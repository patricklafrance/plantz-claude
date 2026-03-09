I want you to create a new skill named `plantz-code`. This skill must be loaded everytime an agent wants to write code. The skill will include the instructions for every phase of writing code. The main agent using will act as an orchetrator (and will be referenced going forward as the "orchestrator" agent) and will spawn subagents for different steps.

Here are the steps...

## Branch creation

Before starting to write code, the orchestrator agent must create a new branch from `main`. Use the conventional commit prefix matching the branch prefix (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).

## Write plan

The orchestrator agent must spawn two planning subagents in plan mode to draft the technical approach before writing any files. Those planning subagents should assist and challenge each others. The output of this step should be a `./tmp/runs/[hash]/plan.md` file.

On top of the instructions to write the plan, the planning subagents must receive the following instructions:

- Before proceeding, look for relevant records in [ADR](./agent-docs/adr/index.md).
- Before proceeding, look for relevant records in [ODR](./agent-docs/odr/index.md).
- Before proceeding, read [ARCHITECTURE.md](./agent-docs/ARCHITECTURE.md).
- The code must be in React and TypeScript. To help with that, this agent must load the `workleap-react-best-practices` agent skill.
- The code must use Tailwind for styling.
- The code must be WCAG AA compliant. To help with that, the agent must load the `accessibility` agent skill.
- The code must support light and dark color scheme (when creating the skill, move the information from `./agent-docs/references/color-mode.md` to the agent skill and, if there's nothing left, delete the file).
- The code must support phone, tablet and desktop devices (when creating the skill, move the information from `./agent-docs/references/responsive-layout.md` to the agent skill and, if there's nothing left, delete the file).
- The code must use [Tanstack DB](https://tanstack.com/db/latest) for persistence. Currently, it should only support [local storage collections](https://tanstack.com/db/latest/docs/collections/local-storage-collection) (when creating the skill, move the information from `./agent-docs/references/tanstack-db.md` to the skill and, if there's nothing left, delete the file).
- The code must use [shadcn](https://ui.shadcn.com/) v4 with Base UI, Tailwind and PostCSS for components (when creating the skill, move the information from `./agent-docs/references/shadcn.md` to the skill and, if there's nothing left, delete the file).
- The agent must generate [Storybook](https://storybook.js.org/) stories with multiple variants for every components (when creating the skill, move the information from `./agent-docs/references/storybook.md` to the skill and, if there's nothing left, delete the file).
- The agent must load the `frontend-design` agent skill to help design any feature.
- If the agent have to scaffold a new domain module, the agent must load the `plantz-scaffold-domain-module` agent skill.
- If the agent have to scaffold a new Storybook, the agent must load the ` plant-zscaffold-domain-storybook` agent skill.

## Write code

The orchestrator agent must spawn two coding subagents to execute the `./tmp/runs/[hash]/plan.md` file created in the plan step. Those coding subagents should assist and challenge each others.

On top of the instructions to execute the plan, the coding subagents must also receive the same instructions listed for the planning subagents writing the plan.

## Validate code

Once the coding subagents are done, the orchestrator agent must spawn two validation subagents to validate the code. Those validation subagents should assist and challenge each others.

The validation subagents must receive the following instructions:

- Execute `pnpm lint` from the root of the workspace
- Load the `plantz-validate-modules` agent skill and validate that every module is conform
- Read the `./agent-docs/referenes/quality-gate.md` file for additional validation information (when creating the skill, move the relevant information from `./agent-docs/referenes/quality-gate.md` to the skill and, if there's nothing left, delete the file).
- Load the `plantz-verify-apps` agent skill to smoke tests every app

When done, the validation subagents must write their findings in the `./tmp/runs/[hash]/validation-issues-[iteration-number].md` file. When is done writing, if there are issues, the orchestrator agent must ask the previous coding subagents to write the `./tmp/runs/[hash]/validation-issues-[iteration-number].md` file and fix the issues. Once done, the existing validatin subagents should validate the code again. The orchestrator agent must iterate with this process until all checks pass.

## Simplify

Run `/simplify` to review all changed code for reuse, quality, and efficiency. Fix any issues found before committing.

## Write ADR

If there are changes affecting the [ADR](./agent-docs/adr.README.md), the orchestrator agent must update the ADR. When creating the skill, evaluate if the ADR template and README file could be move to the skill instead, and, if there's nothing left, delete the files.

## Write ODR

If there are changes affecting the [ODR](./agent-docs/odr.README.md), the orchestrator agent must update the ODR. When creating the skill, evaluate if the ODR template and README file could be move to the skill instead, and, if there's nothing left, delete the files.

## Update agent-docs references

If there are changes affecting the [agent-docs reference files](./agent-docs/references), the orchestrator agent must update the references files. Don't forget to update the root CLAUDE.md index as well.

## Commit

The orchestrator agent must commit the changes:

```
git add -A
git commit -m "<type>: <description>"
```

Use the conventional commit prefix matching the branch prefix (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).

## Push and open PR

The orchestrator agent must push the commits and open a pull request:

```
git push -u origin <branch-name>
gh pr create \
  --title "<type>: <description>" \
  --body "$(cat <<'EOF'
## Changes
<brief description of the chanes>

## Quality checks
- [ ] Lint
- [ ] Module structure
- [ ] Smoke tests
- [ ] Quality gate

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Use the conventional commit prefix matching the branch prefix (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).

## Monitor PR

The orchestrator agent must monitor the pull request:

1. If any workflows fails, ask the existing coding subagents to fix the issues and commit + push the changes.
2. If any comments is added to the pull request, spawn a subagent to assist you in evaluating if they are legitimate. If any are legitimate, ask the coding subagents to fix the legitimate comments and commit + push the changes. The orchestrator should then resolve the comments that have been adressed.
3. When all workflows except chromatic are green, and all pull request comments have been resolved, the orchestrators agent should add the `run chromatic` label to the pull request. This will execute the Chromatic workflows.
4. If Chromatic workflows fails, tag the repository repository maintainers and ask them to review Chromatic.
