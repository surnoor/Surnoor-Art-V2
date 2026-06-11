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
    const stripe = getStripe();

    const [products, prices] = await Promise.all([
      stripe.products.list({ active: true, limit: 100 }).autoPagingToArray({ limit: 500 }),
      stripe.prices.list({ active: true, type: 'one_time', limit: 100 }).autoPagingToArray({ limit: 500 }),
    ]);

    const pricesByProduct = new Map<string, Stripe.Price[]>();
    for (const price of prices) {
      const productId = typeof price.product === 'string' ? price.product : price.product.id;
      if (!pricesByProduct.has(productId)) pricesByProduct.set(productId, []);
      pricesByProduct.get(productId)!.push(price);
    }

    const data = products.map((product) => {
      const metadata = (product.metadata ?? {}) as Record<string, string>;
      const productPrices = (pricesByProduct.get(product.id) ?? []).map((pr) => ({
        id: pr.id,
        unit_amount: pr.unit_amount,
        currency: pr.currency,
        recurring: pr.recurring as Record<string, unknown> | null,
        active: pr.active,
        metadata: (pr.metadata ?? {}) as Record<string, string>,
      }));
      const firstActivePrice = productPrices.find((p) => p.active) ?? productPrices[0] ?? null;
      const metaImages: string[] = [];
      let imgIdx = 1;
      while (metadata[`IMAGE${imgIdx}`]) {
        metaImages.push(metadata[`IMAGE${imgIdx}`]!);
        imgIdx++;
      }
      const hostedImages = product.images ?? [];
      const allImages = [
        ...hostedImages,
        ...metaImages.filter((url) => !hostedImages.includes(url)),
      ];

      return {
        id: product.id,
        name: product.name,
        description: product.description ?? null,
        active: product.active,
        images: allImages,
        metadata,
        category: metadata['category'] ?? null,
        subject: metadata['subject'] ?? null,
        medium: metadata['medium'] ?? null,
        substrate: metadata['substrate'] ?? null,
        dimensions: metadata['dimensions'] ?? null,
        status: metadata['status'] ?? null,
        prices: productPrices,
        priceId: firstActivePrice?.id ?? null,
      };
    });

    return res.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching products:', message);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
}
