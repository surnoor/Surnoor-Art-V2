import { useEffect, useState } from "react";
import { Link } from "wouter";
import { trackBeginCheckout } from "../utils/analytics";
import { X } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";

async function startCartCheckout(
  items: { priceId: string; quantity: number }[],
  siteUrl: string
): Promise<string> {
  const apiBase = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/$/, "");
  const res = await fetch(`${apiBase}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, siteUrl }),
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? "Could not create checkout session");
  return data.url;
}

export default function CartPage() {
  const { items, removeFromCart, subtotal, currency } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Cart — Surnoor Sembhi";
  }, []);

  async function handleCheckout() {
    if (items.length === 0) return;
    trackBeginCheckout(items.length, subtotal);
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const url = await startCartCheckout(
        items.map((item) => ({ priceId: item.priceId, quantity: 1 })),
        window.location.origin
      );
      window.location.href = url;
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Something went wrong");
      setCheckoutLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 md:px-12 py-16 md:py-24 max-w-6xl mx-auto">
        {items.length === 0 ? (
          <div>
            <h1 className="font-serif text-4xl font-light mb-8">Your cart is empty.</h1>
            <Link
              href="/shop"
              className="text-[10px] tracking-[0.15em] uppercase border border-primary text-primary px-5 py-2.5 hover:bg-primary hover:text-background transition-colors inline-block"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            {/* Cart items — left */}
            <div className="lg:col-span-8">
              <h1 className="text-xs tracking-[0.2em] uppercase mb-8">Shopping Cart</h1>

              <div className="">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className=" py-6 flex items-start gap-5"
                  >
                    {/* Thumbnail */}
                    <Link href={`/shop/${item.productId}`} className="flex-shrink-0">
                      <div className="w-20 h-24 bg-card overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-[10px] text-muted-foreground uppercase">No image</span>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/shop/${item.productId}`}>
                        <p className="font-serif text-base leading-snug hover:text-primary transition-colors">
                          {item.name}
                        </p>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatPrice(item.price, item.currency)}
                      </p>
                      <p className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground/60 mt-2">
                        Qty: 1
                      </p>
                    </div>

                    {/* Price + remove */}
                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      <p className="text-sm font-medium">
                        {formatPrice(item.price, item.currency)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={`Remove ${item.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <Link
                  href="/shop"
                  className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Continue shopping
                </Link>
              </div>
            </div>

            {/* Order summary — right */}
            <div className="lg:col-span-4">
              <h2 className="text-xs tracking-[0.2em] uppercase mb-6">Summary</h2>

              <div className=" pt-5 space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <div className=" pt-5 mb-8">
                <div className="flex justify-between text-sm font-medium">
                  <span>Total</span>
                  <span>{formatPrice(subtotal, currency)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Shipping added at checkout</p>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="w-full h-11 text-[11px] tracking-[0.18em] uppercase border border-primary text-primary hover:bg-primary hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? "Redirecting…" : "Checkout"}
              </button>

              {checkoutError && (
                <p className="text-[10px] text-red-600 mt-3">{checkoutError}</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
