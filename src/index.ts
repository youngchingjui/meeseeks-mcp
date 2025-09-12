import { McpServer } from "@modelcontextprotocol/sdk/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import OpenAI from "openai";
import { meeseeksTools } from "./tools.js";
import { runMeeseeksAttempt } from "./agent.js";

/**
 * A recursive Meeseeks MCP server. It exposes a single tool: `meeseeks.solve`.
 *
 * Inputs:
 * - task: string (required) – The task to solve.
 * - maxRecursions: number (optional) – Maximum recursion depth to attempt. Default 10. Hard-capped at 10.
 * - solveAtDepth: number (optional) – For testing/demo: force success once depth >= solveAtDepth.
 *
 * Behavior:
 * - The tool attempts to solve the task using OpenAI (Mr. Meeseeks persona). If it cannot (simulated), it recursively calls itself
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
  openai: OpenAI,
  task: string,
  depth: number,
  maxRecursions: number,
  solveAtDepth?: number,
  trace: string[] = []
): Promise<SolveResult> {
  const remaining = Math.max(0, maxRecursions - depth);

  // Let Mr. Meeseeks have a go using the LLM
  const attemptInfo = await runMeeseeksAttempt({
    openai,
    task,
    attempt: depth + 1,
    depth,
    remainingDepth: remaining,
    tools: meeseeksTools,
  });

  const preface = `Depth ${depth}: Mr. Meeseeks attempts -> ${task}`;
  const attemptSummary = attemptInfo.content?.trim() ? attemptInfo.content.trim() : "(no content)";
  const toolNote = attemptInfo.toolCallRequested
    ? `Model requested tool '${attemptInfo.toolCallName ?? "unknown"}' (host enforces recursion).`
    : undefined;
  const currentTrace = [
    ...trace,
    preface,
    attemptSummary,
    ...(toolNote ? [toolNote] : []),
  ];

  // Base cases
  if (depth >= maxRecursions) {
    return {
      success: true,
      depth,
      maxRecursions,
      message: `Solved '${task}' at depth ${depth} (reached recursion limit). I'm Mr. Meeseeks, look at me!`,
      trace: currentTrace,
    };
  }

  if (typeof solveAtDepth === "number" && depth >= solveAtDepth) {
    return {
      success: true,
      depth,
      maxRecursions,
      message: `Solved '${task}' at depth ${depth} (solveAtDepth reached). Ooooh yeah!`,
      trace: currentTrace,
    };
  }

  // Simulate a failure at this depth; recurse with controlled counters
  const reason = `Could not fully solve at depth ${depth}; calling another Mr. Meeseeks (recursion managed by host).`;
  const newTrace = [...currentTrace, reason];
  return attemptSolve(openai, task, depth + 1, maxRecursions, solveAtDepth, newTrace);
}

async function main() {
  const server = new McpServer({ name: "meeseeks-mcp", version: "0.1.0" });

  server.tool(
    "meeseeks.solve",
    {
      description:
        "Solve a task using recursive Mr. Meeseeks delegation. Limits recursion to 10 by default (and hard-cap). Uses OpenAI.",
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
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error(
          "OPENAI_API_KEY is not set. Provide it via your MCP client's server configuration or environment."
        );
      }
      const openai = new OpenAI({ apiKey });

      const userMax = Math.floor(args.maxRecursions ?? 10);
      const maxRecursions = Math.max(0, Math.min(HARD_CAP, userMax));

      const result = await attemptSolve(
        openai,
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
  console.error("Meeseeks MCP server failed to start:", err);
  process.exit(1);
});

