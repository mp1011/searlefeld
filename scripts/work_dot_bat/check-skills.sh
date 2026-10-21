#!/usr/bin/env bash
# work_dot_bat managed file — DO NOT EDIT; overwritten by `work_dot_bat sync`.
# file: scripts/work_dot_bat/check-skills.sh
# version: 2.0.1
# date: 2026-10-14
# sha256: 5bc0d6ecf2e95938bb10f90036f1ce8aa477e40e31c3634fecc3b6053c805b8c
# Thin wrapper around the `work_dot_bat check-skills` command. See that command and
# agent_docs/plans/august_2026/aug_06_health_followup/03_repair_agents_skill_tree_and_add_check.md.
#
#   scripts/work_dot_bat/check-skills.sh check      # fail if any skill has broken path, name mismatch, or cross-tree routing mismatch
set -euo pipefail
bin="${WORK_DOT_BAT_BIN:-}"
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -n "$bin" ]; then
  :
elif command -v work_dot_bat >/dev/null 2>&1; then
  bin="work_dot_bat"
elif [ -f "$here/work" ]; then
  bin="$here/work"
  runflag="--run"
elif command -v work >/dev/null 2>&1; then
  bin="work"
  runflag="--run"
elif command -v work.bat >/dev/null 2>&1; then
  bin="work.bat"
  runflag="--run"
else
  echo "work binary not found: put work or work_dot_bat on PATH or set WORK_DOT_BAT_BIN." >&2
  exit 127
fi
exec "$bin" ${runflag:-} check-skills "$@"
