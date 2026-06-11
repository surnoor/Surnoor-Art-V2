import { useState, useRef, useEffect } from "react";
import { trackFilterUsed } from "../utils/analytics";
import { motion, useInView, type Variants } from "framer-motion";
import { Link } from "wouter";
import { ArrowUpRight, ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { useShop, type ShopProduct } from "../hooks/useShop";
import { FilterGroup } from "../components/FilterGroup";
import WorkCard from "../components/WorkCard";
import TrustSection from "../components/TrustSection";
import Pagination from "../components/Pagination";

const PRODUCTS_PER_PAGE = 12;

const CATEGORIES = ["All", "Original", "Print", "Digital"] as const;
const SUBJECTS = ["All", "Landscape", "Figure", "Still Life", "Urban", "Plein Air", "Abstract", "Other"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Subject = (typeof SUBJECTS)[number];

const easing: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: easing },
  },
};

function FadeIn({ children, className = "", delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function matchesFilters(
  product: ShopProduct,
  category: string,
  subject: string
): boolean {
  if (category !== "All") {
    const productCategory = product.category ?? "";
    if (productCategory.toLowerCase() !== category.toLowerCase()) return false;
  }
  if (subject !== "All") {
    const productSubject = product.subject ?? "";
    if (productSubject.toLowerCase() !== subject.toLowerCase()) return false;
  }
  return true;
}

export default function ShopPage() {
  const { available, sold, loading: shopLoading, error: shopError } = useShop();

  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [activeSubject, setActiveSubject] = useState<Subject>("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, activeSubject]);

  function handleCategoryChange(c: string) {
    setActiveCategory(c as Category);
    trackFilterUsed("category", c);
  }

  function handleSubjectChange(s: string) {
    setActiveSubject(s as Subject);
    trackFilterUsed("subject", s);
  }

  const [checkoutCancelled, setCheckoutCancelled] = useState(false);

  useEffect(() => {
    document.title = "Buy Original Art & Prints — Surnoor Sembhi | Realist Painter, BC";
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "cancel") {
      setCheckoutCancelled(true);
      params.delete("checkout");
      const newUrl = [window.location.pathname, params.toString()].filter(Boolean).join("?");
      window.history.replaceState({}, "", newUrl);
      const timer = setTimeout(() => setCheckoutCancelled(false), 6000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const filteredAvailable = available.filter((p) =>
    matchesFilters(p, activeCategory, activeSubject)
  );
  const filteredSold = sold.filter((p) =>
    matchesFilters(p, activeCategory, activeSubject)
  );

  const totalProducts = filteredAvailable.length + filteredSold.length;
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

  // Combine available and sold for pagination, but maintain internal order
  const allFiltered = [...filteredAvailable, ...filteredSold];
  const paginatedProducts = allFiltered.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const currentAvailable = paginatedProducts.filter(p => p.status !== "sold");
  const currentSold = paginatedProducts.filter(p => p.status === "sold");

  const activeFilterCount = (activeCategory !== "All" ? 1 : 0) + (activeSubject !== "All" ? 1 : 0);

  function clearAll() {
    setActiveCategory("All");
    setActiveSubject("All");
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

      <FilterGroup
        label="Category"
        options={CATEGORIES}
        selected={activeCategory}
        onSelect={handleCategoryChange}
      />

      <FilterGroup
        label="Subject"
        options={SUBJECTS}
        selected={activeSubject}
        onSelect={handleSubjectChange}
      />
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {checkoutCancelled && (
        <div className="w-full  text-center py-3 px-6">
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Checkout cancelled — your cart has not been charged.</p>
        </div>
      )}


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
          {filteredAvailable.length + filteredSold.length} work{(filteredAvailable.length + filteredSold.length) !== 1 ? "s" : ""}
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
        <aside className="hidden md:block w-60 lg:w-64 flex-shrink-0 p-6 sticky top-[68px] h-[calc(100vh-68px)] overflow-y-auto">
          {sidebarContent}
        </aside>

        {/* Main content */}
        <main className="flex-1 px-6 md:px-8 lg:px-12 py-8 md:py-10">
          {shopLoading && (
            <FadeIn>
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Loading works…</p>
            </FadeIn>
          )}

          {shopError && (
            <FadeIn>
              <p className="text-sm text-muted-foreground">
                Could not load products — {shopError}
              </p>
            </FadeIn>
          )}

          {!shopLoading && !shopError && filteredAvailable.length === 0 && filteredSold.length === 0 && (
            <FadeIn>
              <p className="text-sm text-muted-foreground italic mb-4">No works match the selected filters.</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs tracking-[0.15em] uppercase text-primary hover:opacity-70 transition-opacity"
                >
                  Clear filters
                </button>
              )}
            </FadeIn>
          )}

          {currentAvailable.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
              {currentAvailable.map((product, idx) => (
                <FadeIn key={product.id} delay={idx * 0.05}>
                  <WorkCard product={product} />
                </FadeIn>
              ))}
            </div>
          )}

          {currentSold.length > 0 && (
            <div className="mt-16">
              {currentAvailable.length > 0 && <div className=" mb-8" />}
              <FadeIn className="mb-10">
                <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Sold</p>
              </FadeIn>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
                {currentSold.map((product, idx) => (
                  <FadeIn key={product.id} delay={idx * 0.05}>
                    <WorkCard product={product} sold />
                  </FadeIn>
                ))}
              </div>
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => {
              setCurrentPage(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />

          <TrustSection />

          {/* Archive call-to-action */}
          <div className="mt-24" />
          <FadeIn className="mt-12 mb-10 flex flex-col items-center text-center">
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-2">Archive</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Browse a complete catalogue of past works — paintings no longer available for sale.
            </p>
            <Link
              href="/archive"
              className="inline-flex items-center gap-2 border border-primary text-primary text-xs tracking-[0.15em] uppercase px-6 py-3.5 hover:bg-primary hover:text-background transition-colors"
              data-testid="link-archive"
            >
              Browse Archive <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </FadeIn>
        </main>
      </div>
    </div>
  );
}
