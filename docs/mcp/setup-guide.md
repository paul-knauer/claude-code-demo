# MCP Setup Guide

MCP (Model Context Protocol) is an open protocol that lets Claude connect to external tools and data sources. Instead of relying only on built-in tools, Claude can talk to MCP servers that expose capabilities specific to your environment — databases, APIs, filesystems, issue trackers, and more.

---

## Why MCP Matters

Without MCP, Claude knows only what you tell it in the prompt. With MCP, Claude can:

- Read and write files via a filesystem server
- Query Jira tickets and Confluence pages via an Atlassian server
- Run database queries via a Postgres/SQLite server
- Call internal APIs via a custom server you build

MCP turns Claude from a text tool into an active participant in your development environment.

---

## How Configuration Works

Claude Code looks for `.mcp.json` in the project root at startup. Each entry in `mcpServers` defines one server Claude can use.

```json
{
  "mcpServers": {
    "<server-name>": {
      "command": "<executable>",
      "args": ["<arg1>", "<arg2>"],
      "env": {
        "ENV_VAR": "${ENV_VAR}"
      }
    }
  }
}
```

- **command** — the executable to launch the server process
- **args** — arguments passed to the executable
- **env** — environment variables injected into the server process; `${VAR}` pulls from your shell environment

---

## Example: Filesystem Server

Gives Claude read/write access to a directory on disk.

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."],
      "description": "Filesystem access scoped to the project root"
    }
  }
}
```

The third argument to `server-filesystem` is the root path it will expose. Using `.` scopes it to the current working directory.

---

## Example: Atlassian Server (Jira + Confluence)

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-atlassian"],
      "env": {
        "ATLASSIAN_API_TOKEN": "${ATLASSIAN_API_TOKEN}",
        "ATLASSIAN_BASE_URL": "${ATLASSIAN_BASE_URL}"
      }
    }
  }
}
```

Set the required env vars before starting Claude Code:

```bash
export ATLASSIAN_API_TOKEN=your_token_here
export ATLASSIAN_BASE_URL=https://your-org.atlassian.net
```

See the project's `.mcp.json` for a working reference configuration.

---

## Adding a Custom Server

Any process that speaks the MCP protocol can be a server. To add your own:

1. Implement the server using the MCP SDK (`@modelcontextprotocol/sdk`)
2. Add it to `.mcp.json` pointing at your script or binary
3. Restart Claude Code — servers are loaded at session start

```json
{
  "mcpServers": {
    "my-api": {
      "command": "node",
      "args": ["scripts/mcp/my-api-server.js"],
      "env": {
        "API_BASE_URL": "${API_BASE_URL}"
      }
    }
  }
}
```

---

## Troubleshooting

**Server doesn't appear in Claude's tools**
- Confirm `.mcp.json` is in the project root (same directory you run `claude` from)
- Check for JSON syntax errors in `.mcp.json`
- Restart Claude Code — MCP servers are only loaded at session startup

**Environment variable errors**
- Verify the variable is exported in your shell before launching Claude Code
- `echo $ATLASSIAN_API_TOKEN` should print a value, not blank

**`npx` command not found**
- Ensure Node.js 20+ is installed and `npx` is on your PATH
- Run `npx --version` to confirm

**Server crashes immediately**
- Run the server command manually in your terminal to see the raw error
- Example: `npx -y @modelcontextprotocol/server-filesystem .`
