import React, { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Check, Loader2, SlidersHorizontal, X, Crop, Download, RefreshCw, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { useArchive, type ArchiveRecord } from "../../hooks/useArchive";
import { AdminFilterGroup } from "./components/AdminFilterGroup";
import AdminLoader from "./components/AdminLoader";

export default function InstagramConsole() {
  const { archive, loading, error } = useArchive();
  
  // Archive Filters
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedMedium, setSelectedMedium] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ArchiveRecord | null>(null);

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

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif mb-2 flex items-center gap-3">
            <Crop className="w-8 h-8 text-primary" />
            Instagram Console
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Select artwork from your archive to frame, crop, and export with professional branding for Instagram.
          </p>
        </div>
      </div>

      <div className="flex gap-8 items-start relative min-h-[50vh]">
        {/* Mobile Filter Toggle */}
        <button
          className="lg:hidden fixed bottom-6 right-6 z-40 bg-primary text-background p-4 rounded-full shadow-xl animate-bounce"
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
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredArchive.map((record) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  key={record.id} 
                  className="group relative bg-card border border-border flex flex-col cursor-pointer"
                  onClick={() => setSelectedRecord(record)}
                >
                  <div className="aspect-[3/4] relative overflow-hidden bg-muted/20">
                    {record.thumbnail ? (
                      <img src={record.thumbnail} alt={record.name} className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No Image</div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                      <div className="flex items-center gap-2 px-4 py-2 border border-foreground bg-foreground text-background text-xs tracking-[0.15em] uppercase font-medium">
                        <Crop className="w-4 h-4" />
                        Customize
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
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <EditorModal 
            record={selectedRecord} 
            onClose={() => setSelectedRecord(null)} 
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

/* ── Interactive Branding Editor Modal ── */
function EditorModal({ 
  record, 
  onClose 
}: { 
  record: ArchiveRecord; 
  onClose: () => void; 
}) {
  const [format, setFormat] = useState<"story" | "post">("story");
  const [zoom, setZoom] = useState<number>(1.0);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  
  // Drag states
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Reset editor settings when switching format or artwork
  useEffect(() => {
    setZoom(1.0);
    setOffsetX(0);
    setOffsetY(0);
  }, [format, record.id]);

  // Preload full resolution artwork image
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    if (!record.image) {
      setImageError(true);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      // Retry without anonymous crossOrigin if CORS fails
      const imgFallback = new Image();
      imgFallback.onload = () => {
        imgRef.current = imgFallback;
        setImageLoaded(true);
      };
      imgFallback.onerror = () => {
        setImageError(true);
      };
      imgFallback.src = record.image!;
    };
    img.src = record.image;
  }, [record.id]);

  // Draw composite onto offscreen (full res) and on-screen canvas
  const drawComposite = () => {
    const offscreen = offscreenCanvasRef.current;
    const screen = canvasRef.current;
    const img = imgRef.current;
    if (!offscreen || !screen || !imageLoaded || !img) return;

    const ctx = offscreen.getContext("2d");
    if (!ctx) return;

    // Set dimensions based on format
    const width = 1080;
    const height = format === "story" ? 1920 : 1080;
    offscreen.width = width;
    offscreen.height = height;

    // 1. Draw solid background
    ctx.fillStyle = "#F8F8F4"; // Cream / off-white matching admin/site theme
    ctx.fillRect(0, 0, width, height);

    // 2. Define crop window coordinates
    let cropX = 120;
    let cropWidth = 840;
    let cropY = 200;
    let cropHeight = 1000;

    if (format === "post") {
      cropX = 140;
      cropWidth = 800;
      cropY = 120;
      cropHeight = 680;
    }

    // Draw Drop Shadow under the crop area
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.12)";
    ctx.shadowBlur = 48;
    ctx.shadowOffsetY = 24;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(cropX, cropY, cropWidth, cropHeight);
    ctx.restore();

    // 3. Draw artwork inside clipped crop window
    ctx.save();
    // Create clipping path
    ctx.beginPath();
    ctx.rect(cropX, cropY, cropWidth, cropHeight);
    ctx.clip();

    // Image sizing maths
    const baseScale = Math.min(cropWidth / img.width, cropHeight / img.height);
    const baseWidth = img.width * baseScale;
    const baseHeight = img.height * baseScale;

    // Apply zoom and panning offsets
    const drawWidth = baseWidth * zoom;
    const drawHeight = baseHeight * zoom;
    const drawX = cropX + (cropWidth - drawWidth) / 2 + offsetX;
    const drawY = cropY + (cropHeight - drawHeight) / 2 + offsetY;

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();

    // Subtle outline border around crop window
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropWidth, cropHeight);

    // 4. Draw Branding Elements
    ctx.textAlign = "center";

    if (format === "story") {
      // Title
      ctx.fillStyle = "#111111";
      ctx.font = "300 64px 'Hanken Grotesk', 'Playfair Display', Georgia, serif";
      ctx.fillText(record.name, 540, 1390);

      // Medium & Details
      ctx.fillStyle = "#666666";
      ctx.font = "400 28px 'Hanken Grotesk', sans-serif";
      const detailStr = [record.medium, record.substrate, record.year].filter(Boolean).join(" · ");
      ctx.fillText(detailStr.toUpperCase(), 540, 1465);

      // Accent Line
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(490, 1525, 100, 2);

      // Artist Brand
      ctx.fillStyle = "#111111";
      ctx.font = "300 32px 'Hanken Grotesk', sans-serif";
      ctx.fillText("Surnoor Sembhi", 540, 1595);

      // Portfolio URL
      ctx.fillStyle = "#888888";
      ctx.font = "400 24px 'Hanken Grotesk', sans-serif";
      ctx.fillText("surnoor.art", 540, 1655);
    } else {
      // 1:1 Post Branding Layout
      ctx.fillStyle = "#111111";
      ctx.font = "300 48px 'Hanken Grotesk', 'Playfair Display', Georgia, serif";
      ctx.fillText(record.name, 540, 875);

      ctx.fillStyle = "#666666";
      ctx.font = "400 24px 'Hanken Grotesk', sans-serif";
      const details = [record.medium, record.year].filter(Boolean).join(" · ");
      ctx.fillText(details.toUpperCase(), 540, 930);

      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(500, 970, 80, 2);

      ctx.fillStyle = "#888888";
      ctx.font = "300 26px 'Hanken Grotesk', sans-serif";
      ctx.fillText("Surnoor Sembhi  ·  surnoor.art", 540, 1020);
    }

    // 5. Draw from offscreen to visible screen canvas (keeps aspect ratio)
    const sCtx = screen.getContext("2d");
    if (!sCtx) return;

    screen.width = width;
    screen.height = height;
    sCtx.drawImage(offscreen, 0, 0);
  };

  // Re-draw whenever parameters change
  useEffect(() => {
    drawComposite();
  }, [format, zoom, offsetX, offsetY, imageLoaded]);

  // Drag interaction handlers
  const handleStart = (clientX: number, clientY: number) => {
    if (!canvasRef.current || !imageLoaded) return;
    isDragging.current = true;
    dragStart.current = { x: clientX, y: clientY };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;

    const screenWidth = rect.width;
    const scaleFactor = 1080 / screenWidth;

    setOffsetX((prev) => prev + dx * scaleFactor);
    setOffsetY((prev) => prev + dy * scaleFactor);
    dragStart.current = { x: clientX, y: clientY };
  };

  const handleEnd = () => {
    isDragging.current = false;
  };

  // Generate Instagram Caption
  const captionText = useMemo(() => {
    const title = `"${record.name}"`;
    const yearText = record.year ? `, ${record.year}` : '';
    
    const detailsArray = [];
    if (record.medium) detailsArray.push(record.medium);
    if (record.substrate) detailsArray.push(record.substrate);
    if (record.dimensions) detailsArray.push(record.dimensions);
    const details = detailsArray.length > 0 ? detailsArray.join(", ") : "";
    
    const notesText = record.notes ? `\n\n"${record.notes}"` : "";
    
    const baseTags = ["ContemporaryRealism", "FineArt", "VisualArtist"];
    if (record.medium) {
      const med = record.medium.toLowerCase();
      if (med.includes("oil")) baseTags.push("OilPainting", "OilOnCanvas", "StudioPractice");
      if (med.includes("water") || med.includes("watercolor")) baseTags.push("Watercolor", "Watercolour", "Aquarelle");
      if (med.includes("draw") || med.includes("charcoal") || med.includes("pencil")) baseTags.push("Drawing", "WorkOnPaper", "Draftsmanship");
    }
    if (record.subject && Array.isArray(record.subject)) {
      record.subject.forEach(sub => {
        const formattedSub = sub.replace(/\s+/g, '');
        baseTags.push(formattedSub);
        if (formattedSub.toLowerCase() === "landscape" || formattedSub.toLowerCase() === "pleinair") {
          baseTags.push("PleinAirPainting", "LandscapePainting");
        }
        if (formattedSub.toLowerCase() === "portrait" || formattedSub.toLowerCase() === "figurative" || formattedSub.toLowerCase() === "figure") {
          baseTags.push("FigurativeArt", "Portraiture", "FromLife");
        }
        if (formattedSub.toLowerCase() === "stilllife") {
          baseTags.push("StillLifePainting", "FromLife");
        }
      });
    }
    
    const hashtags = Array.from(new Set(baseTags))
      .slice(0, 5)
      .map(tag => `#${tag.charAt(0).toUpperCase() + tag.slice(1)}`)
      .join(" ");

    return `Surnoor Sembhi (b. Fraser Valley, BC)
${title}${yearText}
${details}${notesText}

Full catalog & availability: www.surnoor.art | @surnoorsembhi

${hashtags}`;
  }, [record]);

  // Auto-copy caption on mount for efficiency
  useEffect(() => {
    navigator.clipboard.writeText(captionText).catch(() => {});
  }, [captionText]);

  const copyCaption = () => {
    navigator.clipboard.writeText(captionText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const offscreen = offscreenCanvasRef.current;
    if (!offscreen || isDownloading) return;

    setIsDownloading(true);
    try {
      const link = document.createElement("a");
      link.download = `${record.name.replace(/\s+/g, "_")}_Instagram_${format}.jpg`;
      link.href = offscreen.toDataURL("image/jpeg", 0.95);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to download image", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const offscreen = offscreenCanvasRef.current;
    if (!offscreen) return;

    try {
      offscreen.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `${record.name.replace(/\s+/g, "_")}_Instagram_${format}.jpg`, { type: "image/jpeg" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: record.name,
            text: `Check out ${record.name} by Surnoor Sembhi`,
          });
        } else {
          // Fallback to direct download if share sheet is unsupported
          handleDownload();
        }
      }, "image/jpeg", 0.95);
    } catch (err) {
      console.error("Failed to share image", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
    >
      <div 
        className="max-w-6xl w-full bg-background border border-border shadow-2xl rounded-md overflow-hidden grid grid-cols-1 lg:grid-cols-12 max-h-[calc(100vh-2rem)] lg:max-h-[calc(100vh-4rem)] overflow-y-auto lg:overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Left column: Canvas & interactive cropping */}
        <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-border flex flex-col justify-between lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Editor Panel</span>
                <h3 className="font-serif text-2xl font-light mt-1">{record.name}</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded transition-colors lg:hidden">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Layout selector */}
            <div className="flex gap-2 p-1 bg-muted/30 border border-border rounded mb-6">
              <button
                onClick={() => setFormat("story")}
                className={`flex-1 py-2 text-xs tracking-wider uppercase font-semibold rounded transition-colors ${
                  format === "story" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                9:16 Story (1080x1920)
              </button>
              <button
                onClick={() => setFormat("post")}
                className={`flex-1 py-2 text-xs tracking-wider uppercase font-semibold rounded transition-colors ${
                  format === "post" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                1:1 Post (1080x1080)
              </button>
            </div>
            
            {/* Draggable workspace */}
            <div className="relative w-full aspect-square flex items-center justify-center bg-[#eae8e3] rounded border border-border overflow-hidden select-none">
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/20">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-xs text-muted-foreground tracking-widest uppercase">Loading Artwork...</p>
                </div>
              )}
              {imageError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-destructive/10 text-destructive p-6 text-center">
                  <p className="text-sm font-semibold">Could not load artwork image.</p>
                  <p className="text-xs opacity-80">Please ensure the Airtable image URL is active.</p>
                </div>
              )}

              {/* Visible on-screen canvas */}
              <canvas
                ref={canvasRef}
                onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
                onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={handleEnd}
                className={`max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing border border-black/5 shadow-lg ${
                  format === "story" ? "aspect-[9/16]" : "aspect-[1/1]"
                }`}
              />

              {/* Hidden offscreen canvas for exporting full-resolution copies */}
              <canvas ref={offscreenCanvasRef} className="hidden" />
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 pt-6 border-t border-border space-y-4">
            <div className="flex items-center gap-4">
              <ZoomOut className="w-4 h-4 text-muted-foreground" />
              <input
                type="range"
                min="1.0"
                max="4.0"
                step="0.01"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="flex-1 accent-primary cursor-pointer"
              />
              <ZoomIn className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground w-10 text-right">{zoom.toFixed(2)}x</span>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Crop className="w-3.5 h-3.5" />
                Drag image to pan / position crop
              </span>
              <button 
                onClick={() => { setZoom(1.0); setOffsetX(0); setOffsetY(0); }}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Frame
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Branding review & caption */}
        <div className="lg:col-span-5 p-6 flex flex-col justify-between bg-muted/10 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
          <div>
            <div className="hidden lg:flex justify-between items-center mb-6">
              <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Preview & Share</span>
              <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Caption Generator */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Instagram Caption</label>
                <button
                  onClick={copyCaption}
                  className="text-xs text-primary font-semibold hover:opacity-80 transition-opacity flex items-center gap-1.5"
                >
                  {isCopied ? <><Check className="w-3.5 h-3.5 text-green-500" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Caption</>}
                </button>
              </div>
              <textarea
                readOnly
                value={captionText}
                className="w-full h-48 sm:h-64 text-xs font-mono p-3 bg-card border border-border rounded resize-none focus:outline-none scrollbar-thin text-muted-foreground"
              />
              <p className="text-[10px] text-muted-foreground leading-normal italic">
                * Caption has been automatically copied to your clipboard. You can paste it directly when uploading.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 pt-6 border-t border-border flex flex-col gap-3">
            <button
              onClick={handleDownload}
              disabled={!imageLoaded || isDownloading}
              className="w-full py-3.5 bg-foreground text-background hover:bg-foreground/90 font-semibold tracking-wider text-xs uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download Branded Card
            </button>
            
            <button
              onClick={handleShare}
              disabled={!imageLoaded}
              className="w-full py-3.5 border border-border bg-background hover:bg-muted/40 font-semibold tracking-wider text-xs uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Share2 className="w-4 h-4 text-muted-foreground" />
              Share Direct
            </button>
          </div>
        </div>
        
      </div>
    </motion.div>
  );
}
