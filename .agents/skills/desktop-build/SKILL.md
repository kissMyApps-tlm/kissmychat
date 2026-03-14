---
name: desktop-build
description: "Build KissMyChat desktop app (Electron). Covers build setup, self-hosted server config, branding, onboarding bypass, and platform packaging. Use when user mentions 'desktop', 'electron', 'desktop build', 'desktop app', or 'package mac/win/linux'."
user_invocable: true
---

# KissMyChat Desktop Build

The desktop app lives in `apps/desktop/` — a separate pnpm workspace with its own `pnpm-workspace.yaml` and `.npmrc`.

## Architecture

- **Electron** main process: `apps/desktop/src/main/`
- **Preload** scripts: `apps/desktop/src/preload/`
- **Build assets** (icons, entitlements): `apps/desktop/build/`
- **Packaging config**: `apps/desktop/electron-builder.mjs`
- **Dev/build config**: `apps/desktop/electron.vite.config.ts`

The desktop app is a thin Electron shell that loads the SPA from a remote server (`OFFICIAL_CLOUD_SERVER`) via a transparent proxy (`lobe-backend://` protocol). It does NOT bundle the Next.js backend.

## Self-Hosted Server Connection

The key env var is `OFFICIAL_CLOUD_SERVER` (default: `https://app.lobehub.com`).

For KissMyChat:
```bash
export OFFICIAL_CLOUD_SERVER=https://chat.kissmyapps.site
```

This is read at build time in `apps/desktop/src/main/env.ts` and used by `BackendProxyProtocolManager` to rewrite `lobe-backend://api/...` requests to the actual server URL.

Auth flow uses Auth0 OIDC configured on the Vercel deployment (same `AUTH_AUTH0_*` env vars).

## KissMyApps Fork Customizations

### Onboarding Bypass

Two changes skip the desktop onboarding wizard (data sharing + login screens):

1. **`apps/desktop/src/main/core/browser/BrowserManager.ts`**
   - Hardcoded `isOnboardingCompleted = true` instead of checking `RemoteServerConfigCtr.isRemoteServerConfigured()`
   - Removed unused `RemoteServerConfigCtr` import
   - Effect: app always loads `/` on startup, never `/desktop-onboarding`

2. **`src/routes/(main)/_layout/DesktopAutoOidcOnFirstOpen.tsx`**
   - Removed `getDesktopOnboardingCompleted()` guard
   - Effect: auto-triggers OIDC login on first launch without requiring onboarding completion

**Flow on first launch**: App opens → loads `/` → `DesktopAutoOidcOnFirstOpen` fires → opens Auth0 in browser → user authenticates → tokens stored → connected to `chat.kissmyapps.site`

### Store Defaults

`apps/desktop/src/main/const/store.ts` — default `dataSyncConfig`:
```typescript
dataSyncConfig: { storageMode: 'cloud' }  // active defaults to false/undefined
```
Keep `active` as false/undefined so `DesktopAutoOidcOnFirstOpen` triggers the OIDC flow (it skips when `active === true`).

## Build Commands

### Prerequisites

```bash
# Install desktop workspace deps (SEPARATE from root pnpm install)
cd apps/desktop
CXX=g++ pnpm install   # CXX override needed — .zshrc sets CXX=g++-14 which isn't installed
```

**Why `CXX=g++`**: The `.zshrc` exports `CXX=g++-14` for other projects, but `g++-14` isn't installed. The `node-mac-permissions` native module needs a working C++ compiler. Override with system `g++` (Apple Clang).

### China Mirror Issue

`apps/desktop/.npmrc` has China npm mirrors for electron binaries:
```
electron_mirror=https://npmmirror.com/mirrors/electron/
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/
```

The `dmg-builder` binary (`dmgbuild-bundle-arm64-75c8a6c.tar.gz`) is missing from the China mirror. **To fix**: comment out both mirror lines before building, restore after.

```bash
# Before build:
sed -i '' 's/^electron_mirror/#electron_mirror/' apps/desktop/.npmrc
sed -i '' 's/^electron_builder_binaries_mirror/#electron_builder_binaries_mirror/' apps/desktop/.npmrc

# After build:
sed -i '' 's/^#electron_mirror/electron_mirror/' apps/desktop/.npmrc
sed -i '' 's/^#electron_builder_binaries_mirror/electron_builder_binaries_mirror/' apps/desktop/.npmrc
```

### Build for macOS (unsigned, local dev)

