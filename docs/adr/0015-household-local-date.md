# 0015 — The day is the household's local date, stamped by the client

- **Status:** proposed
- **Date:** 2026-11-22
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` (need 6; acceptance "DST change weekend"), ADR 0014, ADR 0016

## Context

The streak "day" is the household's local calendar day, including over the DST weekends. Members
or sitters may be in another time zone. Offline devices must know which day a tick belongs to
without the server.

## Options considered

| Option | Pros | Cons | Cost at MVP (≤100) / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. Store the IANA zone on `household`; the client stamps `local_date` (date type) using that zone; the server uses `(now() AT TIME ZONE tz)::date` | Works offline; date arithmetic only, so DST can't shift a day; one zone per pet's home | Needs a tz library on Hermes; a timezone change applies only going forward | $0 | Low |
| B. Store only UTC timestamps; derive the day at read time | One source of truth | The day boundary depends on the reader's zone or offset; DST bugs; the offline device must still pick a zone | $0 | Low |
| C. Use the phone's local date | Simplest | A travelling member breaks the shared day | $0 | Low |

## Decision

Option A. `household.timezone` defaults to the device zone at creation, else `Europe/Warsaw`,
and is validated against `pg_timezone_names`. `tick.local_date` is the day the tick is **for**.
Fixtures cover 2027-03-28 and 2027-10-31 in Europe/Warsaw.

## Consequences

- Easier: streak logic is pure date logic; the server close job is "local date moved on".
- Harder: mobile needs Luxon or a Temporal polyfill (Hermes `Intl` timeZone support is `unverified`).
- Revisit if: households span time zones in a way that matters (e.g. pets that travel).
