// cart-sync v3 — active cart tracking with IP + geolocation
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, items } = req.body || {};

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId string is required' });
  }

  try {
    const supabase = getSupabaseClient();

    // 1. Extract IP Address & User Agent — safely, with no nullable property access
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const ipAddress = (
      (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0]?.trim()
      || (Array.isArray(realIp) ? realIp[0] : realIp)?.trim()
      || '127.0.0.1'
    );

    let city = (req.headers['x-vercel-ip-city'] as string) || null;
    let region = (req.headers['x-vercel-ip-country-region'] as string) || null;
    let postalCode = (req.headers['x-vercel-ip-postal-code'] as string) || null;
    let country = (req.headers['x-vercel-ip-country'] as string) || null;
    const userAgent = (req.headers['user-agent'] as string) || null;

    // 2. IP Geolocation fallback if Vercel headers are incomplete
    if ((!postalCode || !city) && ipAddress && ipAddress !== '127.0.0.1' && ipAddress !== '::1') {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1500);
        const geoRes = await fetch(
          `http://ip-api.com/json/${ipAddress}?fields=status,country,regionName,city,zip`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);
        if (geoRes.ok) {
          const geoData = await geoRes.json() as Record<string, string>;
          if (geoData.status === 'success') {
            city = city || geoData.city || null;
            region = region || geoData.regionName || null;
            postalCode = postalCode || geoData.zip || null;
            country = country || geoData.country || null;
          }
        }
      } catch {
        // Geo lookup failed or timed out — continue without it
      }
    }

    // 3. Delete existing rows for this session (try ActiveCarts, fallback to active_carts)
    let targetTable = 'ActiveCarts';
    const { error: deleteError } = await supabase
      .from('ActiveCarts')
      .delete()
      .eq('session_id', sessionId);

    if (deleteError && (deleteError.code === '42P01' || deleteError.message?.includes('does not exist'))) {
      targetTable = 'active_carts';
      await supabase.from('active_carts').delete().eq('session_id', sessionId);
    }

    // 4. If cart is empty, done
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(200).json({ success: true, count: 0 });
    }

    // 5. Insert updated cart rows
    const rowsToInsert = (items as CartItemSync[]).map((item) => ({
      session_id: sessionId,
      product_id: item.productId || null,
      title: item.title,
      price: typeof item.price === 'number' ? item.price : 0,
      quantity: typeof item.quantity === 'number' ? item.quantity : 1,
      category: item.category || null,
      image_url: item.imageUrl || null,
      ip_address: ipAddress,
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

    return res.status(200).json({ success: true, count: rowsToInsert.length, ip: ipAddress });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to sync cart';
    console.error('Cart sync error:', msg);
    return res.status(500).json({ error: msg });
  }
}
