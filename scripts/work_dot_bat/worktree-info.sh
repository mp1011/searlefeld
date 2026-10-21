#!/usr/bin/env bash
# work_dot_bat managed file — DO NOT EDIT; overwritten by `work_dot_bat sync`.
# file: scripts/work_dot_bat/worktree-info.sh
# version: 2.0.1
# date: 2026-10-14
# sha256: 555c4fbfa221f66a7b6f717f9ea92e8c44b42cf455acc5bdc4daf32978a73cf4
# Read-only: prints the current worktree's path/branch, the main checkout's
# path, and whether they're the same. See the `work_dot_bat worktree-info` command.
#
#   scripts/work_dot_bat/worktree-info.sh
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
exec "$bin" ${runflag:-} worktree-info "$@"
