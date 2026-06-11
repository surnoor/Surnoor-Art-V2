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

export function useShop(): UseShopResult {
  const apiBase = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/$/, "");

  const { data, isLoading, error } = useQuery({
    queryKey: ['shop-products'],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/products`);
      if (!res.ok) {
        throw new Error(`Failed to load shop products: HTTP ${res.status}`);
      }
      const json = await res.json() as { data: ApiProduct[] };
      
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
