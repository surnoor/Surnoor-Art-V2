import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Use the secret env vars (without VITE_ prefix, though VITE_ will work if already set in Vercel)
  const AIRTABLE_TOKEN = process.env.VITE_AIRTABLE_TOKEN || process.env.AIRTABLE_TOKEN;
  const AIRTABLE_BASE_ID = process.env.VITE_AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
    console.error("Missing Airtable configuration in backend environment.");
    return res.status(500).json({ error: 'Airtable configuration missing' });
  }

  const baseUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Archive?filterByFormula=${encodeURIComponent("OR({Status}='Archive', {ShowAtEvent}=1, {ArtSupplyPrint}=1)")}`;

  try {
    let allRecords: any[] = [];
    let offset: string | undefined;

    // Fetch all pages of records on the server side
    do {
      const fetchUrl = `${baseUrl}${offset ? `&offset=${offset}` : ""}`;
      const response = await fetch(fetchUrl, {
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Airtable API error:', errorData || response.statusText);
        throw new Error(`Airtable HTTP ${response.status}`);
      }

      const data = await response.json();
      allRecords = allRecords.concat(data.records);
      offset = data.offset;
    } while (offset);

    // Set cache headers to improve performance (cache for 1 minute, stale-while-revalidate for 12 hours)
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=43200');
    
    return res.status(200).json({ records: allRecords });
  } catch (err) {
    console.error('Archive fetching error:', err);
    return res.status(500).json({ error: 'Failed to fetch archive records' });
  }
}
