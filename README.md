# Clutch

AI-powered file description generator for any GitHub repository using Claude Code.

## Installation

Just like Claude Code, install with one command:

```bash
curl -fsSL https://raw.githubusercontent.com/michaelsayman/clutch/main/install.sh | bash
```

The installer downloads a pre-built binary for your platform (no Node.js required).

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

All data lives in `~/clutch/` (easy to access!):
```
~/clutch/
├── projects/<repo-name>/
│   ├── metadata.json          # Repo info
│   ├── PROJECT_CONTEXT.md     # Architecture overview
│   ├── descriptions.jsonl     # Generated descriptions
│   ├── all_files.txt          # List of all files found
│   ├── file_stats.txt         # Line counts per file
│   └── completed.txt          # Progress tracking
└── repos/<repo-name>/         # Cloned repository
```

Binary installed to: `~/.local/bin/clutch`

## Example Workflow

```bash
# Install
curl -fsSL https://raw.githubusercontent.com/michaelsayman/clutch/main/install.sh | bash

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

# Access your data
open ~/clutch/projects/
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

This removes:
- Binary: `~/.local/bin/clutch`
- Data: `~/clutch/`

## Requirements

- **Claude Code CLI** (required) - Install from https://claude.ai/download
- **Git** (required) - For cloning repositories
- **curl or wget** (required) - For installation

Bun runtime is bundled in the binary - no dependencies needed!

## Architecture

Clutch is built with TypeScript and compiled to standalone binaries using Bun:

- **Pre-built binaries** for macOS (x64/arm64) and Linux (x64/arm64)
- **Bun runtime bundled** inside the binary - no dependencies
- **Zero config** - just download and run
- **Native ESM support** - modern JavaScript out of the box

For developers:
- `src/` - TypeScript source code
- `build-binaries.sh` - Build all platform binaries locally with Bun
- `.github/workflows/release.yml` - Automated binary builds on release

Built with modern tooling for modern code.

## License

MIT
