# Architectural Decisions

> Quick-reference for agents. Each line is a deliberate decision — read the linked ADR only if you need the full rationale.

| Decision                                                                                              | ADR                                               |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Modular monolith with Squide local modules; every feature area registers via `ModuleRegisterFunction` | [ADR-0001](0001-squide-local-modules.md)          |
| Each domain area and shared packages layer has its own Storybook instance                             | [ADR-0002](0002-domain-scoped-storybooks.md)      |
| MSW + TanStack Query for data layer; in-memory DB with REST API patterns, no backend server required  | [ADR-0003](0003-msw-tanstack-query-data-layer.md) |
