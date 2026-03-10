---
name: plantz-seed-plants
description: |
    Generate and inject seed data for the plants collection.
    Wipes existing plant data in localStorage and replaces it with fresh seed data.
    Requires the dev server and Chrome DevTools MCP browser to be available.
    Triggers: /seed-plants, "seed plants", "reseed plants", "reset plant data"
license: MIT
---

# Seed Plants

Generate seed data and inject it into the running app's localStorage via Chrome DevTools MCP.

## Procedure

Execute these steps sequentially. Do not skip steps.

### Step 1 — Generate seed data

Run the seed script:

```
pnpm seed-plants
```

This writes `apps/host/public/seed-plants.json` containing 220–280 plants in TanStack DB localStorage format.

### Step 2 — Ensure dev server is running

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

### Step 3 — Navigate MCP browser to the app

Use `mcp__chrome-devtools__navigate_page` to go to `http://localhost:8080`.

### Step 4 — Inject seed into localStorage

Use `mcp__chrome-devtools__evaluate_script` to run:

```javascript
async () => {
    const res = await fetch("/seed-plants.json");
    if (!res.ok) return { error: "fetch failed: " + res.status };
    const data = await res.text();
    localStorage.removeItem("plantz-plants");
    localStorage.setItem("plantz-plants", data);
    return { ok: true, size: data.length };
};
```

Verify the result contains `ok: true`.

### Step 5 — Reload the page

Use `mcp__chrome-devtools__navigate_page` with `type: reload` to reload the page.

### Step 6 — Clean up

Delete the temporary JSON file:

```
rm apps/host/public/seed-plants.json
```

### Step 7 — Stop dev server if we started it

Only if `SERVER_WAS_RUNNING = false` (i.e., this skill started the dev server), stop it now:

```bash
# Linux:
kill -9 $(lsof -ti :8080) 2>/dev/null

# Windows:
netstat -ano | grep :8080 | grep LISTENING
taskkill //PID <PID> //T //F
```

Do NOT stop the server if it was already running before this skill started.

### Step 8 — Confirm

Report the number of plants seeded and that the page has been reloaded.
