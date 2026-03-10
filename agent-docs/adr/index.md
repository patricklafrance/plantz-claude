# Architectural Decisions

> Quick-reference for agents. Each line is a deliberate decision — read the linked ADR only if you need the full rationale.

| Decision                                                                                                                          | ADR                                          |
| --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Squide is the application shell; every feature area is a module with `ModuleRegisterFunction`                                     | [ADR-0001](0001-squide-federated-modules.md) |
| Each domain area and shared packages layer has its own Storybook instance                                                         | [ADR-0002](0002-domain-scoped-storybooks.md) |
| Cross-module sharing uses shared packages under `packages/`; modules never import each other (superseded subpath-export approach) | [ADR-0003](0003-shared-domain-packages.md)   |
