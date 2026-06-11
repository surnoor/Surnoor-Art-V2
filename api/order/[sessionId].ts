import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.query as { sessionId?: string };

    if (!sessionId || !sessionId.startsWith('cs_')) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product', 'shipping_cost.shipping_rate'],
    });

    const lineItems = session.line_items?.data ?? [];

    const shippingCost = session.shipping_cost;
    let shippingRateData: {
      displayName: string | null;
      amount: number | null;
      currency: string | null;
      minDays: number | null;
      maxDays: number | null;
    } | null = null;

    if (shippingCost?.shipping_rate && typeof shippingCost.shipping_rate === 'object') {
      const sr = shippingCost.shipping_rate as Stripe.ShippingRate;
      const estimate = sr.delivery_estimate;
      shippingRateData = {
        displayName: sr.display_name ?? null,
        amount: sr.fixed_amount?.amount ?? null,
        currency: sr.fixed_amount?.currency ?? null,
        minDays: estimate?.minimum?.value ?? null,
        maxDays: estimate?.maximum?.value ?? null,
      };
    }

    const shippingDetails = session.collected_information?.shipping_details ?? null;

    const order = {
      id: session.id,
      customerEmail: session.customer_details?.email ?? null,
      customerName: session.customer_details?.name ?? null,
      amountTotal: session.amount_total,
      currency: session.currency,
      paymentStatus: session.payment_status,
      shippingAddress: shippingDetails?.address ?? null,
      shippingName: shippingDetails?.name ?? null,
      shippingRate: shippingRateData,
      lineItems: lineItems.map((item) => {
        const product = item.price?.product;
        const productImage =
          product && typeof product === 'object' && 'images' in product
            ? ((product as Stripe.Product).images?.[0] ?? null)
            : null;
        return {
          id: item.id,
          name: item.description,
          quantity: item.quantity,
          amountTotal: item.amount_total,
          currency: item.currency,
          image: productImage,
        };
      }),
    };

    return res.json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching order:', message);
    return res.status(500).json({ error: 'Failed to fetch order' });
  }
}
