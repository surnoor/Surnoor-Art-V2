import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trackArtworkView } from "../utils/analytics";
import { ChevronDown } from "lucide-react";
import { useShop, type ShopProduct } from "../hooks/useShop";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";
import WorkCard from "../components/WorkCard";
import { ARButton } from "../components/ARViewer";

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-xs tracking-[0.15em] uppercase">{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="pb-6 text-sm text-muted-foreground leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

function ProductImage({ src, alt, onClick }: { src: string; alt: string; onClick: () => void }) {
  return (
    <div 
      className="relative w-full overflow-hidden bg-card group cursor-zoom-in flex items-start justify-center"
      onClick={onClick}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-auto object-contain p-6 md:p-8 transition-transform duration-700 group-hover:scale-[1.02]"
        onLoad={(e) => e.currentTarget.style.opacity = "1"}
      />
      <div className="absolute inset-0 bg-background/0 group-hover:bg-background/5 transition-colors duration-300" />
      <div className="absolute bottom-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/80 bg-background/60 backdrop-blur-[2px] px-2 py-1">Click to Enlarge</span>
      </div>
    </div>
  );
}

function ProductLightbox({ 
  images, 
  initialIdx, 
  onClose,
  onNavigate
}: { 
  images: string[]; 
  initialIdx: number; 
  onClose: () => void;
  onNavigate: (idx: number) => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(initialIdx);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [currentIdx]);

  const handleNext = () => {
    const next = (currentIdx + 1) % images.length;
    setCurrentIdx(next);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    onNavigate(next);
  };

  const handlePrev = () => {
    const prev = (currentIdx - 1 + images.length) % images.length;
    setCurrentIdx(prev);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    onNavigate(prev);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => {
    setZoom(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/98 backdrop-blur-md flex flex-col items-center justify-center select-none">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-20 px-6 flex items-center justify-between z-10">
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
          {currentIdx + 1} / {images.length}
        </span>
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center hover:bg-muted/50 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button 
            onClick={handlePrev}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center hover:bg-muted/30 transition-colors group"
            aria-label="Previous"
          >
            <ChevronLeft className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
          <button 
            onClick={handleNext}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center hover:bg-muted/30 transition-colors group"
            aria-label="Next"
          >
            <ChevronRight className="w-8 h-8 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </>
      )}

      {/* Main Image Viewport */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-10">
        <div 
          className="relative transition-transform duration-200 ease-out"
          style={{ 
            transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)`,
            cursor: zoom > 1 ? 'grab' : 'default'
          }}
        >
          <img
            src={images[currentIdx]}
            alt="Product view"
            className="max-w-[90vw] max-h-[80vh] object-contain shadow-2xl"
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-10 flex items-center gap-3 z-10">
        <button 
          onClick={handleZoomOut}
          disabled={zoom <= 1}
          className="w-12 h-12 flex items-center justify-center bg-card/90 backdrop-blur-md border border-border hover:bg-background transition-all disabled:opacity-30 shadow-sm"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button 
          onClick={handleZoomIn}
          disabled={zoom >= 4}
          className="w-12 h-12 flex items-center justify-center bg-card/90 backdrop-blur-md border border-border hover:bg-background transition-all disabled:opacity-30 shadow-sm"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function ProductDetailPage({ productId }: { productId: string }) {
  const [, navigate] = useLocation();
  const { available, sold, loading, error } = useShop();
  const { addToCart, isInCart } = useCart();

  const allProducts = [...available, ...sold];
  const product: ShopProduct | undefined = allProducts.find((p) => p.id === productId);

  const [selectedImage, setSelectedImage] = useState(0);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [interestOpen, setInterestOpen] = useState(false);
  const [interestEmail, setInterestEmail] = useState("");
  const [interestStatus, setInterestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    if (product) {
      document.title = `${product.name} — Surnoor Sembhi`;
      trackArtworkView(product.name, product.category ?? "");
    } else {
      document.title = "Work — Surnoor Sembhi";
    }
    setSelectedImage(0);
  }, [product, productId]);

  const isSold = product?.status?.toLowerCase() === "sold";
  const hasPurchasablePrice = !isSold && product?.price != null && product?.priceId != null;
  const priceDisplay = formatPrice(product?.price ?? null, product?.currency ?? null);
  const alreadyInCart = product ? isInCart(product.id) : false;

  const relatedProducts = available
    .filter((p) => p.id !== productId)
    .slice(0, 4);

  function handleAddToCart() {
    if (!product || isSold || !hasPurchasablePrice) return;
    addToCart({
      productId: product.id,
      priceId: product.priceId!,
      name: product.name,
      price: product.price!,
      currency: product.currency,
      image: product.images[0] ?? null,
    });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2200);
  }

  async function handleExpressInterest(e: React.FormEvent) {
    e.preventDefault();
    if (!interestEmail || !product) return;
    setInterestStatus("loading");
    try {
      const res = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: interestEmail, artwork: product.name }),
      });
      if (!res.ok) throw new Error("Failed");
      setInterestStatus("success");
    } catch {
      setInterestStatus("error");
    }
  }

  const mailtoSubject = encodeURIComponent(`Enquiry: ${product?.name ?? ""}`);
  const mailtoHref = `mailto:surnoorsingh@gmail.com?subject=${mailtoSubject}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-6 md:px-12 py-24">
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error || (!loading && !product)) {
    return (
      <div className="min-h-screen bg-background px-6 md:px-12 py-24">
        <p className="text-sm text-muted-foreground mb-8">
          {error ?? "Work not found."}
        </p>
        <button
          onClick={() => navigate("/shop")}
          className="text-[10px] tracking-[0.15em] uppercase border border-primary text-primary px-4 py-2 hover:bg-primary hover:text-background transition-colors"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  if (!product) return null;

  const images = product.images.length > 0 ? product.images : [];
  const categoryMediumLine = [product.category, product.medium].filter(Boolean).join(" · ");
  const substrateDimensionsLine = [product.substrate, product.dimensions].filter(Boolean).join(" · ");

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 md:px-12 py-12 md:py-20">
        {/* Breadcrumb */}
        <nav className="mb-10 text-xs tracking-[0.15em] uppercase text-muted-foreground flex items-center gap-2">
          <Link href="/shop" className="hover:text-foreground transition-colors">Shop</Link>
          <span>›</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        {/* Main product area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20 mb-24">
          {/* Image gallery — left */}
          <div className="lg:col-span-7 flex flex-col-reverse lg:flex-row gap-4">
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto">
                {images.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-16 h-20 lg:w-14 lg:h-[72px] bg-card overflow-hidden border transition-colors ${idx === selectedImage ? "border-primary" : "border-transparent hover:border-border"
                      }`}
                  >
                    <img
                      src={src}
                      alt={`${product.name} view ${idx + 1}`}
                      loading="lazy"
                      className="w-full h-full object-contain p-1 opacity-0 transition-opacity duration-300"
                      onLoad={(e) => e.currentTarget.classList.remove("opacity-0")}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="flex-1 bg-card overflow-hidden relative">
              {images.length > 0 && selectedImage === 0 && (
                <ARButton 
                  imageUrl={images[0]} 
                  dimensionsString={product.dimensions || product.description} 
                  productName={product.name} 
                />
              )}
              {images.length > 0 ? (
                <ProductImage 
                  src={images[selectedImage]} 
                  alt={product.name} 
                  onClick={() => setIsLightboxOpen(true)}
                />
              ) : (
                <div className="w-full h-96 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground tracking-wide uppercase">No image</span>
                </div>
              )}
            </div>
          </div>

          {/* Lightbox */}
          {isLightboxOpen && images.length > 0 && (
            <ProductLightbox 
              images={images} 
              initialIdx={selectedImage}
              onClose={() => setIsLightboxOpen(false)}
              onNavigate={(idx) => setSelectedImage(idx)}
            />
          )}


          {/* Product details — right */}
          <div className="lg:col-span-5 flex flex-col">
            {isSold && (
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Sold</span>
              </div>
            )}

            <h1 className="font-serif text-3xl md:text-4xl font-light leading-tight mb-3">
              {product.name}
            </h1>

            {categoryMediumLine && (
              <p className="text-muted-foreground text-xs tracking-wide mb-1">{categoryMediumLine}</p>
            )}
            {substrateDimensionsLine && (
              <p className="text-muted-foreground text-xs tracking-wide mb-5">{substrateDimensionsLine}</p>
            )}

            <p className="text-lg font-medium mb-8">{priceDisplay}</p>

            {!isSold && hasPurchasablePrice && (
              <div className="mb-5 space-y-3">
                {/* Express Interest */}
                <div className="w-full">
                  <button
                    onClick={() => setInterestOpen(!interestOpen)}
                    className="w-full h-10 text-[11px] tracking-[0.15em] uppercase border border-border text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
                  >
                    Express Interest
                  </button>
                  <AnimatePresence>
                    {interestOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <form onSubmit={handleExpressInterest} className="pt-3 pb-1 flex flex-col gap-2">
                          <p className="text-xs text-muted-foreground text-center">Leave your email to stay updated on this piece.</p>
                          <div className="flex gap-2">
                            <input
                              type="email"
                              required
                              placeholder="Your email address"
                              value={interestEmail}
                              onChange={(e) => setInterestEmail(e.target.value)}
                              disabled={interestStatus === "loading" || interestStatus === "success"}
                              className="flex-1 min-w-0 h-10 px-3 text-xs border border-border bg-transparent focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                            />
                            <button
                              type="submit"
                              disabled={interestStatus === "loading" || interestStatus === "success"}
                              className="h-10 flex-shrink-0 px-4 text-[10px] tracking-widest uppercase bg-primary text-background hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                              {interestStatus === "loading" ? "..." : "Submit"}
                            </button>
                          </div>
                          {interestStatus === "success" && (
                            <p className="text-[10px] text-[#4efa84] text-center mt-1 uppercase tracking-widest">Interest recorded.</p>
                          )}
                          {interestStatus === "error" && (
                            <p className="text-[10px] text-destructive text-center mt-1 uppercase tracking-widest">Something went wrong.</p>
                          )}
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {alreadyInCart ? (
                  <Link
                    href="/cart"
                    className="flex items-center justify-center w-full h-10 text-[11px] tracking-[0.15em] uppercase bg-[#4efa84] text-primary border-none hover:opacity-90 transition-opacity"
                  >
                    In Cart — View Cart →
                  </Link>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="w-full h-10 text-[11px] tracking-[0.15em] uppercase border border-primary text-primary hover:bg-primary hover:text-background transition-colors"
                  >
                    {addedFeedback ? "Added to Cart" : "Add to Cart"}
                  </button>
                )}
              </div>
            )}

            {!isSold && !hasPurchasablePrice && (
              <a
                href={mailtoHref}
                className="inline-flex items-center justify-center h-10 px-6 text-[11px] tracking-[0.15em] uppercase border border-primary text-primary hover:bg-primary hover:text-background transition-colors mb-5"
              >
                Enquire
              </a>
            )}

            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                {product.description}
              </p>
            )}

            {/* Accordions */}
            <div className="mb-8">
              <Accordion title="Shipping Info">
                <p>
                  Standard shipping: 5–10 business days — $15 CAD<br />
                  Express shipping: 2–4 business days — $35 CAD<br />
                  We ship to Canada, United States, United Kingdom, Australia, and New Zealand.
                  All works are carefully packaged to arrive safely.
                </p>
              </Accordion>
              <Accordion title="Return & Refund Policy">
                <p>
                  Original works and prints are final sale. If your order arrives damaged, please
                  contact <a href="mailto:surnoorsingh@gmail.com" className="underline underline-offset-2">surnoorsingh@gmail.com</a> within
                  7 days of receipt with photographs and we will make it right.
                </p>
              </Accordion>
            </div>
          </div>
        </div>

        {/* You might also like */}
        {relatedProducts.length > 0 && (
          <div className=" pt-16">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-10">
              You might also like
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {relatedProducts.map((p) => (
                <WorkCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
