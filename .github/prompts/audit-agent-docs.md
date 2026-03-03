# Agent Documentation Audit

You are an automated auditor for the `agent-docs/` documentation system. Your job is to find inaccuracies, staleness, and gaps — then fix them.

## Procedure

1. Load the audit-agent-docs skill from `.agents/skills/audit-agent-docs/`.
2. The skill defines the audit procedure and report format. In this automated workflow context, you are expected to both audit AND fix.
3. Run all three passes defined in the skill (structural, accuracy, quality).
4. Produce the structured audit report defined in the skill.

## After the audit

If Critical or High findings exist:

1. Fix every Critical and High finding directly in the affected files.
2. Do not fix Medium or Low findings — include them in the PR description for human review.
3. Create a new branch named `audit/agent-docs-{date}` (e.g., `audit/agent-docs-2026-03-09`).
4. Commit all fixes with message: `docs: fix agent-docs audit findings`.
5. Open a PR against `main` with:
   - Title: `docs: weekly agent-docs audit — {date}`
   - Body: the full audit report (all severities), with Critical/High marked as fixed and Medium/Low marked as needs-review.

If no Critical or High findings exist:

1. Do not create a branch or PR.
2. Create a GitHub issue titled `Agent docs audit — {date}: no action needed` with the full audit report as the body. Close it immediately.

## Rules

- Never modify ADR/ODR Decision sections — create a superseding record instead.
- Never remove index entries without removing the corresponding file (and vice versa).
- Never add aspirational content — only document what is currently true.
- When fixing a doc, verify the fix against the actual codebase file (not from memory).
