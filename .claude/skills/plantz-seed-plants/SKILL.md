---
name: plantz-seed-plants
description: |
    Generate and inject seed data for the plants collection.
    Resets the MSW in-memory database with fresh randomly generated plant data.
    Requires the dev server and Chrome DevTools MCP browser to be available.
    Triggers: /seed-plants, "seed plants", "reseed plants", "reset plant data"
license: MIT
---

# Seed Plants

Reset the MSW in-memory plant database with fresh seed data via Chrome DevTools MCP.

## Background

Plant data lives in an MSW in-memory database (`plantsDb` from `@packages/plants-core/msw`). On page load, the host app calls `plantsDb.reset(defaultSeedPlants)` which populates ~250 plants. The `scripts/seed-plants.ts` script can also generate a static JSON file, but the primary seeding mechanism is the in-memory DB.

## Procedure

Execute these steps sequentially. Do not skip steps.

### Step 1 — Ensure dev server is running

Check if the dev server is reachable:

```
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080
```

If the response is `200`, set `SERVER_WAS_RUNNING = true` and continue.

If the response is not `200`, set `SERVER_WAS_RUNNING = false` and start the dev server in the background:

```
pnpm dev-management-plants
```

Wait until `http://localhost:8080` returns `200` before proceeding.

### Step 2 — Navigate MCP browser to the app

Use `mcp__chrome-devtools__navigate_page` to go to `http://localhost:8080`.

### Step 3 — Reload the page to reset seed data

The MSW in-memory database resets on every page load (the host app calls `plantsDb.reset(defaultSeedPlants)` during MSW initialization). Simply reload the page to get fresh seed data.

Use `mcp__chrome-devtools__navigate_page` with `type: reload` to reload the page.

### Step 4 — Stop dev server if we started it

Only if `SERVER_WAS_RUNNING = false` (i.e., this skill started the dev server), stop it now:

```bash
# Linux:
kill -9 $(lsof -ti :8080) 2>/dev/null

# Windows:
netstat -ano | grep :8080 | grep LISTENING
taskkill //PID <PID> //T //F
```

Do NOT stop the server if it was already running before this skill started.

### Step 5 — Confirm

Report that the page has been reloaded and the in-memory plant database has been reset with fresh seed data.
