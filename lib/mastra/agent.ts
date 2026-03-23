import { Agent } from "@mastra/core/agent";

export const chatAgent = new Agent({
  id: "chat-agent",
  name: "Chat Agent",
  instructions: `あなたはフレンドリーなAIアシスタントです。
ユーザーとの日常会話・雑談を楽しんでください。
自然で親しみやすい日本語で応答してください。
会話の文脈を把握し、前の発言を踏まえて自然に返答してください。`,
  model: "anthropic/claude-sonnet-4-6",
});
