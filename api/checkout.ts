import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key);
}

interface CartItemPayload {
  priceId: string;
  quantity: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as {
      items?: CartItemPayload[];
      siteUrl?: string;
    };

    if (!body.items || body.items.length === 0) {
      return res.status(400).json({ error: 'items[] is required' });
    }

    const stripe = getStripe();

    let prices: (Stripe.Price & { product: Stripe.Product })[];
    try {
      prices = await Promise.all(
        body.items.map((item) =>
          stripe.prices.retrieve(item.priceId, { expand: ['product'] }) as Promise<
            Stripe.Price & { product: Stripe.Product }
          >
        )
      );
    } catch {
      return res.status(404).json({ error: 'One or more prices were not found' });
    }

    for (const price of prices) {
      if (!price.active) {
        return res.status(400).json({ error: `Price ${price.id} is no longer active` });
      }
      const product = price.product as Stripe.Product;
      if (!product.active) {
        return res.status(400).json({ error: `${product.name} is no longer available` });
      }
      if (product.metadata?.status === 'sold') {
        return res.status(400).json({ error: `${product.name} has already been sold` });
      }
    }

    const currency = prices[0]!.currency ?? 'cad';

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = body.items.map((item) => ({
      price: item.priceId,
      quantity: item.quantity,
    }));

    const siteUrl = body.siteUrl;
    const origin = siteUrl ?? (req.headers['origin'] as string | undefined) ?? 'https://surnoor.art';
    const baseUrl = origin.replace(/\/$/, '');

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['CA', 'US', 'GB', 'AU', 'NZ'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 1500, currency },
            display_name: 'Standard Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 5 },
              maximum: { unit: 'business_day', value: 10 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 3500, currency },
            display_name: 'Express Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 2 },
              maximum: { unit: 'business_day', value: 4 },
            },
          },
        },
      ],
      success_url: `${baseUrl}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    
    // Check if the API key being used is a restricted key
    const isRestrictedKey = (process.env.STRIPE_SECRET_KEY || '').startsWith('rk_');
    const finalMessage = isRestrictedKey 
      ? `Stripe Error: ${message} (Note: You are using a restricted API key starting with rk_. It may lack Checkout write permissions.)`
      : `Stripe Error: ${message}`;
      
    console.error('Error creating checkout session:', finalMessage);
    // Return the actual error message so the frontend can display it in red text
    return res.status(500).json({ error: finalMessage });
  }
}
