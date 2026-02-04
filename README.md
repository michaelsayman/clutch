# OpenClaw File Description Generator

Generates AI-powered descriptions for all **4,953 files** in the OpenClaw codebase.

## Usage

```bash
cd /Users/saymanmini/Documents/Notes/OpenClaw/descriptions

# Run with 5 workers, 50 files per batch (default)
./run.sh

# Run with 10 workers, 100 files per batch
./run.sh 10 100

# Run with 1 worker (sequential)
./run.sh 1 10

# View progress
open progress.html
```

## Files

| File | Purpose |
|------|---------|
| `run.sh` | Main batch runner (1-10 parallel workers) |
| `process_file.sh` | Processes a single file with Claude Code |
| `update_progress.sh` | Updates the dashboard data |
| `all_files.txt` | List of 4,953 files to process |
| `completed.txt` | Tracks finished files |
| `descriptions.jsonl` | Output descriptions |
| `progress.html` | Visual progress dashboard |

## Output Format

```json
{"file":"/path/to/file.ts","desc":"3-5 sentence description..."}
```

## Convert to JSON

```bash
jq -s '.' descriptions.jsonl > descriptions.json
```
