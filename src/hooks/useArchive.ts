import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export interface ArchiveRecord {
  id: string;
  name: string;
  medium: string | null;
  year: string | null;
  dimensions: string | null;
  notes: string | null;
  image: string | null;      // Full resolution
  thumbnail: string | null;  // Optimized for gallery
  filmstrip: string | null;  // Optimized for filmstrip
  status: string;
  category: string | null;
  series: string[];
  substrate: string | null;
  additionalImages: string[];
  showAtEvent: boolean;
  artSupplyPrint: boolean;
  pinterestPublished: boolean;
  featured: boolean;
  sort_order: number | null;
}

interface UseArchiveResult {
  archive: ArchiveRecord[];
  loading: boolean;
  error: string | null;
}

export function useArchive(options?: { includeHidden?: boolean }): UseArchiveResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['archive', options?.includeHidden],
    queryFn: async () => {
      let query = supabase
        .from('Archive')
        .select('*');
      
      if (!options?.includeHidden) {
        query = query.neq('Status', 'Hide');
      }

      const { data: records, error: supabaseError } = await query
        .order('Year', { ascending: false, nullsFirst: false })
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw new Error(`Failed to load archive: ${supabaseError.message}`);
      }
      
      const mapped: ArchiveRecord[] = (records || []).map((r) => {
        return {
          id: r.id,
          name: r.Name || "Untitled",
          medium: r.Medium || null,
          year: r.Year != null ? String(r.Year) : null,
          dimensions: r.Dimensions || null,
          notes: r.Notes || null,
          image: r.Image_url || null,
          thumbnail: r.Thumbnail_url || r.Image_url || null,
          filmstrip: r.Filmstrip_url || r.Thumbnail_url || r.Image_url || null,
          status: r.Status || "",
          category: r.Category || null,
          series: Array.isArray(r.Series) ? r.Series : [],
          substrate: r.Substrate || null,
          additionalImages: Array.isArray(r.Additional_Images) ? r.Additional_Images : [],
          showAtEvent: r.ShowAtEvent || false,
          artSupplyPrint: r.ArtSupplyPrint || false,
          pinterestPublished: r.Pinterest || false,
          featured: r.Featured || false,
          sort_order: r.sort_order ?? null,
        };
      });

      const mediumOrder: Record<string, number> = {
        "Watercolor": 1,
        "Oil": 2,
        "Sketchbooks": 3
      };

      mapped.sort((a, b) => {
        // 1. Year (descending)
        const yearA = parseInt(a.year || "0");
        const yearB = parseInt(b.year || "0");
        if (yearA !== yearB) return yearB - yearA;

        // 2. Medium (Custom order)
        // Put items without a medium at the top (0) so newly added records don't disappear
        const medA = a.medium ? (mediumOrder[a.medium] || 99) : 0;
        const medB = b.medium ? (mediumOrder[b.medium] || 99) : 0;
        if (medA !== medB) return medA - medB;

        // 3. sort_order (ascending)
        const sortA = a.sort_order ?? 999999;
        const sortB = b.sort_order ?? 999999;
        if (sortA !== sortB) return sortA - sortB;

        return 0;
      });

      return mapped;
    }
  });

  return { 
    archive: data || [], 
    loading: isLoading, 
    error: error instanceof Error ? error.message : null 
  };
}
