---
title: 'EVC GUI'
description: 'A cross-platform Flutter desktop app that wraps the Echo Value Calculator for Wuthering Waves. Native UI with dark/light themes, build comparison, and persistent echo preset management.'
techStack:
  - 'Flutter'
  - 'Dart'
  - 'Provider'
  - 'Material Design 3'
  - 'REST API'
  - 'SharedPreferences'
githubUrl: 'https://github.com/phnthnhnm/evc'
featured: false
order: 4
---

EVC GUI is a Flutter desktop app I built because I used the [Echo Value Calculator](https://www.echovaluecalc.com) website for Wuthering Waves a lot but wanted saveable echo presets and a smoother native UI. This was also my excuse to learn Flutter. The code isn't perfect, but the app works well and I ship Windows binaries on every release.

I respect the original calculator's backend (it does the heavy lifting), so the app just wraps its API with a better client experience: offline-able stat entry, persistent presets, side-by-side build comparison, and a full resonator browser with search.

---

## What it does

The app has four main screens:

**Resonator Browser**: a scrollable grid of all resonators with portraits, icons, rarity indicators, and a search bar. Tap a resonator to start building echoes for them.

**Echo Build Screen**: the core of the app. Five echo slots, each with dropdowns for 13 stat types (crit rate, crit damage, ATK%, flat ATK, HP%, etc.). A total Energy Regen field and optional team input. Hit "Calculate" and the app posts to the Echo Value Calculator API, parses the response, and shows overall score, overall tier (S, A, B, etc.), and per-echo breakdowns with colored tier chips.

**Compare Screen**: side-by-side comparison of two saved builds. Shows resonator portraits, stats, scores, and per-echo tier differences at a glance. Good for evaluating gear swaps without recalculating everything.

**Settings**: three tabs: Appearance (theme mode toggle with system/default/light/dark), Data (import/export presets as JSON), and About (credits and links).

### Saving and loading presets

The main feature I wanted: you can save a completed build as a named preset and reload it later. Presets persist across app restarts via `SharedPreferences`. You can also export them as JSON files and import them back, handy for sharing builds with other players.

---

## Architecture

The project follows a loose feature-based structure:

```
lib/
├── main.dart                  # App entry, Provider setup, image precaching
├── models/                    # Echo, Resonator data classes
├── data/                      # Seed data (stats list, resonator catalog)
├── screens/                   # 4 main screens + settings (3 tabs)
├── services/
│   ├── api_service.dart       # HTTP client for echovaluecalc.com
│   └── storage_service.dart   # SharedPreferences wrapper for presets
├── widgets/                   # Reusable components (echo cards, stat dropdowns, resonator cards, search bar)
└── utils/                     # Providers (theme, echo sets), color utilities, toast helpers
```

State management uses `Provider` with two `ChangeNotifier` providers: one for theme mode, one for the current echo set. Simple but sufficient for the app's scope.

### API integration

The `ApiService` posts a JSON payload to `echovaluecalc.com/calcFull` with the resonator name, a 5×13 stat matrix (SSR), optional team, and total Energy Regen. The response is parsed as JSON (preferred) or falls back to HTML scraping via Dart's `html` package if the server returns a webpage instead. Each echo gets a score and tier extracted from the response, and the overall build gets a composite score and tier.

The stat mapping between the app's internal enum and the API's string keys is centralized in a lookup table so there's no duplication between the UI and the HTTP layer.

---

## Design decisions

| Decision                          | Why                                                                                                                                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provider over Riverpod/Bloc**   | For two pieces of global state (theme + echo set), Provider is simpler and adds less boilerplate                                                                                             |
| **HTML fallback parsing**         | The Echo Value Calculator API occasionally returns HTML instead of JSON. Parsing the `<h2>` tags in `div.sub_anal_f` catches this edge case instead of showing an error                      |
| **Image precaching**              | All resonator portraits and stat icons are precached on startup via `Future.wait` so scrolling through the resonator grid is smooth with no placeholder flicker                              |
| **SharedPreferences over SQLite** | Echo presets are small JSON blobs. No need for a full database. SharedPreferences keeps dependencies minimal                                                                                 |
| **Material Design 3**             | Native look on both Windows and Android, dark mode support out of the box, and `ColorScheme.fromSeed` auto-generates a cohesive palette from one color                                       |
| **Scoop + GitHub Releases**       | Windows users can install via `scoop install evc` or download a prebuilt binary. I wrote a PowerShell script (`gh-release.ps1`) that automates GitHub Releases with the Flutter build output |

---

## Running it

```bash
# Install dependencies
flutter pub get

# Run on Windows
flutter run -d windows

# Build a Windows release binary
flutter build windows
```

Prebuilt Windows binaries are available on the [GitHub Releases page](https://github.com/phnthnhnm/evc/releases/latest). Or install via Scoop:

```powershell
scoop bucket add <bucketname> https://github.com/phnthnhnm/Scoop
scoop install <bucketname>/evc
```
