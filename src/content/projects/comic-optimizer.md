---
title: 'Comic Optimizer'
description: 'A Flutter desktop app for batch-optimizing comic book archives (CBZ/CBR/ZIP) by compressing images to JPEG XL using the cjxl encoder, with pause/resume, safe-run mode, and post-run system actions.'
techStack:
  - 'Flutter'
  - 'Dart'
  - 'Provider'
  - 'cjxl (JPEG XL)'
  - 'dwebp'
  - 'ImageMagick'
  - 'SharedPreferences'
githubUrl: 'https://github.com/phnthnhnm/comic_optimizer'
featured: false
order: 5
---

Comic Optimizer is a Flutter desktop app I built because I had a lot of CBZ files that were way bigger than they needed to be. JPEG XL (`.jxl`) compresses images way better than PNG or JPEG inside archives, but the `cjxl` command line tool is annoying to use across dozens of folders. So I wrapped it in a GUI.

The app scans a root folder for comic directories, runs `cjxl` on every image inside them, cleans up the originals, and repacks everything into a CBZ (or CBR or ZIP). It handles the edge cases I ran into: WEBP files that `cjxl` can't read directly, images that get bigger after encoding (it reverts those), and `cjxl` exit code 1 failures that can be fixed by re-saving through ImageMagick.

---

## What it does

Pick a root folder, pick a preset, hit Start. The app walks every subdirectory looking for image files. For each folder it finds:

1. Strips out non-image files (metadata, thumbnails, `comicinfo.xml` etc.)
2. Renames images to sequential numbering (`001.png`, `002.jpg`, ...)
3. Encodes every image to `.jxl` using `cjxl` with the selected preset args
4. Removes the original non-jxl files (assuming a `.jxl` version was created)
5. Packs the folder into a CBZ/CBR/ZIP archive in the parent directory
6. Deletes the source folder (to Recycle Bin by default, or permanently)

**Safe-run mode** copies the root to a temp location first and works on the copy. The originals are never touched. Good for testing new presets without risking your files.

**Pause/resume** lets you stop mid batch and pick up later. The cancel button stops gracefully between files rather than killing `cjxl` mid encode.

**Post-run actions** are for long overnight batches: the app can quit, shut down the PC, restart, hibernate, or sleep when it's done. An optional countdown dialog lets you abort before the action fires.

### Presets

Three built-in presets control the `cjxl` quality/size tradeoff:

| Preset            | Args                             | Use case                                            |
| ----------------- | -------------------------------- | --------------------------------------------------- |
| Lossless          | `--distance=0 --lossless_jpeg=1` | Archive preservation, zero quality loss             |
| Visually Lossless | `--distance=1.0`                 | Nearly identical quality, noticeable size reduction |
| Lossy             | `--distance=3.0`                 | Aggressive compression, smallest files              |

---

## Architecture

```
lib/
├── main.dart                   # Entry point, Provider setup, theme wiring
├── core/
│   ├── optimizer.dart          # Main orchestrator: walk, clean, encode, archive
│   ├── encoder.dart            # cjxl invocation with WEBP + ImageMagick fallback
│   ├── archive.dart            # ZIP store (no compression) via dart:archive
│   ├── io.dart                 # File I/O: recycle, safe copy, cleanup helpers
│   └── utils.dart              # Logging, path masking, natural sort
├── presets.dart                # Preset definitions with cjxl argument lists
├── screens/
│   ├── home_screen.dart        # Control panel + per-folder log tabs
│   └── settings/               # Settings screen (appearance, data, about tabs)
├── settings/
│   ├── settings_model.dart     # ChangeNotifier with all persisted settings
│   └── settings_repository.dart# SharedPreferences read/write layer
└── widgets/
    ├── controls.dart           # ControlPanel (root picker, preset dropdown, buttons)
    └── layouts.dart            # LogsPanel with per-folder tabbed log viewer
```

The `Optimizer` class is the orchestrator. It takes callbacks for logging, folder start, and folder done events. The UI pushes these into a `Map<String, List<String>>` keyed by folder path so the log viewer shows per-folder tabs. The `Encoder` class handles the `cjxl` process spawning with three layers of error recovery.

### Error recovery during encoding

The encoder has a fallback chain for each image:

1. **Normal path**: run `cjxl input.png output.jxl <preset args>`. If exit code is 0 and the `.jxl` is smaller than the original, keep it.
2. **WEBP path**: if the input is `.webp`, convert to PNG via `dwebp` first (because `cjxl` can't read webp directly), then encode the PNG.
3. **ImageMagick fallback**: if `cjxl` exits with code 1 (corrupt or weirdly encoded PNG), re-save the image through `magick convert -strip` to normalize it, then retry `cjxl`.
4. **Revert on size increase**: after encoding, if the `.jxl` file is larger than the original, delete the `.jxl` and keep the original. No point trading bytes for worse compression.

---

## Design decisions

| Decision                                  | Why                                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Safe-run copies before touching files** | First rule of a tool that deletes things: never delete originals unless the user explicitly opts in                                         |
| **WEBP to PNG conversion**                | `cjxl` doesn't support WEBP input. `dwebp` handles this cleanly with no quality loss since it's a lossless conversion to PNG                |
| **ImageMagick resave on cjxl exit 1**     | Some PNGs have metadata or color profiles that `cjxl` chokes on. `magick -strip` normalizes them without visible quality change             |
| **Revert larger jxl files**               | Compression isn't guaranteed. If the output is bigger, the original was already well compressed and we should keep it                       |
| **ZIP store (level 0)**                   | CBZ files are already compressed images inside. Re-compressing the ZIP would waste CPU for zero size savings                                |
| **Recycle Bin by default**                | Permanent delete is scary. The option exists for SSDs with limited space, but the default puts files in the bin so you can recover mistakes |
| **Post-run system actions**               | Batch processing 50+ folders takes hours. Being able to walk away and have the PC shut down when it's done is the whole point               |

---

## Running it

```bash
# Prerequisites: install cjxl and make it available on PATH
# https://github.com/libjxl/libjxl/releases

# Install dependencies
flutter pub get

# Run on Windows
flutter run -d windows

# Build a Windows release binary
flutter build windows --release
```

Prebuilt Windows binaries are on the [GitHub Releases page](https://github.com/phnthnhnm/comic_optimizer/releases). Settings live in `%APPDATA%/com.phanthanhnam/comic_optimizer/shared_preferences.json`.
