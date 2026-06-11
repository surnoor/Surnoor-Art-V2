import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Share2, Check, Loader2, SlidersHorizontal, X } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { useArchive, type ArchiveRecord } from "../../hooks/useArchive";
import { FilterGroup } from "../../components/FilterGroup";
import BauhausLoader from "../../components/BauhausLoader";

export default function PinterestQueue() {
  const { archive, loading, error } = useArchive();
  const [filterMode, setFilterMode] = useState<"pending" | "published">("pending");
  
  // Archive Filters
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedMedium, setSelectedMedium] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Local state to instantly hide items that we mark as published before React Query refetches
  const [localPublishedIds, setLocalPublishedIds] = useState<Set<string>>(new Set());
  const [localUnpublishedIds, setLocalUnpublishedIds] = useState<Set<string>>(new Set());
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /* Derive unique filter values from data */
  const filters = useMemo(() => {
    const years = new Set<string>();
    const mediums = new Set<string>();
    const subjects = new Set<string>();
    const categories = new Set<string>();

    for (const r of archive) {
      if (r.status !== 'Archive') continue;
      if (r.year) years.add(r.year.trim());
      if (r.medium) mediums.add(r.medium.trim());
      if (r.subject) r.subject.forEach(s => subjects.add(s.trim()));
      if (r.category) categories.add(r.category.trim());
    }

    return {
      years: ["All", ...Array.from(years).sort().reverse()],
      mediums: ["All", ...Array.from(mediums).sort()],
      subjects: ["All", ...Array.from(subjects).sort()],
      categories: ["All", ...Array.from(categories).sort()],
    };
  }, [archive]);

  // Determine actual published status combining Airtable data and local optimistic updates
  const getIsPublished = (id: string, initialStatus: boolean) => {
    if (localPublishedIds.has(id)) return true;
    if (localUnpublishedIds.has(id)) return false;
    return initialStatus;
  };

  const filteredArchive = useMemo(() => {
    return archive.filter((r) => {
      if (r.status !== 'Archive') return false;

      const isPublished = getIsPublished(r.id, r.pinterestPublished);
      
      // Top Level Tab Filter
      if (filterMode === "pending" && isPublished) return false;
      if (filterMode === "published" && !isPublished) return false;

      // Sidebar Filters
      if (selectedYear !== "All" && r.year !== selectedYear) return false;
      if (selectedMedium !== "All" && r.medium !== selectedMedium) return false;
      if (selectedCategory !== "All" && r.category !== selectedCategory) return false;
      if (selectedSubject !== "All" && !r.subject.includes(selectedSubject)) return false;

      return true;
    });
  }, [archive, filterMode, selectedYear, selectedMedium, selectedCategory, selectedSubject, localPublishedIds, localUnpublishedIds]);

  const togglePublishedStatus = async (id: string, currentStatus: boolean) => {
    if (isUpdatingId) return; // Prevent multiple clicks
    setIsUpdatingId(id);
    const newStatus = !currentStatus;

    try {
      const response = await fetch('/api/update-archive', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: [{ id, fields: { Pinterest: newStatus } }]
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Optimistic update
      if (newStatus) {
        setLocalPublishedIds(prev => new Set(prev).add(id));
        setLocalUnpublishedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      } else {
        setLocalUnpublishedIds(prev => new Set(prev).add(id));
        setLocalPublishedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      }

    } catch (err) {
      console.error("Error updating Pinterest status", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handleShareToPinterest = (record: ArchiveRecord) => {
    // Build Pinterest SEO-optimized hashtags
    const baseTags = ["SurnoorArt", "OriginalArt", "ContemporaryRealism"];
    if (record.medium) baseTags.push(record.medium.replace(/\s+/g, ''));
    if (record.category) baseTags.push(record.category.replace(/\s+/g, ''));
    if (record.year) baseTags.push(`Art${record.year}`);
    if (record.subject && Array.isArray(record.subject)) {
      record.subject.forEach((sub: string) => baseTags.push(sub.replace(/\s+/g, '')));
    }
    
    const hashtags = baseTags.map(tag => `#${tag}`).join(" ");
    
    // Build a robust description
    const yearText = record.year ? ` (${record.year})` : '';
    const mediumText = record.medium ? ` | ${record.medium}` : '';
    const description = `${record.name}${yearText}${mediumText} by artist Surnoor Sembhi. Explore the complete archive and current availability directly at surnoor.art. ${hashtags}`;
    
    const shareUrl = `${window.location.origin}/archive#${record.id}`;
    const mediaUrl = record.image || record.thumbnail || shareUrl;
    
    const pinterestUrl = `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(mediaUrl)}&title=${encodeURIComponent(record.name)}&description=${encodeURIComponent(description)}`;
    
    navigator.clipboard.writeText(description).then(() => {
      setCopiedId(record.id);
      setTimeout(() => setCopiedId(null), 2000);
      window.open(pinterestUrl, '_blank', 'noopener,noreferrer');
    }).catch(() => {
      window.open(pinterestUrl, '_blank', 'noopener,noreferrer');
    });
  };

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif mb-2 flex items-center gap-3">
            <Share2 className="w-8 h-8 text-primary" />
            Pinterest Queue
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Keep track of which artworks from your archive have been published to Pinterest.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-1 bg-card border border-border rounded w-full md:w-auto">
          <button
            onClick={() => setFilterMode("pending")}
            className={`flex-1 md:px-6 py-2 text-xs tracking-[0.15em] uppercase font-medium rounded transition-colors ${
              filterMode === "pending" ? "bg-primary text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Needs Publishing
          </button>
          <button
            onClick={() => setFilterMode("published")}
            className={`flex-1 md:px-6 py-2 text-xs tracking-[0.15em] uppercase font-medium rounded transition-colors ${
              filterMode === "published" ? "bg-primary text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Published
          </button>
        </div>
      </div>

      <div className="flex gap-8 items-start relative min-h-[50vh]">
        
        {/* Mobile Filter Toggle */}
        <button
          className="lg:hidden fixed bottom-6 right-6 z-40 bg-primary text-background p-4 rounded-full shadow-xl"
          onClick={() => setSidebarOpen(true)}
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>

        {/* Sidebar Filters */}
        <aside className={`
          fixed inset-y-0 right-0 z-50 w-72 bg-background border-l border-border p-6 transform transition-transform duration-300 ease-in-out overflow-y-auto
          lg:relative lg:transform-none lg:w-64 lg:border-l-0 lg:border-r lg:bg-transparent lg:p-0 lg:pr-8
          ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        `}>
          <div className="flex items-center justify-between mb-8 lg:mb-6">
            <h3 className="text-xs tracking-[0.2em] uppercase font-bold text-foreground">Filters</h3>
            <button className="lg:hidden p-2 -mr-2" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-4">
            <FilterGroup label="Year" options={filters.years} selected={selectedYear} onSelect={setSelectedYear} />
            <FilterGroup label="Medium" options={filters.mediums} selected={selectedMedium} onSelect={setSelectedMedium} />
            <FilterGroup label="Category" options={filters.categories} selected={selectedCategory} onSelect={setSelectedCategory} />
            <FilterGroup label="Subject" options={filters.subjects} selected={selectedSubject} onSelect={setSelectedSubject} />
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Grid Content */}
        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <BauhausLoader isDone={false} onComplete={() => {}} />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-destructive">{error}</div>
          ) : filteredArchive.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p>No artworks found in this view.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredArchive.map((record) => {
                const isPublished = getIsPublished(record.id, record.pinterestPublished);
                const isUpdating = isUpdatingId === record.id;

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    key={record.id} 
                    className="group relative bg-card border border-border flex flex-col"
                  >
                    <div className="aspect-[3/4] relative overflow-hidden bg-muted/20">
                      {record.thumbnail ? (
                        <img src={record.thumbnail} alt={record.name} className="w-full h-full object-contain p-2" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No Image</div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 gap-2">
                        <button
                          onClick={() => handleShareToPinterest(record)}
                          className="flex items-center justify-center gap-2 w-full py-3 text-xs tracking-[0.15em] uppercase font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                        >
                          {copiedId === record.id ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                          {copiedId === record.id ? "Copied Info!" : "Share to Pinterest"}
                        </button>
                        <button
                          disabled={isUpdating}
                          onClick={() => togglePublishedStatus(record.id, isPublished)}
                          className={`
                            flex items-center justify-center gap-2 w-full py-3 text-xs tracking-[0.15em] uppercase font-medium transition-colors
                            ${isPublished ? "bg-muted text-foreground hover:bg-destructive hover:text-white" : "bg-primary text-background hover:bg-[#4efa84]"}
                            disabled:opacity-50 disabled:cursor-not-allowed
                          `}
                        >
                          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : isPublished ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          {isUpdating ? "Updating..." : isPublished ? "Undo Publish" : "Mark as Pinned"}
                        </button>
                      </div>
                    </div>
                    <div className="p-3 border-t border-border bg-background">
                      <h3 className="font-serif text-sm truncate" title={record.name}>{record.name}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {record.medium || "No medium"} • {record.year || "No year"}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
