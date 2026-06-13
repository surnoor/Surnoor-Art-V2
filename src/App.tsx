import { useEffect, useRef, useState } from "react";
import { motion, useInView, Variants, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Instagram, ExternalLink, Calendar, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Router, Route, Link, useLocation } from "wouter";
import { Analytics } from "@vercel/analytics/react";
import ShopPage from "./pages/ShopPage";
import ArchivePage from "./pages/ArchivePage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import PinterestQueue from "./pages/admin/PinterestQueue";
import InstagramConsole from "./pages/admin/InstagramConsole";
import ExhibitionPlanner from "./pages/admin/ExhibitionPlanner";
import PollPage from "./pages/PollPage";
import EventPage from "./pages/EventPage";
import SupportPage from "./pages/SupportPage";
import { CartProvider, useCart } from "./context/CartContext";
import { NewsletterProvider } from "./context/NewsletterContext";
import { useShop } from "./hooks/useShop";
import { useHeroSlides } from "./hooks/useHeroSlides";
import { trackSlideshowInteraction } from "./utils/analytics";
import WorkCard from "./components/WorkCard";
import NewsletterBanner from "./components/NewsletterBanner";
import NewsletterForm from "./components/NewsletterForm";
import { AdminAuth } from "./components/AdminAuth";

const easing: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: easing },
  },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.18 },
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


const HERO_IMAGES = [
  "/web/AL1.jpg",
  "/web/AL3.jpg",
  "/web/AL4.jpg",
  "/web/AL5.jpg",
  "/web/AL7.jpg",
  "/web/Chilliwack%20River%20Plein%20Air.jpg",
  "/web/DSC00474_edited.jpg",
  "/web/DSC00475.jpg",
  "/web/DSC09878.jpg",
  "/web/IMG_E5163.jpg",
  "/web/Screenshot%202026-02-05%20181600.jpg",
];

function CartBadge() {
  const { totalItems } = useCart();
  if (totalItems === 0) return null;
  return (
    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-background text-[9px] flex items-center justify-center tabular-nums">
      {totalItems > 9 ? "9+" : totalItems}
    </span>
  );
}

