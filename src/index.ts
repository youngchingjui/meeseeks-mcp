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
 * - model: string (optional) – LLM model id. When using the Vercel AI Gateway, prefer provider-qualified ids like "openai/gpt-4o-mini".
 *
 * Behavior:
 * - The tool attempts to solve the task using an LLM (Mr. Meeseeks persona). If it cannot (simulated), it recursively calls itself
 *   until it succeeds or reaches the recursion limit.
 * - Returns a trace of the recursion and the final result.
 */

const HARD_CAP = 10;

interface SolveArgs {
  task: string;
  maxRecursions?: number;
  solveAtDepth?: number; // demo/testing helper
  model?: string; // optional model override
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
  model: string,
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
    model,
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
  return attemptSolve(openai, task, depth + 1, maxRecursions, model, solveAtDepth, newTrace);
}

function createOpenAIClient() {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY;
  const gatewayUrl = process.env.AI_GATEWAY_URL || "https://ai-gateway.vercel.sh/v1";
  const openaiKey = process.env.OPENAI_API_KEY;

  if (gatewayKey) {
    return {
      client: new OpenAI({ apiKey: gatewayKey, baseURL: gatewayUrl }),
      usingGateway: true,
    } as const;
  }

  if (openaiKey) {
    return {
      client: new OpenAI({ apiKey: openaiKey }),
      usingGateway: false,
    } as const;
  }

  throw new Error(
    "No API key configured. Set AI_GATEWAY_API_KEY to use the Vercel AI Gateway (recommended), or OPENAI_API_KEY to talk to OpenAI directly."
  );
}

async function main() {
  const server = new McpServer({ name: "meeseeks-mcp", version: "0.2.0" });

  server.tool(
    "meeseeks.solve",
    {
      description:
        "Solve a task using recursive Mr. Meeseeks delegation. Limits recursion to 10 by default (and hard-cap). Uses an LLM via the Vercel AI Gateway or OpenAI directly.",
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
          model: {
            type: "string",
            description:
              "LLM model id. If using Vercel AI Gateway, prefer provider-qualified ids like 'openai/gpt-4o-mini' or 'anthropic/claude-3-5-sonnet'. Defaults based on gateway presence.",
          },
        },
        required: ["task"],
      },
    },
    async (args: SolveArgs) => {
      const { client: openai, usingGateway } = createOpenAIClient();

      const userMax = Math.floor(args.maxRecursions ?? 10);
      const maxRecursions = Math.max(0, Math.min(HARD_CAP, userMax));

      const envModel = process.env.MEESEEKS_MODEL;
      const defaultModel = usingGateway ? "openai/gpt-4o-mini" : "gpt-4o-mini";
      const model = (args.model || envModel || defaultModel).trim();

      const result = await attemptSolve(
        openai,
        args.task,
        0,
        maxRecursions,
        model,
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

