/**
 * Real-time supervision engine for Claude Code tool calls.
 *
 * Tracks tool call patterns in a rolling 15-minute window and detects
 * behavioral anti-patterns: doom loops (same file edited repeatedly),
 * command retry loops, and write thrashing.
 *
 * Two modes (invoked from separate hooks):
 *   track (PostToolUse) — record tool call, detect patterns, output warning
 *   check (PreToolUse)  — read state, output block decision if doom loop
 *
 * State: .claude/snapshots/supervision-state.json (gitignored)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const STATE_FILE = join(ROOT, ".claude/snapshots/supervision-state.json");
const WINDOW_MS = 15 * 60 * 1000; // 15-minute sliding window
const MAX_ENTRIES = 100;

// Thresholds: count of same tool+target within the window.
// nudge = warning in tool result, block = tool call prevented.
const THRESHOLDS = {
    Edit: { nudge: 7, block: 12 },
    Write: { nudge: 4, block: 7 },
    Bash: { nudge: 5, block: 8 },
};

// ─── State Management ────────────────────────────────────────────────────────

function readState() {
    try {
        return JSON.parse(readFileSync(STATE_FILE, "utf8"));
    } catch {
        return { version: 1, window: [] };
    }
}

function writeStateToDisk(state) {
    const dir = join(ROOT, ".claude/snapshots");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(STATE_FILE, JSON.stringify(state));
}

function cleanup(state) {
    const cutoff = Date.now() - WINDOW_MS;
    state.window = state.window.filter((e) => e.ts > cutoff).slice(-MAX_ENTRIES);
    return state;
}

// ─── Target Extraction ──────────────────────────────────────────────────────

function extractTarget(toolName, toolInput) {
    if (!toolInput) return null;
    switch (toolName) {
        case "Edit":
        case "Write":
            return toolInput.file_path || null;
        case "Bash":
            return toolInput.command || null;
        default:
            return null;
    }
}

function normalizeTarget(toolName, target) {
    if (!target) return null;
    if (toolName === "Bash") {
        // Collapse whitespace, trim, truncate for matching.
        return target.trim().replace(/\s+/g, " ").slice(0, 200);
    }
    // Normalize file paths: forward slashes.
    return target.replace(/\\/g, "/").replace(/\/$/, "");
}

// ─── Pattern Detection ──────────────────────────────────────────────────────

function countOccurrences(state, toolName, normalizedTarget) {
    return state.window.filter((e) => e.tool === toolName && e.target === normalizedTarget).length;
}

function detect(state, toolName, normalizedTarget, includeUpcoming) {
    const thresholds = THRESHOLDS[toolName];
    if (!thresholds) return null;

    const count = countOccurrences(state, toolName, normalizedTarget) + (includeUpcoming ? 1 : 0);

    const truncTarget = normalizedTarget.length > 80 ? normalizedTarget.slice(0, 77) + "..." : normalizedTarget;

    if (thresholds.block && count >= thresholds.block) {
        return {
            level: "block",
            count,
            message: `DOOM LOOP: ${toolName} on "${truncTarget}" called ${count} times in 15 min. ` + `Your current approach is not working. STOP and ask the user for guidance.`,
        };
    }

    if (thresholds.nudge && count >= thresholds.nudge) {
        // Escalate to "warn" when approaching block threshold.
        const isWarn = thresholds.block && count >= thresholds.block - 2;
        return {
            level: isWarn ? "warn" : "nudge",
            count,
            message: isWarn
                ? `WARNING: ${toolName} on "${truncTarget}" called ${count} times. ` + `You appear stuck. Try a fundamentally different approach or ask the user.`
                : `NOTICE: ${toolName} on "${truncTarget}" called ${count} times. ` + `Consider whether your current approach is making progress.`,
        };
    }

    return null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const mode = process.argv[2]; // "track" or "check"
const input = JSON.parse(readFileSync(0, "utf8"));
const toolName = input.tool_name;
const target = extractTarget(toolName, input.tool_input);

// Unknown tool or no target — nothing to supervise.
if (!target) process.exit(0);

const normalizedTarget = normalizeTarget(toolName, target);
if (!normalizedTarget) process.exit(0);

let state = readState();
state = cleanup(state);

if (mode === "track") {
    // ── PostToolUse: record the tool call and nudge if pattern detected ──

    state.window.push({
        tool: toolName,
        target: normalizedTarget,
        ts: Date.now(),
    });
    writeStateToDisk(state);

    const issue = detect(state, toolName, normalizedTarget, false);
    if (issue) {
        // Warn-level: also log to stderr (visible in terminal).
        if (issue.level === "warn") {
            process.stderr.write(`[supervision] ${issue.level}: ${toolName} x${issue.count}\n`);
        }
        // Warning text is appended to the tool result that Claude sees.
        process.stdout.write(`\n⚠️ SUPERVISION: ${issue.message}\n`);
    }
} else if (mode === "check") {
    // ── PreToolUse: block if the upcoming call would hit the block threshold ──

    const issue = detect(state, toolName, normalizedTarget, true);
    if (issue && issue.level === "block") {
        process.stderr.write(`[supervision] BLOCKED: ${toolName} x${issue.count}\n`);

        // Circuit breaker: reset counter for this target so the agent gets a
        // fresh start after the block. If it loops again, the breaker trips again.
        state.window = state.window.filter((e) => !(e.tool === toolName && e.target === normalizedTarget));
        writeStateToDisk(state);

        process.stdout.write(
            JSON.stringify({
                decision: "block",
                reason: issue.message,
            }),
        );
    }
    // Below block threshold: no output. PostToolUse handles nudge/warn.
}
