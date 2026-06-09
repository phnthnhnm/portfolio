---
title: "Torrent Diff Tool"
description: "A Flutter desktop app that diffs two .torrent files and integrates with qBittorrent to selectively download only the newly added files. Built for keeping up with updated comic packs without re-downloading everything."
techStack:
  - "Flutter"
  - "Dart"
  - "dtorrent_parser"
  - "qBittorrent API"
  - "SharedPreferences"
  - "HTTP/REST"
githubUrl: "https://github.com/phnthnhnm/tdt"
featured: false
order: 6
---

I download a lot of comic packs from torrent trackers. The problem is when a tracker uploads a "v2" or "updated" version of a pack with a few new files swapped in: to get the new files, you normally have to download the entire thing again. Torrent Diff Tool fixes that.

You point it at a new `.torrent` file, it finds the matching old one in a data folder, diffs the file lists, and shows exactly what was added and removed. If new files were added, it can push the torrent to qBittorrent paused, deselect everything, and select only the new files so you download just the delta.

---

## What it does

The workflow is three steps:

1. **Pick a new torrent file.** The app looks for a matching old torrent (same filename) in your configured data folder. If it finds one, you can proceed.
2. **Compare.** It parses both torrents with [dtorrent_parser](https://pub.dev/packages/dtorrent_parser), extracts the internal file lists, runs a set diff, and shows two lists: added files (green) and removed files (red), with counts.
3. **Push to qBittorrent (optional).** If files were added, the "Open in qBittorrent" button adds the torrent to a running qBittorrent instance in paused state, sets all files to "do not download" (priority 0), then selects only the added files (priority 1). You review and hit resume when ready.

### qBittorrent integration

The app talks to qBittorrent's Web API. It supports both API key auth and username/password login. After adding the torrent, it polls for the torrent hash (up to 8 seconds), fetches the file list from qBittorrent, matches files by basename (to handle path differences between the torrent and qBittorrent's view), and sets priorities accordingly.

A **blacklist** setting lets you exclude files matching certain patterns (like `.nfo`, `.txt`, or tracker-specific junk) from being selected.

### Settings

The Settings screen has four tabs:

- **Appearance**: theme mode toggle (system/light/dark)
- **Data**: configure the data folder where old torrent files live
- **qBittorrent**: host, port, HTTPS toggle, username/password or API key
- **About**: version info, report a bug link

All settings persist through `SharedPreferences`.

---

## Architecture

```
lib/
├── main.dart                         # Entry point, logging setup, theme init
├── theme_manager.dart                # ValueNotifier<ThemeMode> with SharedPreferences
├── screens/
│   ├── diff_screen.dart              # Main UI: file picker, diff, qBittorrent push
│   └── settings/                     # 4 settings tabs + settings screen shell
├── services/
│   ├── torrent_service.dart          # dtorrent_parser wrapper + set diff logic
│   ├── qbittorrent_service.dart      # Full qBittorrent Web API client
│   └── logging_client.dart           # http.Client wrapper with request/response logging
└── widgets/
    ├── file_row.dart                 # File picker row (label + path display + button)
    └── result_list.dart              # Two-column added/removed file list
```

No state management framework. The `DiffScreen` is a single `StatefulWidget` that owns all the diff state, and `ThemeManager` is a simple `ValueNotifier` with `ValueListenableBuilder`. The `QBittorrentService` is a singleton with its own `http.Client` and cookie/session state.

### qBittorrent API surface

The `QBittorrentService` wraps six qBittorrent endpoints:

| Endpoint | Method | Used for |
|---|---|---|
| `/api/v2/auth/login` | POST | Username/password login, extracts session cookie |
| `/api/v2/torrents/add` | POST (multipart) | Adds the torrent file as paused |
| `/api/v2/torrents/info` | GET | Polls for the torrent hash after adding |
| `/api/v2/torrents/files` | GET | Gets the file list with indices for priority targeting |
| `/api/v2/torrents/filePrio` | POST | Sets priority 0 (skip) or 1 (download) per file |
| `/api/v2/torrents/stop` | POST | Ensures the torrent stays paused after adding |

Each method takes `(host, port, useHttps, ...)` explicitly rather than reading from a config object. This keeps the service decoupled from `SharedPreferences` and makes it testable with any connection params.

### File matching across paths

Torrent files store internal paths like `Comic Pack Vol 3/Chapter 01.cbz`. When qBittorrent lists files, paths might differ slightly (different root folder name, case differences). The app matches by basename (`Chapter 01.cbz`) plus a suffix fallback so it doesn't miss files over path discrepancies.

---

## Design decisions

| Decision | Why |
|---|---|
| **No state management framework** | The app has one screen with one piece of state. Provider would be overkill here |
| **Explicit host/port/useHttps on every method** | Service methods are pure functions of their inputs. No hidden mutable state except the session cookie |
| **Polling for torrent hash (not WebSocket)** | qBittorrent's Web API doesn't return the hash on add. Polling for 8 seconds with 1s intervals is dumb but reliable |
| **Force-pause after add** | Some qBittorrent versions ignore the `paused` flag on `torrents/add`. Explicitly calling `stop` after adding covers this edge case |
| **Basename matching for files** | Internal torrent paths vary between uploads. Matching by filename (ignoring directory structure) means the diff works even when the packager rearranged folders |
| **Blacklist, not whitelist** | It's easier to exclude known junk patterns (`.nfo`, `.txt`, `cover.jpg`) than to predict what valid files will be named. The blacklist is a simple substring match on the lowered filename |

---

## Running it

```bash
flutter pub get
flutter run -d windows
```

You need a running qBittorrent instance with the Web UI enabled (Tools > Options > Web UI) to use the integration. The diff feature works standalone without qBittorrent.
