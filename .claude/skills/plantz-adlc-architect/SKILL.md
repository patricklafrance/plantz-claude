---
name: plantz-adlc-architect
description: |
    Analyze a plan's architectural implications: explore the codebase for friction, design interface contracts, classify dependency boundaries, and assess module depth. Always-on step in the ADLC pipeline that self-scales — produces rich output for complex plans, minimal confirmation for simple ones.
    Use when asked to "review architecture", "analyze plan architecture", or as part of the ADLC orchestrator's architect review phase.
license: MIT
---

# ADLC Architect Review

Analyze the plan's architectural implications by exploring the codebase for friction, designing interface contracts for cross-file boundaries, classifying dependency boundaries, and assessing module depth.

A **deep module** (John Ousterhout, "A Philosophy of Software Design") has a small interface hiding a large implementation. Deep modules are more testable, more navigable, and let you test at the boundary instead of inside. Apply the **"replace, don't layer"** principle: if testing a component requires wrapping it in additional providers or mocking hooks rather than driving behavior through its props, the interface is not deep enough.

## Inputs (provided by orchestrator)

| Input      | Description                |
| ---------- | -------------------------- |
| `run-uuid` | Run folder identifier      |
| Plan path  | `.adlc/[run-uuid]/plan.md` |

## Procedure

1. Read `agent-docs/ARCHITECTURE.md`, `agent-docs/adr/index.md`, `agent-docs/odr/index.md`, and these reference files: `agent-docs/references/domains.md`, `agent-docs/references/msw-tanstack-query.md`, `agent-docs/references/storybook.md`, `agent-docs/references/tailwind-postcss.md`, `agent-docs/references/shadcn.md`, `agent-docs/references/color-mode.md`, `agent-docs/references/bundle-size-budget.md`.
2. Load the `workleap-squide` skill for module architecture guidance.
3. Read the plan file. Identify the affected packages and the key boundaries (where modules meet packages, where components meet data layer, where new code meets existing patterns). **Early exit:** if the plan touches only code internal to a single existing component or file — no new exports, no new routes, no new packages, no cross-module data flow — write the minimal review immediately (see step 8) and stop. Do not proceed to steps 4-7.
4. **Explore the codebase around affected packages.** Use the Explore agent to navigate the code. Read the affected files and their direct dependencies (one hop outward). If none of the friction signals below appear within that scope, stop exploring. Note where:
    - Understanding one concept requires bouncing between many small files
    - Existing interfaces are shallow (props/params nearly as complex as the implementation)
    - Data flows are tangled (a component reaches through multiple layers to get what it needs)
    - A component stores a query/collection object in `useState` rather than storing just the ID and deriving the object from the reactive source — the stored object goes stale after mutations that update the source
    - Storybook stories require elaborate setup that reveals a leaking abstraction
    - Per-story MSW handler overrides are frequent (stories need custom `parameters.msw.handlers` to control state rather than driving state through props — the component is leaking its data-fetching seam)
    - A component's props mirror another component's internal state shape rather than representing a domain concept — the interface couples the two components to each other instead of to the domain model
5. **Check for infrastructure patterns.** If the plan touches routing, module registration, Squide federation config, or Turborepo task graph, expand exploration to include the relevant host/infrastructure files.
6. **Design interface contracts and classify boundaries.** Skip this step entirely if no cross-file boundaries exist. For each cross-file boundary the plan introduces, specify:
    - The concrete export: function/component/hook name, signature (params → return type), and the named type for any data shape
    - The testability seam: pure function (preferred), hook, or component — choose the simplest that works
    - What complexity is hidden behind the interface
    - The dependency category and its testing implication. Categories:
        - **In-process**: pure computation, no I/O (e.g., utilities in `@packages/core-*`). Testable directly.
        - **Local-substitutable**: has a test stand-in (e.g., MSW-intercepted fetch — the MSW handler IS the boundary). Note whether a new MSW handler is required and which module owns it.
        - **Remote but owned / True external**: rare in this codebase — if applicable, note the category and mock strategy at the boundary
    - A usage example showing how callers consume it
    - The coupling: what the consumer must know beyond the typed signature — must it render inside a specific provider, call in a specific order, co-exist with a sibling component, or share state through a parent? If the typed signature is the complete contract, state "self-contained." May be omitted when the testability seam is "pure function." Coupling that goes beyond standard infrastructure (QueryClient, collection context, Squide runtime) suggests the interface may not be deep enough — consider whether the coupling can be internalized.
7. **Assess module depth.** Skip this step entirely if the plan introduces no new modules or component clusters. For each new module, package, or component cluster the plan introduces, evaluate: is the proposed boundary deep (small interface hiding large implementation) or shallow (interface complexity rivals implementation)? If shallow, recommend what to absorb or restructure to deepen it. Use story setup complexity as a proxy — if rendering a component in Storybook would require more than the standard MSW + QueryClient setup, the interface is leaking.
8. Write `.adlc/[run-uuid]/architecture-review.md`. If no cross-file boundaries exist in the plan and exploration surfaced no friction in the affected code, write a minimal review with all section headers and the prescribed fallback text for each (see Output Format). Do not invent concerns — a clean result is a valid result.

