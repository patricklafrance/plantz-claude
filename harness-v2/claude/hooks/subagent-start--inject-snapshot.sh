#!/usr/bin/env bash
set -uo pipefail

# ═══════════════════════════════════════════════════════════════════════════════
# SubagentStart hook: inject the repo snapshot into every subagent's context.
#
# The SessionStart hook generates and persists a snapshot to
# .claude/snapshots/repo-snapshot.json. This hook reads that file and injects
# it into the subagent via additionalContext — giving every subagent the same
# structural awareness the main agent has.
#
# Cannot block (SubagentStart is informational only).
# ═══════════════════════════════════════════════════════════════════════════════

SNAPSHOT_FILE=".claude/snapshots/repo-snapshot.json"

# No snapshot on disk → nothing to inject.
if [ ! -f "$SNAPSHOT_FILE" ]; then
  exit 0
fi

# Read the agent_type to tailor the injection.
INPUT=$(cat)
AGENT_TYPE=$(node -e "
  const d = JSON.parse(require('fs').readFileSync(0, 'utf8'));
  process.stdout.write(d.agent_type ?? 'unknown');
" <<< "$INPUT")

# Build a context-appropriate digest. Harness subagents get the full snapshot
# reference + evaluation criteria. Lightweight agents get just the workspace
# topology to avoid wasting their context window.
node -e "
  const fs = require('fs');
  const agentType = process.argv[1];
  const snapshot = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const ws = snapshot.workspace;
  const criteria = snapshot.evaluationCriteria;
  const versions = snapshot.keyVersions;

  const lines = [];

  // All agents get workspace topology — it's compact and universally useful.
  lines.push('## Repository Snapshot');
  lines.push('');
  lines.push('### Workspace (' + ws.packageCount + ' packages)');
  const byScope = {};
  for (const p of ws.packages) {
    if (!byScope[p.scope]) byScope[p.scope] = [];
    byScope[p.scope].push(p.name);
  }
  for (const [scope, names] of Object.entries(byScope)) {
    lines.push('**' + scope + ':** ' + names.join(', '));
  }
  lines.push('');
  lines.push('### Domains');
  for (const [domain, info] of Object.entries(ws.domains)) {
    lines.push('- **' + domain + '**: modules=[' + info.modules.join(', ') + '], storybook=' + (info.storybook || 'none'));
  }

  // Harness agents get commands, versions, and evaluation criteria.
  if (agentType.startsWith('harness-')) {
    const scripts = snapshot.scripts;
    const dev = Object.keys(scripts).filter(s => s.startsWith('dev-'));
    const quality = ['lint', 'typecheck', 'test', 'sizecheck', 'oxlint', 'oxfmt', 'knip', 'syncpack'].filter(s => scripts[s]);
    lines.push('');
    lines.push('### Commands');
    lines.push('- **Dev:** ' + dev.join(', '));
    lines.push('- **Quality:** ' + quality.join(', '));
    lines.push('');
    lines.push('### Key Versions');
    const versionPairs = Object.entries(versions).map(([k, v]) => k + '@' + v);
    lines.push(versionPairs.join(', '));
    lines.push('');
    lines.push('### Evaluation Criteria');
    lines.push('- **Static:** ' + criteria.lint);
    lines.push('- **Bundle:** JS ' + criteria.bundleJs + ', CSS ' + criteria.bundleCss);
    lines.push('- **Stories:** ' + criteria.stories);
    lines.push('- **A11y:** ' + criteria.a11y);
    lines.push('- **Architecture:** ' + criteria.layering);
    lines.push('- **MSW:** ' + criteria.mswOwnership);
    lines.push('');
    lines.push('Full snapshot: \`.claude/snapshots/repo-snapshot.json\`');
  }

  const digest = lines.join('\\n');

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SubagentStart',
      additionalContext: digest
    }
  }));
" "$AGENT_TYPE" "$SNAPSHOT_FILE"

exit 0
