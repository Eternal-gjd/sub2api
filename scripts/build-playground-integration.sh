#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)

pushd "$ROOT/image-playground" >/dev/null
npm ci
npm test -- --run
npm run build
rm -rf "$ROOT/frontend/public/gpt-image-playground"
mkdir -p "$ROOT/frontend/public/gpt-image-playground"
cp -a dist/. "$ROOT/frontend/public/gpt-image-playground/"
popd >/dev/null

pushd "$ROOT/frontend" >/dev/null
pnpm install --frozen-lockfile
pnpm test:run src/views/user/__tests__/ImagePlaygroundView.spec.ts
pnpm build
popd >/dev/null

GO_BIN=${GO_BIN:-$(command -v go || true)}
if [[ -z "$GO_BIN" && -x /usr/local/go/bin/go ]]; then
  GO_BIN=/usr/local/go/bin/go
fi
if [[ -z "$GO_BIN" ]]; then
  echo "Go is required; set GO_BIN to the Go executable." >&2
  exit 2
fi

pushd "$ROOT/backend" >/dev/null
"$GO_BIN" test ./internal/server/middleware -run TestSecurityHeaders -count=1
"$GO_BIN" test -tags embed ./internal/web -run TestFrontendServer_Middleware -count=1
popd >/dev/null

git -C "$ROOT" diff --check

echo "Playground integration build and tests passed."
