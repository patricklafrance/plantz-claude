---
name: plantz-smoke-tests
description: |
    Smoke-test every application by starting dev servers and verifying pages load without errors.
    Use when asked to "verify apps", "test all apps", "smoke test", "check dev servers".
disable-model-invocation: true
license: MIT
---

# Smoke Tests

Smoke-test every application in the repository by starting each dev server and verifying the page loads without errors.

## Prerequisites

This skill requires `agent-browser` CLI for browser verification (navigating to URLs, taking snapshots, checking console errors, taking screenshots).

## Run Folder

Generate a UUID at the start of the run:

```bash
RUN_UUID=$(node -e "console.log(require('crypto').randomUUID())")
mkdir -p ./tmp/smoke-tests/$RUN_UUID
```

All screenshots and artifacts go in `./tmp/smoke-tests/$RUN_UUID/`.

## Discovery

1. Read root `package.json` and collect every `dev-*` script.
2. Filter out module-specific scripts — those that use `cross-env MODULES=` are filtered host instances, not standalone apps. Keep only scripts that start a distinct application (the host and each storybook).
3. Build an ordered list of apps to test. Test the host first, then storybooks.

## Procedure

For each app in the list, run these steps sequentially:

### Step 1 — Start the dev server

Run the dev script in the background (e.g., `pnpm dev-host`). Capture the task ID so you can stop it later.

### Step 2 — Wait for ready

Watch stdout for the local URL. Wait for the server to emit it — this confirms the build succeeded and the server is listening.

**Known ports:** host app = `8080`, storybooks = `6006`.

**Timeouts:** 60 seconds for the host app, 300 seconds for storybooks (storybooks compile on first launch and are significantly slower).

### Step 3 — Verify in browser

1. Navigate to the local URL.
2. Take a page snapshot and confirm meaningful content loaded (not a blank page or error screen).
3. Check the browser console for errors. Warnings are acceptable — errors are not.
4. Take a screenshot and save it to `./tmp/smoke-tests/$RUN_UUID/{app-name}.png`.

### Step 4 — Stop the dev server

Stop the background task started in Step 1. Then **immediately** run the port-cleanup procedure below.

### Step 5 — Record result

Record the app name, URL, status (pass/fail), and any errors.

## Port-Cleanup Procedure

This is the most failure-prone part of the skill. `TaskStop` kills the Turbo wrapper, but child processes (the actual Node dev server) survive. You **must** verify the port is free before starting the next app.

After stopping the background task, kill any process still holding the port:

```bash
# Linux:
kill -9 $(lsof -ti :<PORT>) 2>/dev/null

# Windows:
netstat -ano | grep :<PORT> | grep LISTENING
taskkill //PID <PID> //T //F
```

**Rules:**

- Always check the port after TaskStop, even if TaskStop reported success.
- Never start the next app's dev server until the port is confirmed free.
- If the server used a port other than 8080 or 6006 (discovered from server output), use that port instead.

## Cleanup

- **On success:** delete the run folder: `rm -rf ./tmp/smoke-tests/$RUN_UUID`.
- **On failure:** never delete the run folder. Leave artifacts for diagnosis.

## Summary

After all apps are tested, output a markdown table:

```
| App | URL | Status | Errors |
|---|---|---|---|
| {app-name} | {discovered-url} | pass | — |
| ... | ... | ... | ... |
```

If any app failed, list the failure details below the table.

## Prohibitions

- Never leave a dev server running — always stop it and run the port-cleanup procedure before starting the next one. Orphan servers cause port conflicts that fail subsequent tests.
- Never skip an app — test every discovered application even if a previous one failed. Skipping hides cascading failures across apps.
- Always save screenshots as evidence, even for passing apps. Without screenshots, failures cannot be diagnosed after the fact.
- Never skip the port-cleanup procedure — checking the port and killing orphans is mandatory, not optional. Use the platform-appropriate commands (lsof/kill on Linux, netstat/taskkill on Windows).
