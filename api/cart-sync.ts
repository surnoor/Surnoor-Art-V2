// cart-sync — active cart tracking with Vercel IP & Geolocation
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase URL or Key missing in server environment');
  }
  return createClient(url, key);
}

interface CartItemSync {
  productId?: string;
  title: string;
  price: number;
  quantity: number;
  category?: string;
  imageUrl?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, items } = req.body || {};

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId string is required' });
  }

  try {
    const supabase = getSupabaseClient();

    // Extract IP Address & Vercel Geolocation headers
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const rawIp = (
      (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0]?.trim()
      || (Array.isArray(realIp) ? realIp[0] : realIp)?.trim()
      || '127.0.0.1'
    );

    const city = (req.headers['x-vercel-ip-city'] as string) || null;
    const region = (req.headers['x-vercel-ip-country-region'] as string) || null;
    const postalCode = (req.headers['x-vercel-ip-postal-code'] as string) || null;
    const country = (req.headers['x-vercel-ip-country'] as string) || null;
    const userAgent = (req.headers['user-agent'] as string) || null;

    // Delete existing items for this session
    let targetTable = 'ActiveCarts';
    const { error: deleteError } = await supabase
      .from('ActiveCarts')
      .delete()
      .eq('session_id', sessionId);

    if (deleteError && (deleteError.code === '42P01' || deleteError.message?.includes('does not exist'))) {
      targetTable = 'active_carts';
      await supabase.from('active_carts').delete().eq('session_id', sessionId);
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(200).json({ success: true, count: 0 });
    }

    // Insert active cart rows
    const rowsToInsert = (items as CartItemSync[]).map((item) => ({
      session_id: sessionId,
      product_id: item.productId || null,
      title: item.title,
      price: typeof item.price === 'number' ? item.price : 0,
      quantity: typeof item.quantity === 'number' ? item.quantity : 1,
      category: item.category || null,
      image_url: item.imageUrl || null,
      ip_address: rawIp,
      city,
      region,
      postal_code: postalCode,
      country,
      user_agent: userAgent,
      last_active_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from(targetTable)
      .insert(rowsToInsert);

    if (insertError) {
      console.error(`Insert error on ${targetTable}:`, insertError);
      throw insertError;
    }

    return res.status(200).json({ success: true, count: rowsToInsert.length, ip: rawIp });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to sync cart';
    console.error('Cart sync error:', msg);
    return res.status(500).json({ error: msg });
  }
}
