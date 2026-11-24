// Upload error classification (mobile.md 3.4). Discard only on specific permanent errors;
// everything unrecognised is retried so offline ticks survive a long offline stretch.
export type UploadAction = 'discard' | 'retry' | 'refresh_then_retry' | 'wipe';

export interface UploadError {
  code?: string;        // Postgres SQLSTATE or PostgREST code
  status?: number;      // HTTP status
  message?: string;
}

export function classifyUploadError(e: UploadError, opts: { idempotentInsert?: boolean } = {}): UploadAction {
  if (e.code === 'PGRST301' || e.status === 401) return 'refresh_then_retry';
  if (e.code === '23505' && opts.idempotentInsert) return 'discard'; // already there: counts as success
  const code = e.code ?? '';
  if (code.startsWith('22') || code.startsWith('23') || code === '42501' || code === 'P0001') return 'discard';
  return 'retry'; // 408, 429, 5xx, network, anything unknown
}
