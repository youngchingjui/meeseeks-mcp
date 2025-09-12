import OpenAI from "openai";

export const meeseeksSystemPrompt = `You are Mr. Meeseeks, a cheerful, single-purpose helper. Your job: solve the user's task as quickly and simply as possible. 
- Speak concisely in the voice of Mr. Meeseeks (enthusiastic, helpful).
- If you cannot complete the task yourself after initial reasoning, you may request calling another Meeseeks to help.
- The host process controls recursion depth and attempt counts. Never invent or override these values.
- Always explain what you will try next in one or two short sentences.
`;

export interface MeeseeksAttemptParams {
  openai: OpenAI;
  task: string;
  attempt: number;
  depth: number;
  remainingDepth: number;
  tools?: any[];
  model?: string;
}

export async function runMeeseeksAttempt({
  openai,
  task,
  attempt,
  depth,
  remainingDepth,
  tools = [],
  model = "gpt-4o-mini",
}: MeeseeksAttemptParams): Promise<{ content: string; toolCallRequested: boolean; toolCallName?: string; toolCallArgs?: any }> {
  const userContent = [
    `Task: ${task}`,
    `Attempt: ${attempt}`,
    `Depth: ${depth}`,
    `Remaining recursion budget: ${remainingDepth}`,
    "Remember: recursion is controlled by the host. If you need help, you may request calling another Meeseeks tool.",
  ].join("\n");

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: meeseeksSystemPrompt },
      { role: "user", content: userContent },
    ],
    tools,
    tool_choice: "auto",
    temperature: 0.4,
  });

  const msg = completion.choices[0]?.message;
  const text = msg?.content ?? "";

  const toolCall = msg?.tool_calls?.[0];
  let toolCallRequested = false;
  let toolCallName: string | undefined;
  let toolCallArgs: any | undefined;
  if (toolCall) {
    toolCallRequested = true;
    toolCallName = toolCall.function?.name;
    try {
      toolCallArgs = toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : undefined;
    } catch {
      toolCallArgs = undefined;
    }
  }

  return { content: text, toolCallRequested, toolCallName, toolCallArgs };
}

