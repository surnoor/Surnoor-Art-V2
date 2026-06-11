import { useQuery } from "@tanstack/react-query";

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
  subject: string[];
  substrate: string | null;
  additionalImages: string[];
  showAtEvent: boolean;
  artSupplyPrint: boolean;
}

interface UseArchiveResult {
  archive: ArchiveRecord[];
  loading: boolean;
  error: string | null;
}

interface AirtableThumbnail {
  url: string;
  width: number;
  height: number;
}

interface AirtableAttachment {
  url: string;
  thumbnails?: {
    small?: AirtableThumbnail;
    large?: AirtableThumbnail;
    full?: AirtableThumbnail;
  };
}

interface AirtableField {
  Name?: string;
  Medium?: string;
  Year?: string | number;
  Dimensions?: string;
  Notes?: string;
  Note?: string;
  Image?: AirtableAttachment[];
  Status?: string;
  Category?: string;
  Subject?: string | string[];
  Substrate?: string;
  "Additional Images"?: AirtableAttachment[];
  ShowAtEvent?: boolean;
  ArtSupplyPrint?: boolean;
}

interface AirtableRecord {
  id: string;
  fields: AirtableField;
}

export function useArchive(): UseArchiveResult {
  const apiBase = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/$/, "");

  const { data, isLoading, error } = useQuery({
    queryKey: ['archive'],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/api/archive`);
      if (!res.ok) {
        throw new Error(`Failed to load archive: HTTP ${res.status}`);
      }
      const json = await res.json();
      
      const mapped: ArchiveRecord[] = (json.records || [])
        .filter((r: AirtableRecord) => r.fields.Status?.toLowerCase() !== 'hide')
        .map((r: AirtableRecord) => {
        const f = r.fields;
        const mainImage = f.Image?.[0];

        return {
          id: r.id,
          name: f.Name ?? "Untitled",
          medium: f.Medium ?? null,
          year: f.Year != null ? String(f.Year) : null,
          dimensions: f.Dimensions ?? null,
          notes: f.Notes ?? f.Note ?? null,
          image: mainImage?.url ?? null,
          thumbnail: mainImage?.thumbnails?.large?.url ?? mainImage?.url ?? null,
          filmstrip: mainImage?.thumbnails?.small?.url ?? mainImage?.thumbnails?.large?.url ?? mainImage?.url ?? null,
          status: f.Status ?? "",
          category: f.Category ?? null,
          subject: Array.isArray(f.Subject) ? f.Subject : (f.Subject ? [f.Subject] : []),
          substrate: f.Substrate ?? null,
          additionalImages: (f["Additional Images"] ?? []).map((a) => a.url),
          showAtEvent: f.ShowAtEvent ?? false,
          artSupplyPrint: f.ArtSupplyPrint ?? false,
        };
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
