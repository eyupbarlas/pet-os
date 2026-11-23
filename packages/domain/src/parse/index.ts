/** Accepts "12,5" and "12.5" (Polish keyboards). Returns null when not a positive number. */
export function parseDecimal(input: string): number | null {
  const n = Number(input.trim().replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}
