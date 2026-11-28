import { describe, expect, it } from 'vitest';
import { inviteUrl, isInviteToken, tokenFromUrl } from './inviteLink';

const token = 'aB3_-xYz0123456789aB3_-xYz0123456789aB3_-xY';

describe('invite links', () => {
  it('accepts 43-char base64url tokens only', () => {
    expect(token).toHaveLength(43);
    expect(isInviteToken(token)).toBe(true);
    expect(isInviteToken(token.slice(1))).toBe(false);
    expect(isInviteToken(token.slice(1) + '=')).toBe(false);
    expect(isInviteToken(undefined)).toBe(false);
  });
  it('builds the web link', () => {
    expect(inviteUrl('https://healthypaw.app/', token)).toBe(`https://healthypaw.app/i/${token}`);
  });
  it.each([
    [`https://healthypaw.app/i/${token}`, token],
    [`https://healthypaw.app/i/${token}?utm=x`, token],
    [`healthypaw://i/${token}`, token],
    [`https://healthypaw.app/c/${token}`, null],
    ['https://healthypaw.app/i/short', null],
  ])('reads %s', (url, expected) => {
    expect(tokenFromUrl(url)).toBe(expected);
  });
});
