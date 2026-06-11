import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return new Stripe(key);
}

async function readRawBody(req: VercelRequest): Promise<string | null> {
  try {
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', resolve);
      req.on('error', reject);
    });
    return Buffer.concat(chunks).toString('utf8');
  } catch {
    return null;
  }
}

function parseWebhookEvent(
  payload: string,
  sig: string,
  secret: string,
  stripe: Stripe,
): Stripe.Event | null {
  try {
    return stripe.webhooks.constructEvent(payload, sig, secret);
  } catch {
    return null;
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not set — webhook received but not verified.');
    res.status(200).json({ received: true, warning: 'Webhook secret not configured' });
    return;
  }

  const rawSig = req.headers['stripe-signature'];
  if (!rawSig) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  const sig = Array.isArray(rawSig) ? rawSig[0] : rawSig;
  if (!sig) {
    res.status(400).json({ error: 'Invalid stripe-signature header' });
    return;
  }

  const rawBody = await readRawBody(req);
  if (rawBody === null) {
    res.status(400).json({ error: 'Failed to read request body' });
    return;
  }

  const stripe = getStripe();

  const event = parseWebhookEvent(rawBody, sig, webhookSecret, stripe);
  if (event === null) {
    res.status(400).json({ error: 'Invalid webhook signature' });
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
        limit: 10,
      });

      for (const item of lineItems.data) {
        const product = item.price?.product;
        if (product && typeof product === 'object' && 'metadata' in product) {
          const stripeProduct = product as Stripe.Product;
          await stripe.products.update(stripeProduct.id, {
            metadata: { ...stripeProduct.metadata, status: 'sold' },
          });
          console.log(`Product ${stripeProduct.id} marked as sold after checkout ${session.id}`);
        }
      }
    } catch (err) {
      console.error('Error marking product as sold:', err instanceof Error ? err.message : err);
    }
  }

  res.status(200).json({ received: true });
}
