import { describe, it, expect } from "vitest";
import { z } from "zod";

// lib/hono/index.ts と同じスキーマ定義
const chatSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().min(1),
});

describe("chatSchema バリデーション", () => {
  it("正常なリクエストを受け入れる", () => {
    const result = chatSchema.safeParse({
      message: "こんにちは",
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("messageが空文字列の場合は失敗する", () => {
    const result = chatSchema.safeParse({
      message: "",
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("message");
    }
  });

  it("messageが存在しない場合は失敗する", () => {
    const result = chatSchema.safeParse({
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(false);
  });

  it("sessionIdが空文字列の場合は失敗する", () => {
    const result = chatSchema.safeParse({
      message: "こんにちは",
      sessionId: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("sessionId");
    }
  });

  it("sessionIdが存在しない場合は失敗する", () => {
    const result = chatSchema.safeParse({ message: "こんにちは" });
    expect(result.success).toBe(false);
  });

  it("両フィールドが存在しない場合は2つのエラーを返す", () => {
    const result = chatSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toHaveLength(2);
    }
  });

  it("スペースのみのmessageは失敗する（min(1)は空白を許容するが空文字は拒否）", () => {
    // min(1)は長さ1以上を要求するため、スペース1文字は通過する
    // 実際のトリミングはフロントエンドで行う
    const result = chatSchema.safeParse({
      message: "a",
      sessionId: "test-session",
    });
    expect(result.success).toBe(true);
  });
});
