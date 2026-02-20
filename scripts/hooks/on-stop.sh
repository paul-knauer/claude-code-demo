#!/bin/bash
# =============================================================================
# on-stop.sh — Claude Code Stop Hook Example
# =============================================================================
# This script runs when a Claude Code session ends (the Stop event).
# Use it for cleanup, audit logging, notifications, or post-session summaries.
#
# No stdin input is provided for Stop hooks.
# =============================================================================

LOG_FILE="$(dirname "$0")/session.log"

# Append a timestamped entry to the session log
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Claude Code session ended" >> "$LOG_FILE"

echo "[on-stop] Session logged to $LOG_FILE" >&2

exit 0
