#!/usr/bin/env bash
set -uo pipefail

# PreToolUse/Edit|Write: enforce architectural layering rules on TS/TSX files.
#
# ┌────────────────────┬─────────────────────────────────┬──────────────────────────────┐
# │ Layer              │ May import from                 │ Blocked                      │
# ├────────────────────┼─────────────────────────────────┼──────────────────────────────┤
# │ @apps/host         │ @modules/*, @packages/*         │ @apps/*                      │
# │ @modules/*         │ @packages/* only                │ @modules/* (cross), @apps/*  │
# │ @apps/*-storybook  │ @packages/* only                │ @modules/*, @apps/*          │
# │ @packages/*        │ @packages/* only                │ @modules/*, @apps/*          │
# └────────────────────┴─────────────────────────────────┴──────────────────────────────┘
#
# Optimized for Windows: uses bash builtins instead of grep subprocesses.

INPUT=$(cat)

# Fast exit: extract file_path with bash pattern matching instead of grep.
# The JSON payload always contains "file_path" as the first path-like field.
if [[ "$INPUT" =~ \"file_path\"[[:space:]]*:[[:space:]]*\"([^\"]+)\" ]]; then
    FILE_PATH="${BASH_REMATCH[1]}"
else
    exit 0
fi

# Only check TS/TSX files.
case "$FILE_PATH" in
    *.ts|*.tsx) ;;
    *) exit 0 ;;
esac

# Determine layer and context using bash pattern matching.
LAYER=""
CONTEXT=""

case "$FILE_PATH" in
    apps/host/*)
        LAYER="host"
        CONTEXT="@apps/host"
        ;;
    apps/storybook/*)
        LAYER="storybook"
        CONTEXT="@apps/storybook"
        ;;
    apps/*/storybook/*)
        LAYER="storybook"
        # Extract domain: apps/{domain}/storybook/...
        local_path="${FILE_PATH#apps/}"
        DOMAIN="${local_path%%/storybook/*}"
        CONTEXT="@apps/${DOMAIN}-storybook"
        ;;
    apps/*/*/*)
        LAYER="module"
        # Extract domain and module: apps/{domain}/{module}/...
        local_path="${FILE_PATH#apps/}"
        DOMAIN="${local_path%%/*}"
        rest="${local_path#*/}"
        MODULE="${rest%%/*}"
        if [[ -z "$DOMAIN" || -z "$MODULE" ]]; then
            exit 0
        fi
        CONTEXT="@modules/${DOMAIN}-${MODULE}"
        ;;
    packages/*/*)
        LAYER="package"
        local_path="${FILE_PATH#packages/}"
        PKG_DIR="${local_path%%/*}"
        if [[ -z "$PKG_DIR" ]]; then
            exit 0
        fi
        CONTEXT="@packages/${PKG_DIR}"
        ;;
    *)
        exit 0
        ;;
esac

# Single grep call: extract all @modules/* and @apps/* references at once.
REFS=$(echo "$INPUT" | grep -oP '@(modules|apps)/[a-z0-9-]+' | sort -u) || true

if [[ -z "$REFS" ]]; then
    exit 0
fi

# Check each reference against the layer rules.
VIOLATIONS=""

while IFS= read -r ref; do
    [[ -z "$ref" ]] && continue

    case "$LAYER" in
        host)
            # Host: block @apps/* only.
            [[ "$ref" == @apps/* ]] && VIOLATIONS+="  - $ref"$'\n'
            ;;
        module)
            # Modules: block @apps/* and cross-module @modules/*.
            if [[ "$ref" == @apps/* ]]; then
                VIOLATIONS+="  - $ref"$'\n'
            elif [[ "$ref" == @modules/* && "$ref" != "$CONTEXT" ]]; then
                VIOLATIONS+="  - $ref"$'\n'
            fi
            ;;
        storybook|package)
            # Storybooks and packages: block @modules/* and @apps/*.
            VIOLATIONS+="  - $ref"$'\n'
            ;;
    esac
done <<< "$REFS"

if [[ -n "$VIOLATIONS" ]]; then
    echo "Blocked: import violates architectural layering." >&2
    echo "${CONTEXT} cannot import from:" >&2
    echo -n "$VIOLATIONS" >&2
    case "$LAYER" in
        host)      echo "Host may import from @modules/* and @packages/*, but never from other @apps/*." >&2 ;;
        module)    echo "Modules may only import from @packages/*." >&2 ;;
        storybook) echo "Storybooks may only import from @packages/*." >&2 ;;
        package)   echo "Packages may only import from other @packages/*." >&2 ;;
    esac
    exit 2
fi

exit 0
