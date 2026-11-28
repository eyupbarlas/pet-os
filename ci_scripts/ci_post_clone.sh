#!/bin/sh
# Xcode Cloud: runs after the repo is cloned and before the build. apps/mobile/ios is generated
# (not committed), so build it here. The workflow must point at
# apps/mobile/ios/HealthyPaw.xcworkspace and the HealthyPaw scheme.
# Public app settings (EXPO_PUBLIC_*) come from the workflow's environment variables; see
# docs/xcode-cloud.md.
set -eu

cd "$CI_PRIMARY_REPOSITORY_PATH"

# The Xcode Cloud image has Homebrew but not Node, pnpm or CocoaPods.
brew install node@22 cocoapods
export PATH="$(brew --prefix node@22)/bin:$PATH"
npm install --global pnpm@10.28.0

pnpm install --frozen-lockfile

export LANG=en_US.UTF-8
cd apps/mobile
for v in EXPO_PUBLIC_SUPABASE_URL EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY EXPO_PUBLIC_POWERSYNC_URL \
         EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID; do
  eval "val=\${$v:-}"
  if [ -z "$val" ]; then echo "Missing workflow environment variable: $v" >&2; exit 1; fi
done
npx expo prebuild -p ios --clean
