// Formatting helpers shared across views.

export function formatPrice(price: number | string | null | undefined): string {
  if (price == null || price === '') return '';
  const n = Number(price);
  if (Number.isNaN(n)) return String(price);
  return '₹' + n.toLocaleString('en-IN');
}
