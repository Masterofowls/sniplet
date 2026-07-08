# Activity Log

## 2026-07-08

- Scaffolded Tauri v2 + React TypeScript project with Android init
- Implemented Rust snippet CRUD, clipboard, GitHub OAuth device flow + Gist sync
- Built React UI: adaptive cards, syntax highlighting, quick import/copy, GitHub sync panel
- Added Biome lint/format, Vitest unit tests, APK build scripts and Gradle tuning
- Verified lint, typecheck, tests (7 passing), frontend build
- Built unsigned APK: `src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk`
- Added `scripts/android-build.ps1` for rustup+NDK PATH fix on Windows
