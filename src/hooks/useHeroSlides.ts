import { useEffect, useState } from "react";

export interface HeroSlide {
  url: string;
  id: string;
}

export function useHeroSlides() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = import.meta.env.VITE_AIRTABLE_TOKEN;
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;

    if (!token || !baseId) {
      setLoading(false);
      return;
    }

    // Filter by Active=true and sort by Order
    const tableName = "HeroSlideshow";
    const filter = encodeURIComponent("{Active} = 1");
    const sort = encodeURIComponent('[{"field": "Order", "direction": "asc"}]');
    const url = `https://api.airtable.com/v0/${baseId}/${tableName}?filterByFormula=${filter}&sort=${sort}`;

    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.records?.map((r: any) => ({
          id: r.id,
          url: r.fields.Image?.[0]?.url || "",
        })).filter((s: HeroSlide) => s.url !== "") || [];
        
        setSlides(mapped);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return { slides, loading };
}
