# 03 — Privacy and security review: MVP architecture (phase 3)

- **Reviewer:** privacy-security-reviewer (agent) · **Date:** 2026-11-22 · **Issue:** #5
- **Reviewed:** `docs/specs/001-mvp/spec.md` (approved), the Decisions section of `docs/specs/001-mvp/spec.md`,
  `docs/architecture/mvp/backend-sync.md`, `docs/architecture/mvp/mobile.md`,
  `docs/architecture/mvp/platform-services.md`, ADR drafts `0001`–`0026`.
- **Method:** `privacy-review` skill with `legal:compliance-check` (GDPR, PKE art. 399 / ePrivacy,
  store rules). The legal plugin's connectors were offline, so no external sources were used.
- **Stage:** invite-only beta of ≤100 users. **MUST-FIX** means it is needed even for this beta,
  because without it someone could be harmed (data leak, tracking without consent, no real
  deletion, a link that can be guessed or never turned off). **LATER** means it must be done
  before public launch. This review does not ask for DPAs, TIAs, a DPIA or residency paperwork
  before the beta.
- Not legal advice. Items for a lawyer are listed at the end.

## Verdict

**Proceed with conditions.** The architecture is privacy-friendly by default. Analytics and
crash SDKs are not initialised before opt-in. There is no location and there are no photos. RLS
is the single permission wall. The care card uses an anon RPC instead of a service key. Push
payloads carry no data. The deletion flows are well designed. There are **11 MUST-FIX items**.
All of them are small, between a few lines of SQL and an hour of work each:

- Three are security holes in the RLS and RPC layer: the pet scope of a card isn't checked, a
  removed member can rejoin with an old invite, and Supabase's default grants are left open.
- Two are about the care card after a member is removed.
- Four are about consent and deletion.
- Two are about secrets and the beta privacy notice.

None of them changes the stack or an ADR decision.

---

## Rulings on the questions asked

### R1. Care-card token stored in plaintext vs hashed → **plaintext accepted for the MVP** (ADR 0018 option A)

The backend's reasoning holds. The card exposes only data that a database attacker or a
member's phone already has. Re-sharing without rotating is a real need for a household with
equal members, and the token's strength comes from its 256 bits plus revocation, not from
hashing. Conditions:

- 256-bit `gen_random_bytes(32)` base64url, as in backend §9. **ADR 0024's consequences and
  platform B4 still say "128-bit, only the hash is stored". Align them to ADR 0018** (owner:
  platform). The Worker's format check (≥22 characters) can stay as a cheap pre-filter, but
  tighten it to exactly 43 characters.
- The token is readable only by active members through RLS and the `household_data` stream. It
  is never sent to PostHog or Sentry. The Sentry `scrubTokens` must cover `/c/`, `/i/`, `?t=`,
  `access_token` and `Authorization` (MUST-FIX P3). Worker logs show `/c/<redacted>` (already
  designed).
- Removal of a member is the case where a plaintext token matters most. See B2 and M1.
- **LATER:** switch to `token_hash` plus "rotate to share again" if the card ever shows data
  that isn't already in the database (photos, address), or if sitters get write access.

### R2. What the card shows, and caching and indexing → **OK as designed, with three conditions**

- **Done status without names: OK.** A read-only `done: bool` per due task tells the sitter
  what they need and doesn't expose who in the household did what.
- **Owner contacts: OK.** The owner chooses them per card, as first name and phone only, at most
  3. Surname, home address and microchip are excluded (platform B4). The vet contact is a
  business contact, so `show_vet` defaulting to true is fine.
- **Free-text `note`:** people will type door codes and addresses there. The share sheet and
  the card editor need one line of copy: "Anyone with this link can see this card. Don't add
  door codes or your address." (MUST-FIX M2.)
- **Caching and indexing: OK.** The design already covers it: `Cache-Control: no-store`,
  `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`, a strict CSP, no cookies,
  no third-party scripts, a DB read on every request, and the same NULL/410 answer for unknown
  and revoked links. Two additions:
  - Add `noarchive` and a matching `<meta name="robots">`. Do **not** `Disallow: /c/` in
    robots.txt, because a crawler has to fetch the page to see `noindex`.
  - Keep the `<title>` and any Open Graph tags generic ("Pet OS care card" or the pet's name at
    most). Never put contacts, meds or notes in meta tags, because WhatsApp, Messenger and
    iMessage fetch link previews. This is LATER as data quality: preview bots also bump
    `view_count`, so skip counting for known unfurler user agents.
