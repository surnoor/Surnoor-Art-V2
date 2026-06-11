import { useEffect, useMemo, useState, useRef } from "react";
import { motion, type Variants } from "framer-motion";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X, Download, Share2, Check, Loader2, Printer, Facebook, Twitter, Linkedin, Mail, Link as LinkIcon, MessageCircle, Image as ImageIcon } from "lucide-react";
import { useArchive, type ArchiveRecord } from "../hooks/useArchive";
import { FilterGroup } from "../components/FilterGroup";
import BauhausLoader from "../components/BauhausLoader";

const easing: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easing },
  },
};



/* ── Archive card with lightbox ── */
function ArchiveCard({
  record,
  onClick,
}: {
  record: ArchiveRecord;
  onClick: () => void;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="bg-card aspect-[3/4] mb-4 overflow-hidden flex items-center justify-center p-3 relative">
        {record.thumbnail ? (
          <img
            src={record.thumbnail}
            alt={record.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="text-xs text-muted-foreground tracking-wide uppercase">
            No image
          </span>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-background/0 group-hover:bg-background/10 transition-colors duration-300" />
      </div>
      <h3 className="font-serif text-base mb-0.5 group-hover:text-primary transition-colors">
        {record.name}
      </h3>
      <div className="flex flex-wrap gap-x-2 text-muted-foreground text-xs">
        {record.medium && <span>{record.medium}</span>}
        {record.year && (
          <>
            <span className="text-border">·</span>
            <span>{record.year}</span>
          </>
        )}
      </div>
      {record.dimensions && (
        <p className="text-muted-foreground text-xs mt-0.5">{record.dimensions}</p>
      )}
    </motion.div>
  );
}

/* ── Archive Image with Progressive Loading ── */
function ArchiveImage({
  src,
  alt,
  thumbnail,
}: {
  src: string;
  alt: string;
  thumbnail?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full min-h-[50vh] flex items-center justify-center bg-card rounded overflow-hidden">
      {!loaded && thumbnail && (
        <img
          src={thumbnail}
          alt={alt}
          className="absolute inset-0 w-full h-full object-contain"
        />
      )}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/10 z-10">
          <Loader2 className="w-6 h-6 text-muted-foreground/50 animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        loading="lazy"
        decoding="async"
        className={`w-full max-h-[calc(100vh-10rem)] object-contain rounded ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

/* ── Lightbox / detail overlay ── */
function Lightbox({
  record,
  onClose,
  onNext,
  onPrev,
  allRecords,
  onSelectRecord,
}: {
  record: ArchiveRecord;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  allRecords?: ArchiveRecord[];
  onSelectRecord?: (record: ArchiveRecord) => void;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [pinterestShareData, setPinterestShareData] = useState<{ url: string, description: string } | null>(null);
  
  const downloadAbortRef = useRef<AbortController | null>(null);

  // Cancel any pending fetches if the user navigates to a new image or closes the lightbox
  useEffect(() => {
    return () => {
      if (downloadAbortRef.current) downloadAbortRef.current.abort();
      setIsSharing(false);
      setIsDownloading(false);
      setShowShareMenu(false);
      setPinterestShareData(null);
    };
  }, [record.id]);

  const shareUrl = window.location.href;
  const shareTitle = `${record.name} - Surnoor Art`;
  const shareText = `Check out ${record.name} by Surnoor Sembhi`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowShareMenu(false);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const generateStoryCard = async () => {
    if (!record.image) return null;
    try {
      const response = await fetch(record.image, { cache: "force-cache" });
      const blobData = await response.blob();
      const objectUrl = URL.createObjectURL(blobData);

      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");

      if (!ctx) return null;

      ctx.fillStyle = "#f8f8f8";
      ctx.fillRect(0, 0, 1080, 1920);

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = objectUrl;
      });

      const maxWidth = 840;
      const maxHeight = 1000;
      let imgW = img.width;
      let imgH = img.height;
      const ratio = Math.min(maxWidth / imgW, maxHeight / imgH);
      imgW = imgW * ratio;
      imgH = imgH * ratio;
      
      const x = (1080 - imgW) / 2;
      const y = 200 + (maxHeight - imgH) / 2;
      
      ctx.shadowColor = "rgba(0,0,0,0.15)";
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 20;
      ctx.drawImage(img, x, y, imgW, imgH);
      
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.textAlign = "center";
      ctx.fillStyle = "#111111";
      ctx.font = "300 72px 'Hanken Grotesk', sans-serif";
      ctx.fillText(record.name, 540, 1400);

      ctx.fillStyle = "#666666";
      ctx.font = "400 32px 'Hanken Grotesk', sans-serif";
      ctx.fillText((record.medium || record.category || "Original Artwork").toUpperCase(), 540, 1480);

      ctx.fillStyle = "#111111";
      ctx.fillRect(500, 1540, 80, 2);

      ctx.font = "300 36px 'Hanken Grotesk', sans-serif";
      ctx.fillText("Surnoor Sembhi", 540, 1620);

      ctx.fillStyle = "#888888";
      ctx.font = "400 28px 'Hanken Grotesk', sans-serif";
      ctx.fillText("surnoor.art", 540, 1680);

      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/jpeg", 0.9));
      URL.revokeObjectURL(objectUrl);
      return blob;
    } catch (e) {
      console.warn("Could not generate story card", e);
      return null;
    }
  };

  const shareImageViaOS = async () => {
    setShowShareMenu(false);
    if (isSharing) return;
    setIsSharing(true);
    try {
      const blob = await generateStoryCard();
      if (blob) {
        const file = new File([blob], `${record.name.replace(/\s+/g, '_')}_Story.jpg`, { type: "image/jpeg" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: record.name,
            text: `Check out ${record.name} by Surnoor Sembhi`,
            url: window.location.href,
          });
        } else {
          // Fallback to downloading the image
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error("Share image failed", err);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const shareOptions = [
    {
      name: "Copy Link",
      icon: <LinkIcon className="w-4 h-4" />,
      onClick: copyToClipboard,
    },
    {
      name: "Share Image",
      icon: <ImageIcon className="w-4 h-4" />,
      onClick: shareImageViaOS,
    },
    {
      name: "Email",
      icon: <Mail className="w-4 h-4" />,
      onClick: () => { setShowShareMenu(false); window.open(`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + "\n" + shareUrl)}`); },
    },
    {
      name: "WhatsApp",
      icon: <MessageCircle className="w-4 h-4" />,
      onClick: () => { setShowShareMenu(false); window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`, '_blank'); },
    },
    {
      name: "X (Twitter)",
      icon: <Twitter className="w-4 h-4" />,
      onClick: () => { setShowShareMenu(false); window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank'); },
    },
    {
      name: "LinkedIn",
      icon: <Linkedin className="w-4 h-4" />,
      onClick: () => { setShowShareMenu(false); window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`, '_blank'); },
    },
    {
      name: "Facebook",
      icon: <Facebook className="w-4 h-4" />,
      onClick: () => { setShowShareMenu(false); window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank'); },
    },
    {
      name: "Pinterest",
      icon: <ImageIcon className="w-4 h-4" />,
      onClick: () => { 
        // Build Pinterest SEO-optimized hashtags
        const baseTags = ["SurnoorArt", "OriginalArt", "ContemporaryRealism"];
        if (record.medium) baseTags.push(record.medium.replace(/\s+/g, ''));
        if (record.category) baseTags.push(record.category.replace(/\s+/g, ''));
        if (record.year) baseTags.push(`Art${record.year}`);
        if (record.subject) {
          record.subject.forEach(sub => baseTags.push(sub.replace(/\s+/g, '')));
        }
        
        const hashtags = baseTags.map(tag => `#${tag}`).join(" ");
        
        // Build a robust description without quotes to avoid breaking Pinterest's parser
        const yearText = record.year ? ` (${record.year})` : '';
        const mediumText = record.medium ? ` | ${record.medium}` : '';
        const description = `${record.name}${yearText}${mediumText} by artist Surnoor Sembhi. Explore the complete archive and current availability directly at surnoor.art. ${hashtags}`;
        
        const mediaUrl = record.image || record.thumbnail || shareUrl;
        
        // Using www.pinterest.com and passing both 'description' and 'title' explicitly.
        // NOTE: Pinterest frequently ignores the description parameter now to prevent spam. 
        // We will copy the optimized description to the user's clipboard as a fallback.
        const pinterestUrl = `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(mediaUrl)}&title=${encodeURIComponent(record.name)}&description=${encodeURIComponent(description)}`;
        
        navigator.clipboard.writeText(description).catch(() => {});
        setPinterestShareData({ url: pinterestUrl, description });
      },
    }
  ];

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!record.image || isDownloading) return;
    
    setIsDownloading(true);
    downloadAbortRef.current = new AbortController();
    
    try {
      // force-cache to load instantly if the browser has already downloaded the image
      const response = await fetch(record.image, { 
        signal: downloadAbortRef.current.signal,
        cache: "force-cache"
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${record.name.replace(/\s+/g, '_')}_Surnoor_Art.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error("Download failed", err);
        window.open(record.image, '_blank');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      handleNativeShare();
    } else {
      setShowShareMenu((prev) => !prev);
    }
  };

  const handleNativeShare = async () => {
    if (isSharing) return;

    setIsSharing(true);

    try {
      let sharedFile = false;
      
      // Try generating Story Card image natively to avoid Safari hanging
      if (record.image && navigator.canShare) {
        try {
          const blob = await generateStoryCard();
          if (blob) {
            const file = new File([blob], `${record.name.replace(/\s+/g, '_')}_Story.jpg`, { type: "image/jpeg" });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: record.name,
                text: `Check out ${record.name} by Surnoor Sembhi`,
                url: window.location.href,
              });
              sharedFile = true;
            }
          }
        } catch (e) {
          console.warn("Could not generate story card natively", e);
        }
      }

      if (!sharedFile) {
        if (navigator.share) {
          await navigator.share({
            title: `${record.name} - Surnoor Art`,
            text: `Check out ${record.name} by Surnoor Sembhi`,
            url: window.location.href,
          });
        } else {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error("Share failed", err);
      }
    } finally {
      setIsSharing(false);
    }
  };



  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && onNext) onNext();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
    }
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onNext, onPrev]);

  const allImages = [
    ...(record.image ? [record.image] : []),
    ...record.additionalImages,
  ];

  const activeThumbRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active thumbnail to center
  useEffect(() => {
    if (activeThumbRef.current) {
      activeThumbRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [record.id]);

  // Preload adjacent images
  useEffect(() => {
    if (!allRecords || allRecords.length === 0) return;
    
    const idx = allRecords.findIndex(r => r.id === record.id);
    if (idx === -1) return;

    // Delay preloading to prioritize the currently viewed image
    const timeout = setTimeout(() => {
      const nextRecord = allRecords[(idx + 1) % allRecords.length];
      const prevRecord = allRecords[(idx - 1 + allRecords.length) % allRecords.length];

      const urlsToPreload = [
        nextRecord.image,
        ...nextRecord.additionalImages,
        prevRecord.image,
        ...prevRecord.additionalImages
      ].filter(Boolean) as string[];

      urlsToPreload.forEach(url => {
        const img = new Image();
        img.src = url;
      });
    }, 1500);

    return () => clearTimeout(timeout);
  }, [record.id, allRecords]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10 flex flex-col md:flex-row-reverse items-center gap-2">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center hover:bg-muted/50 rounded transition-colors"
          aria-label="Close detail"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="relative flex">
          <button
            onClick={handleShareClick}
            disabled={isSharing}
            className="w-10 h-10 flex items-center justify-center hover:bg-muted/50 rounded transition-colors disabled:opacity-50"
            aria-label="Share image"
          >
            {copied && !showShareMenu ? <Check className="w-5 h-5 text-green-500" /> : isSharing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
          </button>
          
          {/* Share Dropdown */}
          {showShareMenu && (
            <>
              {/* Invisible overlay to close menu */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={(e) => { e.stopPropagation(); setShowShareMenu(false); setPinterestShareData(null); }}
              />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className={`absolute top-full right-0 mt-2 bg-background border border-border shadow-xl rounded-md overflow-hidden z-50 py-1 ${pinterestShareData ? 'w-72' : 'w-48'}`}
                onClick={(e) => e.stopPropagation()}
              >
                {pinterestShareData ? (
                  <div className="p-4 flex flex-col gap-3">
                    <p className="text-xs font-medium text-foreground">Pinterest Description</p>
                    <p className="text-[10px] text-muted-foreground leading-snug">
                      Pinterest no longer auto-fills descriptions. We've copied it to your clipboard for you!
                    </p>
                    <textarea 
                      className="w-full h-24 text-xs p-2 bg-muted/30 border border-border rounded resize-none focus:outline-none"
                      readOnly
                      value={pinterestShareData.description}
                    />
                    <div className="flex flex-col gap-2 mt-1">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(pinterestShareData.description);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="w-full py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded transition-colors flex items-center justify-center gap-2"
                      >
                        {copied ? <><Check className="w-3.5 h-3.5 text-green-500" /> Copied!</> : 'Copy Text'}
                      </button>
                      <button 
                        onClick={() => {
                          window.open(pinterestShareData.url, '_blank', 'noopener,noreferrer');
                          setShowShareMenu(false);
                          setPinterestShareData(null);
                        }}
                        className="w-full py-2 bg-[#E60023] hover:bg-[#ad081b] text-white text-xs font-medium rounded transition-colors"
                      >
                        Open Pinterest
                      </button>
                    </div>
                  </div>
                ) : (
                  shareOptions.map((option) => (
                    <button
                      key={option.name}
                      onClick={(e) => {
                        e.stopPropagation();
                        option.onClick();
                      }}
                      className="w-full px-4 py-2.5 text-sm text-left flex items-center gap-3 hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-muted-foreground">{option.icon}</span>
                      {option.name}
                    </button>
                  ))
                )}
              </motion.div>
            </>
          )}
        </div>

        <button
          onClick={handleDownload}
          disabled={isDownloading || !record.image}
          className="w-10 h-10 flex items-center justify-center hover:bg-muted/50 rounded transition-colors disabled:opacity-50"
          aria-label="Download image"
        >
          {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation Arrows */}
      {onPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center hover:bg-muted/50 rounded-full transition-colors group"
          aria-label="Previous artwork"
        >
          <ChevronLeft className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      )}
      {onNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center hover:bg-muted/50 rounded-full transition-colors group"
          aria-label="Next artwork"
        >
          <ChevronRight className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      )}

      <div
        className="max-w-5xl w-full max-h-[calc(100vh-7rem)] overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 px-12 pb-4 mb-20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Images */}
        <div className="flex flex-col gap-4">
          {allImages.length > 0 ? (
            allImages.map((src, i) => (
                <ArchiveImage
                  key={`${record.id}-${i}`}
                  src={src}
                  alt={`${record.name} ${i + 1}`}
                  thumbnail={record.thumbnail || undefined}
                />
            ))
          ) : (
            <div className="aspect-[3/4] bg-card flex items-center justify-center">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                No image
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-6 py-4">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-3">
              {record.name}
            </h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              {record.medium && (
                <p>
                  <span className="text-foreground text-xs uppercase tracking-[0.12em]">Medium</span>
                  <br />
                  {record.medium}
                </p>
              )}
              {record.substrate && (
                <p>
                  <span className="text-foreground text-xs uppercase tracking-[0.12em]">Substrate</span>
                  <br />
                  {record.substrate}
                </p>
              )}
              {record.dimensions && (
                <p>
                  <span className="text-foreground text-xs uppercase tracking-[0.12em]">Dimensions</span>
                  <br />
                  {record.dimensions}
                </p>
              )}
              {record.year && (
                <p>
                  <span className="text-foreground text-xs uppercase tracking-[0.12em]">Year</span>
                  <br />
                  {record.year}
                </p>
              )}
              {record.category && (
                <p>
                  <span className="text-foreground text-xs uppercase tracking-[0.12em]">Category</span>
                  <br />
                  {record.category}
                </p>
              )}
              {record.subject && record.subject.length > 0 && (
                <p>
                  <span className="text-foreground text-xs uppercase tracking-[0.12em]">Subject</span>
                  <br />
                  {record.subject.join(", ")}
                </p>
              )}
            </div>
          </div>
          {record.notes && (
            <div className=" pt-4">
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                {record.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Stripe */}
      {allRecords && allRecords.length > 1 && onSelectRecord && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-24 bg-background/95 backdrop-blur-md  flex items-center justify-center px-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-4 overflow-x-auto max-w-full px-4 py-4 scrollbar-hide items-center">
            {allRecords.map((r) => {
              const isActive = r.id === record.id;
              return (
              <button
                key={r.id}
                ref={isActive ? activeThumbRef : null}
                onClick={() => onSelectRecord(r)}
                className={`relative h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 rounded overflow-hidden transition-all duration-300 ${
                  isActive 
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background opacity-100 scale-105' 
                    : 'opacity-40 hover:opacity-100'
                }`}
                aria-label={`View ${r.name}`}
              >
                {r.thumbnail ? (
                  <img src={r.filmstrip || r.thumbnail} alt={r.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-[8px] uppercase text-muted-foreground tracking-widest">Img</div>
                )}
              </button>
            )})}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ── Main Archive Page ── */
export default function ArchivePage() {
  const { archive, loading, error } = useArchive();
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedMedium, setSelectedMedium] = useState("All");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [lightboxRecord, setLightboxRecord] = useState<ArchiveRecord | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAnimatingLoader, setIsAnimatingLoader] = useState(true);

  useEffect(() => {
    document.title = "Archive — Surnoor Sembhi | Past Works";
  }, []);

  // Check URL for artwork on mount/load
  useEffect(() => {
    if (archive.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const artworkId = params.get('artwork');
      if (artworkId && !lightboxRecord) {
        const record = archive.find(r => r.id === artworkId);
        if (record) setLightboxRecord(record);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archive]);

  // Update URL when lightbox opens/closes
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (lightboxRecord) {
      const newUrl = `${window.location.pathname}?artwork=${lightboxRecord.id}`;
      window.history.replaceState(null, '', newUrl);
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [lightboxRecord]);

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
      years: [...years].sort((a, b) => parseInt(b) - parseInt(a)),
      mediums: [...mediums].sort(),
      subjects: [...subjects].sort(),
      categories: [...categories].sort(),
    };
  }, [archive]);

  /* Filter & Sort records */
  const filtered = useMemo(() => {
    const list = archive.filter((r) => {
      if (r.status !== 'Archive') return false;
      if (selectedYear !== "All" && r.year?.trim() !== selectedYear) return false;
      if (selectedMedium !== "All" && r.medium?.trim() !== selectedMedium) return false;
      if (selectedSubject !== "All" && !r.subject?.includes(selectedSubject)) return false;
      if (selectedCategory !== "All" && r.category?.trim() !== selectedCategory) return false;
      return true;
    });

    // Sort to bring recent paintings first, then Watercolors to the top
    return [...list].sort((a, b) => {
      const yearA = a.year ? parseInt(a.year, 10) : 0;
      const yearB = b.year ? parseInt(b.year, 10) : 0;
      if (yearA !== yearB) {
        return yearB - yearA;
      }

      const aIsWatercolor = a.medium?.toLowerCase().includes("watercolor") ?? false;
      const bIsWatercolor = b.medium?.toLowerCase().includes("watercolor") ?? false;

      if (aIsWatercolor && !bIsWatercolor) return -1;
      if (!aIsWatercolor && bIsWatercolor) return 1;
      return 0;
    });
  }, [archive, selectedYear, selectedMedium, selectedSubject, selectedCategory]);

  const activeFilterCount = [selectedYear, selectedMedium, selectedSubject, selectedCategory].filter(
    (v) => v !== "All"
  ).length;

  function clearAll() {
    setSelectedYear("All");
    setSelectedMedium("All");
    setSelectedSubject("All");
    setSelectedCategory("All");
  }

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
          Filters
        </p>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-primary hover:opacity-70 transition-opacity"
          >
            Clear all
          </button>
        )}
      </div>

      {filters.years.length > 0 && (
        <FilterGroup
          label="Year"
          options={["All", ...filters.years]}
          selected={selectedYear}
          onSelect={setSelectedYear}
        />
      )}
      {filters.mediums.length > 0 && (
        <FilterGroup
          label="Medium"
          options={["All", ...filters.mediums]}
          selected={selectedMedium}
          onSelect={setSelectedMedium}
        />
      )}
      {filters.subjects.length > 0 && (
        <FilterGroup
          label="Subject"
          options={["All", ...filters.subjects]}
          selected={selectedSubject}
          onSelect={setSelectedSubject}
        />
      )}
      {filters.categories.length > 0 && (
        <FilterGroup
          label="Category"
          options={["All", ...filters.categories]}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background">

      {/* Mobile filter toggle */}
      <div className="md:hidden relative z-30 bg-background px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-muted-foreground"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-background text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        <span className="text-xs text-muted-foreground">
          {(!loading && !isAnimatingLoader) ? (
            <>{filtered.length} work{filtered.length !== 1 ? "s" : ""}</>
          ) : (
            <>&nbsp;</>
          )}
        </span>
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="md:hidden fixed inset-0 top-[var(--header-offset)] z-40"
        >
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full bg-background  p-6 overflow-y-auto">
            {sidebarContent}
          </div>
        </motion.div>
      )}

      {/* Dashboard layout */}
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-60 lg:w-64 flex-shrink-0  p-6">
          {sidebarContent}
        </aside>

        {/* Main content */}
        <main className="flex-1 px-6 md:px-8 lg:px-12 py-8 md:py-10">
          {(loading || isAnimatingLoader) && (
            <BauhausLoader isDone={!loading} onComplete={() => setIsAnimatingLoader(false)} />
          )}

          {error && !isAnimatingLoader && (
            <p className="text-sm text-muted-foreground">
              Could not load archive — {error}
            </p>
          )}

          {!loading && !isAnimatingLoader && !error && filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground italic mb-4">
                No works match the selected filters.
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs tracking-[0.15em] uppercase text-primary hover:opacity-70 transition-opacity"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {!loading && !isAnimatingLoader && !error && filtered.length > 0 && (
            <>
              <div className="hidden md:flex items-center justify-between mb-8">
                <p className="text-xs text-muted-foreground">
                  {filtered.length} work{filtered.length !== 1 ? "s" : ""}
                  {activeFilterCount > 0 && " (filtered)"}
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                {filtered.map((record) => (
                  <ArchiveCard
                    key={record.id}
                    record={record}
                    onClick={() => setLightboxRecord(record)}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Lightbox */}
      {lightboxRecord && (() => {
        const idx = filtered.findIndex((r) => r.id === lightboxRecord.id);
        const hasNext = idx !== -1 && idx < filtered.length - 1;
        const hasPrev = idx > 0;

        return (
          <Lightbox
            record={lightboxRecord}
            allRecords={filtered}
            onSelectRecord={setLightboxRecord}
            onClose={() => setLightboxRecord(null)}
            onNext={hasNext ? () => setLightboxRecord(filtered[idx + 1]) : undefined}
            onPrev={hasPrev ? () => setLightboxRecord(filtered[idx - 1]) : undefined}
          />
        );
      })()}
    </div>
  );
}
