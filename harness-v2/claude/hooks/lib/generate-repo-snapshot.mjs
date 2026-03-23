/**
 * Generates a structured snapshot of the monorepo for context injection.
 *
 * Only captures fields that hooks and digests actually consume:
 *   - SessionStart digest: topology, versions, infrastructure counts, criteria
 *   - SubagentStart digest: topology, versions (harness only), criteria (harness only)
 *   - Stop hook drift check: package names, hook files, workflow files
 *
 * Output: JSON to stdout + persisted to .claude/snapshots/repo-snapshot.json
 */

import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { join, relative, dirname } from "path";

const ROOT = process.cwd();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readJson(path) {
    try {
        return JSON.parse(readFileSync(path, "utf8"));
    } catch {
        return null;
    }
}

function findPackageJsonFiles(dir, maxDepth = 5, depth = 0) {
    if (depth >= maxDepth || !existsSync(dir)) return [];
    const results = [];
    try {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist" || entry.name === ".harness") continue;
            const full = join(dir, entry.name);
            if (entry.isDirectory()) {
                results.push(...findPackageJsonFiles(full, maxDepth, depth + 1));
            } else if (entry.name === "package.json") {
                results.push(full);
            }
        }
    } catch {
        /* permission errors */
    }
    return results;
}

// ─── Workspace Topology ─────────────────────────────────────────────────────
// Consumers: all three hooks read package names + scope; SessionStart/SubagentStart
// read domains. Stop hook uses only names for drift detection.

function buildWorkspaceTopology() {
    const pkgFiles = findPackageJsonFiles(ROOT);
    const packages = [];
    const domains = {};

    for (const pkgPath of pkgFiles) {
        const pkg = readJson(pkgPath);
        if (!pkg?.name || pkg.name === "workspace-root") continue;

        const rel = relative(ROOT, dirname(pkgPath)).replace(/\\/g, "/");
        const scope = pkg.name.startsWith("@apps/") ? "apps" : pkg.name.startsWith("@modules/") ? "modules" : pkg.name.startsWith("@packages/") ? "packages" : "other";

        let domain = null;
        const pathParts = rel.split("/");
        if (pathParts[0] === "apps" && pathParts.length >= 3) {
            if (["management", "today"].includes(pathParts[1])) {
                domain = pathParts[1];
            }
        }

        packages.push({
            name: pkg.name,
            scope,
            ...(domain && { domain }),
        });

        if (domain && scope === "modules") {
            if (!domains[domain]) domains[domain] = { modules: [], storybook: null };
            domains[domain].modules.push(pkg.name);
        }
        if (domain && scope === "apps" && existsSync(join(dirname(pkgPath), ".storybook"))) {
            if (!domains[domain]) domains[domain] = { modules: [], storybook: null };
            domains[domain].storybook = pkg.name;
        }
    }

    return { packageCount: packages.length, packages, domains };
}

// ─── Key Framework Versions ──────────────────────────────────────────────────
// Consumers: SessionStart digest, SubagentStart harness digest.

function extractKeyVersions() {
    const rootPkg = readJson(join(ROOT, "package.json"));
    const hostPkg = readJson(join(ROOT, "apps/host/package.json"));
    const componentsPkg = readJson(join(ROOT, "packages/components/package.json"));

    const allDeps = {
        ...rootPkg?.devDependencies,
        ...hostPkg?.dependencies,
        ...hostPkg?.devDependencies,
        ...componentsPkg?.dependencies,
        ...componentsPkg?.devDependencies,
    };

    const keyDeps = [
        "react",
        "react-dom",
        "react-router",
        "@squide/firefly",
        "@tanstack/react-query",
        "@tanstack/db",
        "typescript",
        "turbo",
        "storybook",
        "msw",
        "vitest",
        "vite",
        "playwright",
        "@rsbuild/core",
        "@rslib/core",
        "tailwindcss",
        "oxlint",
        "oxfmt",
        "syncpack",
        "knip",
        "zod",
        "size-limit",
        "agent-browser",
    ];

    const versions = {};
    for (const dep of keyDeps) {
        if (allDeps[dep]) versions[dep] = allDeps[dep];
    }
    return versions;
}

