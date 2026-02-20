# 🤖 Claude Code Showcase

> A personal reference project demonstrating every major Claude Code feature — from basic prompting to fully autonomous agent loops.

Built by [Paul Knauer](https://www.linkedin.com/in/paulknauer/) | Engineering Manager @ nCino

---

## 🗺️ Feature Map

| # | Feature | What You'll Learn | Folder |
|---|---------|------------------|--------|
| 1 | [Prompting with Intent](#1-prompting-with-intent) | Plan mode, structured prompting | `docs/prompting/` |
| 2 | [Personalising Claude](#2-personalising-claude--claudemd) | CLAUDE.md at global & project level | `CLAUDE.md` |
| 3 | [Skills, Commands & Hooks](#3-skills-commands--hooks) | Slash commands, auto-invoked skills, lifecycle hooks | `.claude/` |
| 4 | [MCP Servers](#4-mcp-servers) | Connect Claude to external tools | `.mcp.json` |
| 5 | [Executor → Supervisor](#5-executor--supervisor-mode) | `/gsd` pattern, headless mode | `.claude/commands/` |
| 6 | [Agent Teams](#6-agent-teams) | Parallel subagents, orchestration | `.claude/agents/` |
| 7 | [Fully Autonomous (Ralph Loop)](#7-fully-autonomous-systems--ralph-loop) | Self-looping, TDD, PRD-driven builds | `scripts/ralph/` |

---

## Quick Start

```bash
# Prerequisites: Claude Code installed
# npm install -g @anthropic-ai/claude-code

git clone https://github.com/YOUR_USERNAME/claude-code-showcase.git
cd claude-code-showcase

# Open Claude Code in this project
claude
```

---

## 1. Prompting with Intent

📄 See [`docs/prompting/`](./docs/prompting/)

The difference between average and exceptional Claude Code results comes down to **intent-driven prompting** combined with **plan mode**.

### Key Techniques

**Plan Mode** — Think before acting:
```
claude --plan "Refactor the auth module to use JWT tokens"
```
Claude will output a complete plan *before* touching any code. Review it, then approve.

**Structured Prompts** — Give context, constraints, and success criteria:
```
# ❌ Weak
"Fix the login bug"

# ✅ Strong  
"The login endpoint at /api/auth/login returns 500 when the email 
contains a plus sign. Fix this without changing the API contract. 
Tests must still pass. Only modify src/auth/."
```

**Use `$ARGUMENTS` in skills** to make prompts dynamic and reusable.

📄 See [`docs/prompting/intent-guide.md`](./docs/prompting/intent-guide.md) for a full prompt engineering guide.

---

## 2. Personalising Claude — CLAUDE.md

📄 See [`CLAUDE.md`](./CLAUDE.md)

`CLAUDE.md` is Claude's **persistent memory** — it loads automatically at every session start. Think of it as the constitution for how Claude behaves in your project.

### Two Levels

| Level | Location | Scope |
|-------|----------|-------|
| **Global** | `~/.claude/CLAUDE.md` | All projects — your personal preferences |
| **Project** | `./CLAUDE.md` | This repo only — team standards |

### What Goes In CLAUDE.md

```markdown
## Architecture
- Frontend: VueJS + Rails
- Backend: TypeScript, AWS Lambda
- Never modify generated files in /dist

## Coding Standards  
- TypeScript strict mode always on
- No console.log in production code — use the logger utility
- All new functions need JSDoc

## Commands
- Build: npm run build
- Test: npm test
- Lint: npm run lint
```

> **Pro tip:** Claude also reads `CLAUDE.md` files in subdirectories for module-specific context.

---

## 3. Skills, Commands & Hooks

📂 See [`.claude/`](./.claude/)

### Skills (Auto-invoked)
Skills live in `.claude/skills/` and Claude loads them **automatically** when the task context matches their description.

```
.claude/skills/
├── explain-code/SKILL.md      # Auto-loads when explaining code
├── pr-review/SKILL.md         # Auto-loads on PR review tasks  
└── api-docs/SKILL.md          # Auto-loads when documenting APIs
```

### Commands (User-invoked)
Slash commands you trigger manually:
```
/onboard        — Deep exploration of a new codebase
/pr-review      — Structured PR review workflow
/ticket PROJ-1  — Pull Jira ticket, implement, update status
/deploy staging — Deploy to specified environment
```

### Hooks (Lifecycle Events)
Hooks run automatically at Claude Code lifecycle events:

```json
// .claude/settings.json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{"type": "command", "command": "scripts/hooks/pre-tool.sh"}]
    }],
    "PostToolUse": [{
      "matcher": "Write",
      "hooks": [{"type": "command", "command": "scripts/hooks/post-write.sh"}]
    }],
    "Stop": [{
      "hooks": [{"type": "command", "command": "scripts/hooks/on-stop.sh"}]
    }]
  }
}
```

**Hook use cases:**
- `PreToolUse` — Block dangerous commands, enforce code standards
- `PostToolUse` — Auto-run linter after writes, update logs  
- `Stop` — Send desktop notification when task completes, trigger ralph loop restart

📄 See [`.claude/settings.json`](./.claude/settings.json) for full hook configuration.

---

## 4. MCP Servers

📄 See [`.mcp.json`](./.mcp.json)

MCP (Model Context Protocol) connects Claude to **external tools and APIs**. This is how you get Claude to read a Jira ticket, implement it, and update the ticket — all in one command.

```
Claude Code ──► MCP Server ──► External API
                (local bridge)   (Jira, GitHub, Slack...)
```

### Configured Servers in This Project

| Server | Purpose | Tools Available |
|--------|---------|----------------|
| GitHub | Read/write repos, PRs | `create_pr`, `get_issue`, `list_commits` |
| Filesystem | Extended file access | `read_file`, `search_files` |
| Fetch | Web browsing | `fetch_url` |

### Add a Server
```bash
# Via Claude Code CLI
claude mcp add github -- npx -y @modelcontextprotocol/server-github

# Or edit .mcp.json directly (committed for team sharing)
```

📄 See [`docs/mcp/setup-guide.md`](./docs/mcp/setup-guide.md) for detailed configuration.

---

## 5. Executor → Supervisor Mode

📂 See [`.claude/commands/gsd.md`](./.claude/commands/gsd.md)

The biggest productivity shift in Claude Code: **stop being the executor, become the supervisor.**

### The Mental Model

```
❌ Executor Mode (You do the work)
You: "Write a test for the login function"
Claude: writes test
You: "Now add error handling"
Claude: adds error handling
You: "Now update the docs"
...

✅ Supervisor Mode (Claude does the work)  
You: /gsd "Implement complete user authentication with tests and docs"
Claude: Plans → Executes → Tests → Documents → Reports back
```

### The `/gsd` Command

The custom `/gsd` (Get Stuff Done) command is defined in `.claude/commands/gsd.md`. It instructs Claude to:

1. Create a plan in `docs/plans/`
2. Break it into atomic tasks
3. Execute each task with verification
4. Run tests after each step
5. Report completion summary

```bash
# Inside Claude Code session:
/gsd "Add rate limiting to all API endpoints"
/gsd "Refactor the database layer to use connection pooling"
```

### Headless / Batch Mode
```bash
# Run Claude non-interactively (CI/CD, scripts)
claude -p "Run all tests and fix any failures" --allowedTools "Read,Write,Bash"

# Print mode (no interactive session)
echo "Review this PR diff" | claude -p --print
```

---

## 6. Agent Teams

📂 See [`.claude/agents/`](./.claude/agents/)

Claude Code can spawn **parallel subagents** — specialized instances that work concurrently, each with their own focused context.

### Subagent Architecture

```
Main Claude (Orchestrator)
├── Research Agent ──────────── Searches docs, web, codebase
├── Implementation Agent ─────── Writes the actual code  
├── Test Agent ──────────────── Writes and runs tests
└── Documentation Agent ──────── Updates docs and comments
         ↑
    All results flow back to orchestrator
    Main context stays clean
```

### Defining a Subagent

```markdown
<!-- .claude/agents/code-reviewer.md -->
---
name: code-reviewer
description: Deep code review focusing on security, performance, and maintainability
tools: Read, Grep, Glob
---

You are an expert code reviewer. When reviewing code:
1. Check for security vulnerabilities (XSS, injection, auth bypass)
2. Identify performance bottlenecks
3. Flag maintainability issues
4. Suggest specific improvements with code examples
```

### Spawning Parallel Agents (in a skill/command)

```markdown
Launch these subagents IN PARALLEL using the Task tool:

1. **Security Agent** — Scan for vulnerabilities
2. **Performance Agent** — Profile hot paths  
3. **Test Coverage Agent** — Identify untested code paths
```

📄 See [`.claude/agents/`](./.claude/agents/) for ready-to-use agent definitions.

---

## 7. Fully Autonomous Systems — Ralph Loop

📂 See [`scripts/ralph/`](./scripts/ralph/)

The **Ralph Loop** is the pinnacle of Claude Code autonomy: an iterative, self-correcting loop where Claude works on a task repeatedly until it succeeds — using tests as the success signal.

### How It Works

```
┌─────────────────────────────────────────┐
│              Ralph Loop                  │
│                                          │
│  1. Read prd.json (task backlog)         │
│  2. Pick next incomplete story           │
│  3. Implement it (fresh Claude session)  │
│  4. Run tests                            │
│  5. If pass → commit + mark done         │
│     If fail → retry with learnings       │
│  6. Loop until all stories done          │
└─────────────────────────────────────────┘
```

Each iteration starts **fresh** — no context degradation. Memory lives in files and git, not the model.

### Quick Start

```bash
# 1. Create your PRD using the skill
/prd "Build a REST API for user management with CRUD operations"

# 2. Convert PRD to task list
/prd-convert

# 3. Start the autonomous loop (up to 20 iterations)
./scripts/ralph/ralph.sh "claude --dangerously-skip-permissions" 20

# Walk away ☕
```

### What Gets Created

```
scripts/ralph/
├── ralph.sh          — The loop orchestrator script
├── CLAUDE.md         — Ralph-specific instructions for Claude
├── prd.json          — Your task backlog (auto-generated)
└── progress.txt      — Running log of what was done + learnings
```

### Safety Controls

- `--max-iterations` — Hard limit prevents runaway loops
- `DONE` marker — Claude signals completion to break early
- `progress.txt` — Full audit trail of every iteration
- Git history — Every iteration commits, giving full rollback capability

> ⚠️ **Note:** Uses `--dangerously-skip-permissions` for full autonomy. Only run in isolated environments or with code you can rollback.

📄 See [`docs/ralph/philosophy.md`](./docs/ralph/philosophy.md) for the full philosophy and advanced patterns.

---

## Project Structure

```
claude-code-showcase/
├── CLAUDE.md                        # Project-level Claude personalisation
├── .mcp.json                        # MCP server configuration
├── .claude/
│   ├── settings.json                # Hooks + permissions config
│   ├── settings.local.json          # Personal overrides (gitignored)
│   ├── skills/
│   │   ├── explain-code/SKILL.md    # Auto-invoked: code explanations
│   │   ├── pr-review/SKILL.md       # Auto-invoked: PR reviews
│   │   └── api-docs/SKILL.md        # Auto-invoked: API documentation
│   ├── commands/
│   │   ├── gsd.md                   # /gsd — supervisor mode
│   │   ├── onboard.md               # /onboard — codebase exploration
│   │   └── ticket.md                # /ticket — Jira workflow
│   └── agents/
│       ├── code-reviewer.md         # Security + quality reviewer
│       ├── researcher.md            # Parallel research agent
│       └── test-writer.md           # Dedicated test author
├── scripts/
│   ├── ralph/
│   │   ├── ralph.sh                 # Autonomous loop runner
│   │   └── CLAUDE.md               # Ralph context for Claude
│   └── hooks/
│       ├── pre-tool.sh              # PreToolUse hook
│       ├── post-write.sh            # PostToolUse hook
│       └── on-stop.sh               # Stop hook (notifications)
├── docs/
│   ├── prompting/intent-guide.md    # Prompting best practices
│   ├── mcp/setup-guide.md           # MCP configuration guide
│   └── ralph/philosophy.md          # Ralph loop deep dive
└── src/                             # Sample project code
    └── api/                         # Demo API for testing features
```

---

## Learning Path

If you're new to Claude Code, work through the features in order:

1. **Start here** → Read `CLAUDE.md` — understand project memory
2. **Try prompting** → Use `docs/prompting/intent-guide.md` 
3. **Use a skill** → Ask Claude to explain code in this repo
4. **Run a command** → `/onboard` to explore the codebase
5. **Set up MCP** → Configure GitHub MCP, run `/ticket`
6. **Go supervisor** → `/gsd` a small feature end-to-end
7. **Launch agents** → Use the research skill with parallel agents
8. **Go autonomous** → Run Ralph Loop on a greenfield feature

---

## Resources

- [Claude Code Docs](https://code.claude.com/docs)
- [Awesome Claude Code](https://github.com/hesreallyhim/awesome-claude-code)
- [Ralph Loop Plugin](https://claude.com/plugins/ralph-loop)
- [Claude Code Plugins Hub](https://www.claudepluginhub.com)
- [MCP Protocol](https://modelcontextprotocol.io)

---

*Built with Claude Code, for Claude Code.*
