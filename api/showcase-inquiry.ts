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

  const { name, email, location, interestType, availability } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    // 1. Save to Supabase — this is what determines success
    const { error: dbError } = await supabase.from('ShowcaseInquiries').insert({
      Name: name,
      Email: email,
      Location: location || null,
      InterestType: interestType || null,
      Availability: availability || null,
    });

    if (dbError) throw dbError;

    // 2. Fire email notification — failure here does NOT block success response
    try {
      await transporter.sendMail({
        from: `"Surnoor Art Website" <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        subject: `🎨 New Studio Showcase Inquiry from ${name}`,
        html: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
            <div style="border-bottom: 2px solid #000; padding-bottom: 16px; margin-bottom: 24px;">
              <p style="font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #888; margin: 0 0 4px;">Studio Showcase Inquiry</p>
              <h1 style="font-size: 22px; font-weight: 300; margin: 0;">New request from ${name}</h1>
            </div>

            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #888; width: 130px;">Name</td>
                <td style="padding: 12px 0; font-size: 14px;">${name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #888;">Email</td>
                <td style="padding: 12px 0; font-size: 14px;"><a href="mailto:${email}" style="color: #000;">${email}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #888;">Location</td>
                <td style="padding: 12px 0; font-size: 14px;">${location || '—'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 0; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #888;">Interested In</td>
                <td style="padding: 12px 0; font-size: 14px;">${interestType || '—'}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #888;">Availability</td>
                <td style="padding: 12px 0; font-size: 14px;">${availability || '—'}</td>
              </tr>
            </table>

            <div style="margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
              <a href="mailto:${email}?subject=Re%3A%20Your%20Studio%20Showcase%20Inquiry" 
                 style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 12px 24px; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;">
                Reply to ${name.split(' ')[0]}
              </a>
            </div>

            <p style="margin-top: 32px; font-size: 11px; color: #aaa;">Submitted via surnoor.art/contact</p>
          </div>
        `,
      });
    } catch (emailError) {
      // Log but don't fail — inquiry is already saved to Supabase
      console.error('Email notification failed (inquiry was saved):', emailError);
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Showcase inquiry error:', error);
    return res.status(500).json({ error: error.message || 'Something went wrong' });
  }
}