- **App links:** don't claim `/c/*` (mobile O6 / platform M8). Keep the card web-only. A sitter
  who has Pet OS installed must not be pulled into the app with another household's token, and
  the owner doesn't need an in-app preview.

### R3. G2 card view counts and G3 metrics from the shared database without analytics consent → **OK, with conditions**

- **ePrivacy / PKE art. 399** is about storing or reading information on the user's device.
  `view_count`/`last_viewed_at` is a server-side counter with no IP, no user agent and no cookie.
  The `analytics.*` views read rows that the service already holds. Neither touches a device,
  so neither needs consent.
- **GDPR:** this is further use of service data for internal, aggregated product measurement,
  which is compatible with the original purpose (Art. 6(4)) under legitimate interest. It is
  fine provided that:
  1. Only aggregates are reported (counts and percentages), and the team never looks at
     individual users' rows for "metrics".
  2. The `analytics` schema is not in PostgREST's exposed schemas and has no grants to
     `anon`/`authenticated`.
  3. Nothing is joined with PostHog identities or sent to a third party.
  4. The beta privacy notice has one line about it (see P5).
  5. With about 100 users, small segments can identify people, so results stay with the team.
- **Spec wording:** "What we want to learn … consented stats only" can be read as forbidding
  this. The product owner should add one clarifying line to the spec ("consented" means device
  and SDK analytics; aggregate counts from service data are first-party), or Eyup should
  acknowledge it. This needs a note, not a redesign.
- Showing the owner "Opened 3 times" in the app is fine. It describes their own link.

### R4. Crash reporting consent default → **default OFF for the beta** (ADR 0023 as drafted)

Keep "Send crash reports" as its own switch, off by default. Do not call `Sentry.init` before
it is on. The consent-free baseline is TestFlight/App Store Connect and Play vitals. With 100
invited testers, the team can simply ask people to turn it on. The [lawyer] question (is crash
reporting strictly necessary under PKE art. 399?) is **LATER**. If the answer is yes, the
default becomes one line. Conditions: `sendDefaultPii: false`, no `setUser`, replay and tracing
off, and the scrubber covers tokens plus the query strings of HTTP breadcrumbs (P3).

### R5. Web deletion flow → **approved** (platform §8.4)

