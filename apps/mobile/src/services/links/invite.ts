// Invite links (ADR 0019, mobile.md 4.2): https://healthypaw.app/i/<token>, no typable code.
// The token is 43 base64url characters (256 bits), so it is safe in a URL path as is.
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

export const isInviteToken = (s: string | undefined | null): s is string => !!s && TOKEN.test(s);

export function inviteUrl(webBase: string, token: string) {
  return `${webBase.replace(/\/+$/, '')}/i/${token}`;
}

/** Pulls the token out of an https or healthypaw:// invite link, or returns null. */
export function tokenFromUrl(url: string): string | null {
  const m = url.match(/^(?:https:\/\/[^/]+|healthypaw:\/)\/i\/([^/?#]+)/);
  return m && isInviteToken(m[1]) ? m[1]! : null;
}
