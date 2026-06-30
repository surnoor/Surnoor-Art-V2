import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface HeroSlide {
  url: string;
  id: string;
}

export function useHeroSlides() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchSlides() {
      try {
        const { data, error } = await supabase
          .from('HeroSlideshow')
          .select('id, Image_url')
          .eq('Active', true)
          .order('Order', { ascending: true });

        if (error) throw error;

        if (mounted) {
          const mapped = (data || [])
            .map((r) => ({
              id: String(r.id),
              url: r.Image_url || "",
            }))
            .filter((s: HeroSlide) => s.url !== "");

          setSlides(mapped);
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          console.error("Failed to fetch hero slides:", error);
          setLoading(false);
        }
      }
    }

    fetchSlides();

    return () => {
      mounted = false;
    };
  }, []);

  return { slides, loading };
}
