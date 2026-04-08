

# Fix GitHub Actions Build Error

## Problem
The workflow uses `npm ci`, which requires a valid `package-lock.json`. This project uses **bun** as its package manager (has `bun.lock`/`bun.lockb`), so `npm ci` fails.

## Fix: `.github/workflows/deploy.yml`
Switch from npm to bun:

- Replace `actions/setup-node@v4` with `oven-sh/setup-bun@v2`
- Change `npm ci` → `bun install --frozen-lockfile`
- Change `npm run build` → `bun run build`

That's the only file that needs to change.

