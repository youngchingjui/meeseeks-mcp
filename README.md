# Meeseeks MCP Server

A simple recursive Meeseeks MCP server implemented in TypeScript/Node.js using the Model Context Protocol (MCP) SDK. It exposes a single tool that attempts to solve a task by recursively delegating to additional "Meeseeks" until the task is solved or a recursion limit is reached.

- Default max recursion depth: 10 (hard-capped at 10)
- User-configurable `maxRecursions` input
- Required `task` input
- Optional `solveAtDepth` input for demo/testing to force a success once depth is reached

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

### Configure OpenAI API key

This server uses OpenAI to run the Mr. Meeseeks agent. Provide your API key via environment variable so your MCP client can launch the server with access to it.

- Set environment variable `OPENAI_API_KEY` before starting the server, or configure it in your MCP client’s server configuration.

Example (shell):

- macOS/Linux: `export OPENAI_API_KEY=sk-...`
- Windows (PowerShell): `$env:OPENAI_API_KEY = "sk-..."`

### Subscribing from an MCP client

Add an entry for this server to your MCP-aware client (for example, an editor or agent runner) using stdio transport. Provide the command and ensure the environment includes `OPENAI_API_KEY`.

Example conceptual client config:

- command: `node`
- args: `["dist/index.js"]`
- env: `{ "OPENAI_API_KEY": "<your key>" }`

Refer to your MCP client’s documentation for the exact configuration format.

## MCP tool: `meeseeks.solve`

Input schema:
- `task` (string, required): The task to solve.
- `maxRecursions` (integer, optional, default 10): Maximum recursion depth to attempt. Hard-capped to 10 for safety.
- `solveAtDepth` (integer, optional): For demo/testing—force a success once current depth >= this value.

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
  "maxRecursions": 5
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
- The agent is implemented with OpenAI and speaks like Mr. Meeseeks. Recursion depth and attempt counters are enforced in code, not by the model.

