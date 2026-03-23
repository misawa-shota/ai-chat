import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { CoreMessage } from "ai";
import { chatAgent } from "@/lib/mastra/agent";
import { prisma } from "@/lib/prisma";

const app = new Hono();

const chatSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().min(1),
});

// POST /api/chat
app.post("/chat", zValidator("json", chatSchema), async (c) => {
  const { message, sessionId } = c.req.valid("json");

  // 既存の会話履歴をMongoDBから取得
  const session = await prisma.session.findUnique({
    where: { sessionId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  // Mastra用メッセージ配列を構築（履歴 + 新しいユーザーメッセージ）
  const history: CoreMessage[] = (session?.messages ?? []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
  const messages: CoreMessage[] = [
    ...history,
    { role: "user", content: message },
  ];

  // ユーザーメッセージをMongoDBに保存
  await prisma.session.upsert({
    where: { sessionId },
    create: {
      sessionId,
      messages: {
        create: { role: "user", content: message },
      },
    },
    update: {
      messages: {
        create: { role: "user", content: message },
      },
    },
  });

  return streamSSE(c, async (stream) => {
    let fullResponse = "";

    try {
      const result = await chatAgent.stream(messages);

      for await (const chunk of result.textStream) {
        fullResponse += chunk;
        await stream.writeSSE({
          data: JSON.stringify({ type: "delta", content: chunk }),
        });
      }

      // アシスタントの応答をMongoDBに保存
      await prisma.message.create({
        data: {
          sessionId,
          role: "assistant",
          content: fullResponse,
        },
      });

      await stream.writeSSE({
        data: JSON.stringify({ type: "done" }),
      });
    } catch {
      await stream.writeSSE({
        data: JSON.stringify({
          type: "error",
          message: "AI応答の生成に失敗しました",
        }),
      });
    }
  });
});

// GET /api/chat/history/:sessionId
app.get("/chat/history/:sessionId", async (c) => {
  const { sessionId } = c.req.param();

  const session = await prisma.session.findUnique({
    where: { sessionId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!session) {
    return c.json({ sessionId, messages: [] });
  }

  return c.json({
    sessionId,
    messages: session.messages.map((m) => ({
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
  });
});

export { app };
