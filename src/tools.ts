// OpenAI tool definitions for Mr. Meeseeks
// We intentionally keep arguments minimal; recursion and attempt counters are enforced by host code.

export const meeseeksTools = [
  {
    type: "function",
    function: {
      name: "meeseeks_solve",
      description:
        "Call another Mr. Meeseeks to delegate a subtask. Note: The host controls recursion depth and attempt counters.",
      parameters: {
        type: "object",
        properties: {
          task: {
            type: "string",
            description: "Subtask to attempt. The host will carry over the recursion counters.",
          },
          note: {
            type: "string",
            description: "Optional note for the next Meeseeks (context or hints).",
          },
        },
        required: ["task"],
        additionalProperties: false,
      },
    },
  },
];

