#!/bin/bash
# Project Crawler - File Description Generator

DESC_DIR="/Users/saymanmini/Documents/GitHub/crawler"
cd "$DESC_DIR"

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

clear
echo -e "${CYAN}${BOLD}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           Project Crawler - File Descriptions             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

TOTAL=$(wc -l < all_files.txt | tr -d ' ')
DONE=$(wc -l < completed.txt 2>/dev/null | tr -d ' ')
[ -z "$DONE" ] && DONE=0
REMAINING=$((TOTAL - DONE))

echo -e "  Total: ${CYAN}$TOTAL${NC}  Completed: ${GREEN}$DONE${NC}  Remaining: ${YELLOW}$REMAINING${NC}"
echo ""

if [ "$REMAINING" -eq 0 ]; then
    echo -e "${GREEN}✓ All files processed!${NC}"
    exit 0
fi

# Worker selection
echo -e "${BOLD}Workers:${NC} ${CYAN}1)${NC}10  ${CYAN}2)${NC}20  ${CYAN}3)${NC}30  ${CYAN}4)${NC}40  ${CYAN}5)${NC}50  ${CYAN}c)${NC}custom"
read -p "Select [1-5, c]: " choice

case $choice in
    1) WORKERS=10 ;; 2) WORKERS=20 ;; 3) WORKERS=30 ;; 4) WORKERS=40 ;; 5) WORKERS=50 ;;
    c|C) read -p "Enter number: " WORKERS ;;
    *) WORKERS=20 ;;
esac
[[ ! "$WORKERS" =~ ^[0-9]+$ ]] && WORKERS=20
[ "$WORKERS" -gt 100 ] && WORKERS=100

# Continue or restart?
if [ "$DONE" -gt 0 ]; then
    read -p "Continue from previous run? [Y/n]: " cont
    if [[ "$cont" =~ ^[Nn] ]]; then
        > completed.txt && > descriptions.jsonl && > live_log.txt
        DONE=0
    fi
fi

# Initialize
> active_workers.txt
echo "$(date +%s)" > start_time.txt
START_TIME=$(date +%s)

PENDING=$(comm -23 <(sort all_files.txt) <(sort completed.txt 2>/dev/null || true))

# Live progress display
show_progress() {
    while true; do
        sleep 1

        NOW=$(date +%s)
        ELAPSED=$((NOW - START_TIME))
        COMPLETED=$(wc -l < completed.txt 2>/dev/null | tr -d ' ')
        [ -z "$COMPLETED" ] && COMPLETED=0
        REMAIN=$((TOTAL - COMPLETED))

        # Speed & ETA
        SPEED="--"; ETA="--"
        if [ "$ELAPSED" -gt 0 ] && [ "$COMPLETED" -gt 0 ]; then
            SPEED=$(echo "scale=1; $COMPLETED * 60 / $ELAPSED" | bc 2>/dev/null)
            if [ "$(echo "$SPEED > 0" | bc 2>/dev/null)" = "1" ]; then
                ETA_MIN=$(echo "scale=0; $REMAIN / $SPEED" | bc 2>/dev/null)
                [ "$ETA_MIN" -ge 60 ] && ETA="$((ETA_MIN/60))h $((ETA_MIN%60))m" || ETA="${ETA_MIN}m"
            fi
        fi

        # Elapsed format
        E_MIN=$((ELAPSED / 60)); E_SEC=$((ELAPSED % 60))
        [ "$E_MIN" -ge 60 ] && ELAPSED_FMT="$((E_MIN/60))h $((E_MIN%60))m" || ELAPSED_FMT="${E_MIN}m ${E_SEC}s"

        # Progress bar
        PCT=$(echo "scale=1; $COMPLETED * 100 / $TOTAL" | bc 2>/dev/null || echo "0")
        FILLED=$(echo "scale=0; 40 * $COMPLETED / $TOTAL" | bc 2>/dev/null || echo "0")
        BAR=$(printf "%${FILLED}s" | tr ' ' '█')$(printf "%$((40-FILLED))s" | tr ' ' '░')

        clear
        echo -e "${CYAN}${BOLD}"
        echo "╔═══════════════════════════════════════════════════════════╗"
        echo "║           Project Crawler - Live Progress                 ║"
        echo "╚═══════════════════════════════════════════════════════════╝"
        echo -e "${NC}"
        echo -e "  ${CYAN}[$BAR]${NC} ${BOLD}${PCT}%${NC}"
        echo ""
        echo -e "  ${GREEN}Completed:${NC} ${BOLD}$COMPLETED${NC}/$TOTAL    ${YELLOW}Remaining:${NC} ${BOLD}$REMAIN${NC}"
        echo -e "  ${DIM}Speed:${NC} ${BOLD}$SPEED${NC}/min    ${DIM}Elapsed:${NC} ${BOLD}$ELAPSED_FMT${NC}    ${DIM}ETA:${NC} ${BOLD}$ETA${NC}"
        echo ""
        echo -e "${PURPLE}${BOLD}  Active Workers:${NC}"

        # Show active files
        if [ -s active_workers.txt ]; then
            grep -v '^$' active_workers.txt 2>/dev/null | while read -r file; do
                echo -e "    ${CYAN}→${NC} $file"
            done
        else
            echo -e "    ${DIM}(none)${NC}"
        fi

        echo ""
        echo -e "${DIM}  Ctrl+C to stop${NC}"

        [ "$REMAIN" -eq 0 ] && break
    done
}

show_progress &
PROGRESS_PID=$!

cleanup() {
    kill $PROGRESS_PID 2>/dev/null
    COMPLETED=$(wc -l < completed.txt 2>/dev/null | tr -d ' ')
    echo -e "\n${GREEN}Stopped. Completed: $COMPLETED / $TOTAL${NC}"
    exit 0
}
trap cleanup INT TERM

echo "$PENDING" | xargs -P "$WORKERS" -I {} ./process_file.sh {}

kill $PROGRESS_PID 2>/dev/null
clear
echo -e "${GREEN}${BOLD}✓ Complete! ${NC}$TOTAL files processed → descriptions.jsonl"
