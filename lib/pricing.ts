export type Pricing = { base: number; baseGuests: number; perExtra: number };

export const HST_RATE = 0.13;

export function parsePricing(description: string | null): Pricing {
  const match = description?.match(/\\?\[pricing:\s*base=(\d+),\s*baseGuests=(\d+),\s*perExtra=(\d+)\\?\]/);
  if (!match) return { base: 0, baseGuests: 1, perExtra: 0 };
  return { base: Number(match[1]), baseGuests: Number(match[2]), perExtra: Number(match[3]) };
}

export function calcTotal(guests: number, pricing: Pricing): number {
  if (guests <= pricing.baseGuests) return pricing.base;
  return pricing.base + (guests - pricing.baseGuests) * pricing.perExtra;
}

export function getAmounts(pricing: Pricing, guestCount: number, seated: boolean) {
  const subtotal = seated ? pricing.base : calcTotal(guestCount, pricing);
  const subtotalCents = Math.round(subtotal * 100);
  const hstCents = Math.round(subtotalCents * HST_RATE);
  return { subtotalCents, hstCents, totalCents: subtotalCents + hstCents };
}
