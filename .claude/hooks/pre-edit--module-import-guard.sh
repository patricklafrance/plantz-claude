#!/usr/bin/env bash
set -uo pipefail

# PreToolUse/Edit|Write: block cross-module imports.
# @modules/* packages must never import from other @modules/* — only from @packages/* and host.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | grep -oP '"file_path"\s*:\s*"\K[^"]+' | head -1)

if [[ -z "${FILE_PATH:-}" ]]; then
    exit 0
fi

# Only check files inside module directories (apps/{domain}/{module}/src/).
if ! echo "$FILE_PATH" | grep -qE 'apps/[^/]+/[^/]+/src/'; then
    exit 0
fi

# Only check TS/TSX files.
case "$FILE_PATH" in
    *.ts|*.tsx) ;;
    *) exit 0 ;;
esac

# Extract domain and module from path: apps/{domain}/{module}/src/...
DOMAIN=$(echo "$FILE_PATH" | grep -oP 'apps/\K[^/]+(?=/[^/]+/src/)')
MODULE=$(echo "$FILE_PATH" | grep -oP 'apps/[^/]+/\K[^/]+(?=/src/)')

if [[ -z "${DOMAIN:-}" || -z "${MODULE:-}" ]]; then
    exit 0
fi

OWN_PACKAGE="@modules/${DOMAIN}-${MODULE}"

# Scan the entire input for @modules/ references. In the JSON payload,
# @modules/ can only appear in new_string (Edit) or content (Write) — not
# in file_path or other fields. This avoids fragile JSON value extraction
# that breaks on escaped quotes.
VIOLATIONS=$(echo "$INPUT" | grep -oP '@modules/[a-z0-9-]+' | grep -v "^${OWN_PACKAGE}$" | sort -u)

if [[ -n "$VIOLATIONS" ]]; then
    echo "Blocked: cross-module import violates architectural invariant." >&2
    echo "Module ${OWN_PACKAGE} cannot import from:" >&2
    echo "$VIOLATIONS" | while read -r pkg; do
        echo "  - $pkg" >&2
    done
    echo "Modules must never import from other modules. Use @packages/* for shared code." >&2
    exit 2
fi

exit 0
