# Sniplet app templates

Reusable starters extracted from Sniplet for building new Tauri v2 + React mobile apps with **minimal Rust**.

## Available templates

| Template | Path | Description |
|----------|------|-------------|
| **Tauri React Mobile** | [`tauri-react-mobile/`](tauri-react-mobile/) | Blank MUI app shell, storage/HTTP/clipboard helpers, Android APK build scripts |

## Create a new app

From the repository root:

```powershell
# Windows
.\scripts\create-app.ps1 -Name "My Notes" -AppId "com.example.notes" -Output "..\my-notes"
```

```bash
# Linux/macOS
bash scripts/create-app.sh "My Notes" com.example.notes ../my-notes
```

Then:

```bash
cd ../my-notes
npm install
npm run android:init
npm run android:patch
npm run verify
npm run android:build
```

See [`tauri-react-mobile/README.md`](tauri-react-mobile/README.md) for full build and release instructions.

## What you get

- **React 19 + TypeScript + Vite + MUI + Framer Motion**
- **Rust**: plugins only (~10 lines) — no business logic in Rust
- **Reusable UI**: `AppShell`, `EmptyState`, `FormDialog`, `ConfirmDialog`, toast hook
- **Reusable libs**: `storage`, `http`, `clipboard`, `platform`
- **Android**: signing overlay, jni symlink fix, `android-build` / `release` scripts

## Customize

1. Rename app in `src-tauri/tauri.conf.json` (`productName`, `identifier`, `version`)
2. Edit `src/pages/HomePage.tsx` and add routes/pages
3. Extend `src/store/appStore.ts` with your domain state
4. Add HTTP allowlist URLs in `src-tauri/capabilities/default.json`
5. Replace icons under `src-tauri/icons/`
