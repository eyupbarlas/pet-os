# Xcode Cloud: build and upload to TestFlight on every push to main

The repo has `ci_scripts/ci_post_clone.sh`. It installs Node, pnpm and CocoaPods, then runs
`expo prebuild` to create `apps/mobile/ios` (which is not committed). The steps below are the
workflow you create once in Xcode. Verified only on paper: the first run will show anything
missing.

## One-time setup
1. Open `apps/mobile/ios/HealthyPaw.xcworkspace` in Xcode (run `expo prebuild -p ios` locally
   first if you don't have it). Xcode 26 or newer, because the app icon is an Icon Composer file.
2. Report navigator (⌘9) → Cloud tab → **Get Started** (or Product → Xcode Cloud → Create Workflow).
3. Pick the product **HealthyPaw**. Xcode asks you to grant App Store Connect access to the
   GitHub repo `eyupbarlas/pet-os`; accept.
4. In the workflow editor:
   - **Environment**: Xcode version **Latest Release** (must be 26+), macOS Latest Release.
   - **Start Conditions**: Branch Changes, branch `main`. Leave "auto-cancel builds" on.
   - **Actions**: **Archive – iOS**, scheme `HealthyPaw`, distribution **App Store Connect**.
   - **Post-Actions**: **TestFlight Internal Testing**, pick your internal group.
5. **Environment Variables** (same editor, mark none as secret; they are public app settings
   that end up inside the app):
   `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_POWERSYNC_URL`,
   `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`. Copy the values from
   `apps/mobile/.env.local`. The script stops with a clear message if one is missing.
6. Save and start a build from the Cloud tab to test it.

## Notes
- Xcode Cloud sets the build number itself, so you no longer bump it by hand. The first Cloud
  build number is higher than any manual upload only if you set **Next Build Number** in App
  Store Connect (Xcode Cloud → Settings) above the last uploaded one (1 today). Set it to 100.
- Signing is automatic and managed by Xcode Cloud (cloud-managed certificates).
- Free allowance is 25 compute hours a month on the Apple Developer Program. A build here
  should take roughly 15 to 25 minutes.
- If the log says `ci_post_clone.sh` was not found, the script must sit in a `ci_scripts` folder
  next to the project Xcode Cloud opens or at the repo root; tell us what the log says.
- Every push to `main` makes a TestFlight build, including doc-only merges. Narrow the start
  condition with **Files and Folders** (`apps/mobile`, `packages`, `assets`) if that gets noisy.
