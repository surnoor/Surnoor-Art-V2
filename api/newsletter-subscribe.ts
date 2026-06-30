import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // 1. Save to Supabase Newsletter table
    const { error: dbError } = await supabase.from('Newsletter').insert({ Email: email });

    // 23505 = unique violation (already subscribed) — treat as success
    if (dbError && dbError.code !== '23505') throw dbError;

    const alreadySubscribed = dbError?.code === '23505';

    // 2. Send email notification — failure does NOT block success
    if (!alreadySubscribed) {
      try {
        await transporter.sendMail({
          from: `"Surnoor Art Website" <${process.env.GMAIL_USER}>`,
          to: process.env.GMAIL_USER,
          subject: `📬 New Newsletter Subscriber`,
          html: `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
              <div style="border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 24px;">
                <p style="font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #888; margin: 0 0 4px;">Newsletter</p>
                <h1 style="font-size: 22px; font-weight: 300; margin: 0;">New subscriber</h1>
              </div>

              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #888; width: 130px;">Email</td>
                  <td style="padding: 12px 0; font-size: 14px;">
                    <a href="mailto:${email}" style="color: #000;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #888;">Time</td>
                  <td style="padding: 12px 0; font-size: 14px;">${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'full', timeStyle: 'short' })}</td>
                </tr>
              </table>

              <p style="margin-top: 32px; font-size: 11px; color: #aaa;">Subscribed via surnoor.art</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Newsletter email notification failed (subscriber was saved):', emailError);
      }
    }

    return res.status(200).json({ success: true, alreadySubscribed });
  } catch (error: any) {
    console.error('Newsletter subscribe error:', error);
    return res.status(500).json({ error: error.message || 'Something went wrong' });
  }
}
