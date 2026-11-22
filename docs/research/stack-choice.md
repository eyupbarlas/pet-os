# Build Pet OS on Expo, Supabase and PowerSync

Pet OS should be one Expo (React Native) codebase for iOS, Android and the small web front end, with Supabase in Frankfurt as the backend and login, and PowerSync for offline sync between household members. PostHog EU, Sentry EU, Resend and Google Places stay. Cloudflare stays for DNS and probably hosts the web pages too. Clerk should be dropped, and Stripe and Vercel are not needed at launch. Expected running cost is about **$35–65 a month for the 300-user beta** and roughly **$220–440 a month at 10k users**, not counting AI features or PostHog overage. The biggest change from the founder's list is not a swap. It is something missing: Supabase has **no built-in offline sync** ([Supabase blog](https://supabase.com/blog/mongodb-realm-and-device-sync-alternatives)), and offline sync is the hardest feature in the brief. Clerk is a problem because it duplicates Supabase's login, keeps every user's identity data in the US, and gives the team a second user database to clean up on every GDPR deletion ([Clerk DPA](https://clerk.com/legal/dpa.md)). Stripe cannot cheaply replace App Store or Google Play billing for an in-app premium tier in Poland. Under the new EU rules Apple still takes 10–15% on link-out purchases. The law shapes the stack about as much as the features do: Polish consent rules (PKE art. 399), store account-deletion rules, and Google's EEA-specific Maps terms all point to specific settings that are hard or impossible to change after day one.

> **How to read this report.** Prices come from vendor pages checked in early November 2026 unless noted. **(unverified)** means the researchers took the fact from background knowledge or a single third-party source and did not confirm it from a primary source. Check it before you rely on it. **[lawyer]** means a Polish privacy lawyer should confirm it. This is not legal advice.

## Seven of the founder's nine tools stay, with conditions

The founder's list is sound on the core and weak at two edges. Supabase, PostHog, Sentry, Cloudflare and Google Maps fit the brief well as long as each one is set to its EU option on day one. Resend stays with a residency caveat. Clerk overlaps with Supabase, Stripe solves a problem Pet OS does not have yet, and Vercel's free plan is not allowed for a commercial app.

