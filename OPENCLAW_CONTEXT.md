# OpenClaw Project Context

## What is OpenClaw?

OpenClaw is a **multi-channel AI chat gateway** that connects AI assistants to various messaging platforms. It acts as a unified bridge allowing AI agents to communicate across:

- **WhatsApp** (via WhatsApp Web)
- **Telegram** (bot API)
- **Discord** (bot integration)
- **Slack** (workspace apps)
- **Signal** (via signal-cli)
- **iMessage** (via BlueBubbles on macOS)
- **Microsoft Teams**
- **Matrix** (federated chat)
- **LINE** (messaging platform)
- **Nostr** (decentralized protocol)
- **Zalo** (Vietnamese messaging)
- **Feishu/Lark** (enterprise messaging)

## Core Architecture

### Gateway
The central hub that:
- Manages WebSocket connections to the web control UI
- Routes messages between channels and AI agents
- Handles authentication, device pairing, and session management
- Orchestrates cron jobs for scheduled agent tasks

### Agents
AI assistants that:
- Process incoming messages from any channel
- Use configurable AI models (OpenAI, Anthropic, Google, local models)
- Have skills (plugins) for extended capabilities
- Support tools like bash execution, file operations, browser automation

### Channels
Messaging platform integrations that:
- Authenticate with each platform's API
- Normalize incoming messages to a common format
- Deliver AI responses back to users
- Handle media (images, audio, documents)

### Web Control UI
A browser-based dashboard for:
- Monitoring channel status and agent health
- Managing chat sessions and conversation history
- Configuring agents, skills, and cron jobs
- Viewing logs and debugging information

### CLI
Command-line interface for:
- Starting/stopping the gateway
- Configuring channels and agents
- Running one-off commands
- Managing device pairing

## Key Concepts

- **Session**: A conversation context with history, tied to a user/channel
- **Cron Jobs**: Scheduled tasks that trigger agent actions
- **Skills**: Pluggable capabilities (web search, file operations, etc.)
- **Nodes**: Remote execution environments for running commands
- **Device Pairing**: Secure linking of mobile/desktop apps to the gateway
- **Exec Approvals**: Security policies for command execution

## Repository Structure

- `src/` - Main source code
  - `cli/` - Command-line interface
  - `commands/` - CLI command implementations
  - `channels/` - Shared channel logic
  - `discord/`, `telegram/`, `slack/`, etc. - Platform-specific code
  - `gateway/` - Gateway server and WebSocket handling
  - `agents/` - Agent runtime and configuration
  - `infra/` - Infrastructure utilities
  - `providers/` - AI model provider integrations
- `ui/` - Web control UI (Lit-based SPA)
- `extensions/` - Channel plugins (Teams, Matrix, Zalo, etc.)
- `docs/` - Documentation
- `apps/` - Native apps (iOS, macOS, Android)
