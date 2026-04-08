

# Fix GitHub Pages Deployment

## Problem
Your app fails on GitHub Pages because of two issues:

1. **Base path mismatch** — GitHub Pages serves your app at `/docu-q-a-assistant/`, but Vite builds with base `/`. All JS, CSS, and asset URLs point to the root and return 404.

2. **SPA routing** — GitHub Pages serves static files only. Navigating to `/settings` or refreshing any page returns a 404 because there's no server-side fallback.

The Node.js 20 warning is harmless and can be ignored until June 2026.

## Changes

### 1. `vite.config.ts` — Set base path
Add `base: "/docu-q-a-assistant/"` so all built asset URLs are prefixed correctly for GitHub Pages.

### 2. `src/App.tsx` — Set router basename
Change `<BrowserRouter>` to `<BrowserRouter basename="/docu-q-a-assistant">` so React Router matches routes correctly under the subdirectory.

### 3. `public/404.html` — SPA redirect hack
Create a `404.html` that GitHub Pages serves for unknown routes. It redirects to `index.html` with the path encoded as a query parameter — a standard workaround for SPAs on GitHub Pages.

### 4. `index.html` — Add redirect script
Add a small inline script in `<head>` that reads the encoded path from the query parameter and restores it via `history.replaceState` before React loads.

### 5. `.github/workflows/deploy.yml` — GitHub Actions workflow
Create a workflow that builds the app and deploys to GitHub Pages on push to `main`. Uses `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages`.

## Technical Note
The edge functions (document processing, RAG queries) are hosted on the backend and will continue to work regardless of where the frontend is hosted — no changes needed there.

