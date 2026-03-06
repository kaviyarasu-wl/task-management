#!/bin/bash
set -euo pipefail

# Container health check script
# Used by Docker HEALTHCHECK to verify the app is ready to serve traffic

HEALTH_URL="${HEALTH_URL:-http://localhost:3000/health/ready}"
TIMEOUT="${HEALTH_TIMEOUT:-5}"

response=$(wget -qO- --timeout="${TIMEOUT}" "${HEALTH_URL}" 2>/dev/null) || exit 1

# Check that response contains "ok" status
echo "${response}" | grep -q '"status":"ok"' || exit 1

exit 0
