#!/bin/bash
# Project Crawler - Repository Initializer
# Prepares any GitHub repo for automated file description generation

CRAWLER_DIR="/Users/saymanmini/Documents/GitHub/crawler"
cd "$CRAWLER_DIR"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BOLD='\033[1m'
NC='\033[0m'

clear
echo -e "${CYAN}${BOLD}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║        Project Crawler - Repository Initializer           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Get repo URL
read -p "Enter GitHub repository URL: " REPO_URL
if [ -z "$REPO_URL" ]; then
    echo -e "${YELLOW}No URL provided. Exiting.${NC}"
    exit 1
fi

# Extract repo name
REPO_NAME=$(basename -s .git "$REPO_URL")
REPO_DIR="$CRAWLER_DIR/repos/$REPO_NAME"

echo -e "\n${CYAN}Repository:${NC} $REPO_NAME"
echo -e "${CYAN}Clone path:${NC} $REPO_DIR\n"

# Clean up old clone if exists
if [ -d "$REPO_DIR" ]; then
    read -p "Directory exists. Remove and re-clone? [Y/n]: " reclone
    if [[ ! "$reclone" =~ ^[Nn] ]]; then
        rm -rf "$REPO_DIR"
    else
        echo -e "${GREEN}Using existing clone.${NC}"
    fi
fi

# Clone repository
if [ ! -d "$REPO_DIR" ]; then
    echo -e "${CYAN}Cloning repository...${NC}"
    git clone "$REPO_URL" "$REPO_DIR" 2>&1 | grep -E "(Cloning|done)"
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}Failed to clone repository.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Clone complete${NC}\n"
fi

# Generate file list with line counts
echo -e "${CYAN}Analyzing repository files...${NC}"

# Find all relevant code files (exclude common non-code files)
find "$REPO_DIR" -type f \
    ! -path "*/node_modules/*" \
    ! -path "*/.git/*" \
    ! -path "*/dist/*" \
    ! -path "*/build/*" \
    ! -path "*/.next/*" \
    ! -path "*/coverage/*" \
    ! -path "*/__pycache__/*" \
    ! -path "*/.cache/*" \
    ! -path "*/vendor/*" \
    ! -name "package-lock.json" \
    ! -name "yarn.lock" \
    ! -name "*.min.js" \
    ! -name "*.map" \
    ! -name "*.log" \
    > "$CRAWLER_DIR/all_files.txt"

TOTAL_FILES=$(wc -l < "$CRAWLER_DIR/all_files.txt" | tr -d ' ')
echo -e "${GREEN}✓ Found $TOTAL_FILES files${NC}\n"

# Count lines of code
echo -e "${CYAN}Counting lines of code...${NC}"
TOTAL_LOC=0
> "$CRAWLER_DIR/file_stats.txt"

while IFS= read -r file; do
    if [ -f "$file" ]; then
        LOC=$(wc -l < "$file" 2>/dev/null | tr -d ' ')
        [ -z "$LOC" ] && LOC=0
        TOTAL_LOC=$((TOTAL_LOC + LOC))
        echo "$file|$LOC" >> "$CRAWLER_DIR/file_stats.txt"
    fi
done < "$CRAWLER_DIR/all_files.txt"

echo -e "${GREEN}✓ Total lines of code: $(printf "%'d" $TOTAL_LOC)${NC}\n"

# Generate project context using Claude Code
echo -e "${CYAN}Generating project context file...${NC}"
echo -e "${YELLOW}This may take a moment...${NC}\n"

claude --dangerously-skip-permissions -p "You are analyzing a code repository to generate project documentation.

## Repository Information
- Name: $REPO_NAME
- Location: $REPO_DIR
- Total Files: $TOTAL_FILES
- Total Lines: $TOTAL_LOC

## Your Task
1. Explore the repository structure at $REPO_DIR
2. Read key files like README.md, package.json, go.mod, setup.py, or similar to understand the project
3. Analyze the directory structure and main code files
4. Generate a comprehensive PROJECT_CONTEXT.md file at $CRAWLER_DIR/PROJECT_CONTEXT.md with:
   - Project name and purpose (2-3 sentences)
   - Core architecture and components
   - Key technologies and frameworks used
   - Repository structure explanation
   - Main features/functionality

Use clear markdown formatting. Make it informative so other AI agents can understand the project architecture.

5. After writing PROJECT_CONTEXT.md, append one line to $CRAWLER_DIR/init_log.txt:
   SUCCESS: Generated context for $REPO_NAME

EXIT immediately after completing." 2>/dev/null

if [ -f "$CRAWLER_DIR/PROJECT_CONTEXT.md" ]; then
    echo -e "${GREEN}✓ Project context generated${NC}\n"
else
    echo -e "${YELLOW}⚠ Context generation may have failed${NC}\n"
fi

# Clean up old run data
> "$CRAWLER_DIR/completed.txt"
> "$CRAWLER_DIR/descriptions.jsonl"
> "$CRAWLER_DIR/live_log.txt"
> "$CRAWLER_DIR/active_workers.txt"

# Summary
echo -e "${CYAN}${BOLD}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║                  Initialization Complete                  ║${NC}"
echo -e "${CYAN}${BOLD}╚═══════════════════════════════════════════════════════════╝${NC}\n"

echo -e "  ${BOLD}Repository:${NC} $REPO_NAME"
echo -e "  ${BOLD}Files:${NC} $TOTAL_FILES"
echo -e "  ${BOLD}Lines of code:${NC} $(printf "%'d" $TOTAL_LOC)"
echo -e "  ${BOLD}Context file:${NC} PROJECT_CONTEXT.md"
echo -e "\n${GREEN}Ready to run! Execute:${NC} ${BOLD}./run.sh${NC}\n"
