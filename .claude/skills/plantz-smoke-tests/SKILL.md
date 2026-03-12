---
name: plantz-smoke-tests
description: |
    Smoke-test the host application by starting the dev server and verifying the page loads without errors.
    Use when asked to "verify apps", "test all apps", "smoke test", "check dev servers".
license: MIT
---

# Smoke Tests

Smoke-test the host application by starting its dev server and verifying the page loads without errors.

## Prerequisites

This skill requires `agent-browser` CLI for browser verification (navigating to URLs, taking snapshots, checking console errors, taking screenshots).

## Run Folder

Generate a UUID at the start of the run:

```bash
RUN_UUID=$(node -e "console.log(require('crypto').randomUUID())")
mkdir -p ./tmp/smoke-tests/$RUN_UUID
```

All screenshots and artifacts go in `./tmp/smoke-tests/$RUN_UUID/`.

## Target

The only app to test is the host. Run it with `pnpm dev-host` (port `8080`).

## Procedure

### Step 1 — Start the dev server

Run `pnpm dev-host` in the background. Capture the task ID so you can stop it later.

### Step 2 — Wait for ready

Watch stdout for the local URL. Wait for the server to emit it — this confirms the build succeeded and the server is listening.

**Known port:** `8080`.

**Timeout:** 60 seconds.

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
- If the server used a port other than 8080 (discovered from server output), use that port instead.

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

- Never leave the dev server running — always stop it and run the port-cleanup procedure.
- Always save a screenshot as evidence, even if the app passes. Without screenshots, failures cannot be diagnosed after the fact.
- Never skip the port-cleanup procedure — checking the port and killing orphans is mandatory, not optional. Use the platform-appropriate commands (lsof/kill on Linux, netstat/taskkill on Windows).
