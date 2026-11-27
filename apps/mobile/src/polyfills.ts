// Engine gaps in Hermes, filled before any app code runs.
//
// Hermes has no Web Crypto. `uuid` (newId = UUIDv7 in @petos/domain) needs
// crypto.getRandomValues, so give it expo-crypto's native implementation. Imported first in
// app/_layout.tsx, before anything can create an id.
import { getRandomValues } from 'expo-crypto';

const g = globalThis as { crypto?: { getRandomValues?: unknown } };
if (typeof g.crypto?.getRandomValues !== 'function') {
  g.crypto = { ...(g.crypto ?? {}), getRandomValues: getRandomValues as unknown };
}

// Hermes on iOS has no Intl.PluralRules (week-one check failed: "undefined cannot be used as a
// constructor"). i18next needs it for the Polish one/few/many/other forms (ADR 0006). The
// polyfills only install themselves when the engine lacks the API; locale data for our two
// languages only.
import '@formatjs/intl-getcanonicallocales/polyfill.js';
import '@formatjs/intl-pluralrules/polyfill.js';
import '@formatjs/intl-pluralrules/locale-data/en.js';
import '@formatjs/intl-pluralrules/locale-data/pl.js';
