#!/bin/bash
# Build binaries for all platforms

set -e

echo "Building Clutch binaries..."
echo ""

# Build and bundle
echo "→ Compiling TypeScript and bundling..."
npm run build:all

# Build binaries
echo "→ Building binaries for all platforms..."
npx pkg dist/ncc/index.js \
  --targets node18-macos-x64,node18-macos-arm64,node18-linux-x64,node18-linux-arm64 \
  --compress Brotli \
  --output clutch

echo ""
echo "✓ Binaries built:"
ls -lh clutch-*
echo ""

# Generate checksums
echo "→ Generating checksums..."
for binary in clutch-*; do
  if [[ "$OSTYPE" == "darwin"* ]]; then
    shasum -a 256 "$binary" | cut -d' ' -f1 > "$binary.sha256"
  else
    sha256sum "$binary" | cut -d' ' -f1 > "$binary.sha256"
  fi
  echo "  $(cat "$binary.sha256")  $binary"
done

echo ""
echo "✓ Done! Binaries are ready for release."
