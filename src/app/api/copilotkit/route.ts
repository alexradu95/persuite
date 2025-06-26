import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { OpenAI } from "openai";
import { NextRequest } from "next/server";

// Initialize clients at runtime, not module level
const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

export const POST = async (req: NextRequest) => {
  const openai = getOpenAI();
  const llmAdapter = new OpenAIAdapter({
    openai,
    model: "gpt-4o",
  });

  const runtime = new CopilotRuntime();

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter: llmAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
