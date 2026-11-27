/** Postgres/PowerSync timestamps ("2026-11-27 15:00:00.12+00", "…Z", ISO) → epoch ms. */
export function parseTimestamp(s: string): number {
  let v = s.trim().replace(' ', 'T');
  if (/[+-]\d{2}$/.test(v)) v += ':00';
  else if (!/(Z|[+-]\d{2}:?\d{2})$/.test(v)) v += 'Z';
  return Date.parse(v);
}
