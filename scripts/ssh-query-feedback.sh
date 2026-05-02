#!/usr/bin/env bash
# Query production feedback by SSHing to a TheoShift app host and using psql
# with DATABASE_URL from that host's .env.green (no secrets in git).
#
#   ./scripts/ssh-query-feedback.sh              # all recent
#   ./scripts/ssh-query-feedback.sh new          # status = NEW only
#
# Override host if your SSH config uses a different alias:
#   FEEDBACK_SSH_HOST=jwg ./scripts/ssh-query-feedback.sh

set -euo pipefail
MODE="${1:-all}"
HOST="${FEEDBACK_SSH_HOST:-green-theoshift}"
REMOTE_DIR="${FEEDBACK_REMOTE_DIR:-/opt/theoshift}"

WHERE_ALL='1=1'
WHERE_NEW="status = 'NEW'"
WHERE="$WHERE_ALL"
if [[ "$MODE" == "new" ]]; then
  WHERE="$WHERE_NEW"
fi

ssh -o BatchMode=yes "$HOST" bash -s <<EOF
set -euo pipefail
cd "$REMOTE_DIR"
set -a
[ -f .env.green ] && . ./.env.green
set +a
if [ -z "\${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL not set in $REMOTE_DIR/.env.green" >&2
  exit 1
fi
psql "\$DATABASE_URL" -v ON_ERROR_STOP=1 -c "
SELECT COALESCE(\"feedbackNumber\", '—') AS fb,
       type::text,
       status::text,
       priority::text,
       title,
       \"createdAt\"
FROM feedback
WHERE $WHERE
ORDER BY \"createdAt\" DESC
LIMIT 50;
"
EOF
