#!/bin/bash
# Clutch Installer

set -e

# Configuration
CLUTCH_URL="https://raw.githubusercontent.com/user/clutch/main/clutch"
CLUTCH_DIR="$HOME/.clutch"
INSTALL_PATH="$HOME/.local/bin/clutch"

# Check for required dependencies
DOWNLOADER=""
if command -v curl >/dev/null 2>&1; then
    DOWNLOADER="curl"
elif command -v wget >/dev/null 2>&1; then
    DOWNLOADER="wget"
else
    echo "Either curl or wget is required but neither is installed" >&2
    exit 1
fi

# Download function that works with both curl and wget
download_file() {
    local url="$1"
    local output="$2"

    if [ "$DOWNLOADER" = "curl" ]; then
        if [ -n "$output" ]; then
            curl -fsSL -o "$output" "$url"
        else
            curl -fsSL "$url"
        fi
    elif [ "$DOWNLOADER" = "wget" ]; then
        if [ -n "$output" ]; then
            wget -q -O "$output" "$url"
        else
            wget -q -O - "$url"
        fi
    else
        return 1
    fi
}

# Check for Git
if ! command -v git >/dev/null 2>&1; then
    echo "Git is required but not installed" >&2
    echo "Install from: https://git-scm.com/downloads" >&2
    exit 1
fi

# Check for Claude Code
if ! command -v claude >/dev/null 2>&1; then
    echo "Warning: Claude Code CLI not found" >&2
    echo "Clutch requires Claude Code to function." >&2
    echo "Install from: https://claude.ai/download" >&2
    echo "" >&2
    read -p "Continue anyway? [y/N]: " cont
    [[ ! "$cont" =~ ^[Yy]$ ]] && exit 1
fi

# Check for optional dependencies
if ! command -v jq >/dev/null 2>&1; then
    echo "Note: jq not found (recommended for metadata parsing)" >&2
    case "$(uname -s)" in
        Darwin) echo "Install with: brew install jq" >&2 ;;
        Linux) echo "Install with: sudo apt install jq (or equivalent)" >&2 ;;
    esac
    echo "" >&2
fi

# Create directories
mkdir -p "$CLUTCH_DIR"
mkdir -p "$HOME/.local/bin"

# Install from local or remote
if [ -f "$(dirname "$0")/clutch" ]; then
    # Local installation
    echo "Installing from local directory..."
    cp "$(dirname "$0")/clutch" "$INSTALL_PATH"
    chmod +x "$INSTALL_PATH"
else
    # Remote installation
    echo "Downloading clutch..."
    temp_file=$(mktemp)
    if ! download_file "$CLUTCH_URL" "$temp_file"; then
        echo "Download failed" >&2
        rm -f "$temp_file"
        exit 1
    fi

    echo "Installing clutch to $INSTALL_PATH..."
    mv "$temp_file" "$INSTALL_PATH"
    chmod +x "$INSTALL_PATH"
fi

# Verify installation
if ! command -v clutch >/dev/null 2>&1; then
    echo "" >&2
    echo "Installation complete, but clutch is not in your PATH." >&2
    echo "Add this line to your shell profile (~/.bashrc, ~/.zshrc, etc.):" >&2
    echo "" >&2
    echo "  export PATH=\"\$HOME/.local/bin:\$PATH\"" >&2
    echo "" >&2
    echo "Then restart your shell or run: source ~/.bashrc" >&2
    exit 0
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "Get started:"
echo "  clutch init https://github.com/user/repo"
echo "  clutch status"
echo "  clutch run"
echo ""
