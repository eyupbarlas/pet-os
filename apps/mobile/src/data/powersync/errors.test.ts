import { describe, expect, it } from 'vitest';
import { classifyUploadError } from './errors';

describe('classifyUploadError', () => {
  it('discards permanent errors', () => {
    for (const code of ['22P02', '23503', '42501', 'P0001']) expect(classifyUploadError({ code })).toBe('discard');
  });
  it('treats a duplicate id on a retried insert as done, otherwise discards', () => {
    expect(classifyUploadError({ code: '23505' }, { idempotentInsert: true })).toBe('discard');
  });
  it('refreshes on expired JWT', () => {
    expect(classifyUploadError({ code: 'PGRST301' })).toBe('refresh_then_retry');
    expect(classifyUploadError({ status: 401 })).toBe('refresh_then_retry');
  });
  it('retries network, 5xx and unknown errors', () => {
    expect(classifyUploadError({ status: 503 })).toBe('retry');
    expect(classifyUploadError({ message: 'Network request failed' })).toBe('retry');
    expect(classifyUploadError({ code: 'XX000' })).toBe('retry');
  });
});
