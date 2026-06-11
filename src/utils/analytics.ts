declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, string | number>) => void;
    };
  }
}

function track(eventName: string, data?: Record<string, string | number>) {
  try {
    window.umami?.track(eventName, data);
  } catch {
  }
}

export function trackArtworkView(name: string, category: string) {
  track("artwork_view", { name, category });
}

export function trackSlideshowInteraction(slideIndex: number) {
  track("slideshow_interaction", { slide: slideIndex });
}

export function trackAddToCart(name: string, price: number) {
  track("add_to_cart", { name, price });
}

export function trackBeginCheckout(itemCount: number, subtotal: number) {
  track("begin_checkout", { items: itemCount, subtotal });
}

export function trackPurchaseComplete(total: number, currency: string) {
  track("purchase_complete", { total, currency });
}

export function trackFilterUsed(filterType: string, value: string) {
  track("filter_used", { type: filterType, value });
}
