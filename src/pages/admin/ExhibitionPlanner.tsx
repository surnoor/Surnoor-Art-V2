import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutTemplate, Plus, Trash2, SlidersHorizontal, X, Check, Copy } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { useArchive, type ArchiveRecord } from "../../hooks/useArchive";
import { AdminFilterGroup } from "./components/AdminFilterGroup";
import AdminLoader from "./components/AdminLoader";

interface ExhibitionPlan {
  id: string;
  name: string;
  artworks: string[];
}

export default function ExhibitionPlanner() {
  const { archive, loading, error } = useArchive();
  
  // Local state for exhibitions
  const [plans, setPlans] = useState<ExhibitionPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Archive Filters
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedMedium, setSelectedMedium] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem("surnoor_exhibition_plans");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlans(parsed);
          setActivePlanId(parsed[0].id);
        } else {
          createDefaultPlan();
        }
      } catch {
        createDefaultPlan();
      }
    } else {
      createDefaultPlan();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to localStorage when plans change
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("surnoor_exhibition_plans", JSON.stringify(plans));
    }
  }, [plans, isClient]);

  const createDefaultPlan = () => {
    const defaultPlan = { id: crypto.randomUUID(), name: "New Exhibition Plan", artworks: [] };
    setPlans([defaultPlan]);
    setActivePlanId(defaultPlan.id);
  };

  const createNewPlan = () => {
    const newPlan = { id: crypto.randomUUID(), name: `Plan ${plans.length + 1}`, artworks: [] };
    setPlans(prev => [...prev, newPlan]);
    setActivePlanId(newPlan.id);
  };

  const activePlan = plans.find(p => p.id === activePlanId);

  const updatePlanName = (id: string, name: string) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  };

  const toggleArtwork = (artworkId: string) => {
    if (!activePlanId) return;
    setPlans(prev => prev.map(p => {
      if (p.id !== activePlanId) return p;
      if (p.artworks.includes(artworkId)) {
        return { ...p, artworks: p.artworks.filter(id => id !== artworkId) };
      }
      return { ...p, artworks: [...p.artworks, artworkId] };
    }));
  };

  const removePlan = (id: string) => {
    setPlans(prev => {
      const next = prev.filter(p => p.id !== id);
      if (next.length === 0) {
        const defaultPlan = { id: crypto.randomUUID(), name: "New Exhibition Plan", artworks: [] };
        setActivePlanId(defaultPlan.id);
        return [defaultPlan];
      }
      if (activePlanId === id) {
        setActivePlanId(next[0].id);
      }
      return next;
    });
  };

  const exportPlan = () => {
    if (!activePlan) return;
    const selectedArtworks = archive.filter(r => activePlan.artworks.includes(r.id));
    let text = `Exhibition Plan: ${activePlan.name}\n\n`;
    text += `Total Artworks: ${selectedArtworks.length}\n`;
    text += `----------------------------------------\n\n`;
    
    selectedArtworks.forEach((art, i) => {
      text += `${i + 1}. ${art.name}\n`;
      text += `Medium: ${art.medium || 'N/A'}\n`;
      text += `Year: ${art.year || 'N/A'}\n`;
      text += `Dimensions: ${art.dimensions || 'N/A'}\n\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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

  const filteredArchive = useMemo(() => {
    return archive.filter((r) => {
      if (r.status !== 'Archive') return false;

      // Sidebar Filters
      if (selectedYear !== "All" && r.year !== selectedYear) return false;
      if (selectedMedium !== "All" && r.medium !== selectedMedium) return false;
      if (selectedCategory !== "All" && r.category !== selectedCategory) return false;
      if (selectedSubject !== "All" && !r.subject.includes(selectedSubject)) return false;

      return true;
    });
  }, [archive, selectedYear, selectedMedium, selectedCategory, selectedSubject]);

  const selectedArchiveArtworks = useMemo(() => {
    if (!activePlan) return [];
    return archive.filter(r => activePlan.artworks.includes(r.id));
  }, [archive, activePlan]);

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif mb-2 flex items-center gap-3">
            <LayoutTemplate className="w-8 h-8 text-primary" />
            Exhibition Planner
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Select and group artworks into collections. Your plans are saved locally in this browser.
          </p>
        </div>

        {/* Plan Selector */}
        {isClient && (
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <label className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-medium">
              Current Plan
            </label>
            <div className="flex items-center gap-2">
              <select
                value={activePlanId || ""}
                onChange={(e) => setActivePlanId(e.target.value)}
                className="bg-card border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary flex-1 min-w-[200px]"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.artworks.length})</option>
                ))}
              </select>
              <button
                onClick={createNewPlan}
                className="p-2 bg-primary text-background rounded hover:opacity-90 transition-opacity"
                title="Create New Plan"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isClient && activePlan && (
        <div className="bg-card border border-border p-6 mb-10 shadow-sm relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <input
              type="text"
              value={activePlan.name}
              onChange={(e) => updatePlanName(activePlan.id, e.target.value)}
              className="text-2xl font-serif bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors px-1 py-1"
              placeholder="Name your exhibition..."
            />
            
            <div className="flex items-center gap-3 text-xs tracking-[0.15em] uppercase font-medium">
              <span className="text-muted-foreground">
                {activePlan.artworks.length} items
              </span>
              <button
                onClick={exportPlan}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy List"}
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this plan?")) {
                    removePlan(activePlan.id);
                  }
                }}
                className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                title="Delete Plan"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Selected Artworks Horizontal Scroll */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {selectedArchiveArtworks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8">No artworks selected. Click artworks below to add them to this plan.</p>
            ) : (
              selectedArchiveArtworks.map(record => (
                <div key={record.id} className="relative group w-32 flex-shrink-0">
                  <div className="aspect-[3/4] bg-muted/20 relative overflow-hidden mb-2">
                    {record.thumbnail ? (
                      <img src={record.thumbnail} alt={record.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">No Image</div>
                    )}
                    <button
                      onClick={() => toggleArtwork(record.id)}
                      className="absolute top-1 right-1 bg-destructive text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <h4 className="text-[11px] font-medium truncate" title={record.name}>{record.name}</h4>
                  <p className="text-[10px] text-muted-foreground truncate">{record.dimensions || "No dims"}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

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
            <h3 className="text-xs tracking-[0.2em] uppercase font-bold text-foreground">Archive Filters</h3>
            <button className="lg:hidden p-2 -mr-2" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-4">
            <AdminFilterGroup label="Year" options={filters.years} selected={selectedYear} onSelect={setSelectedYear} />
            <AdminFilterGroup label="Medium" options={filters.mediums} selected={selectedMedium} onSelect={setSelectedMedium} />
            <AdminFilterGroup label="Category" options={filters.categories} selected={selectedCategory} onSelect={setSelectedCategory} />
            <AdminFilterGroup label="Subject" options={filters.subjects} selected={selectedSubject} onSelect={setSelectedSubject} />
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
              <AdminLoader isDone={false} onComplete={() => {}} />
            </div>
          ) : error ? (
            <div className="text-center py-20 text-destructive">{error}</div>
          ) : filteredArchive.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p>No artworks found in this view.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredArchive.map((record) => {
                const isSelected = activePlan?.artworks.includes(record.id) || false;

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    key={record.id} 
                    className={`group relative bg-card border flex flex-col cursor-pointer transition-all ${
                      isSelected ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => toggleArtwork(record.id)}
                  >
                    <div className="aspect-[3/4] relative overflow-hidden bg-muted/20">
                      {record.thumbnail ? (
                        <img src={record.thumbnail} alt={record.name} className="w-full h-full object-contain p-2" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No Image</div>
                      )}
                      
                      {/* Selection Overlay */}
                      <div className={`absolute inset-0 transition-colors flex items-start justify-end p-2 ${
                        isSelected ? "bg-primary/10" : "group-hover:bg-primary/5"
                      }`}>
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected ? "bg-primary border-primary text-background" : "border-muted-foreground/50 text-transparent"
                        }`}>
                          <Check className="w-3.5 h-3.5" />
                        </div>
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
