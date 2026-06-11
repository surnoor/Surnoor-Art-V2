import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const AIRTABLE_TOKEN = process.env.VITE_AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.VITE_AIRTABLE_BASE_ID;
  const TABLE_NAME = 'Newsletter'; 

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Airtable configuration missing' });
  }

  try {
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              'Email': email,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable error:', errorData);
      return res.status(response.status).json({ error: 'Failed to save to Airtable' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Subscription error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
