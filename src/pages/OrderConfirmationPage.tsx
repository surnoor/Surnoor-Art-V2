import { useEffect, useState } from "react";
import { Link } from "wouter";
import { trackPurchaseComplete } from "../utils/analytics";

interface OrderLineItem {
  id: string;
  name: string | null;
  quantity: number | null;
  amountTotal: number | null;
  currency: string | null;
  image: string | null;
}

interface ShippingAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

interface ShippingRate {
  displayName: string | null;
  amount: number | null;
  currency: string | null;
  minDays: number | null;
  maxDays: number | null;
}

interface Order {
  id: string;
  customerEmail: string | null;
  customerName: string | null;
  amountTotal: number | null;
  currency: string | null;
  paymentStatus: string | null;
  shippingAddress: ShippingAddress | null;
  shippingName: string | null;
  shippingRate: ShippingRate | null;
  lineItems: OrderLineItem[];
}

function formatCurrency(amount: number | null, currency: string | null): string {
  if (amount == null || currency == null) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

function formatAddress(addr: ShippingAddress): string {
  return [addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country]
    .filter(Boolean)
    .join(", ");
}

function formatDeliveryEstimate(rate: ShippingRate): string {
  if (rate.minDays != null && rate.maxDays != null) {
    if (rate.minDays === rate.maxDays) {
      return `${rate.minDays} business day${rate.minDays === 1 ? "" : "s"}`;
    }
    return `${rate.minDays}–${rate.maxDays} business days`;
  }
  if (rate.minDays != null) return `${rate.minDays}+ business days`;
  if (rate.maxDays != null) return `Up to ${rate.maxDays} business days`;
  return "Contact for estimate";
}

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Order Confirmed — Surnoor Sembhi";

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (!sessionId) {
      setError("No order found. If you completed a purchase, check your email for confirmation.");
      setLoading(false);
      return;
    }

    const apiBase = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/$/, "");

    fetch(`${apiBase}/api/order/${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Order>;
      })
      .then((data) => {
        setOrder(data);
        setLoading(false);
        const trackedKey = `surnoor_tracked_${sessionId}`;
        if (
          data.paymentStatus === "paid" &&
          data.amountTotal != null &&
          data.currency &&
          !sessionStorage.getItem(trackedKey)
        ) {
          sessionStorage.setItem(trackedKey, "1");
          trackPurchaseComplete(data.amountTotal, data.currency);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load order details.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 md:px-12 py-20 md:py-32 max-w-2xl mx-auto">
        {loading && (
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Loading order…</p>
        )}

        {error && (
          <div>
            <p className="text-sm text-muted-foreground mb-8">{error}</p>
            <Link
              href="/shop"
              className="text-[10px] tracking-[0.15em] uppercase border border-primary text-primary px-4 py-2 hover:bg-primary hover:text-background transition-colors"
            >
              Return to Shop
            </Link>
          </div>
        )}

        {order && (
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-6">
              Order Confirmed
            </p>

            <h1 className="font-serif text-4xl md:text-5xl font-light leading-tight mb-10">
              Thank you{order.customerName ? `, ${order.customerName.split(" ")[0]}` : ""}.
            </h1>

            {/* Line items */}
            <div className=" mb-8">
              {order.lineItems.map((item) => (
                <div key={item.id} className=" py-6 flex items-start gap-5">
                  {item.image && (
                    <div className="w-16 h-20 bg-card flex-shrink-0 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name ?? "Artwork"}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-base leading-snug">
                      {item.name ?? "Artwork"}
                    </p>
                    {item.quantity != null && item.quantity > 1 && (
                      <p className="text-xs text-muted-foreground mt-0.5">Qty {item.quantity}</p>
                    )}
                  </div>
                  <p className="text-sm font-medium flex-shrink-0">
                    {formatCurrency(item.amountTotal, item.currency)}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2 mb-10">
              {order.shippingRate && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{order.shippingRate.displayName ?? "Shipping"}</span>
                  <span>{formatCurrency(order.shippingRate.amount, order.shippingRate.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-medium pt-2 ">
                <span>Total</span>
                <span>{formatCurrency(order.amountTotal, order.currency)}</span>
              </div>
            </div>

            {/* Shipping details */}
            {(order.shippingAddress || order.shippingRate) && (
              <div className=" pt-8 mb-10 space-y-5">
                <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
                  Delivery
                </p>

                {order.shippingAddress && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Shipping to</p>
                    <p className="text-sm">{order.shippingName ?? order.customerName}</p>
                    <p className="text-sm text-muted-foreground">{formatAddress(order.shippingAddress)}</p>
                  </div>
                )}

                {order.shippingRate && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Estimated delivery</p>
                    <p className="text-sm">{formatDeliveryEstimate(order.shippingRate)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{order.shippingRate.displayName}</p>
                  </div>
                )}
              </div>
            )}

            {/* Contact */}
            {order.customerEmail && (
              <div className=" pt-8 mb-10">
                <p className="text-xs text-muted-foreground mb-1">Confirmation sent to</p>
                <p className="text-sm">{order.customerEmail}</p>
              </div>
            )}

            <p className="text-xs text-muted-foreground mb-10 leading-relaxed">
              Questions about your order? Email{" "}
              <a href="mailto:surnoorsingh@gmail.com" className="underline underline-offset-2">
                surnoorsingh@gmail.com
              </a>{" "}
              with your order reference: <span className="font-mono text-[10px]">{order.id}</span>
            </p>

            <Link
              href="/shop"
              className="inline-block text-[10px] tracking-[0.15em] uppercase border border-primary text-primary px-5 py-2.5 hover:bg-primary hover:text-background transition-colors"
            >
              Back to Shop
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
