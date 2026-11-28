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
| **iOS app icon, iOS 26+ (Icon Composer, layered)**: used by `ios.icon` in `apps/mobile/app.json` | `ios/AppIcon.icon` (built by `scripts/make_ios_app_icon.py`) |
| Flat app icon (Expo root `icon`, 1024, opaque RGB, square: iOS rounds it) | `png/ios/icon-1024.png` · `svg/icon-ios.svg` |
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
| Flat dark icon, kept for reference and other uses (orange paw on transparent) | `png/ios/icon-dark-1024.png` · `svg/icon-ios-dark.svg` |
| Flat tinted icon, kept for reference (grayscale on transparent) | `png/ios/icon-tinted-1024.png` · `svg/icon-ios-tinted.svg` |
| Dark icon for docs, site and slides (navy ground, orange paw) | `svg/icon-rounded-dark.svg`, `svg/icon-dark.svg`, `png/brand/icon-rounded-dark-1024.png` |
| Dark web icons (for `prefers-color-scheme: dark`) | `png/web/favicon-dark-32.png`, `apple-touch-icon-dark-180.png`, `icon-dark-512.png` |
| Lockup on dark: navy icon + white wordmark | `svg/lockup-dark-icon.svg`, `png/brand/lockup-dark-icon@2x.png` (or `lockup-white` to keep the orange icon) |
| Mark only, no background | `svg/mark-orange.svg`, `svg/mark-navy.svg` |

## iOS app icon and its appearances

iOS 26 shows every app icon in six appearances: **default, dark, clear light, clear dark, tinted light and tinted dark**, all rendered with Liquid Glass. Apple's [app icon guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons#Appearances) recommend a layered Icon Composer file, so the system can apply the glass to each shape instead of guessing layers from a flat PNG.

`ios/AppIcon.icon` is that file. It holds:

| Part | Default | Dark | Clear and tinted |
|---|---|---|---|
| Background fill | orange `#FF8A4C` | navy `#1E1B3A` | made by iOS |
| Toes layer (glass) | white | orange | made by iOS |
| Pad layer (glass), tick cut out | white | orange | made by iOS |

The tick is a hole in the pad, so whatever is behind the paw shows through it in every appearance, as it does in the flat logo. The layers are vector SVGs, 1024 × 1024, square and unmasked; there are no baked-in shadows or highlights (the group uses Icon Composer's neutral shadow and translucency). `ios/appearances-preview.png` is an approximate preview of all six; Icon Composer shows the real rendering.

To change it, edit `scripts/make_ios_app_icon.py` and run `python3 assets/brand/scripts/make_ios_app_icon.py` (needs `pip install shapely`), or open `AppIcon.icon` in Icon Composer (comes with Xcode 26) and save. Building needs **Xcode 26 or later**; Xcode also makes the flat icons for older iOS versions from the same file.

## Expo `app.json`

```json
{
  "expo": {
    "icon": "../../assets/brand/png/ios/icon-1024.png",
    "ios": {
      "icon": "../../assets/brand/ios/AppIcon.icon"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "../../assets/brand/png/android/adaptive-foreground-1024.png",
        "monochromeImage": "../../assets/brand/png/android/adaptive-monochrome-1024.png",
        "backgroundColor": "#FF8A4C"
      }
    },
    "web": { "favicon": "../../assets/brand/png/web/favicon-48.png" }
  }
}
```

`ios.icon` must be a string path to the `.icon` folder (Expo copies it into the Xcode project on prebuild and sets it as the app icon). The root `icon` stays a PNG for other platforms and tools.

Android has no dark app icon. Android 13+ themed icons use `adaptive-monochrome`. The web favicon can switch with `<link rel="icon" media="(prefers-color-scheme: dark)" href="…/favicon-dark-32.png">`.

The name is pending a trademark check.
