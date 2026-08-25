import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import type { ShopProduct } from "../hooks/useShop";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";
import { identifyUser } from "../utils/analytics";
import { supabase } from "../lib/supabase";
import PaymentLogos from "./PaymentLogos";

interface WorkCardProps {
  product: ShopProduct;
  sold?: boolean;
}

export default function WorkCard({ product, sold = false }: WorkCardProps) {
  const { addToCart, isInCart, removeFromCart } = useCart();

  const primaryImage = product.images[0] ?? null;
  const hoverImage = product.images[1] ?? null;

  const categoryMediumLine = [product.category, product.medium].filter(Boolean).join(" · ");
  const substrateDimensionsLine = [product.substrate, product.dimensions].filter(Boolean).join(" · ");

  const priceDisplay = formatPrice(product.price, product.currency);
  const alreadyInCart = isInCart(product.id);
  const hasPurchasablePrice = !sold && product.price != null && product.priceId != null;

  const [interestOpen, setInterestOpen] = useState(false);
  const [interestEmail, setInterestEmail] = useState("");
  const [interestStatus, setInterestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleExpressInterest(e: React.FormEvent) {
    e.preventDefault();
    if (!interestEmail) return;
    setInterestStatus("loading");
    try {
      const { error } = await supabase.from('Interests').insert({ Email: interestEmail, Artwork: product.name });
      if (error) throw error;
      identifyUser(interestEmail, { expressed_interest_artwork: product.name });
      setInterestStatus("success");
    } catch {
      setInterestStatus("error");
    }
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!hasPurchasablePrice || alreadyInCart) return;
    addToCart({
      productId: product.id,
      priceId: product.priceId!,
      name: product.name,
      price: product.price!,
      currency: product.currency,
      image: primaryImage,
    });
  }

  return (
    <div className={`${sold ? "opacity-50" : ""} group flex-1 w-full flex flex-col`}>
      {/* Image block */}
      <Link href={`/shop/${product.id}`} className="block mb-4">
        <div className="relative aspect-[3/4] overflow-hidden">
          {sold && (
            <>
              <div className="absolute top-2 left-2 z-10">
                <span className="text-[10px] tracking-[0.2em] uppercase text-foreground/70">Sold</span>
              </div>
              <div className="absolute bottom-2 right-2 z-10 w-2.5 h-2.5 rounded-full bg-red-500" aria-label="Sold" />
            </>
          )}

          {primaryImage ? (
            <>
              <img
                src={primaryImage}
                alt={product.name}
                loading="lazy"
                className={
                  "absolute inset-0 w-full h-full object-contain p-3 opacity-0 transition-opacity duration-700" +
                  (hoverImage ? " group-hover:opacity-0" : "")
                }
                onLoad={(e) => e.currentTarget.classList.remove("opacity-0")}
              />
              {hoverImage && (
                <img
                  src={hoverImage}
                  alt={`${product.name} — detail`}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-contain p-3 transition-opacity duration-700 opacity-0 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-muted-foreground tracking-wide uppercase">No image</span>
            </div>
          )}
        </div>
      </Link>

      {/* Metadata */}
      <Link href={`/shop/${product.id}`} className="block">
        <h3 className="font-sans text-[10px] tracking-widest uppercase mb-1 group-hover:opacity-70 transition-opacity">
          {product.name}
        </h3>
      </Link>
      {categoryMediumLine && (
        <p className="text-muted-foreground text-[9px] uppercase tracking-wider mb-0.5">{categoryMediumLine}</p>
      )}
      {substrateDimensionsLine && (
        <p className="text-muted-foreground text-[9px] uppercase tracking-wider">{substrateDimensionsLine}</p>
      )}

      {/* Price + CTA row */}
      <div className="mt-auto pt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] tracking-widest text-foreground flex-shrink-0">{priceDisplay}</p>
            {!sold && product.price != null && product.price >= 10000 && (
              <div className="flex items-center gap-2">
                <span className="text-[8px] tracking-[0.1em] uppercase text-primary font-medium whitespace-nowrap">Free Delivery ($100+)</span>
                <PaymentLogos className="scale-[0.55] origin-left hidden sm:flex" />
              </div>
            )}
          </div>
          {sold && (
            <p className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground/70 ml-auto">Sold</p>
          )}
        </div>

        {!sold && hasPurchasablePrice && (
          <div className="flex flex-col gap-1.5 mt-1">
            {/* Express Interest */}
            <div className="w-full">
              <button
                onClick={(e) => { e.preventDefault(); setInterestOpen(!interestOpen); }}
                className="w-full h-7 text-[9px] tracking-[0.15em] uppercase border border-primary text-primary hover:bg-primary hover:text-background transition-colors flex items-center justify-center"
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
                    <form onSubmit={handleExpressInterest} className="pt-2 pb-1 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1.5">
                        <input
                          type="email"
                          required
                          placeholder="Your email"
                          value={interestEmail}
                          onChange={(e) => setInterestEmail(e.target.value)}
                          disabled={interestStatus === "loading" || interestStatus === "success"}
                          className="flex-1 min-w-0 h-7 px-2 text-[9px] border border-border bg-transparent focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                        />
                        <button
                          type="submit"
                          disabled={interestStatus === "loading" || interestStatus === "success"}
                          className="h-7 flex-shrink-0 px-3 text-[9px] tracking-widest uppercase bg-primary text-background hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          {interestStatus === "loading" ? "..." : "Submit"}
                        </button>
                      </div>
                      {interestStatus === "success" && (
                        <p className="text-[9px] text-[#4efa84] text-center mt-0.5 uppercase tracking-widest">Interest recorded.</p>
                      )}
                      {interestStatus === "error" && (
                        <p className="text-[9px] text-destructive text-center mt-0.5 uppercase tracking-widest">Error.</p>
                      )}
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Add to Cart Container - reserves space for Remove button to prevent layout shifts */}
            <div className="flex flex-col gap-1.5 w-full">
              {alreadyInCart ? (
                <Link
                  href="/cart"
                  className="w-full h-7 flex items-center justify-center text-[9px] tracking-[0.15em] uppercase bg-[#4efa84] text-primary border-none hover:opacity-80 transition-opacity"
                >
                  In Cart →
                </Link>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="w-full h-7 text-[9px] tracking-[0.15em] uppercase border border-primary text-primary hover:bg-primary hover:text-background transition-colors"
                >
                  Add to Cart
                </button>
              )}
              
              <button
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  if (alreadyInCart) removeFromCart(product.id); 
                }}
                className={`text-[8px] tracking-[0.15em] uppercase text-[#ff4e4e] transition-opacity text-center w-full ${alreadyInCart ? 'hover:opacity-80' : 'opacity-0 pointer-events-none'}`}
                tabIndex={alreadyInCart ? 0 : -1}
                aria-hidden={!alreadyInCart}
              >
                Remove
              </button>
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
