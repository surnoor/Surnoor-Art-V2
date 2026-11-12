import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NotionAPI } from 'notion-client';

const notion = new NotionAPI();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pageId = (req.query.pageId as string) || '416274d7b6d9800aa902e368c698fde2';

  try {
    const recordMap = await notion.getPage(pageId);
    
    // Cache for 10 minutes in Vercel Edge Cache, stale-while-revalidate for 1 hour
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    return res.status(200).json(recordMap);
  } catch (error: any) {
    console.error('Error fetching Notion page:', error);
    return res.status(500).json({ error: 'Failed to fetch Notion page data', message: error?.message });
  }
}