// ─── Infrastructure Inventory ────────────────────────────────────────────────
// Stop hook reads: hookFiles (drift), workflows (drift).
// SessionStart reads: counts only.

function buildInfrastructure() {
    const hooksDir = join(ROOT, ".claude/hooks");
    const hookFiles = existsSync(hooksDir) ? readdirSync(hooksDir).filter((f) => f.endsWith(".sh")) : [];

    const wfDir = join(ROOT, ".github/workflows");
    const workflows = existsSync(wfDir) ? readdirSync(wfDir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml")) : [];

    const skillsDir = join(ROOT, ".claude/skills");
    const skillCount = existsSync(skillsDir) ? readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).length : 0;

    const adrsDir = join(ROOT, "agent-docs/adr");
    const odrsDir = join(ROOT, "agent-docs/odr");
    const refsDir = join(ROOT, "agent-docs/references");

    return {
        hookFiles,
        workflows,
        skillCount,
        agentDocs: {
            adrs: existsSync(adrsDir) ? readdirSync(adrsDir).filter((f) => /^\d{4}-/.test(f)).length : 0,
            odrs: existsSync(odrsDir) ? readdirSync(odrsDir).filter((f) => /^\d{4}-/.test(f)).length : 0,
            references: existsSync(refsDir) ? readdirSync(refsDir).filter((f) => f.endsWith(".md")).length : 0,
        },
    };
}

// ─── Evaluation Criteria ─────────────────────────────────────────────────────
// Consumers: SessionStart and SubagentStart harness digests project specific fields.
// Flattened to only the strings that are actually injected.

function buildEvaluationCriteria() {
    return {
        lint: "pnpm lint (oxlint + oxfmt + typecheck + syncpack + knip)",
        bundleJs: "500 KB gzipped (apps/host)",
        bundleCss: "15 KB gzipped (apps/host)",
        stories: "Every page and component must have a co-located .stories.tsx file",
        a11y: "axe-core via @storybook/addon-vitest in light + dark modes",
        layering: "Modules import only from @packages/*; no cross-module imports",
        mswOwnership: "Every module owns its own MSW handlers",
        ci: "secret scan → build → size-limit → oxlint → typecheck → syncpack → test",
    };
}

// ─── Scripts ─────────────────────────────────────────────────────────────────
// Consumers: SessionStart and SubagentStart digests. Subagents need to know
// which commands are available without reading package.json themselves.
// Excludes destructive (reset, clean) and maintenance (outdated-deps) commands.

function extractScripts() {
    const rootPkg = readJson(join(ROOT, "package.json"));
    const all = rootPkg?.scripts ?? {};
    const exclude = /^(clean|reset|list-outdated|update-outdated|install-playwright)/;
    return Object.entries(all)
        .filter(([name]) => !exclude.test(name))
        .reduce((acc, [name, cmd]) => {
            acc[name] = cmd;
            return acc;
        }, {});
}

// ─── Main ────────────────────────────────────────────────────────────────────

function generate() {
    const snapshot = {
        generatedAt: new Date().toISOString(),
        workspace: buildWorkspaceTopology(),
        scripts: extractScripts(),
        keyVersions: extractKeyVersions(),
        infrastructure: buildInfrastructure(),
        evaluationCriteria: buildEvaluationCriteria(),
    };

    const snapshotDir = join(ROOT, ".claude/snapshots");
    if (!existsSync(snapshotDir)) mkdirSync(snapshotDir, { recursive: true });
    writeFileSync(join(snapshotDir, "repo-snapshot.json"), JSON.stringify(snapshot, null, 2));

    return snapshot;
}

const snapshot = generate();
process.stdout.write(JSON.stringify(snapshot));
