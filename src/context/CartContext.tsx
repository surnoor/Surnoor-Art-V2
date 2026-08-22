import { createContext, useContext, useEffect, useReducer, type ReactNode } from "react";
import { trackAddToCart } from "../utils/analytics";
import { supabase } from "../lib/supabase";

export interface CartItem {
  productId: string;
  priceId: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD"; item: CartItem }
  | { type: "REMOVE"; productId: string }
  | { type: "CLEAR" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.find((i) => i.productId === action.item.productId);
      if (existing) {
        return state;
      }
      return { items: [...state.items, { ...action.item, quantity: 1 }] };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.productId !== action.productId) };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

const STORAGE_KEY = "surnoor_cart_v3";
const SESSION_KEY = "surnoor_session_id";

function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = "sess_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

function loadCart(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CartState;
      if (
        Array.isArray(parsed.items) &&
        parsed.items.every(
          (i) => typeof i.productId === "string" && typeof i.priceId === "string"
        )
      ) {
        return parsed;
      }
    }
  } catch {
  }
  return { items: [] };
}

interface ClientGeo {
  ip: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  postalCode: string | null;
}

let cachedGeo: ClientGeo | null = null;

async function fetchClientGeo(): Promise<ClientGeo> {
  if (cachedGeo) return cachedGeo;
  try {
    const raw = sessionStorage.getItem("surnoor_client_geo");
    if (raw) {
      cachedGeo = JSON.parse(raw);
      return cachedGeo!;
    }
  } catch {}

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      cachedGeo = {
        ip: data.ip || null,
        city: data.city || null,
        region: data.region || null,
        country: data.country_name || data.country || null,
        postalCode: data.postal || null,
      };
      try {
        sessionStorage.setItem("surnoor_client_geo", JSON.stringify(cachedGeo));
      } catch {}
      return cachedGeo;
    }
  } catch {}

  return { ip: null, city: null, region: null, country: null, postalCode: null };
}

export interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  currency: string;
  isInCart: (productId: string) => boolean;
  sessionId: string;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCart);
  const sessionId = getOrCreateSessionId();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    const syncTimer = setTimeout(async () => {
      let apiSucceeded = false;
      const geo = await fetchClientGeo();

      try {
        const payload = {
          sessionId,
          clientIp: geo.ip,
          clientLocation: {
            city: geo.city,
            region: geo.region,
            country: geo.country,
            postalCode: geo.postalCode,
          },
          items: state.items.map((i) => ({
            productId: i.productId,
            title: i.name,
            price: i.price,
            quantity: i.quantity || 1,
            imageUrl: i.image,
          })),
        };

        const res = await fetch("/api/cart-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          apiSucceeded = true;
        }
      } catch (err) {
        console.warn("Server cart sync network error:", err);
      }

      // Fallback: If API was unavailable or returned non-200, sync directly to Supabase from client
      if (!apiSucceeded) {
        try {
          // Delete existing session rows
          const { error: delErr } = await supabase.from("ActiveCarts").delete().eq("session_id", sessionId);
          if (delErr && (delErr.code === "42P01" || delErr.message?.includes("does not exist"))) {
            await supabase.from("active_carts").delete().eq("session_id", sessionId);
          }

          if (state.items.length > 0) {
            const rows = state.items.map((i) => ({
              session_id: sessionId,
              product_id: i.productId,
              title: i.name,
              price: i.price,
              quantity: i.quantity || 1,
              image_url: i.image,
              ip_address: geo.ip,
              city: geo.city,
              region: geo.region,
              country: geo.country,
              postal_code: geo.postalCode,
              last_active_at: new Date().toISOString(),
            }));

            let activeTable = "ActiveCarts";
            const { error: insErr } = await supabase.from("ActiveCarts").insert(rows);
            if (insErr && (insErr.code === "42P01" || insErr.message?.includes("does not exist"))) {
              activeTable = "active_carts";
              await supabase.from("active_carts").insert(rows);
            }

            // Insert into CartEvents for permanent history logging
            try {
              const eventRows = rows.map((r) => ({ ...r, event_type: "add_to_cart" }));
              const { error: evErr } = await supabase.from("CartEvents").insert(eventRows);
              if (evErr && (evErr.code === "42P01" || evErr.message?.includes("does not exist"))) {
                await supabase.from("cart_events").insert(eventRows);
              }
            } catch {}
          }
        } catch (dbErr) {
          console.warn("Direct Supabase cart sync fallback failed:", dbErr);
        }
      }
    }, 400);

    return () => clearTimeout(syncTimer);
  }, [state, sessionId]);

  const totalItems = state.items.length;
  const subtotal = state.items.reduce((acc, i) => acc + i.price, 0);
  const currency = state.items[0]?.currency ?? "cad";

  function addToCart(item: Omit<CartItem, "quantity">) {
    if (isInCart(item.productId)) return;
    dispatch({ type: "ADD", item: { ...item, quantity: 1 } });
    trackAddToCart(item.name, item.price);
  }

  function removeFromCart(productId: string) {
    dispatch({ type: "REMOVE", productId });
  }

  function clearCart() {
    dispatch({ type: "CLEAR" });
  }

  function isInCart(productId: string): boolean {
    return state.items.some((i) => i.productId === productId);
  }

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        addToCart,
        removeFromCart,
        clearCart,
        totalItems,
        subtotal,
        currency,
        isInCart,
        sessionId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
