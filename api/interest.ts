import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, artwork } = req.body;

  if (!email || !artwork) {
    return res.status(400).json({ error: 'Email and artwork are required' });
  }

  // Use the secret env vars (without VITE_ prefix, though VITE_ will work if already set in Vercel)
  const AIRTABLE_TOKEN = process.env.VITE_AIRTABLE_TOKEN || process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.VITE_AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
    console.error("Missing Airtable configuration in backend environment.");
    return res.status(500).json({ error: 'Airtable configuration missing' });
  }

  const baseUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Interests`;

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              Artwork: artwork,
              Email: email,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Airtable API error:', errorData || response.statusText);
      throw new Error(`Airtable HTTP ${response.status}`);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Express interest saving error:', err);
    return res.status(500).json({ error: 'Failed to record interest' });
  }
}
