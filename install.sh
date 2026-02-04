#!/bin/bash
# Clutch Installer

set -e

CLUTCH_URL="https://raw.githubusercontent.com/michaelsayman/clutch/main"
CLUTCH_DIR="$HOME/.clutch"
INSTALL_PATH="$HOME/.local/bin/clutch"
LIB_PATH="$HOME/.local/lib/clutch"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}Installing Clutch...${NC}\n"

# Check for Node.js
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}Error: Node.js is required but not installed${NC}" >&2
    echo "Install from: https://nodejs.org/" >&2
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js 18 or higher is required${NC}" >&2
    echo "Current version: $(node -v)" >&2
    echo "Install from: https://nodejs.org/" >&2
    exit 1
fi

# Check for Git
if ! command -v git >/dev/null 2>&1; then
    echo "Git is required but not installed" >&2
    echo "Install from: https://git-scm.com/downloads" >&2
    exit 1
fi

# Check for Claude Code
if ! command -v claude >/dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Claude Code CLI not found${NC}" >&2
    echo "Clutch requires Claude Code to function." >&2
    echo -e "Install from: https://claude.ai/download\n" >&2
    read -p "Continue anyway? [y/N]: " cont
    [[ ! "$cont" =~ ^[Yy]$ ]] && exit 1
fi

# Create directories
mkdir -p "$CLUTCH_DIR"
mkdir -p "$HOME/.local/bin"
mkdir -p "$LIB_PATH"

# Install from local or remote
if [ -f "$(dirname "$0")/package.json" ]; then
    # Local installation
    echo "Installing from local directory..."

    # Check if already built
    if [ ! -d "$(dirname "$0")/dist" ]; then
        echo "Building Clutch..."
        cd "$(dirname "$0")"
        npm install --production
        npm run build
        cd - > /dev/null
    fi

    # Copy built files
    cp -r "$(dirname "$0")/dist" "$LIB_PATH/"
    cp "$(dirname "$0")/package.json" "$LIB_PATH/"

    # Copy node_modules (only production dependencies)
    if [ -d "$(dirname "$0")/node_modules" ]; then
        cp -r "$(dirname "$0")/node_modules" "$LIB_PATH/"
    else
        cd "$LIB_PATH"
        npm install --production --silent
        cd - > /dev/null
    fi
else
    # Remote installation
    echo "Downloading Clutch..."

    # Download and extract
    temp_dir=$(mktemp -d)
    git clone --depth 1 https://github.com/michaelsayman/clutch.git "$temp_dir"

    cd "$temp_dir"
    npm install --production --silent
    npm run build

    cp -r dist "$LIB_PATH/"
    cp package.json "$LIB_PATH/"
    cp -r node_modules "$LIB_PATH/"

    cd - > /dev/null
    rm -rf "$temp_dir"
fi

# Create wrapper script
cat > "$INSTALL_PATH" << 'EOF'
#!/bin/bash
NODE_PATH="$HOME/.local/lib/clutch/node_modules" node "$HOME/.local/lib/clutch/dist/index.js" "$@"
EOF

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
