#!/bin/bash
# Build binaries for all platforms using Bun

set -e

echo "Building Clutch binaries with Bun..."
echo ""

# Check for Bun
if ! command -v bun >/dev/null 2>&1; then
    echo "Error: Bun is required but not installed"
    echo "Install from: https://bun.sh"
    exit 1
fi

# Install dependencies
echo "→ Installing dependencies..."
bun install

# Build binaries for each platform
echo "→ Building binaries for all platforms..."
echo ""

for target in bun-darwin-x64 bun-darwin-arm64 bun-linux-x64 bun-linux-arm64; do
  platform=$(echo $target | sed 's/bun-//')
  echo "Building $platform..."
  bun build --compile --minify --sourcemap --target=$target src/index.ts --outfile clutch-$platform
done

echo ""
echo "✓ Binaries built:"
ls -lh clutch-*
echo ""

# Generate checksums
echo "→ Generating checksums..."
for binary in clutch-*; do
  # Skip .sha256 files
  [[ "$binary" == *.sha256 ]] && continue

  if [[ "$OSTYPE" == "darwin"* ]]; then
    shasum -a 256 "$binary" | cut -d' ' -f1 > "$binary.sha256"
  else
    sha256sum "$binary" | cut -d' ' -f1 > "$binary.sha256"
  fi
  echo "  $(cat "$binary.sha256")  $binary"
done

echo ""
echo "✓ Done! Binaries are ready for release."
