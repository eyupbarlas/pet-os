// Hermes has no Web Crypto. `uuid` (newId = UUIDv7 in @petos/domain) needs
// crypto.getRandomValues, so give it expo-crypto's native implementation. Imported first in
// app/_layout.tsx, before anything can create an id.
import { getRandomValues } from 'expo-crypto';

const g = globalThis as { crypto?: { getRandomValues?: unknown } };
if (typeof g.crypto?.getRandomValues !== 'function') {
  g.crypto = { ...(g.crypto ?? {}), getRandomValues: getRandomValues as unknown };
}
