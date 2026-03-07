---
name: plantz-verify-apps
description: |
    [Plantz] Smoke-test every application by starting dev servers and verifying pages load.
    Use when asked to "verify apps", "test all apps", "smoke test", "check dev servers".
    Triggers: /plantz-verify-apps, "verify apps", "test all apps", "smoke test"
license: MIT
---

# Verify Apps

Smoke-test every application in the repository by starting each dev server and verifying the page loads without errors.

## Discovery

1. Read root `package.json` and collect every `dev-*` script.
2. Filter out module-specific scripts — those that use `cross-env MODULES=` are filtered host instances, not standalone apps. Keep only scripts that start a distinct application (the host and each storybook).
3. Build an ordered list of apps to test. Test the host first, then storybooks.

## Procedure

Before testing any app, delete `tmp/verify-apps/` if it exists — this clears stale artifacts from prior failed runs. Then recreate the directory.

For each app in the list, run these steps sequentially:

### Step 1 — Start the dev server

Run the dev script in the background (e.g., `pnpm dev-host`). Capture the task ID so you can stop it later.

### Step 2 — Wait for ready

Watch stdout for the local URL (typically `http://localhost:<port>`). Wait for the server to emit it — this confirms the build succeeded and the server is listening. If the server fails to start within 60 seconds, record a failure and move to the next app.

### Step 3 — Verify in browser

1. Navigate to the local URL.
2. Take a page snapshot and confirm meaningful content loaded (not a blank page or error screen).
3. Check the browser console for errors. Warnings are acceptable — errors are not.
4. Take a screenshot and save it to `tmp/verify-apps/{app-name}.png`.

### Step 4 — Stop the dev server and kill orphan processes

Stop the background task started in step 1. Then verify the port is actually free — `TaskStop` kills the turbo wrapper but child processes (the actual node dev server) can survive. Run `netstat -ano | grep -E "LISTENING" | grep ":<port>"` to check. If the port is still occupied, kill the orphan process with `taskkill //PID <pid> //F` (Windows) or `kill <pid>` (Unix). Do not proceed to the next app until the port is confirmed free.

### Step 5 — Record result

Record the app name, URL, status (pass/fail), and any errors found.

## Summary

After all apps are tested, output a markdown table:

```
| App | URL | Status | Errors |
|---|---|---|---|
| host | http://localhost:8080 | pass | — |
| management-storybook | http://localhost:6006 | pass | — |
| ... | ... | ... | ... |
```

If any app failed, list the failure details below the table.

## Prohibitions

- Never hardcode app names or ports — discover them from `package.json` and server output.
- Never leave a dev server running — always stop it before starting the next one.
- Never skip an app — test every discovered application even if a previous one failed.
- Always save screenshots as evidence, even for passing apps.
