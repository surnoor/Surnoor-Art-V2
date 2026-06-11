import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q1, q2, q3, q4, q5, q6, q7, q8 } = req.body;

  const AIRTABLE_TOKEN = process.env.VITE_AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.VITE_AIRTABLE_BASE_ID;
  const TABLE_NAME = 'Survey Responses'; // They will need to create this table

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
              'Discovery Source': q1,
              'Resonances': (q2 || []).join(', '),
              'Art as Dialogue': q3,
              'Interaction Frequency': q4,
              'Purchase Intent': q5,
              'Values': (q6 || []).join(', '),
              'Requests': q7,
              'Additional Thoughts': q8,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable error:', errorData);
      return res.status(response.status).json({ error: 'Failed to save response to Airtable' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Submission error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