```bash
cd apps/desktop
CXX=g++ OFFICIAL_CLOUD_SERVER=https://chat.kissmyapps.site npm run package:mac:local
```

This runs `build:main` (electron-vite build) then `electron-builder --mac` with:
- `--c.mac.notarize=false` — skip notarization
- `-c.mac.identity=null` — skip code signing
- `UPDATE_CHANNEL=nightly` — uses nightly icon

Output: `apps/desktop/release/`
- `lobehub-desktop-dev-0.0.0-arm64.dmg` (~128 MB)
- `lobehub-desktop-dev-0.0.0-arm64-mac.zip` (~134 MB)
- `mac-arm64/lobehub-desktop-dev.app`

Since the app is unsigned, users must right-click → Open on first launch (macOS Gatekeeper bypass).

### Build for other platforms

```bash
# Windows (NSIS installer + portable)
CXX=g++ OFFICIAL_CLOUD_SERVER=https://chat.kissmyapps.site npm run package:win

# Linux (AppImage, snap, deb, rpm, tar.gz)
CXX=g++ OFFICIAL_CLOUD_SERVER=https://chat.kissmyapps.site npm run package:linux
```

### Quick rebuild (reuse existing dist)

```bash
# Skip electron-vite build, only re-package
npm run package:local:reuse
```

## Branding Customization (TODO)

Currently the app uses LobeHub branding. To rebrand for KissMyChat:

| What | Where | Current | Change to |
|------|-------|---------|-----------|
| App ID | `electron-builder.mjs` line ~191 | `com.lobehub.lobehub-desktop` | `com.kissmyapps.kissmychat` |
| Executable name | `electron-builder.mjs` line ~302 | `LobeHub` | `KissMyChat` |
| Display name | `apps/desktop/src/main/locales/default/common.ts` | `'app.name': 'LobeHub'` | `'app.name': 'KissMyChat'` |
| Icons | `apps/desktop/build/icon.*` | LobeHub icons | KissMyChat icons |
| package.json name | `apps/desktop/package.json` | `lobehub-desktop-dev` | `kissmychat-desktop` |

## Desktop-Only Features (vs Web)

**Killer features** (not possible in web):
- Local stdio-based MCP servers (Python, Node.js tools)
- Local file system access (read, write, browse, search, grep)
- Shell command execution with process management
- Tool detection (auto-discovers git, python, node on the machine)

**Nice-to-have**:
- Network proxy (HTTP/HTTPS/SOCKS5)
- Auto-updates via update channels
- Native OS notifications
- System tray (Windows)
- Multi-window editing
- Custom keyboard shortcuts

## Key Files Reference

| File | Purpose |
|------|---------|
| `apps/desktop/package.json` | Scripts, deps (isolated workspace) |
| `apps/desktop/pnpm-workspace.yaml` | Desktop workspace packages |
| `apps/desktop/.npmrc` | Electron mirrors, hoisting config |
| `apps/desktop/electron-builder.mjs` | Packaging config (targets, signing, icons) |
| `apps/desktop/electron.vite.config.ts` | Vite build config for main/preload |
| `apps/desktop/src/main/env.ts` | Runtime env vars (OFFICIAL_CLOUD_SERVER, etc.) |
| `apps/desktop/src/main/const/store.ts` | Store defaults (dataSyncConfig) |
| `apps/desktop/src/main/core/browser/BrowserManager.ts` | Window initialization, onboarding routing |
| `apps/desktop/src/main/controllers/RemoteServerConfigCtr.ts` | Server config, auth, token management |
| `apps/desktop/src/main/core/infrastructure/BackendProxyProtocolManager.ts` | API proxy (lobe-backend:// → server) |
| `src/routes/(main)/_layout/DesktopAutoOidcOnFirstOpen.tsx` | Auto-OIDC on first launch (SPA side) |

## Environment Variables

| Variable | Purpose | Build/Runtime |
|----------|---------|---------------|
| `OFFICIAL_CLOUD_SERVER` | Backend server URL | Build time |
| `UPDATE_CHANNEL` | Release channel (stable/nightly/canary) | Build time |
| `UPDATE_SERVER_URL` | Custom update server | Build time |
| `CXX` | C++ compiler override (use `g++`) | Build time |
| `CSC_LINK` | macOS code signing certificate (base64) | Build time |
| `CSC_KEY_PASSWORD` | Certificate password | Build time |
| `VERCEL_JWT` | Vercel deployment protection bypass | Runtime |
