import { createContext, useContext, useEffect, useReducer, type ReactNode } from "react";
import { trackAddToCart } from "../utils/analytics";

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

export interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  currency: string;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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
