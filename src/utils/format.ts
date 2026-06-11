export function formatPrice(amount: number | null, currency: string | null): string {
  if (amount == null || currency == null) return "Price on request";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}
