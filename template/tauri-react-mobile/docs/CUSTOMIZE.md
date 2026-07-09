# Customize your app

## 1. Identity

| Field | File | Example |
|-------|------|---------|
| Display name | `src-tauri/tauri.conf.json` → `productName` | `"My Notes"` |
| Bundle ID | `identifier` | `"com.example.notes"` |
| npm name | `package.json` → `name` | `"my-notes"` |
| Window title | `app.windows[0].title` | `"My Notes"` |

If you regenerate Android (`tauri android init`), run `npm run android:patch` again.

## 2. Icons

Place PNG/ICO/ICNS files in `src-tauri/icons/` or generate from one image:

```bash
npm run tauri icon ./assets/logo.png
```

## 3. Add a new page

1. Create `src/pages/SettingsPage.tsx`
2. Wire it in `src/App.tsx` (or add a router like `react-router-dom`)
3. Use `AppShell`, `PageHeader`, `EmptyState` from `src/components/`

## 4. Add persistent data

Extend `src/store/appStore.ts` or create a new store module:

```typescript
import { loadJson, saveJson } from "../lib/storage";

const FILE = "items.json";
await loadJson(FILE, "list", []);
await saveJson(FILE, "list", items);
```

## 5. Call external APIs

```typescript
import { httpFetch } from "../lib/http";

const res = await httpFetch("https://api.example.com/data");
```

Add allowed hosts in `src-tauri/capabilities/default.json`:

```json
{
  "identifier": "http:default",
  "allow": [{ "url": "https://api.example.com/**" }]
}
```

## 6. Clipboard

```typescript
import { readClipboard, writeClipboard } from "../lib/clipboard";
```

## 7. Reusable components

| Component | Use for |
|-----------|---------|
| `AppShell` | Top app bar + container |
| `PageHeader` | Title + subtitle + action slot |
| `EmptyState` | Blank lists / onboarding |
| `LoadingState` | Async data loading |
| `FormDialog` | Modal forms |
| `ConfirmDialog` | Delete / destructive actions |
| `useToast` | Snackbar messages |
| `useResponsiveLayout` | Grid columns by breakpoint |

## 8. Rust changes (rare)

Only when adding plugins:

1. `cargo add tauri-plugin-...` in `src-tauri/`
2. `.plugin(...)` in `src-tauri/src/lib.rs`
3. Permissions in `src-tauri/capabilities/default.json`
4. npm package `@tauri-apps/plugin-...` if JS API needed

## 9. Remove starter demo

Delete or replace:

- `src/pages/HomePage.tsx` example notes field
- `src/store/appStore.ts` → `notes` field
- Starter copy in `App.tsx`

Keep `lib/`, `components/`, `hooks/`, `theme/` as your foundation.
