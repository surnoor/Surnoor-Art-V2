import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const AIRTABLE_TOKEN = process.env.VITE_AIRTABLE_TOKEN || process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.VITE_AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Airtable configuration missing' });
  }

  const { records } = req.body;

  if (!records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const baseUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Archive`;

  try {
    const response = await fetch(baseUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Airtable API error:', errorData || response.statusText);
      throw new Error(`Airtable HTTP ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('Update archive error:', err);
    return res.status(500).json({ error: 'Failed to update archive records' });
  }
}
