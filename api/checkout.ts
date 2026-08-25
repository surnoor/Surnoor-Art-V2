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

    let subtotal = 0;
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = body.items.map((item) => {
      const priceObj = prices.find(p => p.id === item.priceId);
      if (priceObj && priceObj.unit_amount) {
        subtotal += priceObj.unit_amount * item.quantity;
      }
      return {
        price: item.priceId,
        quantity: item.quantity,
      };
    });

    const isFreeShipping = subtotal >= 10000;
    
    let shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] = [];
    if (isFreeShipping) {
      shippingOptions = [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency },
            display_name: 'Free Worldwide Delivery',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 14 },
            },
          },
        }
      ];
    } else {
      shippingOptions = [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 1500, currency },
            display_name: 'North America Delivery',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 7 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 3500, currency },
            display_name: 'International Delivery',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 7 },
              maximum: { unit: 'business_day', value: 14 },
            },
          },
        }
      ];
    }

    const siteUrl = body.siteUrl;
    const origin = siteUrl ?? (req.headers['origin'] as string | undefined) ?? 'https://surnoor.art';
    const baseUrl = origin.replace(/\/$/, '');

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['AC', 'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AT', 'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CV', 'CW', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MK', 'ML', 'MM', 'MN', 'MO', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW', 'SA', 'SB', 'SC', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SZ', 'TA', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VN', 'VU', 'WF', 'WS', 'XK', 'YE', 'YT', 'ZA', 'ZM', 'ZW'],
      },
      shipping_options: shippingOptions,
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
