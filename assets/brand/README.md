# HealthyPaw logo · "Tick paw"

A paw with the daily tick in its pad. It points at the app's core loop: tick off care and keep the streak.
It is drawn in the app palette and keeps away from green and paw-in-heart marks so it stays distinct from the US pet insurer "Healthy Paws".

| Token | Hex |
|---|---|
| Orange (icon ground, "Paws") | `#FF8A4C` |
| Navy ("Healthy", mono mark) | `#1E1B3A` |
| White (paw) | `#FFFFFF` |

The wordmark is Fredoka SemiBold (600), converted to outlines, so no font is needed to show it.

## Files

`svg/` holds the sources and `png/` the exports.

| Use | File |
|---|---|
| iOS app icon (Expo `icon`, 1024, opaque, square: iOS rounds it) | `png/ios/icon-1024.png` · `svg/icon-ios.svg` |
| Android adaptive icon foreground (paw in the 66% safe zone) | `png/android/adaptive-foreground-1024.png` · `svg/android-foreground.svg` |
| Android adaptive icon background | `#FF8A4C` or `png/android/adaptive-background-1024.png` |
| Android 13+ themed (monochrome) icon | `png/android/adaptive-monochrome-1024.png` |
| Google Play listing icon | `png/android/play-store-512.png` |
| Web favicon | `png/web/favicon.ico` (16/32/48), `favicon-16/32/48.png` |
| Apple touch icon | `png/web/apple-touch-icon-180.png` |
| PWA / manifest | `png/web/icon-192.png`, `icon-512.png`, `maskable-512.png` |
| Rounded icon for docs, site, slides | `svg/icon-rounded.svg`, `png/brand/icon-rounded-1024.png` |
| Wordmark (light / dark backgrounds) | `svg/wordmark.svg`, `svg/wordmark-white.svg` (+ `@2x` PNGs) |
| Icon + wordmark lockup | `svg/lockup.svg`, `svg/lockup-white.svg` (+ `@2x` PNGs) |
| iOS 18 dark-mode icon (orange paw on transparent, iOS adds the dark backdrop) | `png/ios/icon-dark-1024.png` · `svg/icon-ios-dark.svg` |
| iOS 18 tinted icon (grayscale on transparent) | `png/ios/icon-tinted-1024.png` · `svg/icon-ios-tinted.svg` |
| Dark icon for docs, site and slides (navy ground, orange paw) | `svg/icon-rounded-dark.svg`, `svg/icon-dark.svg`, `png/brand/icon-rounded-dark-1024.png` |
| Dark web icons (for `prefers-color-scheme: dark`) | `png/web/favicon-dark-32.png`, `apple-touch-icon-dark-180.png`, `icon-dark-512.png` |
| Lockup on dark: navy icon + white wordmark | `svg/lockup-dark-icon.svg`, `png/brand/lockup-dark-icon@2x.png` (or `lockup-white` to keep the orange icon) |
| Mark only, no background | `svg/mark-orange.svg`, `svg/mark-navy.svg` |

## Expo `app.json`

```json
{
  "expo": {
    "icon": "./assets/brand/png/ios/icon-1024.png",
    "ios": {
      "icon": {
        "light": "./assets/brand/png/ios/icon-1024.png",
        "dark": "./assets/brand/png/ios/icon-dark-1024.png",
        "tinted": "./assets/brand/png/ios/icon-tinted-1024.png"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/brand/png/android/adaptive-foreground-1024.png",
        "monochromeImage": "./assets/brand/png/android/adaptive-monochrome-1024.png",
        "backgroundColor": "#FF8A4C"
      }
    },
    "web": { "favicon": "./assets/brand/png/web/favicon-48.png" }
  }
}
```

Android has no dark app icon. Android 13+ themed icons use `adaptive-monochrome`. The web favicon can switch with `<link rel="icon" media="(prefers-color-scheme: dark)" href="…/favicon-dark-32.png">`.

The name is pending a trademark check.
