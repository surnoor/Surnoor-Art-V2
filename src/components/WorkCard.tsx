import { Link } from "wouter";
import type { ShopProduct } from "../hooks/useShop";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";
import { ARButton } from "./ARViewer";

interface WorkCardProps {
  product: ShopProduct;
  sold?: boolean;
}

export default function WorkCard({ product, sold = false }: WorkCardProps) {
  const { addToCart, isInCart } = useCart();

  const primaryImage = product.images[0] ?? null;
  const hoverImage = product.images[1] ?? null;

  const categoryMediumLine = [product.category, product.medium].filter(Boolean).join(" · ");
  const substrateDimensionsLine = [product.substrate, product.dimensions].filter(Boolean).join(" · ");

  const priceDisplay = formatPrice(product.price, product.currency);
  const alreadyInCart = isInCart(product.id);
  const hasPurchasablePrice = !sold && product.price != null && product.priceId != null;

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
    <div className={`${sold ? "opacity-50" : ""} group`}>
      {/* Image block */}
      <Link href={`/shop/${product.id}`} className="block mb-4">
        <div className="relative aspect-[3/4] overflow-hidden">
          {primaryImage && (
            <ARButton 
              imageUrl={primaryImage} 
              dimensionsString={product.dimensions || product.description} 
              productName={product.name} 
            />
          )}
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
      <div className="mt-2 flex items-center gap-2">
        <p className="text-[10px] tracking-widest text-foreground flex-shrink-0">{priceDisplay}</p>

        {sold ? (
          <p className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground/70 ml-auto">Sold</p>
        ) : alreadyInCart ? (
          <Link
            href="/cart"
            className="ml-auto text-[10px] tracking-[0.15em] uppercase text-primary border-b border-primary/40 pb-px hover:border-primary transition-colors whitespace-nowrap"
          >
            In Cart →
          </Link>
        ) : hasPurchasablePrice ? (
          <button
            onClick={handleAddToCart}
            className="ml-auto flex-shrink-0 h-7 px-3 text-[9px] tracking-[0.15em] uppercase border border-primary/60 text-primary hover:bg-primary hover:text-background hover:border-primary transition-colors whitespace-nowrap"
          >
            Add to Cart
          </button>
        ) : null}
      </div>
    </div>
  );
}
