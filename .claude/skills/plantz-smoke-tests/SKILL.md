---
name: plantz-smoke-tests
description: |
    Smoke-test the host application by starting the dev server, logging in with demo credentials, and verifying authenticated content loads without errors.
    Use when asked to "verify apps", "test all apps", "smoke test", "check dev servers".
license: MIT
---

# Smoke Tests

Smoke-test the host application by starting its dev server, logging in, and verifying authenticated content loads without errors.

## Prerequisites

This skill requires `agent-browser` CLI for browser verification (navigating to URLs, taking snapshots, checking console errors, taking screenshots).

## Run Folder

Generate a UUID and create `./tmp/smoke-tests/[run-uuid]/`. All screenshots and artifacts go in this folder.

## Target

The only app to test is the host. Run it with `pnpm dev-host` (port `8080`, URL `http://localhost:8080`).

## Procedure

### Step 1 — Start the dev server

Run `pnpm dev-host` in the background. Capture the task ID so you can stop it later.

### Step 2 — Wait for ready

Watch stdout for the local URL (`http://localhost:8080`). Wait for the server to emit it — this confirms the build succeeded and the server is listening.

**Timeout:** 60 seconds.

### Step 3 — Log in

The app redirects unauthenticated users to `/login`. You must log in before verifying content.

**Demo credentials:** `alice@example.com` / `password`

1. Navigate to `http://localhost:8080`.
2. The app shows a loading spinner while MSW initializes. Wait for the login page to render.
3. Fill in the email and password fields with the demo credentials and submit the form.
4. Wait for the redirect to the home page. **Timeout: 10 seconds.** You should see an authenticated layout (header with logo, navigation, content area) — not the login form.
5. If the redirect does not happen within 10 seconds, take a screenshot (`{app-name}-login-failed.png`), check the browser console for errors, and **fail** the test.

### Step 4 — Verify in browser

1. Take a page snapshot and confirm the authenticated layout loaded (header, navigation, content area — not the login form).
2. Check the browser console for errors. Warnings are acceptable — errors are not.
3. Take a screenshot and save it to `./tmp/smoke-tests/[run-uuid]/{app-name}.png`.

### Step 5 — Stop the dev server

Stop the background task started in Step 1. Then **immediately** run the port-cleanup procedure below.

### Step 6 — Record result

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
- Use port `8080` (or the port from server output if it differs).

## Cleanup

- **On success:** delete the run folder: `rm -rf ./tmp/smoke-tests/[run-uuid]`.
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
