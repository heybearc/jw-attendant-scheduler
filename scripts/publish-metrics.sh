#!/usr/bin/env bash
set -euo pipefail
if [ -f package.json ]; then
  npm ci || npm install || true
  npx -y size-limit --json > size.json || true
fi
if [ "${QOS_URL:-}" != "" ]; then
  npx -y autocannon -d 10 -c 10 "$QOS_URL" > perf.txt || true
  echo '{"latency":{"p95":9999}}' > perf.json
  grep -i 'p95' perf.txt | awk '{print $NF}' | head -n1 | xargs -I{} python - <<'PY'
import json,sys
p95=float(sys.argv[1]) if len(sys.argv)>1 else 9999
json.dump({"latency":{"p95":p95}}, open("perf.json","w"))
PY {}
fi
echo "Metrics published (best-effort)."