The flow is email-verified, gives the same answer whether or not an account exists, stores
only a hashed single-use token for 24 hours, confirms by POST only (so email link scanners
can't trigger it), uses Turnstile, runs the same deletion job as the app, and explains what
stays. Small additions:

- **MUST-FIX (part of P2):** redact `t=` from Worker and Edge Function logs. Compare the
  Worker→function secret in constant time.
- **LATER:** throttle requests per email (for example, one confirm email per address per 15
  minutes) so the form can't be used to flood someone's inbox. Turnstile covers most of this
  for the beta. A web deletion can't revoke the Apple token, because there is no fresh
  `authorizationCode`. That is acceptable, since Apple requires revocation for the in-app path,
  but write it in the runbook.
- Confirm the exact slugs (`/pl/usun-konto` vs `/pl/delete-account`). Mobile and platform
  differ, and the URL goes into the Play listing.

### R6. Account deletion semantics → **approved, with one change**

- **"Former member" via `actor_id ON DELETE SET NULL`, deleting all of the user's
  `household_member` rows (former ones too), and deleting the household when the user was its
  last active member: approved.** Past ticks stay meaningful for the remaining members, and the
  name is gone everywhere. In a household of two, the remaining member can still guess who
  "Former member" was. That is inherent and acceptable. The deletion pages and the in-app
  confirmation must say so ("Your ticks stay in the household's history without your name").
- **A deleted member's contacts left on a card: not acceptable** (MUST-FIX B4). Their phone
  number would stay on a public, non-expiring link that they can no longer control.
- Free-text the user typed into household data (pet notes, health notes, task titles, the
  household name) stays as household data. That's fine, and the deletion page should say so.
- Deletion must cover every store. Status:

| Store | Status for the beta |
|---|---|
| Postgres (profiles, settings, prefs, push tokens, membership, last-member household) | Designed (backend §8.4) |
| Auth user and identities | Designed (`auth.admin.deleteUser`) |
| PowerSync bucket data on other members' phones | Removed through normal sync. The deleting device runs `disconnectAndClear()` |
| User's *other* signed-in devices | **MUST-FIX (part of M3):** when a refresh fails with "user not found" or is revoked, clear local data |
| PostHog | Person deletion by UUID (endpoint unverified). **MUST-FIX (B5):** failures must be logged and retried, never swallowed |
| Sentry | No identity, 30-day ageing: OK |
| Expo push tokens | Cascade on `push_device`: OK |
| Resend (sent-email logs hold the address) | **LATER:** check Resend's log retention and deletion API |
| Supabase daily backups (7 days on Pro), auth and Edge Function logs | **LATER:** state retention in the privacy notice. No action needed for the beta |
| PowerSync Cloud operation history | **LATER:** confirm compaction drops removed rows |

### R7. RLS and the public-key RPC paths → **sound pattern, three holes to close** (B1, B2, B3)

The pattern is good:

- `household_id` on every row.
- `private.my_household_ids()` as a security definer function evaluated once per statement.
- Column grants on `care_card_link`, `household_member` and `household`.
- `actor_id` set by a trigger.
- The bootstrap insert checked by `can_bootstrap`.
- `anon` limited to `get_care_card`, `health` and `get_app_config`.
- `SECURITY DEFINER` with `search_path = ''`.
- Removal by `left_at`, which drops the stream.

The holes are listed under backend: card `pet_ids` across households, rejoining with a stale
invite, and Supabase's default grants. Also note that PowerSync streams are a **second**
authorisation layer that doesn't go through RLS. The streams and RLS must agree, which the
minimal test in B3 checks.

### R8. Secrets handling → **approved** (platform §10, mobile §11)

Only public values are in `EXPO_PUBLIC_*`. The service-role key lives only in Edge Function
secrets, and the Worker never holds it. The Sentry auth token is in EAS secrets. There is a
password vault, 2FA, two admins and secret scanning. Additions:

- **MUST-FIX (P2):** the secret that the `notify-household` trigger uses to call the Edge
  Function (through pg_net or a webhook) must live in Supabase Vault, not as a literal in a
  migration in git. Every Edge Function that isn't called with a user JWT
  (`notify-household`, `request-`/`confirm-account-deletion`, `send-email`) must reject
  callers that don't have its secret or the hook signature.
- **MUST-FIX (part of M3):** don't store Apple refresh tokens. Use the backend's approach (a
  fresh `authorizationCode` at deletion) instead of mobile §9's "send `authorizationCode` once
  at sign-in so the server can revoke later". The mobile approach creates a long-lived Apple
  credential in our database.
- **LATER:** scope the PostHog personal API key to person deletion only. Move from the legacy
  JWT anon/service keys to Supabase publishable/secret keys. Keep the Supabase session in
  SecureStore or an encrypted store instead of AsyncStorage. Add a breach runbook line: notify
  UODO within 72 hours if personal data leaks. GDPR applies to the beta too, so name who does
  it now.

### R9. Silent push payloads → **approved** (ADR 0021)

`{ "t": "sync" }` with `_contentAvailable` and no title, body, names or IDs. The token is
registered only after sign-in, unregistered before sign-out, reassigned when it moves accounts,
and deleted on `DeviceNotRegistered`. This is strictly necessary for the household sync the
user asked for, so it needs no consent. Conditions:

- `notify-household` must not be publicly callable (P2), and it must work out recipients only
  from the database, never from the request body.
- On member removal, the removed member's devices also get the push. Compute the recipients
  before `left_at` is applied, or include the removed member explicitly. Otherwise "faster loss
  of access" doesn't happen.
- **LATER:** Expo DPA/TIA (US processor). Any future visible pushes need lock-screen-safe copy.

---

## Findings by owning architect

### Backend/sync architect

| # | Severity | Finding | Fix |
|---|---|---|---|
| B1 | **MUST-FIX** | **Card scope can cross households.** `care_card_link.pet_ids uuid[]` has no FK, and members may `UPDATE` it (column grant). A member who used to be in another household (or who learns a pet UUID) can put a foreign `pet_id` on their own card. `get_care_card`, as a `SECURITY DEFINER` function, would then publish that pet's routine, meds and notes. Pet ids are not secret to former members, because the ids were synced to them. | In `get_care_card`, select pets with `p.id = any(card.pet_ids) and p.household_id = card.household_id`. Also add a `BEFORE INSERT OR UPDATE` trigger on `care_card_link` that rejects pet ids outside `household_id`. Apply the same rule to `task.medication_id` and to any other id that crosses tables without a composite FK. |
| B2 | **MUST-FIX** | **A removed member can rejoin with an old invite.** Open invites (and their tokens) are synced to every member. A removed member who still has an unaccepted invite link can call `accept_invite` and get full access back. | `remove_member` (and leaving) revokes every open invite of that household in the same transaction. The app tells the remaining members ("Open invite links were turned off"). |
| B3 | **MUST-FIX** | **Supabase default privileges.** Supabase grants `EXECUTE` on new functions and `ALL` on new tables in `public` to `anon` and `authenticated` by default privileges. "Revoke from public" therefore doesn't remove those grants, and tables created after the one-off `revoke all … from anon` get grants again. `delete_user_data`, `notify` helpers and the `private` functions should also not be executable by `PUBLIC`. | (a) `alter default privileges in schema public revoke execute on functions from anon, authenticated, public` (and the same in `private`), then grant each RPC explicitly. (b) Enable RLS on **every** table, including `push_device`, `deletion_request`, `app_config` and `streak_day`. (c) Add a 30-line SQL check in CI that fails if any `public` table has RLS off or if `anon` can execute anything except the three RPCs. Add five RLS cases: a non-member can't read or write, a removed member can't, `anon` can't read tables, a revoked token returns NULL, and a card can't include a foreign pet (B1). The full pgTAP suite stays LATER. |
| B4 | **MUST-FIX** | A deleted (or removed) member's phone stays on a public card. | Store contacts as `[{ user_id?: uuid, first_name, phone }]`. The app pre-fills "me" with `user_id`. `delete_user_data`, `remove_member` and leaving all strip entries where `user_id` matches. Hand-typed third-party entries (a neighbour) stay. |
| B5 | **MUST-FIX** | External deletion steps (PostHog, the deleted-receipt email, Apple revoke) have no defined failure handling. | Postgres plus Auth deletion is the commit point. External steps are logged to a small `deletion_followup` table (no PII beyond the UUID) and retried by the existing daily cron. Alert the founders on a third failure. For PostHog, verify the person-deletion endpoint in the week-1 spike. If it can't be automated, delete by hand within 30 days (runbook). |
| B6 | LATER | Set `rest_day.created_by` (and any other `*_by` column) in a trigger, as `tick.actor_id` already is, so a client can't attribute an action to someone else. | Trigger. |
| B7 | LATER | Get a PowerSync DPA or self-host, accept the Supabase DPA, add a backups/PITR retention statement, and add a tick-history window. | Already parked in backend §13. Agreed. |

### Platform-services architect

| # | Severity | Finding | Fix |
|---|---|---|---|
| P1 | **MUST-FIX** | ADR 0024 and contract B4 contradict ADR 0018 (128-bit, hash only). | Align them to plaintext, 256-bit, 43 characters (R1). Add `noarchive`, generic meta tags and no robots.txt disallow (R2). |
| P2 | **MUST-FIX** | Functions that aren't called with a user JWT need authentication. The secret for the trigger→`notify-household` call must stay out of git. | Vault-stored secret or hook signature. Reject everything else. Compare secrets in constant time. Redact `t=` and `/c/` tokens in Worker and function logs. Recipients come from the database only (R8, R9). |
| P3 | **MUST-FIX** | The Sentry and PostHog scrubbers aren't fully specified. | `beforeSend`/`beforeBreadcrumb`: strip `/c/<token>`, `/i/<token>`, `t=`, `access_token`, `refresh_token`, `Authorization` and URL query strings on `http` breadcrumbs. PostHog: discard IP, no `$current_url` with tokens (deep-link screens), no free text (already designed). |
| P4 | **MUST-FIX** | Consent fields don't match: B9 has `consent_crash_reports`, but the backend `profiles` sketch doesn't. | Add the column to the backend schema (owner: backend, raised here). |
| P5 | **MUST-FIX** | **A beta privacy notice (EN/PL)** at `/en/privacy` and `/pl/privacy` is needed. It is linked from the consent screen, the deletion pages and the store test listings. GDPR Art. 13 information is owed to beta testers too. It can be a plain one-pager, not the lawyer-final version. | Cover: who we are and how to contact `privacy@`; what data is used and why; vendors and regions (including the US for Expo push and Resend storage); the opt-in analytics and crash reports; the aggregate first-party metrics (R3); that the card is public to anyone with the link; what deletion removes and what stays; backup retention; the right to complain to UODO. |
| P6 | LATER | Throttle deletion emails per address. Skip known preview bots in `view_count`. Confirm the deletion-page slugs (R5). | — |
| P7 | LATER | DPAs and TIAs (PostHog, Sentry, Resend, Expo, Cloudflare, Better Stack), a sub-processor list, an Art. 30 record, DMARC to `quarantine`, and Sentry's IP storage turned off. | Already parked in platform §13. Agreed. |

### Mobile architect

| # | Severity | Finding | Fix |
|---|---|---|---|
| M1 | **MUST-FIX** | After a member is removed, the remaining members aren't offered a way to cut off the removed person's access to care cards. The removed person may still have the links (with or without hashing). The routine times plus owner phone numbers are what matter in an ex-partner situation. | After `remove_member` succeeds, show one sheet: "Replace care card links? The sitter will need the new link." It offers Replace (rotate) and Keep. Add a "Care cards" list in Settings with "last opened" and turn-off/rotate actions. |
| M2 | **MUST-FIX** | No public-link warning when sharing a card. | One line of copy on the share sheet and in the card editor (R2), in EN and PL. |
| M3 | **MUST-FIX** | **Consent belongs to the person, not the device.** Today `consent.v1` survives sign-out and "the device value wins until sign-in completes". A second person signing in on a shared phone could start Sentry or PostHog at boot under the previous user's choice. Also, other devices of a deleted user keep their local data. Also, Apple refresh tokens (R8). | Clear `consent.v1` (or key it by user id) on sign-out and on account deletion. After sign-in, the profile value wins, and if there is no profile decision, ask. If a session refresh returns a revoked or deleted user, run `disconnectAndClear()` and clear local storage. Use the backend's fresh `authorizationCode` at deletion and drop "send `authorizationCode` once at sign-in". |
| M4 | **MUST-FIX (decision)** | Don't claim `/c/*` as an app link (R2, O6). | Universal and App Links for `/i/*` only. |
| M5 | LATER | Session tokens are in AsyncStorage. | Move to SecureStore or an encrypted store before public launch. |
| M6 | LATER | Privacy nutrition labels and the Play Data safety form. | Inputs: identifiers (user ID, push token), contact info (email), user content (pet and care data), usage data and diagnostics (both optional, opt-in), no tracking, data not sold, deletion available in the app and on the web. Fill them when the console asks for the test track (the exact per-track requirement is unverified). |

### Product owner (spec wording, no design change)

| # | Severity | Finding |
|---|---|---|
| PO1 | LATER (before beta metrics are read) | Clarify "consented stats only" so it allows first-party aggregates (R3), or have Eyup acknowledge it. |
| PO2 | — | Copy for the deletion confirmation and web page: "Your ticks stay in the household's history as 'Former member'. Your contact is removed from care cards." |

---

## Privacy & security check: Pet OS MVP architecture

**Summary:** proceed with conditions (11 MUST-FIX above).

### Data map

| Data | Subject | Purpose | Basis | Store/vendor + region | Retention |
|---|---|---|---|---|---|
| Email, Apple/Google identity, auth session | Member | Sign-in | Contract | Supabase Auth, Frankfurt | Until deletion. Logs and backups per Supabase (LATER: state it) |
| Display name, locale, consent flags | Member | Household attribution, i18n, consent proof | Contract / legal obligation | Supabase; synced to self (names to household) | Until deletion |
| Pets, routine, meds, health notes, places, vet contact | Household (members) | Core app | Contract | Supabase Frankfurt + PowerSync EU (Ireland) + members' phones | Until the last member deletes, or until edited |
| Ticks (`actor_id`, `client_at`) | Member | Shared care log, streak | Contract | Same | Kept. `actor_id` set to NULL on deletion |
| Care-card owner contacts and note | Member or third party typed by a member | Sitter handover | Contract (the member's choice) | Supabase; public through the token link | Until edited, revoked or deleted (B4) |
| Card `view_count`, `last_viewed_at` | Household (indirectly) | G2 metric, owner's "opened" info | Legitimate interest | Supabase | With the card |
| Expo push token, platform, app version | Member device | Sync signal | Contract (strictly necessary) | Supabase + Expo (US) → APNs/FCM | Until sign-out, `DeviceNotRegistered` or deletion |
| Usage events (UUID, household and pet UUIDs) | Consenting member | G1/G3 | Consent | PostHog EU | PostHog default; deleted on account deletion (B5) |
| Crash reports (no identity) | Consenting member | Stability | Consent (lawyer question R4) | Sentry EU | 30 days |
| Transactional email (address, content) | Member | OTP, deletion | Contract / legal obligation | Resend (EU sending, US storage) | Resend log retention (LATER) |
| Deletion request (hashed token) | Requester | Verified deletion | Legal obligation | Supabase | 24 h + 7 days purge |
| Onboarding draft, consent, prefs | Device user | Pre-account start | Contract | Device only | Until sign-in or uninstall |

### Requirements

| # | Requirement | Status | Action |
|---|---|---|---|
| 1 | No analytics or crash SDK before opt-in | Met (design) | M3: consent per person |
| 2 | Consent granular, off by default, withdrawable in Settings | Met | — |
| 3 | Unguessable, revocable card link; no indexing; no third-party scripts | Met | P1 alignment, M1, M2 |
| 4 | Card shows only the curated subset | Not met (B1 hole) | B1 |
| 5 | Least privilege: RLS on every table, anon limited to 3 RPCs | Partly met | B3 |
| 6 | Removal actually ends access | Partly met | B2, M1, R9 push to the removed member |
| 7 | Deletion in 3 taps and on the web; covers every store | Mostly met | B4, B5, M3; LATER: Resend, backups |
| 8 | Secrets out of the bundle and out of git | Met | P2 Vault secret |
| 9 | Transparency (Art. 13) for beta testers | Not met | P5 beta privacy notice |
| 10 | Sign in with Apple; Apple token revocation on in-app deletion | Met (spike pending) | M3: fresh code at deletion |
| 11 | DPAs, TIAs, Art. 30 record, sub-processor list | Not met | LATER (before public launch) |
| 12 | DPIA | Not triggered (no location, AI, photos or large scale) | Re-check when the vet finder or photos arrive |

### Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Cross-household data published through a card's `pet_ids` | High (easy, silent) | B1 |
| A removed ex-partner keeps or regains access (invite, card link) | High for the person affected | B2, M1, B4 |
| A forgotten default grant exposes a table or RPC to anon | High (likelihood medium) | B3 CI check |
| A public card note holding a door code or address | Medium | M2 copy |
| Tracking under someone else's consent on a shared phone | Low–medium | M3 |
| Deletion silently incomplete at a vendor | Medium | B5 |
| Push spam or a cost hit through an open Edge Function | Medium | P2 |
| US processors (Expo, Resend) without DPAs | Low at beta scale | LATER |

### Needs a lawyer (LATER, before public launch)

1. Is crash reporting "strictly necessary" under PKE art. 399, so that it could default on (R4)?
2. The final privacy policy and terms in PL and EN, including a minimum age of 16, a household
   "shared data" clause, and members typing third parties' contacts onto cards.
3. Legitimate-interest assessment wording for the first-party aggregate metrics (R3).
4. Transfer assessments for Expo push and Resend storage (US), and how fragile the DPF is.
5. The breach notification process (UODO within 72 hours) and who is responsible.

---

## Re-review (round 2)

**Final verdict: proceed. Every privacy MUST-FIX is resolved in the drafts.** I spot-checked
them against each draft's revision log and the backend SQL in §11.

| Item | Status | Where |
|---|---|---|
| B1 card across households | Resolved more strictly than asked: one pet per card (ruling 5), a composite FK, `get_care_card` joins on the household, and same-household triggers on `tick`, `task.medication_id` and `reminder_pref` | backend §9, §11 |
| B2 rejoin with an old invite | Resolved: remove, leave and join-away revoke all open invites | backend §8.3 |
| B3 default grants and RLS | Resolved: default privileges revoked in `public`, `private` and `analytics`; RLS on every table; a CI allow-list of 4 anon functions; 5 RLS cases | backend §11.1, §11.5–11.6 |
| B4 contacts on cards | Resolved: `owner_contacts[].user_id`, stripped on remove, leave and delete | backend §8.3–8.4, mobile §10.3 |
| B5 retrying external deletion steps | Resolved: `deletion_followup`, daily retry, Vault secret, alert on the 3rd failure | backend §8.4, platform B5 |
| P1 token and headers | Resolved: plaintext, 256-bit, exactly 43 characters; `noarchive`; generic meta tags; no `/c/` in robots.txt | platform §8.3, ADR 0024 |
| P2 function secrets and log redaction | Resolved | platform §8.7, §10 |
| P3 scrubbers | Resolved (`scrubSensitive()`) | platform §5.1, §6; mobile C-P5 |
| P4 `consent_crash_reports` | Resolved | backend `profiles` |
| P5 beta privacy notice | Resolved | platform §8.5 |
| M1 / M2 / M3 / M4 | Resolved: a replace-links sheet and Settings card list; the public-link warning; consent keyed by `userId` and cleared on sign-out; local wipe for a deleted user; Apple code only at deletion; `/i/*` only | mobile §3.7, §9, §10–11 |

**Checked new surfaces, nothing to fix:**
- **`record_invite_landing` (4th anon RPC):** it takes a 256-bit token, returns only
  `{ open }`, stores no IP or user agent, and the invite page shows no names. OK.
- **Tick `DELETE` for members:** it is limited to the household's today and yesterday, and
  undoing someone else's tick asks for confirmation first. OK.
- **Silent push deferred (ruling 8):** this removes R9's push concerns for the MVP. When the
  push comes back, R9's conditions apply again: a data-only payload, recipients computed before
  `left_at`, and a function that isn't public.

**Web deletion (ruling 7): this meets Google Play's account-deletion web-resource requirement
for the closed-testing beta, with three conditions on the page text.** Play asks for a URL
that works without the app, where users can *request* deletion of their account and data.
Clearly described steps that end in an email request are an accepted route; a self-serve form
is not required. Play's Data safety form, which carries this URL, is required on closed testing
tracks. Internal testing is exempt. I did not re-check these Play facts against Google's help
pages this session. Confirm them when filling in the Play Console. The conditions are:
1. Name the app (Pet OS) and the developer exactly as on the Play listing.
2. List the request steps (`privacy@` from the account address, subject line, who acts and when
   — within 30 days).
3. State what is deleted, what is kept and for how long. This includes the Supabase backup
   window (7 days) and "ticks stay as 'Former member'; your contact is removed from care cards".

Identity check by sender address is proportionate. Write in the runbook that an Apple
private-relay user must write from the relay address.

**Still open (all LATER, before public launch):**
- Restore the self-serve web deletion flow (revision 1 §8.4, parked).
- Resend log retention, and PowerSync compaction of removed rows.
- DPAs and TIAs (Supabase, PowerSync, PostHog, Sentry, Resend, Cloudflare; Expo when push
  returns).
- Session tokens in SecureStore.
- Throttle on deletion emails (moot until the self-serve flow returns).
- Store labels and the Data safety form, filled from mobile M6.
- The [lawyer] list above.
- PO1: the spec clarification for "consented stats only". Not yet seen in the spec. Eyup or
  the product owner should add one line before beta metrics are read.
