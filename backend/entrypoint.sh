#!/bin/sh
set -e
# Fix ownership of Docker volume mounts, then drop to non-root user
chown -R appuser:appgroup /app/staticfiles /app/media 2>/dev/null || true
exec gosu appuser "$@"