## Output Format

The file `architecture-review.md` must contain these sections in order:

**`# Architecture Review`**

**`## Codebase friction`** — Issues in the existing code around affected packages that the implementation should be aware of. Friction encountered during exploration — not a checklist, but what actually stood out. Or "None observed."

**`## Interface contracts`** — For each cross-file boundary, a subsection with the export name and file path as heading. Each subsection must include: **Signature** (typed params → return type), **Testability seam** (pure function / hook / component), **Hides** (what complexity is behind the interface), **Boundary** (dependency category and testing implication), **Usage** (a code example showing how callers consume it), and **Coupling** (what the consumer must know beyond the typed signature — "self-contained" if the signature is the complete contract; may be omitted for pure functions). Or "None — all new code is internal to existing components."

Example — pure function contract:

````markdown
### `formatCurrency` (`src/formatCurrency.ts`)

- **Signature**: `(amount: number, locale?: string) => string`
- **Testability seam**: pure function
- **Hides**: locale negotiation, Intl.NumberFormat caching
- **Boundary**: in-process — no I/O, testable directly
- **Usage**:
    ```tsx
    const label = formatCurrency(item.price);
    ```
````

Example — hook contract with MSW boundary:

````markdown
### `useInventory` (`src/useInventory.ts`)

- **Signature**: `(warehouseId: string) => { data: InventoryItem[] | undefined; isLoading: boolean }`
- **Testability seam**: hook
- **Hides**: TanStack Query subscription, endpoint URL construction, response normalization
- **Boundary**: local-substitutable — MSW handler at `/api/inventory/:warehouseId`, owned by the consuming module
- **Usage**:
    ```tsx
    const { data: items, isLoading } = useInventory(warehouse.id);
    if (isLoading) return <Skeleton />;
    return <InventoryList items={items} />;
    ```
- **Coupling**: self-contained
````

Example — component contract with state-synchronization coupling:

````markdown
### `StatusEditor` (`src/StatusEditor.tsx`)

- **Signature**: `(props: { itemId: string; currentValue: number; onSaved: () => void }) => JSX.Element`
- **Testability seam**: component
- **Hides**: TanStack Query subscription for item data, mutation to POST endpoint, query invalidation of own queries after mutation
- **Boundary**: local-substitutable — MSW handlers at `/api/items/:itemId/status`, owned by module
- **Usage**:
    ```tsx
    <StatusEditor itemId={item.id} currentValue={item.score} onSaved={() => collection.utils.refetch()} />
    ```
- **Coupling**: `currentValue` is caller-supplied. After `onSaved` fires, the underlying collection updates, but if the caller derived this value from a `useState` snapshot rather than the live collection, the prop remains stale — the component will query with outdated parameters, silently producing incorrect results.
````

**`## Depth assessment`** — For each new module/package/component cluster: deep or shallow? If shallow, what would deepen it? Use story setup complexity as the proxy — would this component need more than the standard MSW + QueryClient Storybook setup to render? Or "No new modules or component clusters."

**`## Recommendations`** — Concrete, advisory changes to the plan's approach, if any. Not a rewrite — only where the architectural analysis reveals a better cut. Recommendations are advisory for the Code agent — if a recommendation conflicts with the plan's File Changes, the plan wins and the Code agent treats the recommendation as a flagged concern for Subagent B's escalation check. If the plan's approach is sound, say so explicitly: "Confirmed — plan approach is architecturally sound."

## Hard Constraints

- The architect MUST NOT modify `plan.md`. Its output is supplementary — the plan is scope, the review is shape.
- Interface contracts must be concrete: named exports, typed signatures, usage examples. Vague recommendations ("consider a simpler interface") are not contracts.
- The architect MUST NOT spawn parallel competing interface designs. The A/B challenger pattern is sufficient given this codebase's constrained architecture (module isolation rule, fixed data layer pattern).

## Subagent Pattern

**Subagent A** explores the codebase and drafts the full review. A may use the Agent tool (Explore subagent type) for codebase navigation — this is a built-in tool, not an ADLC subagent.

**Subagent B** has three responsibilities, in order:

1. **Boundary identification.** Read `agent-docs/ARCHITECTURE.md` and the plan's File Changes section. Identify every cross-file boundary — any function, hook, or component that is exported from one file and imported by another file the plan describes as new or modified. Write this list down. These are the contracts B will verify exist in A's review.

2. **Contract validation.** Read A's review. For each interface contract A proposed:
    - Can this interface be exercised by a Storybook story with only the standard setup (MSW + QueryClient)? If not, the interface is leaking — fix it.
    - Does the signature hide implementation details, or would the caller need to understand internals to use it correctly?
    - Is the dependency classification correct? Does the testing implication follow?
    - Is the testability seam the simplest that works (pure function > hook > component)?

3. **Completeness check.** Compare the boundary list from step 1 against A's contracts. If A missed a boundary, add the contract. If the plan is architecturally sound and A found no concerns, verify the "no concerns" assessment is justified — do not invent problems, but do not rubber-stamp.

B edits `architecture-review.md` directly. B does not append concerns — it rewrites sections that need improvement.
