# Meeseeks MCP Server

A simple recursive Meeseeks MCP server implemented in TypeScript/Node.js using the Model Context Protocol (MCP) SDK. It exposes a single tool that attempts to solve a task by recursively delegating to additional "Meeseeks" until the task is solved or a recursion limit is reached.

- Default max recursion depth: 10 (hard-capped at 10)
- User-configurable `maxRecursions` input
- Optional `solveAtDepth` input for demo/testing to force a success once depth is reached
- Configurable model and API provider via environment variables; supports the Vercel AI Gateway

## Getting started

Prerequisites:
- Node.js 22+

Install dependencies:

- npm: `npm install`

Build:

- `npm run build`

Run (stdio MCP transport):

- `npm start`

During development:

- `npm run dev`

## Configure API keys and provider

This server can run against either:

1) Vercel AI Gateway (recommended)
- Set `AI_GATEWAY_API_KEY` to your Gateway key.
- Optionally set `AI_GATEWAY_URL` (defaults to `https://ai-gateway.vercel.sh/v1`).
- When using the Gateway, prefer provider-qualified model ids like `openai/gpt-4o-mini` or `anthropic/claude-3-5-sonnet`.

2) Direct OpenAI
- Set `OPENAI_API_KEY` to your OpenAI key.
- Use native OpenAI model ids like `gpt-4o-mini`.

You can also set a default model via `MEESEEKS_MODEL`. The model can be overridden per-call via the tool's `model` input parameter.

Examples (shell):

- macOS/Linux:
  - `export AI_GATEWAY_API_KEY=vercel_xxx`
  - `export AI_GATEWAY_URL=https://ai-gateway.vercel.sh/v1` (optional)
  - `export MEESEEKS_MODEL=openai/gpt-4o-mini`

- Windows (PowerShell):
  - `$env:AI_GATEWAY_API_KEY = "vercel_xxx"`
  - `$env:AI_GATEWAY_URL = "https://ai-gateway.vercel.sh/v1"` (optional)
  - `$env:MEESEEKS_MODEL = "openai/gpt-4o-mini"`

If no Gateway key is provided, the server falls back to `OPENAI_API_KEY`.

## Subscribing from an MCP client

Add an entry for this server to your MCP-aware client (for example, an editor or agent runner) using stdio transport. Provide the command and ensure the environment includes the appropriate API key(s).

Example conceptual client config:

- command: `node`
- args: `["dist/index.js"]`
- env: `{ "AI_GATEWAY_API_KEY": "<your key>", "MEESEEKS_MODEL": "openai/gpt-4o-mini" }`

Refer to your MCP client’s documentation for the exact configuration format.

## MCP tool: `meeseeks.solve`

Input schema:
- `task` (string, required): The task to solve.
- `maxRecursions` (integer, optional, default 10): Maximum recursion depth to attempt. Hard-capped to 10 for safety.
- `solveAtDepth` (integer, optional): For demo/testing—force a success once current depth >= this value.
- `model` (string, optional): Model id to use for this call. With the Gateway, use provider-qualified ids like `openai/gpt-4o-mini`.

Output:
- Returns a textual JSON payload with fields:
  - `success` (boolean)
  - `depth` (number): Depth at which it was solved
  - `maxRecursions` (number)
  - `message` (string)
  - `trace` (string[]): Human-readable recursion trace

## Example usage (conceptual)

From an MCP-aware client, call the `meeseeks.solve` tool with inputs like:

```
{
  "task": "Refactor the code",
  "maxRecursions": 5,
  "model": "openai/gpt-4o-mini"
}
```

Demo/testing example: Force solve at depth 3

```
{
  "task": "Demo task",
  "maxRecursions": 7,
  "solveAtDepth": 3
}
```

## Notes

- This server uses the stdio transport. Many MCP clients (e.g., editors) connect to servers via stdio.
- The agent is implemented to speak like Mr. Meeseeks. Recursion depth and attempt counters are enforced in code, not by the model.
- When using the Vercel AI Gateway, consult Vercel's documentation for setting up providers and routes in your Gateway project.

