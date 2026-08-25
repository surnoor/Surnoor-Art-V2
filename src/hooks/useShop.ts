import { useQuery } from "@tanstack/react-query";

export interface ShopProduct {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  price: number | null;
  currency: string;
  priceId: string | null;
  medium: string | null;
  substrate: string | null;
  dimensions: string | null;
  category: string | null;
  subject: string | null;
  status: string | null;
}

interface UseShopResult {
  available: ShopProduct[];
  sold: ShopProduct[];
  loading: boolean;
  error: string | null;
}

interface ApiPrice {
  id: string;
  unit_amount: number | null;
  currency: string | null;
  active: boolean | null;
}

interface ApiProduct {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  category: string | null;
  subject: string | null;
  medium: string | null;
  substrate: string | null;
  dimensions: string | null;
  status: string | null;
  prices: ApiPrice[];
  priceId: string | null;
}

const SCRATCHPAD_PRODUCTS: ShopProduct[] = [
  {
    id: "prod_scratchpad_1",
    name: "Golden Hour Landscape (Scratchpad)",
    description: "An original oil painting study capturing light across the valley.",
    images: ["https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800&auto=format&fit=crop"],
    price: 35000,
    currency: "cad",
    priceId: "price_scratchpad_1",
    medium: "Oil on Linen",
    substrate: "Canvas",
    dimensions: "16 x 20 in",
    category: "Original",
    subject: "Landscape",
    status: "Available"
  },
  {
    id: "prod_scratchpad_2",
    name: "Studio Sketch Study (Scratchpad)",
    description: "Small dry media sketch on toned paper.",
    images: ["https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop"],
    price: 7500,
    currency: "cad",
    priceId: "price_scratchpad_2",
    medium: "Charcoal & Pastel",
    substrate: "Toned Paper",
    dimensions: "8 x 10 in",
    category: "Study",
    subject: "Figurative",
    status: "Available"
  }
];

export function useShop(): UseShopResult {
  const apiBase = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/$/, "");

  const { data, isLoading, error } = useQuery({
    queryKey: ['shop-products'],
    queryFn: async () => {
      let json: { data: ApiProduct[] } = { data: [] };
      try {
        const res = await fetch(`${apiBase}/api/products`);
        if (!res.ok) {
          throw new Error(`Failed to load shop products: HTTP ${res.status}`);
        }
        json = await res.json() as { data: ApiProduct[] };
      
      const available: ShopProduct[] = [];
      const sold: ShopProduct[] = [];

      for (const p of json.data) {
        const activePrice = p.prices.find((pr) => pr.active) ?? p.prices[0] ?? null;
        const product: ShopProduct = {
          id: p.id,
          name: p.name,
          description: p.description,
          images: p.images,
          price: activePrice?.unit_amount ?? null,
          currency: activePrice?.currency ?? "cad",
          priceId: p.priceId ?? activePrice?.id ?? null,
          medium: p.medium,
          substrate: p.substrate,
          dimensions: p.dimensions,
          category: p.category,
          subject: p.subject,
          status: p.status,
        };

        if (p.status?.toLowerCase() === "sold") {
          sold.push(product);
        } else {
          available.push(product);
        }
      }

      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn("Local fetch failed, falling back to scratchpad products.", err);
          return { available: SCRATCHPAD_PRODUCTS, sold: [] };
        }
        throw err;
      }

      if (import.meta.env.DEV && available.length === 0 && sold.length === 0) {
        console.warn("No products returned locally, falling back to scratchpad products.");
        return { available: SCRATCHPAD_PRODUCTS, sold: [] };
      }

      return { available, sold };
    }
  });

  return { 
    available: data?.available || [], 
    sold: data?.sold || [], 
    loading: isLoading, 
    error: error instanceof Error ? error.message : null 
  };
}