function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const isShop = location.startsWith("/shop");
  const isCart = location === "/cart";
  const { totalItems } = useCart();
  const [, setLocation] = useLocation();

  const scrollToHash = (e: React.MouseEvent, hash: string) => {
    // If we are on the home page, just scroll
    if (location === "/") {
      e.preventDefault();
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", hash);
      }
    }
    // If on another page, let the Link handle navigation
    // The useEffect in AppInner will handle the scroll after navigation
  };

  return (
    <>
    <div className="relative">
      <nav
        className="flex items-center justify-between px-6 md:px-12 py-4 bg-background"
        data-testid="nav"
      >
        <Link 
          href="/" 
          className="font-sans text-sm tracking-[0.2em] font-bold uppercase" 
          data-testid="nav-logo"
          onClick={() => {
            if (location === "/") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        >
          Surnoor Sembhi
        </Link>
        <div className="hidden md:flex items-center gap-5 text-[10px] tracking-[0.2em] font-bold uppercase text-foreground">
          <Link
            href="/shop"
            className={`transition-colors ${isShop ? "text-[#4efa84]" : "hover:text-foreground"}`}
            data-testid="nav-shop"
            onClick={() => {
              if (isShop) window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Shop
          </Link>
          <Link
            href="/archive"
            className={`transition-colors ${location === "/archive" ? "text-[#4efa84]" : "hover:text-foreground"}`}
            data-testid="nav-archive"
            onClick={() => {
              if (location === "/archive") window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Archive
          </Link>
          <Link 
            href="/#instruction" 
            className="hover:text-foreground transition-colors" 
            data-testid="nav-learn"
            onClick={(e) => scrollToHash(e, "#instruction")}
          >
            Learn
          </Link>
          <Link 
            href="/#about" 
            className="hover:text-foreground transition-colors" 
            data-testid="nav-about"
            onClick={(e) => scrollToHash(e, "#about")}
          >
            About
          </Link>
          <Link
            href="/support"
            className={`transition-colors ${location === "/support" ? "text-[#4efa84]" : "hover:text-foreground"}`}
            data-testid="nav-support"
            onClick={() => {
              if (location === "/support") window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Support
          </Link>
          <a href="mailto:surnoorsingh@gmail.com" className="hover:text-foreground transition-colors" data-testid="nav-contact">Contact</a>
          <Link
            href="/cart"
            className={`relative transition-colors ${isCart ? "text-[#4efa84]" : "hover:text-foreground"}`}
            aria-label={`Cart${totalItems > 0 ? ` (${totalItems} items)` : ""}`}
            data-testid="nav-cart"
          >
            <ShoppingBag className="w-4 h-4" />
            <CartBadge />
          </Link>
        </div>
        <div className="flex items-center gap-4 md:hidden">
          <Link
            href="/cart"
            className="relative text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cart"
            data-testid="mobile-nav-cart"
          >
            <ShoppingBag className="w-4 h-4" />
            <CartBadge />
          </Link>
          <button
            className="text-xs tracking-[0.18em] uppercase"
            onClick={() => setMenuOpen(!menuOpen)}
            data-testid="nav-menu-toggle"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-[var(--header-offset)] left-0 right-0 bottom-0 z-50 bg-background px-8 py-10 flex flex-col items-end gap-8 text-2xl font-bold tracking-[0.1em] uppercase text-foreground overflow-y-auto"
          >
            <Link
              href="/shop"
              className={`transition-colors ${isShop ? "text-[#4efa84]" : ""}`}
              data-testid="mobile-nav-shop"
              onClick={() => {
                setMenuOpen(false);
                if (isShop) window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Shop
            </Link>
            <Link
              href="/archive"
              className={`transition-colors ${location === "/archive" ? "text-[#4efa84]" : ""}`}
              data-testid="mobile-nav-archive"
              onClick={() => {
                setMenuOpen(false);
                if (location === "/archive") window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Archive
            </Link>
            <Link 
              href="/#instruction" 
              onClick={(e) => { setMenuOpen(false); scrollToHash(e, "#instruction"); }} 
              data-testid="mobile-nav-learn"
            >
              Learn
            </Link>
            <Link 
              href="/#about" 
              onClick={(e) => { setMenuOpen(false); scrollToHash(e, "#about"); }} 
              data-testid="mobile-nav-about"
            >
              About
            </Link>
            <Link
              href="/support"
              className={`transition-colors ${location === "/support" ? "text-[#4efa84]" : ""}`}
              data-testid="mobile-nav-support"
              onClick={() => {
                setMenuOpen(false);
                if (location === "/support") window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              Support
            </Link>
            <a 
              href="mailto:surnoorsingh@gmail.com" 
              onClick={() => setMenuOpen(false)}
              data-testid="mobile-nav-contact"
            >
              Contact
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}

function FloatingCartButton() {
  const { totalItems } = useCart();
  const [location] = useLocation();
  if (totalItems === 0 || location === "/cart") return null;
  return (
    <Link
      href="/cart"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary text-background flex items-center justify-center hover:opacity-90 transition-opacity"
      aria-label={`Cart — ${totalItems} item${totalItems !== 1 ? "s" : ""}`}
      data-testid="floating-cart-button"
    >
      <span className="relative">
        <ShoppingBag className="w-5 h-5" />
        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-background text-primary text-[9px] flex items-center justify-center tabular-nums font-medium">
          {totalItems > 9 ? "9+" : totalItems}
        </span>
      </span>
    </Link>
  );
}

function SelectedWorksSection() {
  const { available, loading } = useShop();
  const featured = available.slice(0, 6);

  if (!loading && featured.length === 0) return null;

  return (
    <section id="work" className="px-6 md:px-12 pt-6 md:pt-10 pb-16 md:pb-24">
      <FadeIn className="mb-12">
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Available Works</p>
      </FadeIn>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 lg:gap-16">
        {loading
          ? Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="animate-pulse">
              <div className="bg-card aspect-[3/4] mb-4" />
              <div className="h-4 bg-card rounded w-3/4 mb-2" />
              <div className="h-3 bg-card rounded w-1/2" />
            </div>
          ))
          : featured.map((product, idx) => (
            <FadeIn key={product.id} delay={idx * 0.07}>
              <WorkCard product={product} />
            </FadeIn>
          ))}
      </div>

      {!loading && (
        <FadeIn className="mt-14 flex items-center gap-6 flex-wrap">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 border border-primary text-primary text-xs tracking-[0.15em] uppercase px-6 py-3.5 hover:bg-[#4efa84] hover:border-[#4efa84] transition-colors"
            data-testid="link-all-works"
          >
            Acquire <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </FadeIn>
      )}
    </section>
  );
}

const ACCOMPLISHMENTS = [
  {
    id: 1,
    title: "Grand Prize Winner — Paint on the Mountain",
    description: "Honored with the Distinguished Artist Award at the 10th-annual en plein air competition for 'Enchanted Forest'. (Photo: Martin Knowles)",
    image: "/web/award-news.png",
  },
  {
    id: 2,
    title: "Exhibition Showcase",
    description: "(L - R) Surnoor, Michael King, and Shirley Claire Williams celebrating the opening of a recent exhibition in Vancouver.",
    image: "/web/exhibition-patrons.png",
  },
  {
    id: 3,
    title: "Charles van Sandwyk's Gastown Storefront",
    description: "Curated selection of works hanging at the renowned Charles van Sandwyk Fine Arts storefront in Gastown.",
    image: "/web/solo-show-gallery.jpg",
  },
  {
    id: 4,
    title: "Masterclass at Phoenix Art Workshop",
    description: "Conducting a specialized watercolor masterclass and live painting demonstration at Phoenix Art Workshop.",
    image: "/web/painting-demo.jpg",
  },
  {
    id: 5,
    title: "Solo Exhibition 2024 — Pierre Coupey",
    description: "Distinguished abstract artist Pierre Coupey visiting my recent Solo Exhibition and sharing insights on the realist tradition.",
    image: "/web/basic-inquiry-mentorship.jpg",
  }
];

function AccomplishmentsSection() {
  return (
    <section id="about" className="relative w-full py-16 md:py-28 bg-background ">
      <FadeIn className="px-6 md:px-12 mb-10 md:mb-16">
        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Exhibitions & Recognition</p>
      </FadeIn>
      <div className="px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-16 text-sm">
        
        {/* Column 1: Exhibitions */}
        <div className="space-y-12">
          {/* Recent Commissions */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-light text-foreground  pb-2 uppercase tracking-wide text-xs">Recent Commissions</h3>
            <ul className="space-y-3 text-muted-foreground leading-relaxed">
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2025</span>
                <span>Jesus with Baby Louis, Personal Collection, Langley (Oil on Panel 12x16 inch)</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span></span>
                <span>46 West Hasting, Vancouver, BC - Commissioned site-specific painting for an urban housing project</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2024</span>
                <span>Vancouver Center, West Bourne Projects, Commissioned site-specific painting (766 Seymour)</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2022</span>
                <span>Hart House, University of Toronto, Commissioned watercolor painting for personal collection</span>
              </li>
            </ul>
          </div>

          {/* Solo Show */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-light text-foreground  pb-2 uppercase tracking-wide text-xs">Solo Exhibition</h3>
            <ul className="space-y-3 text-muted-foreground leading-relaxed">
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2024</span>
                <span>Rooster in my Painting, Basic Inquiry, Vancouver, BC, Sept - Oct</span>
              </li>
            </ul>
          </div>

          {/* Selected Group Shows */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-light text-foreground  pb-2 uppercase tracking-wide text-xs">Selected Group Exhibitions</h3>
            <ul className="space-y-3 text-muted-foreground leading-relaxed">
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2026</span>
                <span>Chilliwack Mural Festival - Live Mural Painting Artist</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2023-25</span>
                <span>North Van Arts Art Rental Program - Selected participant, featured at CityScape (2023, 2024)</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2025</span>
                <span>Taylor Gallery Pop Up, Astro Arts Fest, Aug 8-10</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2024</span>
                <span>Seymour Art Gallery - Annual Group Exhibition</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span></span>
                <span>Community Exhibition - Place des Arts</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2023</span>
                <span>Community Exhibition - Place des Arts</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span></span>
                <span>Bloom exhibition - Federation Gallery, Granville Island</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2022</span>
                <span>Vancouver Salon - Federation Gallery, Granville Island</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span></span>
                <span>Limitless Exhibition - Federation Gallery, Granville Island</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2021</span>
                <span>ArtRich Exhibition, Richmond Art Gallery - Featured Artist</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span></span>
                <span>Active Members Exhibition - Federation Gallery, Granville Island</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span></span>
                <span>Works on Paper - Federation Gallery, Granville Island</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2018</span>
                <span>Annual Group Exhibition - Punjab Lalit Kala Academy, Chandigarh</span>
              </li>
            </ul>
          </div>

          {/* Artist in Residence */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-light text-foreground  pb-2 uppercase tracking-wide text-xs">Artist in Residence</h3>
            <ul className="space-y-3 text-muted-foreground leading-relaxed">
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2022</span>
                <span>Silk Purse Art Gallery, West Vancouver Community Arts Council - Watercolor Artist in Residence, August 3 & 5</span>
              </li>
            </ul>
          </div>

          {/* Teaching */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-light text-foreground  pb-2 uppercase tracking-wide text-xs">Teaching</h3>
            <ul className="space-y-3 text-muted-foreground leading-relaxed">
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2026</span>
                <span>August - City of Maple Ridge - Plein Air in the Park (Oil & Acrylic)</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span></span>
                <span>July - City of Maple Ridge - Plein Air in the Park (Watercolour)</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span></span>
                <span>June - City of Maple Ridge - ACT Artbar</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span></span>
                <span>March - Phoenix Art Workshop - Authentic Watercolour: Practice & Perception</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2025</span>
                <span>Feb-Mar - Canvas Method - Portrait Drawing Essentials</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span></span>
                <span>Jan-Feb - Canvas Method - Loose Landscapes in Watercolour</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2024</span>
                <span>April - Phoenix Art Workshop - Watercolor Urbanscapes</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2023</span>
                <span>March - North Van Arts - Flower painting Date Night</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span></span>
                <span>April - Phoenix Art Workshop, Richmond - Three week Watercolor Urbanscape workshop</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span></span>
                <span>May-June - North Van Arts - Six week Intro to Watercolor workshop</span>
              </li>
            </ul>
          </div>

          {/* Collections */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-light text-foreground  pb-2 uppercase tracking-wide text-xs">Collections</h3>
            <ul className="space-y-3 text-muted-foreground leading-relaxed">
              <li>British Pacific Properties, West Vancouver</li>
              <li>Private Collection, Toronto</li>
              <li>Private collection, West Vancouver</li>
              <li>Charles van Sandwyk & Co., North Vancouver</li>
            </ul>
          </div>
        </div>

        {/* Column 2: Recognition & Media */}
        <div className="space-y-12">
          {/* Awards and Recognitions */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-light text-foreground  pb-2 uppercase tracking-wide text-xs">Awards & Recognitions</h3>
            <ul className="space-y-3 text-muted-foreground leading-relaxed">
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2025</span>
                <span>Paint on the Mountain - Harmony Arts Festival - Grand Prize</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2024</span>
                <span>Paint on the Mountain - Harmony Arts Festival - Second Place Prize</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2022</span>
                <span>Grand Prix of Art - 2nd place in Masters Category</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2021</span>
                <span>Paint on the Mountain - Harmony Arts Festival - Grand Prize</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span></span>
                <span>Grand Prix of Art - 2nd place in Masters Category</span>
              </li>
              <li className="grid grid-cols-[3rem_1fr] gap-4">
                <span className="font-medium">2020</span>
                <span>Paint on the Mountain - Harmony Arts Festival - Honorable Mention</span>
              </li>
            </ul>
          </div>

          {/* Bibliography */}
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-light text-foreground  pb-2 uppercase tracking-wide text-xs">Bibliography</h3>
            <div className="space-y-8 text-muted-foreground leading-relaxed">
              <div className="space-y-1">
                <p className="font-medium text-foreground">ArtsBC & Chilliwack Community Arts Council, 2026</p>
                <p className="text-sm">Featured Artist Promotional Reel</p>
                <a href="https://www.instagram.com/reel/DYx0bAmB6DC/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-primary hover:opacity-70 transition-opacity mt-2">
                  View Reel <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-1">
                <p className="font-medium text-foreground">Vancouver artist wins annual Paint on the Mountain contest</p>
                <p className="text-sm">A Vancouver artist has enchanted judges to win this year’s Paint on the Mountain contest.</p>
                <a href="https://www.nsnews.com/local-arts/vancouver-artist-wins-annual-paint-on-the-mountain-contest-11053478" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-primary hover:opacity-70 transition-opacity mt-2">
                  Read Article <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              
              <div className="space-y-1">
                <p className="font-medium text-foreground">Inspiring West Coast Artists You Need To Know About</p>
                <a href="https://tourismburnaby.com/wccblog/inspiring-west-coast-artists-you-need-to-know-about/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-primary hover:opacity-70 transition-opacity mt-2">
                  Read Article <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-1">
                <p className="font-medium text-foreground">Vancouver Magazine, 5 Things to Do in Vancouver This Week (February 27-March 5)</p>
                <p className="text-sm">Learn How to Watercolour at North Van Art’s Monthly CityScape Date Night Series March 2</p>
                <a href="https://www.vanmag.com/city/arts-and-culture/5-things-to-do-in-vancouver-this-week-february-27-march-5/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-primary hover:opacity-70 transition-opacity mt-2">
                  Read Article <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-1">
                <p className="font-medium text-foreground">West Vancouver Community Arts Council, August 2022, Watercolour Plein Air Painting with Sunoor Singh, Artist in Residence</p>
                <a href="https://westvanartscouncil.ca/widget/event-4904487" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-primary hover:opacity-70 transition-opacity mt-2">
                  View Event <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-1">
                <p className="font-medium text-foreground">Grand Prix of Art (Blog), September 2022, The 12 Annual Grand Prix of Art a Massive success</p>
                <a href="https://grandprixofart.ca/2022/09/11/the-12-annual-grand-prix-of-art-a-massive-success/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-primary hover:opacity-70 transition-opacity mt-2">
                  Read Post <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-1">
                <p className="font-medium text-foreground">Richmond News, September 2021, Photos: Steveston's Grand Prix of Art</p>
                <a href="https://www.richmond-news.com/in-the-community/photos-stevestons-grand-prix-of-art-4307223" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-primary hover:opacity-70 transition-opacity mt-2">
                  View Photos <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loadedSet, setLoadedSet] = useState<Set<number>>(() => new Set([0, 1]));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragStartX = useRef<number | null>(null);

  const { slides } = useHeroSlides();
  // We use the static images as fallbacks until Airtable loads
  const displayedSlides = slides.length > 0
    ? slides
    : HERO_IMAGES.map((url, i) => ({ id: `static-${i}`, url }));

  // Set this to true to show the slideshow again
  const SHOW_HERO_SLIDESHOW = false;

  // Ensure current slide is within bounds if the slides array changes
  useEffect(() => {
    if (currentSlide >= displayedSlides.length) {
      setCurrentSlide(0);
    }
  }, [displayedSlides.length, currentSlide]);

  useEffect(() => {
    document.title = "Surnoor Sembhi — Visual Artist, BC";
  }, []);

  function startTimer() {
    if (!SHOW_HERO_SLIDESHOW) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrentSlide((i) => {
        const next = (i + 1) % displayedSlides.length;
        setLoadedSet((s) => new Set([...s, next, (next + 1) % displayedSlides.length]));
        return next;
      });
    }, 5000);
  }

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [displayedSlides.length, SHOW_HERO_SLIDESHOW]);

  function prevSlide() {
    startTimer();
    setCurrentSlide((i) => {
      const next = (i - 1 + displayedSlides.length) % displayedSlides.length;
      setLoadedSet((s) => new Set([...s, next, (next - 1 + displayedSlides.length) % displayedSlides.length]));
      trackSlideshowInteraction(next);
      return next;
    });
  }

  function nextSlide() {
    startTimer();
    setCurrentSlide((i) => {
      const next = (i + 1) % displayedSlides.length;
      setLoadedSet((s) => new Set([...s, next, (next + 1) % displayedSlides.length]));
      trackSlideshowInteraction(next);
      return next;
    });
  }

  function handleDragStart(x: number) {
    dragStartX.current = x;
  }

  function handleDragEnd(x: number) {
    if (dragStartX.current === null) return;
    const delta = dragStartX.current - x;
    if (Math.abs(delta) > 50) {
      if (delta > 0) nextSlide();
      else prevSlide();
    }
    dragStartX.current = null;
  }

  return (
    <main>
      {/* ── 2. SELECTED WORKS (Shifted to top) ── */}
      <SelectedWorksSection />

      {/* ── 1. HERO ── */}
      <section id="hero" className="flex flex-col">
        {SHOW_HERO_SLIDESHOW && (
          <>
            <div
              className="w-full aspect-[4/3] md:aspect-[16/9] bg-card overflow-hidden relative select-none cursor-grab active:cursor-grabbing"
              onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
              onTouchEnd={(e) => handleDragEnd(e.changedTouches[0].clientX)}
              onMouseDown={(e) => handleDragStart(e.clientX)}
              onMouseUp={(e) => handleDragEnd(e.clientX)}
              onMouseLeave={() => { dragStartX.current = null; }}
            >
              {displayedSlides.map((slide, i) =>
                loadedSet.has(i) ? (
                  <img
                    key={slide.id}
                    src={slide.url}
                    alt={`Surnoor Sembhi artwork ${i + 1}`}
                    className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 pointer-events-none"
                    style={{ opacity: i === currentSlide ? 1 : 0 }}
                  />
                ) : null
              )}
              <button
                onClick={prevSlide}
                aria-label="Previous image"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center bg-background/60 backdrop-blur-sm hover:bg-background/90 transition-colors text-foreground"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                aria-label="Next image"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center bg-background/60 backdrop-blur-sm hover:bg-background/90 transition-colors text-foreground"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-end px-6 md:px-12 pt-3">
              <span className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
                {currentSlide + 1} / {displayedSlides.length}
              </span>
            </div>
          </>
        )}

        {false && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className={`bg-background px-6 md:px-12 ${SHOW_HERO_SLIDESHOW ? 'pt-10 pb-16 md:pt-14 md:pb-24' : 'pt-10 pb-8 md:pt-16 md:pb-12'}`}
          >
            <motion.p variants={fadeUp} className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-6">
              Visual Artist · Fraser Valley, BC
            </motion.p>
            <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-light leading-[1.05] tracking-wide max-w-4xl">
              A quiet truth in<br />the familiar places.
            </motion.h1>
          </motion.div>
        )}
      </section>

      {/* ── ACCOMPLISHMENTS (Scroll Animation) ── */}
      <AccomplishmentsSection />

      {/* ── 3. ABOUT ── */}
      {false && (
      <section id="about" className=" px-6 md:px-12 py-16 md:py-28 bg-card">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20">
          <div className="lg:col-span-4">
            <FadeIn>
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground lg:sticky lg:top-24">The Practice</p>
            </FadeIn>
          </div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="lg:col-span-8 space-y-6"
          >
            <motion.p variants={fadeUp} className="font-serif text-2xl md:text-3xl font-light leading-snug">
              Based in the Lower Mainland, BC, Surnoor is a visual artist working in the realist tradition. Trained by early mentors, senior artists, and in-depth study of Old Masters.
            </motion.p>
            <motion.p variants={fadeUp} className="text-muted-foreground leading-relaxed">
              Surnoor's work is proudly collected by patrons who value care and concern for a quiet truth in the familiar creeks, a busy downtown crosswalk, a figure in her unadorned nakedness, or a solitary still object seen from a distance — brought to their own homes through a painting well-crafted with technique and consciousness.
            </motion.p>
            <motion.p variants={fadeUp} className="text-muted-foreground leading-relaxed">
              Developing a cohesive visual language, Surnoor's work in Vancouver focused on spontaneous plein airs of the city streets, figurative work at Basic Inquiry, and a SkyTrain sketch series. Since moving to the Fraser Valley, Surnoor has adopted a slower, iterative practice capturing the raw Valley moments — silent rivers, distant mountains, and proud trees.
            </motion.p>
            <motion.div variants={fadeUp}>
              <a
                href="https://www.surnoor.art"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-primary hover:opacity-70 transition-opacity"
                data-testid="link-surnoor-art"
              >
                surnoor.art <ExternalLink className="w-3 h-3" />
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>
      )}

      {/* ── 4. LEARN ── */}
      <section id="instruction" className=" px-6 md:px-12 py-16 md:py-28">
        <FadeIn className="mb-14">
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Instruction</p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border max-w-4xl">
          <div className="bg-background p-8 md:p-10 flex flex-col gap-8">
            <div>
              <h3 className="font-serif text-2xl md:text-3xl font-light mb-4">Online Courses</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Self-paced study in the realist tradition. Master observation, value, and medium from your own studio. Structured modules across watercolour, oils, and dry media.
              </p>
            </div>
            <a
              href="mailto:surnoorsingh@gmail.com"
              className="inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-primary hover:gap-3 transition-all self-start"
              data-testid="link-courses"
            >
              Enquire about courses <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="bg-background p-8 md:p-10 flex flex-col gap-8">
            <div>
              <h3 className="font-serif text-2xl md:text-3xl font-light mb-4">One-to-One Classes</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Private online painting sessions tailored to your goals and level. Direct critique, live demonstrations, and sustained mentorship over time.
              </p>
            </div>
            <a
              href="mailto:surnoorsingh@gmail.com"
              className="inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-primary hover:gap-3 transition-all self-start"
              data-testid="link-one-to-one"
            >
              Book a session <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* ── 5. UPCOMING ── */}
      <section id="upcoming" className=" px-6 md:px-12 py-16 md:py-28 bg-card">
        <FadeIn className="mb-14">
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Workshops & Exhibitions</p>
        </FadeIn>

        <div className="max-w-3xl space-y-0">
          <FadeIn>
            <div className=" py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] tracking-[0.2em] uppercase bg-primary text-background px-2 py-0.5">Upcoming</span>
                </div>
                <h3 className="font-serif text-xl font-light">ArtBar: Magnolia Postcard in Watercolor</h3>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>ACT Arts Centre · Thursday, June 4, 2026 · 6:30 PM</span>
                </div>
              </div>
              <a
                href="https://purchase.mapleridgeact.ca/ChooseSeats/17401"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-primary hover:gap-3 transition-all self-start md:self-auto"
                data-testid="link-workshop-magnolia"
              >
                Register Now <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </FadeIn>

          <FadeIn delay={0.05}>
            <div className=" py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] tracking-[0.2em] uppercase bg-primary text-background px-2 py-0.5">Upcoming</span>
                </div>
                <h3 className="font-serif text-xl font-light">ArtBar: Expressive Abstract Rooster in Watercolor</h3>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>ACT Arts Centre · Thursday, June 18, 2026 · 6:30 PM</span>
                </div>
              </div>
              <a
                href="https://purchase.mapleridgeact.ca/ChooseSeats/17601"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-primary hover:gap-3 transition-all self-start md:self-auto"
                data-testid="link-workshop-rooster"
              >
                Register Now <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </FadeIn>

          {false && (
          <FadeIn delay={0.1}>
            <div className=" py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="font-serif text-xl font-light text-muted-foreground">5-Year Retrospective Solo Show</h3>
                <p className="text-muted-foreground text-sm">Basic Inquiry · Vancouver, BC · 2024</p>
              </div>
            </div>
          </FadeIn>
          )}

          <FadeIn delay={0.15}>
            <div className="py-8">
              <p className="text-muted-foreground text-sm">
                Group exhibitions and collaborative projects throughout the year. Follow on Instagram for announcements.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 6. RECOGNITION ── */}
      {false && (
        <section className=" px-6 md:px-12 py-12 md:py-20">
          <FadeIn>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-xs tracking-[0.15em] uppercase text-muted-foreground">
              <span>Solo Show · Basic Inquiry, Vancouver · 2024</span>
              <span className="hidden md:inline text-border">·</span>
              <span>Grand Prize, British Properties Plein Air · 2025</span>
              <span className="hidden md:inline text-border">·</span>
              <span>Published in North Shore News · 2025</span>
            </div>
          </FadeIn>
        </section>
      )}
    </main>
  );
}

function Footer() {
  return (
    <footer className=" bg-background px-6 md:px-12 py-12 md:py-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 items-start">
          {/* Branding */}
          <div>
            <p className="font-sans font-medium text-sm tracking-[0.2em] uppercase mb-2">Surnoor Sembhi</p>
            <p className="text-muted-foreground text-xs tracking-[0.1em] uppercase">Visual Artist · Fraser Valley, BC</p>
          </div>

          {/* Newsletter - Centered */}
          <div className="flex flex-col md:items-center gap-6 w-full">
            <div className="w-full max-w-sm">
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-5 md:text-center">Studio Newsletter</p>
              <NewsletterForm variant="footer" />
            </div>
          </div>

          {/* Social Links - Two Columns */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-5 text-[10px] tracking-[0.2em] uppercase text-muted-foreground md:justify-self-end">
            <a
              href="https://instagram.com/surnoorsembhi"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
              data-testid="footer-instagram"
            >
              Instagram
            </a>
            <a
              href="https://www.surnoor.art"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
              data-testid="footer-website"
            >
              Website
            </a>
            <a
              href="https://studionomadica.etsy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
              data-testid="footer-etsy"
            >
              Etsy Shop
            </a>
            <a
              href="mailto:surnoorsingh@gmail.com"
              className="hover:text-primary transition-colors"
              data-testid="footer-email"
            >
              Contact
            </a>
          </div>
        </div>

      <div className="max-w-7xl mx-auto mt-10 pt-8  text-[10px] text-muted-foreground tracking-wide">
        &copy; {new Date().getFullYear()} Surnoor Sembhi. All rights reserved.
      </div>
    </footer>
  );
}

function AppInner() {
  const [location] = useLocation();
  const headerRef = useRef<HTMLDivElement>(null);
  const navWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (navWrapperRef.current) {
        const navBottom = navWrapperRef.current.getBoundingClientRect().bottom;
        
        // Total offset is current visible bottom of nav wrapper (min 0)
        const totalOffset = Math.max(0, navBottom);
        document.documentElement.style.setProperty('--header-offset', `${totalOffset}px`);
      }
    };

    window.addEventListener('scroll', updateHeaderHeight);
    window.addEventListener('resize', updateHeaderHeight);
    updateHeaderHeight(); // Initial check

    return () => {
      window.removeEventListener('scroll', updateHeaderHeight);
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  useEffect(() => {
    if (location !== "/") return;

    const sections = ["hero", "work", "about", "instruction", "upcoming"];
    let isScrolling = false;

    const handleScrollSpy = () => {
      const scrollPos = window.scrollY + 150;

      for (const id of sections) {
        const element = document.getElementById(id);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            const newHash = id === "hero" ? "" : `#${id}`;
            const currentHash = window.location.hash;
            if (currentHash !== newHash && !(currentHash === "" && newHash === "")) {
              window.history.replaceState(null, "", window.location.pathname + (newHash || " "));
            }
            break;
          }
        }
      }
    };

    const onScroll = () => {
      if (!isScrolling) {
        window.requestAnimationFrame(() => {
          handleScrollSpy();
          isScrolling = false;
        });
        isScrolling = true;
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [location]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const handleScroll = () => {
      if (interval) clearInterval(interval);
      const hash = window.location.hash;
      
      if (hash) {
        let attempts = 0;
        interval = setInterval(() => {
          const id = window.location.hash.replace("#", "");
          const element = document.getElementById(id);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
            clearInterval(interval);
          }
          
          attempts++;
          if (attempts > 20) { // Stop after 2 seconds (100ms * 20)
            clearInterval(interval);
          }
        }, 100);
      } else {
        if (!window.location.hash) {
          window.scrollTo({ top: 0, behavior: "instant" });
        }
      }
    };

    // Run on initial load and whenever the path changes
    handleScroll();
    
    // Listen for hash changes (for same-page anchor clicks)
    window.addEventListener("hashchange", handleScroll);
    return () => {
      window.removeEventListener("hashchange", handleScroll);
      if (interval) clearInterval(interval);
    };
  }, [location]); // We still depend on location to trigger when switching pages

  return (
    <div id="site-top" className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      <div ref={headerRef}>
        <NewsletterBanner />
      </div>
      <div ref={navWrapperRef} className="relative z-50">
        <Nav />
      </div>
      <FloatingCartButton />
      <div className="pt-0">
        <Route path="/" component={HomePage} />
        <Route path="/shop">
          <ShopPage />
        </Route>
        <Route path="/archive">
          <ArchivePage />
        </Route>
        <Route path="/shop/:productId">
          {(params: { productId: string }) => <ProductDetailPage productId={params.productId} />}
        </Route>
        <Route path="/cart">
          <CartPage />
        </Route>
        <Route path="/order-confirmation">
          <OrderConfirmationPage />
        </Route>
        <Route path="/survey">
          <PollPage />
        </Route>
        <Route path="/private">
          <EventPage />
        </Route>
        <Route path="/support">
          <SupportPage />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin">
          <AdminAuth><PinterestQueue /></AdminAuth>
        </Route>
        <Route path="/admin/pinterest">
          <AdminAuth><PinterestQueue /></AdminAuth>
        </Route>
        <Route path="/admin/instagram">
          <AdminAuth><InstagramConsole /></AdminAuth>
        </Route>
        <Route path="/admin/exhibitions">
          <AdminAuth><ExhibitionPlanner /></AdminAuth>
        </Route>
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <CartProvider>
        <NewsletterProvider>
          <AppInner />
          <Analytics />
        </NewsletterProvider>
      </CartProvider>
    </Router>
  );
}
