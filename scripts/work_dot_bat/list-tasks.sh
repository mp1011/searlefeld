#!/usr/bin/env bash
# work_dot_bat managed file — DO NOT EDIT; overwritten by `work_dot_bat sync`.
# file: scripts/work_dot_bat/list-tasks.sh
# version: 2.0.1
# date: 2026-10-14
# sha256: a33e4e25b1539c86b40e39d21694dd76dd63e8bd3ecd790c1dbc851a7b715729
# Print open tasks (incomplete plans) in agent_docs/plans, indexed by number.
# See scripts/work_dot_bat/`work_dot_bat plan-status`.
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
exec "$bin" ${runflag:-} list-tasks "$@"
