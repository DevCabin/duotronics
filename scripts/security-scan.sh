#!/usr/bin/env bash
# security-scan.sh — re-run Duotronics security scan per security-scan-spec.md.
#
# Pipeline:
#  1. npm audit (SCA)
#  2. next lint baseline
#  3. custom architectural auditor (TS)
#  4. patch apply-check (does every patch apply cleanly from clean tree?)
#  5. (optional) next-build to confirm patches don't break tsc
#
# Output: prints to stdout; for CI integration, redirect to a log file.
# Exit: 0 always for the scan itself; non-zero if any patch fails --check.

set -uo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"

echo "==[ 1/5 ] npm audit (--omit=dev) ==============================="
npm audit --omit=dev --json 2>/dev/null | \
  node -e '
    let d=""; process.stdin.on("data",c=>d+=c);
    process.stdin.on("end",()=>{
      try{
        const j=JSON.parse(d);
        const v=j.vulnerabilities||{};
        const order=["critical","high","moderate","low","info"];
        const counts={};
        order.forEach(s=>counts[s]=v[s]??0);
        console.log("Severity counts:", JSON.stringify(counts));
        if(j.metadata?.vulnerabilities){
          console.log("Metadata:", JSON.stringify(j.metadata.vulnerabilities));
        }
      }catch(e){ console.log("audit json parse failed:", e.message) }
    });'

echo
echo "==[ 2/5 ] next lint baseline ==================================="
npx next lint 2>&1 | tail -40 || true

echo
echo "==[ 3/5 ] custom architectural auditor ========================="
npx tsx scripts/security-scan.ts 2>&1 || \
  npx tsc --target es2022 --module commonjs --outDir /tmp/dtscan \
    scripts/security-scan.ts && node /tmp/dtscan/scripts/security-scan.js

echo
echo "==[ 4/5 ] patch apply-check ====================================="
fail=0
for f in security-patches/*.patch; do
  [ -f "$f" ] || continue
  if git apply --check "$f" 2>/dev/null; then
    printf "  OK  %s\n" "$f"
  else
    printf "  FAIL %s\n" "$f"
    fail=1
  fi
done

echo
echo "==[ 5/5 ] tsc (best-effort, only if tsc available) ============="
if [ -x node_modules/.bin/tsc ]; then
  node_modules/.bin/tsc --noEmit || echo "(tsc reported errors — fix before launch)"
else
  echo "  (skipping: tsc not installed in node_modules)"
fi

echo
echo "== summary ===================================================="
if [ "$fail" -eq 0 ]; then
  echo "Scan complete. All patches apply cleanly."
  exit 0
else
  echo "Scan complete. Some patches DO NOT apply cleanly. Review above."
  exit 2
fi
