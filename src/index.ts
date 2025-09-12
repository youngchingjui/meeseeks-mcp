import { McpServer } from "@modelcontextprotocol/sdk/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";

/**
 * A recursive Meseeks MCP server. It exposes a single tool: `meseeks.solve`.
 *
 * Inputs:
 * - task: string (required) – The task to solve.
 * - maxRecursions: number (optional) – Maximum recursion depth to attempt. Default 10. Hard-capped at 10.
 * - solveAtDepth: number (optional) – For testing/demo: force success once depth >= solveAtDepth.
 *
 * Behavior:
 * - The tool attempts to "solve" the task. If it cannot (simulated), it recursively calls itself
 *   until it succeeds or reaches the recursion limit.
 * - Returns a trace of the recursion and the final result.
 */

const HARD_CAP = 10;

interface SolveArgs {
  task: string;
  maxRecursions?: number;
  solveAtDepth?: number; // demo/testing helper
}

interface SolveResult {
  success: boolean;
  depth: number;
  maxRecursions: number;
  message: string;
  trace: string[];
}

async function attemptSolve(
  task: string,
  depth: number,
  maxRecursions: number,
  solveAtDepth?: number,
  trace: string[] = []
): Promise<SolveResult> {
  const currentTrace = [...trace, `Depth ${depth}: attempting to solve -> ${task}`];

  // Base cases
  if (depth >= maxRecursions) {
    return {
      success: true,
      depth,
      maxRecursions,
      message: `Solved '${task}' at depth ${depth} (reached recursion limit).`,
      trace: currentTrace,
    };
  }

  if (typeof solveAtDepth === "number" && depth >= solveAtDepth) {
    return {
      success: true,
      depth,
      maxRecursions,
      message: `Solved '${task}' at depth ${depth} (solveAtDepth reached).`,
      trace: currentTrace,
    };
  }

  // Simulate a failure at this depth; recurse
  const reason = `Could not solve at depth ${depth}; refining and delegating to next Meseeks.`;
  const newTrace = [...currentTrace, reason];
  return attemptSolve(task, depth + 1, maxRecursions, solveAtDepth, newTrace);
}

async function main() {
  const server = new McpServer({ name: "meseeks-mcp", version: "0.1.0" });

  server.tool(
    "meseeks.solve",
    {
      description:
        "Solve a task using recursive Meseeks delegation. Limits recursion to 10 by default (and hard-cap).",
      inputSchema: {
        type: "object",
        properties: {
          task: { type: "string", description: "The task to solve." },
          maxRecursions: {
            type: "integer",
            minimum: 0,
            description: "Maximum recursion depth (default 10, hard-capped at 10).",
            default: 10,
          },
          solveAtDepth: {
            type: "integer",
            minimum: 0,
            description: "Demo/testing helper to force a success once depth >= this value.",
          },
        },
        required: ["task"],
      },
    },
    async (args: SolveArgs) => {
      const userMax = Math.floor(args.maxRecursions ?? 10);
      const maxRecursions = Math.max(0, Math.min(HARD_CAP, userMax));

      const result = await attemptSolve(
        args.task,
        0,
        maxRecursions,
        typeof args.solveAtDepth === "number" ? Math.max(0, Math.floor(args.solveAtDepth)) : undefined
      );

      // Return a human-readable text payload containing the result structure as JSON
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      } as any;
    }
  );

  // Start stdio transport (MCP default)
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Meseeks MCP server failed to start:", err);
  process.exit(1);
});

