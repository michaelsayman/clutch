# Project Crawler

Automated file description generator for any GitHub repository using Claude Code.

## Overview

This tool clones any GitHub repository, analyzes its structure, and generates detailed descriptions for every code file using AI. Perfect for:
- Understanding unfamiliar codebases
- Generating documentation
- Creating searchable file indexes
- Onboarding new developers

## Quick Start

### 1. Initialize a Repository

```bash
./init.sh
```

This will:
- Prompt for a GitHub repository URL
- Clone the repo to `./repos/<repo-name>/`
- Analyze the codebase structure
- Count lines of code for all files
- Generate a `PROJECT_CONTEXT.md` file with architectural overview
- Prepare the file list for processing

### 2. Generate Descriptions

```bash
./run.sh
```

This launches parallel workers that:
- Read the project context
- Analyze each file individually
- Generate concise descriptions (max 400 characters)
- Output results to `descriptions.jsonl`

## Output Files

- **PROJECT_CONTEXT.md** - AI-generated project overview and architecture
- **all_files.txt** - List of all code files found
- **file_stats.txt** - Files with line counts (`path|lines`)
- **descriptions.jsonl** - JSON Lines format with file descriptions
- **completed.txt** - Processed files (for resuming interrupted runs)
- **live_log.txt** - Real-time processing log

## Worker Configuration

When running `./run.sh`, you can choose:
- **1-5**: Preset worker counts (10, 20, 30, 40, 50)
- **c**: Custom worker count (max 100)

More workers = faster processing, but more API usage.

## Resume Support

If interrupted, the crawler automatically detects completed files and offers to resume from where it left off.

## File Filtering

The initializer excludes common non-code directories:
- `node_modules/`, `dist/`, `build/`, `.next/`
- `.git/`, `coverage/`, `__pycache__/`, `.cache/`
- `package-lock.json`, `*.min.js`, `*.map`, `*.log`

## Requirements

- **Claude Code CLI** installed and authenticated
- **Git** for cloning repositories
- **Bash** 4.0+ (macOS/Linux)
- **bc** for progress calculations

## Example Workflow

```bash
# Initialize a new project
./init.sh
# Enter: https://github.com/user/awesome-project

# Review the generated context
cat PROJECT_CONTEXT.md

# Start processing with 30 workers
./run.sh
# Select: 3

# View results
cat descriptions.jsonl | jq
```

## Output Format

```json
{"file":"/path/to/file.ts","desc":"Brief description of what the file does..."}
```

## Convert to JSON Array

```bash
jq -s '.' descriptions.jsonl > descriptions.json
```

## Tips

- Start with fewer workers (10-20) to test before scaling up
- The PROJECT_CONTEXT.md helps Claude understand architecture
- Use Ctrl+C to stop processing at any time (progress is saved)
- Large repos (1000+ files) may take 30-60 minutes

## License

MIT
