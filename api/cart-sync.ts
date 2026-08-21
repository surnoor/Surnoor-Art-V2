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

    // 1. Extract IP Address & User Agent from request headers
    const rawIp = req.headers['x-forwarded-for']?.toString().split(',')[0]
      || req.headers['x-real-ip']?.toString()
      || req.socket.remoteAddress
      || '127.0.0.1';
      
    const ipAddress = rawIp.trim();
    let city = req.headers['x-vercel-ip-city']?.toString() || null;
    let region = req.headers['x-vercel-ip-country-region']?.toString() || null;
    let postalCode = req.headers['x-vercel-ip-postal-code']?.toString() || null;
    let country = req.headers['x-vercel-ip-country']?.toString() || null;
    const userAgent = req.headers['user-agent']?.toString() || null;

    // Fast IP Geolocation Lookup fallback if headers are incomplete (e.g. for postal code)
    if ((!postalCode || !city) && ipAddress && ipAddress !== '127.0.0.1' && ipAddress !== '::1') {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1200);
        const geoRes = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,regionName,city,zip`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData.status === 'success') {
            city = city || geoData.city || null;
            region = region || geoData.regionName || null;
            postalCode = postalCode || geoData.zip || null;
            country = country || geoData.country || null;
          }
        }
      } catch (e) {
        // Ignore timeout/error gracefully
      }
    }

    // 2. Delete existing active cart items for this session
    await supabase
      .from('ActiveCarts')
      .delete()
      .eq('session_id', sessionId);

    // 3. If cart is empty, return early after delete
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(200).json({ success: true, count: 0 });
    }

    // 4. Insert new cart items for this session
    const rowsToInsert = items.map((item: CartItemSync) => ({
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
      .from('ActiveCarts')
      .insert(rowsToInsert);

    if (insertError) {
      console.error('Error inserting ActiveCarts rows:', insertError);
      throw insertError;
    }

    return res.status(200).json({ success: true, count: rowsToInsert.length, ip: ipAddress });
  } catch (error: any) {
    console.error('Cart sync endpoint error:', error);
    return res.status(500).json({ error: error.message || 'Failed to sync cart' });
  }
}
