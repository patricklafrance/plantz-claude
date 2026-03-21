#!/usr/bin/env bash
set -uo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# SessionStart hook: generate and inject a structured repo snapshot.
#
# Runs at session start (startup, resume, clear, compact). Generates a JSON
# snapshot of the workspace topology, dependency graph, infrastructure
# inventory, and evaluation criteria. The snapshot is:
#
#   1. Injected into Claude's context via additionalContext (visible all session)
#   2. Persisted to .claude/snapshots/repo-snapshot.json (readable by hooks)
#
# The generator script (.claude/hooks/lib/generate-repo-snapshot.mjs) reads
# package.json files, turbo.json, and directory listings — no network calls,
# no pnpm commands, typically completes in < 1 second.
# ═══════════════════════════════════════════════════════════════════════════════

INPUT=$(cat)

# Extract the session source (startup, resume, clear, compact).
SOURCE=$(node -e "
  const d = JSON.parse(require('fs').readFileSync(0, 'utf8'));
  process.stdout.write(d.source ?? 'unknown');
" <<< "$INPUT")

# Only generate full snapshot on fresh sessions and after compaction.
# Resume already has the snapshot from the original session start.
# Clear is intentional reset — re-inject so Claude has context.
case "$SOURCE" in
  startup|compact|clear)
    ;; # Continue to generate snapshot
  resume)
    # On resume, only inject if snapshot file doesn't exist yet.
    if [ -f ".claude/snapshots/repo-snapshot.json" ]; then
      exit 0
    fi
    ;;
  *)
    exit 0
    ;;
esac

# Reset supervision state for the new session — stale counters from a
# previous session would cause false positives.
rm -f .claude/snapshots/supervision-state.json

# Generate the snapshot. Output goes to stdout (for additionalContext)
# and to .claude/snapshots/repo-snapshot.json (for hook reads).
SNAPSHOT=$(node .claude/hooks/lib/generate-repo-snapshot.mjs 2>/dev/null)

if [ -z "$SNAPSHOT" ]; then
  echo "Warning: repo snapshot generation failed" >&2
  exit 0
fi

# Format as a compact summary for Claude's context window.
# Full JSON is on disk; inject a human-readable digest.
node -e "
  const snapshot = JSON.parse(process.argv[1]);
  const ws = snapshot.workspace;
  const infra = snapshot.infrastructure;
  const versions = snapshot.keyVersions;
  const criteria = snapshot.evaluationCriteria;

  const lines = [];
  lines.push('## Repository Snapshot (auto-generated at session start)');
  lines.push('');

  // Workspace topology
  lines.push('### Workspace (' + ws.packageCount + ' packages)');
  lines.push('');
  const byScope = {};
  for (const p of ws.packages) {
    if (!byScope[p.scope]) byScope[p.scope] = [];
    byScope[p.scope].push(p.name);
  }
  for (const [scope, names] of Object.entries(byScope)) {
    lines.push('**' + scope + ':** ' + names.join(', '));
  }
  lines.push('');

  // Domains
  lines.push('### Domains');
  for (const [domain, info] of Object.entries(ws.domains)) {
    lines.push('- **' + domain + '**: modules=[' + info.modules.join(', ') + '], storybook=' + (info.storybook || 'none'));
  }
  lines.push('');

  // Available commands
  lines.push('### Commands');
  const scripts = snapshot.scripts;
  const dev = Object.keys(scripts).filter(s => s.startsWith('dev-'));
  const quality = ['lint', 'typecheck', 'test', 'sizecheck', 'oxlint', 'oxfmt', 'knip', 'syncpack'].filter(s => scripts[s]);
  const build = Object.keys(scripts).filter(s => s.startsWith('build-') || s.startsWith('serve-'));
  lines.push('- **Dev:** ' + dev.join(', '));
  lines.push('- **Quality:** ' + quality.join(', '));
  lines.push('- **Build/Serve:** ' + build.join(', '));
  lines.push('');

  // Key versions
  lines.push('### Key Versions');
  const versionPairs = Object.entries(versions).map(([k, v]) => k + '@' + v);
  lines.push(versionPairs.join(', '));
  lines.push('');

  // Infrastructure counts
  lines.push('### Infrastructure');
  lines.push('- Hooks: ' + infra.hookFiles.length + ' (' + infra.hookFiles.join(', ') + ')');
  lines.push('- Skills: ' + infra.skillCount);
  lines.push('- CI Workflows: ' + infra.workflows.length + ' (' + infra.workflows.join(', ') + ')');
  lines.push('- Agent Docs: ' + infra.agentDocs.adrs + ' ADRs, ' + infra.agentDocs.odrs + ' ODRs, ' + infra.agentDocs.references + ' references');
  lines.push('');

  // Evaluation criteria (compact)
  lines.push('### Evaluation Criteria');
  lines.push('- **Static:** ' + criteria.lint);
  lines.push('- **Bundle:** JS ' + criteria.bundleJs + ', CSS ' + criteria.bundleCss);
  lines.push('- **Stories:** ' + criteria.stories);
  lines.push('- **A11y:** ' + criteria.a11y);
  lines.push('- **CI:** ' + criteria.ci);
  lines.push('');
  lines.push('Full snapshot: \`.claude/snapshots/repo-snapshot.json\`');

  const digest = lines.join('\\n');

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: digest
    }
  }));
" "$SNAPSHOT"

exit 0
