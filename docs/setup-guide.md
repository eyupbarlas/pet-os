# Setup guide: Supabase, PowerSync, Apple and Google sign-in

Do the parts in order. Part 1 and 2 take about 20 minutes. Part 3 and 4 depend on accounts you may
need to pay for or wait on, and you can leave them for later: the email code sign-in works
without them. Dashboard screens change names now and then, so if a label differs slightly,
look for the closest one.

Never paste a secret (database password, Google client secret, Apple key) into the repo or into
chat. They go into dashboards and into `apps/mobile/.env.local` (git-ignored).

## Part 1. Create the tables in Supabase

Your project: `xdpgtfsvbblbntzjyeje`.

1. Open the project, then **SQL Editor**, then **New query**.
2. Open [`supabase/all-migrations.sql`](../supabase/all-migrations.sql) in this repo (on the
   `claude/project-thread-wvrbc2` branch until PR #12 is merged), copy everything, paste it, press **Run**.
   It creates the tables, the security rules and the functions. It should end with "Success".
   If it stops with an error, send me the message and the line it names. Don't run it twice
   after a partial run without telling me, because the second run will fail on "already exists".
3. In **Database**, then **Extensions**, check that `pg_cron` and `pg_net` are on. The script
   asks for them; if the editor refused, switch them on here and re-run only the failing part.
4. Check: **Table Editor** shows `household`, `pet`, `task`, `tick` and others. **Authentication**,
   then **Sign In / Providers**: "Allow anonymous sign-ins" must be off.
5. **Authentication**, then **URL Configuration**: Site URL `https://healthypaws.io`, and add the
   redirect URL `healthypaws://auth/callback`.
6. **Authentication**, then **Email Templates**: in the "Confirm signup" and "Magic Link"
   templates, put `{{ .Token }}` in the body so people get a 6-digit code instead of a link.
   Supabase's built-in email sender is limited to a few emails an hour. That's fine for
   testing yourself; Resend comes later (ADR 0025).
7. **Project Settings**, then **API Keys**: copy the **Project URL** and the **publishable** key
   into `apps/mobile/.env.local` as `EXPO_PUBLIC_SUPABASE_URL` and
   `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Do not use the secret key in the app.

## Part 2. PowerSync

PowerSync reads changes from your Supabase database and sends them to the phones.

1. In Supabase SQL Editor, open [`supabase/powersync_setup.sql`](../supabase/powersync_setup.sql).
   Replace `CHANGE_ME` with a long random password (a password manager can make one) and run it.
   Keep that password for the next step. Don't commit the edited file.
2. In the PowerSync dashboard, in your project, create an **instance** (Cloud). Pick the **EU**
   region (the architecture uses `eu-west-1`). The region can't be changed later. Pick the
   free plan.
3. In the instance's **Database connections**, add a connection to Supabase (there's a Supabase
   option). It needs the database host, port, database name `postgres`, user `powersync_role`
   and the password from step 1. Take the host and port from Supabase: press **Connect** at the
   top of the project and use the connection details there. If the test connection fails on
   the direct host, try the **Session pooler** details instead and tell me which worked.
   Use "Test connection" before saving.
4. In **Client auth**, switch on **Use Supabase Auth**. This lets signed-in app users connect.
5. In **Sync Streams**, paste [`powersync/sync-config.yaml`](../powersync/sync-config.yaml) and
   **Deploy**. If it complains about a line, send me the exact message. The architecture
   marked the column lists and the `invite` filter as unverified.
6. Copy the instance URL into `apps/mobile/.env.local` as `EXPO_PUBLIC_POWERSYNC_URL`.

## Part 3. Google sign-in

You need a Google account and a Google Cloud project. It's free.

1. Open <https://console.cloud.google.com>, create a project called "HealthyPaws".
2. **Google Auth Platform** (older name: OAuth consent screen). Set it up: app name HealthyPaws,
   your support email, audience **External**. You can stay in "Testing" and add yourself and
   your testers as test users while the beta is small.
3. **Clients**, then **Create client**. You make three:
   - **Web application**: name "HealthyPaws web". No redirect URIs are needed for the app, but
     Supabase shows a callback URL on its Google provider page; add that as an authorized
     redirect URI. Save the **Client ID** and **Client secret**.
   - **iOS**: bundle ID `io.healthypaws.app`. Save the Client ID. The "iOS URL scheme" is the
     same ID written backwards, starting `com.googleusercontent.apps.`.
   - **Android**: package name `io.healthypaws.app` and the **SHA-1** of the key that signs
     the app. For your own test builds, that comes from the build tool; I'll get it with you
     when we make the first Android build.
4. In Supabase, **Authentication**, **Sign In / Providers**, **Google**: switch on, put the
   **Web** client ID under Client IDs, the Web client secret under Secret, and switch on
   **Skip nonce checks** (the native Google button doesn't send one).
5. Put the Web client ID in `.env.local` as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`. Tell me the iOS
   URL scheme and I'll add it to `app.json`; the Google plugin needs it.

## Part 4. Apple sign-in

This needs the **Apple Developer Program** ($99 a year, <https://developer.apple.com/programs/>).
Enrolment can take a day or two. The two pages you found are general; you only need these steps.

1. At <https://developer.apple.com/account>, **Certificates, Identifiers & Profiles**, then
   **Identifiers**, then **+**, then **App IDs**, type **App**.
2. Description "HealthyPaws", Bundle ID **Explicit**: `io.healthypaws.app`.
3. Under Capabilities tick **Sign in with Apple** (and **Push Notifications** while you're here,
   we'll need it). Continue, Register.
4. In Supabase, **Authentication**, **Sign In / Providers**, **Apple**: switch on and put
   `io.healthypaws.app` under **Client IDs**. For the native iPhone button, nothing else is
   needed, and the secret stays empty.
5. Later, for account deletion (week-one check 2) we need a **Sign in with Apple key**: under
   **Keys**, **+**, tick Sign in with Apple, download the `.p8` file once (Apple won't show it
   again), and note the Key ID and your Team ID. Keep the file safe; it goes into a Supabase
   secret later, never into the repo.

Apple sign-in only works on a real iPhone build, not in Expo Go or most simulators' App Store
accounts. Android has no Apple button in the app.

## What I can't do from here

My session can't reach your Supabase project or the PowerSync dashboard (the Supabase connector
failed to connect and outbound access to those hosts is blocked), so the steps above are yours.
Send me any error text and I'll fix the SQL or the config in the repo.
