# Meseeks MCP Server

A simple recursive Meseeks MCP server implemented in TypeScript/Node.js using the Model Context Protocol (MCP) SDK. It exposes a single tool that attempts to solve a task by recursively delegating to additional "Meseeks" until the task is solved or a recursion limit is reached.

- Default max recursion depth: 10 (hard-capped at 10)
- User-configurable `maxRecursions` input
- Required `task` input
- Optional `solveAtDepth` input for demo/testing to force a success once depth is reached

## Getting started

Prerequisites:
- Node.js 18+

Install dependencies:

- npm: `npm install`

Build:

- `npm run build`

Run (stdio MCP transport):

- `npm start`

During development:

- `npm run dev`

## MCP tool: `meseeks.solve`

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

From an MCP-aware client, call the `meseeks.solve` tool with inputs like:

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
- The recursion logic here simulates the behavior—replace `attemptSolve` with real task-solving logic or downstream MCP calls if desired.

