# Clutch

AI-powered file description generator for any GitHub repository using Claude Code.

## Installation

Just like Claude Code, install with one command:

```bash
curl -fsSL https://raw.githubusercontent.com/user/clutch/main/install.sh | bash
```

Or install locally:

```bash
cd /path/to/clutch
./install.sh
```

## Quick Start

```bash
# Initialize a repository
clutch init https://github.com/user/repo

# View all projects
clutch status

# Process files
clutch run

# Get help
clutch help
```

## Commands

```
clutch init <repo-url>    Initialize a new repository
clutch run [project]      Process files (prompts if multiple projects)
clutch status             Show all projects and their progress
clutch uninstall          Remove clutch from your system
clutch help               Show help message
```

## How It Works

1. **Initialize**: Clone any repo, analyze structure, generate PROJECT_CONTEXT.md with architecture overview
2. **Process**: Launch parallel Claude Code workers to describe each file (max 400 chars)
3. **Output**: Get descriptions.jsonl with every file documented

All data lives in `~/.clutch/`:
```
~/.clutch/
├── projects/<repo-name>/
│   ├── metadata.json          # Repo info
│   ├── PROJECT_CONTEXT.md     # Architecture overview
│   ├── descriptions.jsonl     # Generated descriptions
│   └── completed.txt          # Progress tracking
└── repos/<repo-name>/         # Cloned repository
```

Binary installed to: `~/.local/bin/clutch`

## Example Workflow

```bash
# Install
curl -fsSL https://raw.githubusercontent.com/user/clutch/main/install.sh | bash

# Initialize a project
clutch init https://github.com/facebook/react

# Check status
clutch status

# Process files (choose 30 workers when prompted)
clutch run react

# View results
cat ~/.clutch/projects/react/descriptions.jsonl | jq

# Process another repo
clutch init https://github.com/vercel/next.js
clutch run
```

## Worker Options

When processing, choose worker count:
- **10** workers - Slower, lower API usage
- **20** workers - Balanced (default)
- **30** workers - Faster, higher API usage
- **40-50** workers - Maximum speed

## Resume Support

Interrupt anytime with Ctrl+C - progress is saved. Run `clutch run` again to continue.

## Output Format

```json
{"file":"/path/to/file.ts","desc":"Brief description..."}
```

Convert to JSON array:
```bash
jq -s '.' descriptions.jsonl > descriptions.json
```

## Uninstall

```bash
clutch uninstall
```

Or via curl:
```bash
curl -fsSL https://raw.githubusercontent.com/user/clutch/main/uninstall.sh | bash
```

This removes:
- Binary: `~/.local/bin/clutch`
- Data: `~/.clutch/`

## Requirements

- **Claude Code CLI** (required) - Install from https://claude.ai/download
- **Git** (required) - For cloning repositories
- **curl or wget** (required) - For installation
- **jq** (optional) - For metadata parsing
- **bc** (optional) - For progress calculations

## Files

- `clutch` - Main CLI (single self-contained bash script)
- `install.sh` - Curl-able installer (like Claude Code)
- `uninstall.sh` - Curl-able uninstaller

Clean and simple, just like Claude Code.

## License

MIT
