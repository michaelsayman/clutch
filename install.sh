#!/bin/bash
# Clutch Installer - Downloads pre-built binary

set -e

GITHUB_REPO="michaelsayman/clutch"
DOWNLOAD_DIR="$HOME/.clutch/downloads"
INSTALL_PATH="$HOME/.local/bin/clutch"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}Installing Clutch...${NC}\n"

# Check for curl or wget
DOWNLOADER=""
if command -v curl >/dev/null 2>&1; then
    DOWNLOADER="curl"
elif command -v wget >/dev/null 2>&1; then
    DOWNLOADER="wget"
else
    echo -e "${RED}Error: Either curl or wget is required${NC}" >&2
    exit 1
fi

# Download function
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
    fi
}

# Detect platform
case "$(uname -s)" in
    Darwin) os="darwin" ;;
    Linux) os="linux" ;;
    *) echo -e "${RED}Error: Windows is not supported${NC}" >&2; exit 1 ;;
esac

case "$(uname -m)" in
    x86_64|amd64) arch="x64" ;;
    arm64|aarch64) arch="arm64" ;;
    *) echo -e "${RED}Error: Unsupported architecture: $(uname -m)${NC}" >&2; exit 1 ;;
esac

platform="${os}-${arch}"
mkdir -p "$DOWNLOAD_DIR"
mkdir -p "$HOME/.local/bin"

# Get latest release version
echo "→ Fetching latest version..."
version=$(download_file "https://api.github.com/repos/$GITHUB_REPO/releases/latest" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$version" ]; then
    echo -e "${RED}Error: Could not fetch latest version${NC}" >&2
    echo "Please check https://github.com/$GITHUB_REPO/releases" >&2
    exit 1
fi

echo "→ Downloading Clutch $version for $platform..."

# Download binary
binary_url="https://github.com/$GITHUB_REPO/releases/download/$version/clutch-$platform"
binary_path="$DOWNLOAD_DIR/clutch-$version-$platform"

if ! download_file "$binary_url" "$binary_path"; then
    echo -e "${RED}Error: Download failed${NC}" >&2
    echo "Binary not found at: $binary_url" >&2
    rm -f "$binary_path"
    exit 1
fi

# Download and verify checksum
echo "→ Verifying checksum..."
manifest_url="https://github.com/$GITHUB_REPO/releases/download/$version/manifest.json"
manifest_json=$(download_file "$manifest_url" 2>/dev/null || echo "")

if [ -n "$manifest_json" ]; then
    expected_checksum=$(echo "$manifest_json" | grep -o "\"$platform\"[^}]*\"checksum\"[[:space:]]*:[[:space:]]*\"[a-f0-9]*\"" | grep -o "[a-f0-9]\{64\}")

    if [ -n "$expected_checksum" ]; then
        if [ "$os" = "darwin" ]; then
            actual_checksum=$(shasum -a 256 "$binary_path" | cut -d' ' -f1)
        else
            actual_checksum=$(sha256sum "$binary_path" | cut -d' ' -f1)
        fi

        if [ "$actual_checksum" != "$expected_checksum" ]; then
            echo -e "${RED}Error: Checksum verification failed${NC}" >&2
            rm -f "$binary_path"
            exit 1
        fi
    fi
fi

# Install binary
echo "→ Installing to $INSTALL_PATH..."
mv "$binary_path" "$INSTALL_PATH"
chmod +x "$INSTALL_PATH"

# Verify installation
if ! command -v clutch >/dev/null 2>&1; then
    echo "" >&2
    echo -e "${YELLOW}Installation complete, but clutch is not in your PATH.${NC}" >&2
    echo "Add this line to your shell profile (~/.bashrc, ~/.zshrc, etc.):" >&2
    echo "" >&2
    echo "  export PATH=\"\$HOME/.local/bin:\$PATH\"" >&2
    echo "" >&2
    echo "Then restart your shell or run: source ~/.bashrc" >&2
    exit 0
fi

echo ""
echo -e "${GREEN}${BOLD}✅ Clutch installed successfully!${NC}\n"
echo "Get started:"
echo "  clutch init https://github.com/user/repo"
echo "  clutch status"
echo "  clutch"
echo ""
