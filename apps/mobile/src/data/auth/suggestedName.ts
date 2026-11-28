/** First name from the sign-in provider's metadata, to prefill "Your name". */
export function suggestedName(meta: Record<string, unknown> | undefined) {
  const v = meta?.given_name ?? meta?.first_name ?? meta?.full_name ?? meta?.name ?? meta?.display_name;
  return typeof v === 'string' ? v.split(' ')[0]!.slice(0, 60) : '';
}
