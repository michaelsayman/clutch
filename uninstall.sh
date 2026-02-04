#!/bin/bash
# Clutch Uninstaller

set -e

INSTALL_PATH="$HOME/.local/bin/clutch"
CLUTCH_DIR="$HOME/.clutch"

echo "Uninstalling Clutch..."

# Remove binary
if [ -f "$INSTALL_PATH" ]; then
    echo "Removing clutch binary..."
    rm -f "$INSTALL_PATH"
fi

# Remove data
if [ -d "$CLUTCH_DIR" ]; then
    echo "Removing clutch data..."
    rm -rf "$CLUTCH_DIR"
fi

echo ""
echo "✅ Clutch uninstalled"
echo ""