| Founder's pick | Verdict | Why, in one line |
|---|---|---|
| **Supabase** | **Keep**, Frankfurt region, Pro plan | Postgres database, login, file storage and server functions under one EU-region DPA. **$25/month covers both 300 and 10k users** ([Supabase pricing](https://supabase.com/pricing)). |
| **Clerk** | **Swap → Supabase Auth** | Duplicates login Supabase already includes. **No EU data residency** in Clerk's DPA. Adds a second store to delete users from. No official PowerSync example ([Clerk DPA](https://clerk.com/legal/dpa.md); [PowerSync docs](https://docs.powersync.com/configuration/auth/supabase-auth.md)). |
| **Vercel** | **Swap → Cloudflare Workers** (or keep on the paid plan) | Hobby is "personal, non-commercial use" only, so Pet OS would need **Pro at $20/month per seat**. Functions also default to Washington DC unless pinned to Frankfurt ([Vercel pricing](https://vercel.com/pricing); [Vercel regions](https://vercel.com/docs/functions/configuring-functions/region)). Two small pages don't need it. |
| **Stripe** | **Defer; flag conflict** | In-app premium in Poland should go through Apple/Google billing via RevenueCat. Stripe is only useful later as a web checkout with BLIK. |
| **Resend** | **Keep, with caveat** | Free to $20/month at your scale, with an EU sending region, but **all stored data is in the US** ([Resend GDPR](https://resend.com/security/gdpr)). |
| **Cloudflare** | **Keep** (DNS, and likely web hosting) | Conflict to avoid: if the web stays on Vercel, Cloudflare records must be "DNS only" (grey cloud) ([Vercel KB](https://vercel.com/kb/guide/cloudflare-with-vercel.md)). |
| **PostHog** | **Keep**, EU Cloud | Free tier likely covers both scales. Supports "off until consent" ([PostHog pricing](https://posthog.com/pricing); [PostHog RN docs](https://posthog.com/docs/libraries/react-native)). |
| **Sentry** | **Keep**, EU org | The EU (Frankfurt) region **can only be chosen when the org is created** ([Sentry docs](https://docs.sentry.io/organization/data-storage-location/)). |
| **Google Maps** | **Keep Places API; flag terms** | EEA terms ban showing Places results on *any* map. Build a list with "Directions" links instead ([Google EEA notice](https://developers.google.com/maps/comms/eea/places)). |

### Why Clerk is the clearest cut

Clerk's real strengths are a polished prebuilt sign-in screen, native Sign in with Apple in Expo (shipped November 2025) and a free tier up to 50,000 retained users ([Clerk changelog](https://clerk.com/changelog/2025-11-13-native-sign-in-with-apple-expo); [Clerk pricing](https://clerk.com/articles/clerk-pricing-explained)). Money is not the issue. Supabase Pro already includes 100,000 monthly users of its own login, hosted in the same Frankfurt region as the data ([Supabase pricing](https://supabase.com/pricing)).

Clerk's DPA says it "may store and process Customer Personal Data anywhere Clerk or its Sub-processors maintain facilities", mainly on Google Cloud and Cloudflare, and it relies on the EU-US Data Privacy Framework ([Clerk DPA](https://clerk.com/legal/dpa.md)). A competitor blog claims Clerk has a Frankfurt region. No Clerk primary source confirms this, and it contradicts Clerk's own DPA, so treat it as wrong.

Adding Clerk would also mean:

- a second processor to list in your GDPR records;
- a second deletion call and webhook sync every time a user deletes their account;
- connecting Clerk tokens to PowerSync with no official example to follow ([PowerSync docs](https://docs.powersync.com/configuration/auth/supabase-auth.md)).

One gap remains. Supabase's native Apple and Google sign-in on React Native (`signInWithIdToken`) was not checked in this research **(unverified)**. Prototype it in week one.

### Why Stripe is the wrong tool for the premium test

A premium unlock is a digital good, so inside the iOS and Android apps the default is store billing.

On iOS, Apple's single EU terms took effect on 1 October 2026 ([third-party summary of Apple's announcement](https://muhittincamdali.com/en/blog/apple-eu-dma-yeni-sartlar-ekim-2026/); **unverified against Apple's own page**):

- **In-app purchase:** 26% standard, 15% reduced.
- **Link-out to a web checkout:** 15% standard, 10% reduced.
- The reduced rate covers the Small Business Program and subscriptions after their first year.
- **You cannot change your chosen payment option for 12 months.**

On Google Play in the EEA, alternative billing removes the 5% billing fee. The service fee still applies: 10% on all auto-renewing subscriptions ([Android Developers Blog](https://android-developers.googleblog.com/2026/06/play-expanded-billing.html)).

So Stripe saves a few percentage points at most, and Apple's link-out adds a mandatory disclosure sheet. **RevenueCat** handles store subscriptions on both platforms and is **free up to $2,500 monthly tracked revenue**, then 1% ([RevenueCat pricing](https://www.revenuecat.com/pricing/)). Stripe becomes useful only if you later sell on the web. It now supports **BLIK recurring payments**, which matter to Polish buyers ([Stripe docs](https://docs.stripe.com/payments/blik/recurring-payments)). Partner link-outs (Psibufet, Allegro and similar) sell physical goods and services, so they need no store billing at all **(unverified)**.

## Offline household sync is the piece the founder's list never named

The feature that will eat the most engineering time is not on the list. Two caregivers, both offline, tick the same meal. Then both phones reconnect, and the streak still has to be correct. Supabase's own guidance points to third-party tools for this ([Supabase blog](https://supabase.com/blog/mongodb-realm-and-device-sync-alternatives)).

Of the options researched, **PowerSync** fits best:

- It stores data in a local SQLite database on the phone and queues offline writes for upload.
- It has first-party SDKs for React Native, Flutter and Kotlin, and connects to Supabase's login keys automatically ([PowerSync conflict docs](https://docs.powersync.com/handling-writes/custom-conflict-resolution); [PowerSync GitHub](https://github.com/powersync-ja)).

The alternatives fall short for this use case:

- **Zero (Rocicorp):** does not support offline writes. Its maintainer said in February 2026 that they "have chosen to focus on online for the foreseeable future" ([Zero issue](https://bugs.rocicorp.dev/p/zero/issue/246605)).
- **ElectricSQL:** syncs reads only. You build the write path yourself ([pistack comparison](https://www.pistack.xyz/posts/2026-10-21-local-first-sync-engines-electricsql-powersync-triplit/)).
- **Convex:** cannot write offline (an aggregator report, so treat it with some caution) ([pkgpulse](https://www.pkgpulse.com/guides/convex-vs-instantdb-vs-electricsql-real-time-sync-2026)).
- **Firestore:** the mature whole-backend alternative, but you give up SQL, Postgres portability and row-level access rules.

**PowerSync's weak spot is paperwork.** Its pricing page lists **no EU hosting region and no DPA** ([PowerSync pricing](https://powersync.com/pricing.md)). Ask PowerSync directly before the beta. If there is no EU region, self-host the source-available service in Frankfurt.

How the data is designed matters as much as which engine you pick. The researchers recommend:

- **Store each completed task as an insert-only "tick" record.** Key it on task + local calendar date + time slot. Two people ticking the same meal then collapse into one record instead of overwriting each other. PowerSync's docs recommend insert-only tables for log-style data and warn that the server may receive the same operation twice ([PowerSync docs](https://docs.powersync.com/handling-writes/custom-conflict-resolution)).
- **Compute "today" from the household's time zone**, for example `Europe/Warsaw`, not the phone's current offset. This keeps streaks correct across daylight-saving changes and for a sitter abroad.
- **Calculate streaks on the server**, and show a provisional streak on the phone while offline.

These rules are the researchers' design advice; no published source covers this exact problem. Sitter access fits the same model: a membership table with `valid_until`, checked by the database's access rules, so access ends automatically.

### Expo beats Flutter mainly because of the web pages

Expo SDK 58 (October 2026, React Native 0.88) made web server-side rendering and data loading stable ([Expo SDK 58](https://expo.dev/changelog/sdk-58)). That means the public care-card pages and the account-deletion page can live in the same TypeScript codebase as the app. Flutter 3.47 is a strong alternative for animation ([Flutter docs](https://docs.flutter.dev/release/whats-new.html)). But Flutter's web output is generally a poor fit for shareable, link-preview-friendly pages **(unverified)**, so a Flutter team would build those pages separately.

Expo's main cost is upgrade churn: three major SDK releases in 2026, each with migration work. **Budget 1–3 days per upgrade.**

### Reminders should mostly run on the phone

Daily care reminders should be local notifications scheduled on the device. They work offline and need no server. Remote push is for household events like "Ola fed Burek".

Android 14+ blocks exact alarms by default, so reminders may arrive a few minutes late. Pet OS is not in the app categories Google Play allows to request exact alarms ([expo-notifications docs](https://docs.expo.dev/versions/latest/sdk/notifications/)). A few minutes' drift is acceptable for pet care.

**Expo Push** is the simplest remote push route. It is a free wrapper over Google's FCM and Apple's APNs **(free price unverified)**, and FCM itself is "no-cost" ([Firebase pricing](https://firebase.google.com/pricing)). Expo says it is GDPR- and DPF-compliant, but its DPA and hosting region were not confirmed ([Expo privacy](https://docs.expo.dev/regulatory-compliance/data-and-privacy-protection/)). Keep pet and person names out of push messages.

## Recommended stack, with alternatives

| Layer | Recommended | Main alternative | ~300 users | ~10k users | EU residency / DPA | Lock-in |
|---|---|---|---|---|---|---|
| App framework | **Expo / React Native (SDK 58)** | Flutter 3.47 | $0 | $0 | n/a | Medium (rewrite to switch) |
| Build + over-the-air updates | **EAS Build/Update** ([Expo pricing](https://expo.dev/pricing)) | Codemagic (free OTA "Patch" under 100k users) ([Codemagic](https://codemagic.io/pricing/)) | $0 (Free: 15+15 builds/month, 1k update users) | $199 (Production) or $19 + undisclosed overage | Not stated (unverified) | Low–medium |
| Backend, database, files | **Supabase Pro, Frankfurt** | Firestore (europe-west3) ([Firestore pricing](https://cloud.google.com/firestore/pricing)) | $25 | ~$25–35 (estimate) | EU region; data, login, files and backups stay in region; DPA with SCCs; support and billing data may leave ([Supabase FAQ](https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq)) | Low for data (plain Postgres), higher for login/storage/functions |
| Login (Apple/Google/email) | **Supabase Auth** | Clerk; Better Auth (not researched) | Included | Included (100k users) | Same Frankfurt DPA | Medium |
| Offline sync | **PowerSync** | Legend-State (lighter, more DIY); Firestore | $0 (Free: 50 concurrent devices) | $49 (Pro: 1,000 concurrent) | **No EU region or DPA listed; ask, or self-host in EU** | Medium (source-available FSL licence) |
| Pet photos | **Supabase Storage** (resize on the phone) | Cloudflare R2 ($0.015/GB, no egress fees) | Included (100 GB) | Included (~90 GB estimate) | Same DPA; may be cached via a global CDN | Low |
| Push | **expo-notifications + Expo Push** | Direct FCM/APNs; OneSignal (~$120/month at 10k) ([OneSignal](https://onesignal.com/pricing)) | $0 | $0 (unverified) | Expo is US; DPA unverified | Low |
| Web pages (care cards, deletion) | **Cloudflare Workers** ([pricing](https://developers.cloudflare.com/workers/platform/pricing/)) | Vercel Pro, pinned to fra1 | $0 (100k requests/day) | $0–5 | Runs globally by default; EU-only needs paid add-on (unverified) | Low |
| DNS, email forwarding | **Cloudflare** | n/a | $0 (unverified) | $0 (unverified) | DPA unverified | Low |
| Transactional email | **Resend** (EU sending) | Mailgun EU or Amazon SES Frankfurt (EU storage) ([Nuntly comparison](https://nuntly.com/blog/email-api-eu-data-residency)) | $0 (3k/month) | $20–40 | US storage; DPF + SCCs; pre-signed DPA | Low |
| Analytics, flags, surveys | **PostHog EU Cloud** | Aptabase (EU, $10/month for 200k events) ([Aptabase](https://aptabase.com/pricing.md)) | $0 | $0 if events are kept under 1M/month; overage rate not published | Frankfurt; DPA not seen on pricing page (unverified) | Medium |
| Crash reporting | **Sentry, EU org** | PostHog error tracking (100k exceptions free) | $0–29 (free plan is 1 user) | $26–29 (Team) | Frankfurt; some account metadata always in US | Low |
| Vet finder | **Google Places API (New)**, list view | OpenStreetMap seed list + hand-curated 24h clinics | $0 | ~$70 (estimate: 3k searches) | No residency (unverified) | High (caching banned) |
| Translations (EN/PL) | **Tolgee Free** ([Tolgee](https://tolgee.io/pricing)) | Weblate (EU-hosted, €47/month) ([Weblate](https://weblate.org/en/hosting/)) | €0 | €0 | Tolgee location unstated; Weblate EU | Low (keep files in repo) |
| Uptime/status | **Better Stack Free** ([Better Stack](https://betterstack.com/pricing)) | UptimeRobot (not researched) | $0* | $0–34 | EU by default | Low |
| Subscriptions (later) | **RevenueCat** over StoreKit/Play Billing | Superwall; Stripe web + BLIK | $0 | $0 under $2.5k revenue/month | Not researched | Low–medium |
| AI avatar (later) | **Reference-image model via an EU route** (Vertex AI EU, OpenAI EU residency) | FLUX Kontext ($0.04/image) | n/a | ~$0.15–0.35 per pet, once | OpenAI EU needs approval + zero-retention amendment ([Wavect](https://wavect.io/blog/eu-data-residency-ai-apps-2026/)) | Medium (models change often) |
| AI portion advisor (later) | **Formula in code** + small LLM via Bedrock/Vertex EU | Mistral EU endpoint | n/a | Fractions of a cent per call | Anthropic's own API has no EU residency; Bedrock/Vertex EU do ([Kontinent.ai](https://kontinent.ai/en/blog/claude-in-the-eu-four-ways-compared)) | Low |

*Better Stack's free tier is labelled "for personal projects". Whether it allows commercial use is unverified.

Notes on specific rows:

- **Vet finder cost.** Showing opening hours triggers Google's "Enterprise" price tier: **1,000 free searches a month, then $35 per 1,000** ([Google Maps pricing](https://developers.google.com/maps/billing-and-pricing/pricing)). Which fields trigger that tier is unverified. Google's terms only allow caching place IDs, so you cannot build your own cached dataset of hours. Wrong "open now" data in an emergency is a safety risk, so always show the phone number and "call before going".
- **AI avatar.** Image models were shut down several times in 2026, so build it so the model can be swapped ([invideo roundup](https://invideo.io/blog/ai-image-model-pricing/)).
- **Portion advisor.** Calories come from the standard veterinary formula (RER = 70 × kg^0.75). The language model only explains the result.

## Running costs: about $35–65 a month in beta, about $220–440 at 10k users

| Item | ~300 users (beta) | ~10k users | Basis |
|---|---|---|---|
| Supabase Pro | $25 | $25–35 | Vendor price; 10k figure is an estimate |
| PowerSync | $0 | $49 | Free → Pro |
| Expo EAS | $0 | $19–199 | Starter + unknown overage, or Production |
| Cloudflare (Workers, DNS) | $0 | $0–5 | |
| Resend | $0 | $20–40 | Third-party price summary ([buildmvpfast](https://www.buildmvpfast.com/blog/resend-vs-ses-vs-postmark-transactional-email-deliverability-saas-2026)) |
| PostHog | $0 | $0 + possible overage | Estimate ~3.6M events/month at 10k without event discipline vs 1M free |
| Sentry | $0–29 | $26–29 | Paid once there is a second engineer |
| Google Places | $0 | ~$70 | Assumes 3k searches/month |
| Apple Developer Program | ~$8 | ~$8 | $99/year ([third-party docs](https://www.mintlify.com/WilliamAGH/apple-maps-java/reference/quota)) |
| Tolgee, Better Stack, RevenueCat, Expo Push | $0 | $0 | Free tiers |
| **Total** | **~$35–65/month** | **~$220–440/month** | Excludes AI, store fees, PostHog overage, domain |

Two things push the 10k figure toward the top of its range.

**Over-the-air (OTA) updates.** These are app updates pushed without going through store review. Every user who downloads at least one counts toward EAS's limit, and Starter covers only 3,000 such users ([Expo pricing](https://expo.dev/pricing)). Shipping OTA updates often at 10k users means $199/month, unless you move to Codemagic's free OTA option.

**Analytics volume.** Keep PostHog under the free tier: turn off autocapture on mobile, define a lean event list, and sample session replays.

Costs to watch:

- **Founder's original list:** would add Vercel Pro at **$20 per seat** (up to $60/month for three people).
- **Paid image resizing:** could add **~$150** if every photo is resized on the server. Resize on the phone before upload instead ([Supabase pricing](https://supabase.com/pricing)).
- **AI avatar launch:** a one-off **~$1,000–2,000** if half of 10k users generate avatars. Gate it behind premium.

## Polish and EU rules decide several settings on day one

The compliance verdict from the research is **"proceed with conditions"**. Pet data and care logs are low risk. The conditions below each change something concrete in the stack.

### 1. Consent before analytics

Poland's Prawo komunikacji elektronicznej (PKE), **art. 399**, requires consent before an app stores or reads anything on the phone that isn't strictly necessary. Login sessions are exempt. Analytics and session replay are not ([EdLaw PKE summary](https://edlaw.eduverse.com/docs/jurisdiction/nat/pl/pke)).

In practice:

- Start PostHog with `defaultOptIn: false` and call `optIn()` only after the consent screen ([PostHog RN docs](https://posthog.com/docs/libraries/react-native)).
- Keep any web analytics in cookieless "on reject" mode ([PostHog cookieless](https://posthog.com/docs/data/cookieless-tracking)).
- Whether crash reporting counts as "strictly necessary" is unsettled **[lawyer]**. Strip personal data from Sentry and leave Sentry's replay off.
- Bootstrap feature flags (kill switches) from your own backend so they don't depend on analytics consent. Whether PostHog still fetches flags while a user is opted out is untested.

### 2. Every US vendor needs paperwork

The EU-US Data Privacy Framework is valid today. The General Court upheld it on **3 September 2025**, but an appeal to the EU Court of Justice was filed on **31 October 2025** and is still pending ([WilmerHale](https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/20251201-european-court-of-justice-to-review-challenge-to-eu-us-data-privacy-framework)).

Before the first external user:

- Sign or accept each vendor's DPA.
- Write a one-page transfer impact assessment (TIA) for each US vendor.
- Publish a sub-processor list.
- Keep an Art. 30 record of processing (a spreadsheet is fine).

Choosing EU regions wherever offered is the hedge if the framework falls. That is a second reason to drop Clerk.

### 3. Regions you cannot change later

Pick EU regions for these at creation, because they cannot be moved afterwards:

- **Supabase:** choose eu-central-1 (Frankfurt). Avoid "general" regions, which may deploy outside the EU ([Supabase regions](https://supabase.com/docs/guides/platform/regions)).
- **Sentry:** create an EU org from the start.
- **PostHog:** choose EU Cloud at sign-up.

### 4. Account deletion

**Apple** ([Apple guidance](https://developer.apple.com/support/offering-account-deletion-in-your-app)):

- Users must be able to start deletion inside the app.
- Deletion must remove photos too.
- Apps using Sign in with Apple must revoke Apple tokens.

**Google Play** ([Google Play Help](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en-GB)):

- Requires in-app deletion plus a public web deletion URL.
- Deletion covers data your vendors hold too.

The planned `/pl/delete-account` and `/en/delete-account` pages meet both rules. Each should trigger one backend job that removes the user from Supabase, Storage, PostHog and Sentry.

You also need a household rule: when one member leaves, the household stays and their name is anonymised on past ticks.

### 5. Sign in with Apple is mandatory

Offering Google sign-in on iOS triggers Apple guideline 4.8, and Sign in with Apple satisfies it ([Apple forum thread](https://developer.apple.com/forums/thread/765145); **exact wording unverified**).

### 6. Public care cards

Treat a care-card link as publishing personal data. The research recommends:

- an unguessable token of at least 128 bits;
- expiry and one-tap revoke;
- a `noindex` header and no third-party scripts on the page;
- a default field list that hides the owner's surname, address and microchip number.

These are design recommendations based on GDPR Articles 5, 25 and 32. No regulator guidance on share links was found.

### 7. Age limit

Poland's age of digital consent is **16** ([Bird & Bird](https://childreninthedigitalworld.twobirds.com/home/poland)). Set the terms at 16+, and consider 18+ for premium purchases.

### 8. Maps under Google's EEA terms

Since **8 July 2025**, new EEA projects may not show Places content on any map, except coordinates and place IDs ([Google EEA notice](https://developers.google.com/maps/comms/eea/places)). Build the vet finder as a list with links to Google Maps or Apple Maps. Store no coordinates.

### 9. Accessibility (EAA)

The European Accessibility Act covers app-based consumer contracts, so a premium tier would bring Pet OS into scope. Microenterprises (fewer than 10 staff, under €2m turnover) are exempt ([You-Source](https://www.you-source.com/blogs/european-accessibility-act-what-applies)). Poland has enforced its version since **28 June 2025** ([RZM alert](https://rzmlaw.com/wp-content/uploads/2025/08/Alert-Polski-Akt-o-Dostepnosci.pdf)). Build to WCAG 2.1 AA anyway, and test layouts with long Polish words at 200% text size.

### 10. AI features and coins

- **AI labels.** AI Act **Article 50** transparency rules apply from **2 August 2026** ([Jones Walker](https://www.joneswalker.com/en/insights/blogs/ai-law-blog/yes-august-2-still-matters-the-eu-approved-a-high-risk-ai-delay-but-most-trans.html)). Label avatars "AI-generated" and keep the provider's watermark metadata.
- **AI disclaimer.** Label the portion advisor as AI and "not veterinary advice".
- **Coins.** EU consumer-protection principles on virtual currency target coins bought with real money ([ZwillGen](https://www.zwillgen.com/gaming/cpcn-announces-virtual-currency-consumer-protection-guidelines/)). Keep coins earn-only, non-purchasable and non-cashable to stay outside them.

## Decisions Eyup needs to make

1. **Framework.** Confirm Expo/React Native over Flutter. This sets hiring, the web approach and every SDK below.
2. **Login.** Drop Clerk and use Supabase Auth. If you keep Clerk, accept US-only identity storage, a second deletion path and integration work with no official PowerSync example.
3. **Offline sync.** Adopt PowerSync, and choose PowerSync Cloud (once it confirms an EU region and DPA) or self-hosting in Frankfurt.
4. **Day-one regions.** Approve Frankfurt for Supabase, a new EU org in Sentry and PostHog EU Cloud. None of these can be moved later.
5. **Web hosting.** Choose Cloudflare Workers ($0–5) or Vercel Pro ($20 per seat, pinned to fra1). Note: whether Expo Router's server output deploys directly to Workers was not verified.
6. **Email.** Accept Resend's US storage, or pay the extra ops cost of an EU-resident sender (Mailgun EU, SES Frankfurt).
7. **Crash reporting.** Choose Sentry alone, or PostHog error tracking to cut one vendor. PostHog's handling of native crashes is unverified.
8. **Vet finder.** Accept a list-plus-directions design under Google's EEA terms, and set a monthly Places budget alert. Alternatively, test OpenStreetMap coverage for Warsaw first.
9. **OTA budget.** At 10k users, pay $199/month for EAS Production, ship over-the-air updates rarely, or move OTA to Codemagic.
10. **Premium test.** Use store billing via RevenueCat. Decide whether a Stripe + BLIK web checkout is worth adding later. Note Apple's 12-month lock on the chosen EU payment option.
11. **Household rules.** Decide who owns shared pets and history when a member deletes their account, and how sitter access expires.
12. **Age gate.** Choose 16+ overall and/or 18+ for purchases.
13. **AI provider path.** Choose Vertex AI EU, OpenAI EU residency (needs approval and zero-retention terms) or Bedrock EU. Prototype pet-likeness quality on three models before committing.
14. **Legal review.** Book a Polish privacy lawyer for the **[lawyer]** items: whether crash reporting needs consent, a short DPIA (location, replay, public links, AI), the insurance-broker referral, and the EAA exemption.

## Conclusion

The founder's list was built around web-SaaS defaults: a login vendor, a web host, a card processor. Pet OS is a mobile app that has to work offline. The stack that fits puts the money and attention into the sync layer and the data model, and stays thin everywhere else. Under GDPR and Polish law, choosing EU regions on day one costs almost nothing now and is very expensive to fix later.

At 10k users, the largest bills are not the database. They are build tooling ($199), Google Places (~$70) and PowerSync ($49), while Supabase stays at $25. Spending on cloud hosting is the wrong place to economise; three settings carry the real cost risk: how often you ship over-the-air updates, how many analytics events you track, and whether you resize photos on the phone. The three open verification items that could change this plan are PowerSync's EU hosting, the official Apple text of the October 2026 EU fees, and the CJEU ruling on the Data Privacy Framework.
