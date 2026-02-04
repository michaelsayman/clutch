#!/bin/bash
# Process a single file with Claude Code
# Usage: ./process_file.sh <file_path>

FILE="$1"
DESC_DIR="/Users/saymanmini/Documents/GitHub/crawler"
LOG_FILE="$DESC_DIR/live_log.txt"
ACTIVE_FILE="$DESC_DIR/active_workers.txt"

if [ -z "$FILE" ]; then
    echo "Usage: $0 <file_path>"
    exit 1
fi

# Skip if already done
if grep -Fxq "$FILE" "$DESC_DIR/completed.txt" 2>/dev/null; then
    exit 0
fi

# Get short path for display (relative to repos directory)
SHORT="${FILE#$DESC_DIR/repos/}"

# Log start
echo "$(date +%H:%M:%S) START $SHORT" >> "$LOG_FILE"
echo "$SHORT" >> "$ACTIVE_FILE"

# Run Claude Code
claude --dangerously-skip-permissions -p "You are analyzing ONE file from a code repository as part of an automated documentation system.

IMPORTANT: Process ONLY this ONE file, then EXIT immediately.

## Your Task
1. First, read $DESC_DIR/PROJECT_CONTEXT.md for project architecture context
2. Read this file: $FILE
3. You MAY use the Explore tool or read related files to understand how this file fits into the project architecture. This helps you write a more informed description.
4. Write a 2-5 sentence description (MAXIMUM 400 characters) explaining:
   - What the file does
   - Its role/relationship in the project's architecture
   - Key functionality and how it connects to other parts of the system
5. Append ONE JSON line to $DESC_DIR/descriptions.jsonl:
   {\"file\":\"$FILE\",\"desc\":\"Your description here\"}
6. Append the file path to $DESC_DIR/completed.txt
7. EXIT immediately after completing these steps.

Use Bash with echo >> to append. Be accurate and insightful. Do NOT process multiple files - only $FILE." 2>/dev/null

# Log completion
echo "$(date +%H:%M:%S) DONE  $SHORT" >> "$LOG_FILE"

# Remove from active
grep -v "^$SHORT$" "$ACTIVE_FILE" > "$ACTIVE_FILE.tmp" 2>/dev/null && mv "$ACTIVE_FILE.tmp" "$ACTIVE_FILE"
