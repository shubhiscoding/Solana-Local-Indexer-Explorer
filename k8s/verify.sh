#!/usr/bin/env bash
# End-to-end check for the solana-explorer namespace.
# Usage: k8s/verify.sh
set -euo pipefail

NS=solana-explorer
PORT=3100

fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "PASS: $*"; }

for w in statefulset/postgres deploy/validator deploy/indexer deploy/explorer; do
  kubectl -n "$NS" rollout status "$w" --timeout=120s >/dev/null || fail "$w not ready"
  pass "$w ready"
done

kubectl -n "$NS" exec deploy/validator -- curl -sf http://localhost:8899/health >/dev/null \
  || fail "validator /health"
pass "validator /health ok"

kubectl -n "$NS" port-forward svc/explorer "$PORT:3000" >/dev/null 2>&1 &
PF_PID=$!
trap 'kill $PF_PID 2>/dev/null || true' EXIT
for _ in $(seq 1 30); do
  curl -sf -o /dev/null "http://localhost:$PORT/" && break
  sleep 1
done
STATUS=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/")
[ "$STATUS" = "200" ] || fail "explorer HTTP $STATUS"
pass "explorer HTTP 200"

COUNT=$(kubectl -n "$NS" exec postgres-0 -- psql -U postgres -d explorer -tAc 'select count(*) from "Transaction";')
[ "$COUNT" -gt 0 ] || fail "no indexed transactions"
pass "indexed transactions in database: $COUNT"
