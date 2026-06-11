import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useArchive, type ArchiveRecord } from "../hooks/useArchive";

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

  // Preload adjacent images
  useEffect(() => {
    if (!allRecords || allRecords.length === 0) return;
    
    const idx = allRecords.findIndex(r => r.id === record.id);
    if (idx === -1) return;

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
  }, [record.id, allRecords]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-10 w-10 h-10 flex items-center justify-center hover:bg-muted/50 rounded transition-colors"
        aria-label="Close detail"
      >
        <X className="w-5 h-5" />
      </button>

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
              <img
                key={i}
                src={src}
                alt={`${record.name} ${i + 1}`}
                className="w-full max-h-[calc(100vh-10rem)] object-contain bg-card rounded"
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
              {record.subject && (
                <p>
                  <span className="text-foreground text-xs uppercase tracking-[0.12em]">Subject</span>
                  <br />
                  {record.subject}
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
          <div className="flex gap-4 overflow-x-auto max-w-full pb-2 pt-2 scrollbar-hide items-center">
            {allRecords.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelectRecord(r)}
                className={`relative h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 rounded overflow-hidden transition-all duration-300 ${
                  r.id === record.id 
                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background opacity-100 scale-105' 
                    : 'opacity-40 hover:opacity-100'
                }`}
                aria-label={`View ${r.name}`}
              >
                {r.thumbnail ? (
                  <img src={r.thumbnail} alt={r.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-[8px] uppercase text-muted-foreground tracking-widest">Img</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function EventPage() {
  const { archive, loading, error } = useArchive();
  const [lightboxRecord, setLightboxRecord] = useState<ArchiveRecord | null>(null);

  useEffect(() => {
    document.title = "Selected Works — Event Showcase";
  }, []);

  const eventWorks = archive.filter(record => record.showAtEvent);

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="px-6 md:px-12 pt-10 pb-6 ">
        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">
            Private Showcase
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-light">
            Selected Works
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg">
            A curated selection of past works.
          </p>
        </motion.div>
      </div>

      <main className="px-6 md:px-12 lg:px-16 py-12 md:py-16">
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-card aspect-[3/4] mb-4" />
                <div className="h-4 bg-card rounded w-3/4 mb-2" />
                <div className="h-3 bg-card rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-muted-foreground">
            Could not load works — {error}
          </p>
        )}

        {!loading && !error && eventWorks.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground italic mb-4">
              No works have been selected for this event yet.
            </p>
            <p className="text-xs text-muted-foreground">
              (Please check the "ShowAtEvent" column in Airtable)
            </p>
          </div>
        )}

        {!loading && !error && eventWorks.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10 lg:gap-12">
            {eventWorks.map((record) => (
              <ArchiveCard
                key={record.id}
                record={record}
                onClick={() => setLightboxRecord(record)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lightboxRecord && (
        <Lightbox
          record={lightboxRecord}
          allRecords={eventWorks}
          onSelectRecord={setLightboxRecord}
          onClose={() => setLightboxRecord(null)}
          onNext={() => {
            const idx = eventWorks.findIndex((r) => r.id === lightboxRecord.id);
            if (idx !== -1 && idx < eventWorks.length - 1) {
              setLightboxRecord(eventWorks[idx + 1]);
            } else if (idx === eventWorks.length - 1) {
              setLightboxRecord(eventWorks[0]); // Loop back to start
            }
          }}
          onPrev={() => {
            const idx = eventWorks.findIndex((r) => r.id === lightboxRecord.id);
            if (idx !== -1 && idx > 0) {
              setLightboxRecord(eventWorks[idx - 1]);
            } else if (idx === 0) {
              setLightboxRecord(eventWorks[eventWorks.length - 1]); // Loop to end
            }
          }}
        />
      )}
    </div>
  );
}
