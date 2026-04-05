import { describe, it, expect } from "vitest";
import { z } from "zod";

// lib/hono/index.ts と同じスキーマ定義
const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

const chatSchema = z
  .object({
    message: z.string().max(2000).default(""),
    sessionId: z.string().min(1),
    imageData: z.string().optional(),
    mediaType: z.enum(ALLOWED_MEDIA_TYPES).optional(),
  })
  .refine((data) => data.message.length > 0 || data.imageData !== undefined, {
    message: "メッセージまたは画像が必要です",
  });

describe("chatSchema バリデーション", () => {
  it("正常なリクエスト（テキストのみ）を受け入れる", () => {
    const result = chatSchema.safeParse({
      message: "こんにちは",
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("画像付きリクエストを受け入れる", () => {
    const result = chatSchema.safeParse({
      message: "この画像について教えてください",
      sessionId: "test-session",
      imageData: "base64encodeddata",
      mediaType: "image/jpeg",
    });
    expect(result.success).toBe(true);
  });

  it("テキストなし・画像ありのリクエストを受け入れる", () => {
    const result = chatSchema.safeParse({
      message: "",
      sessionId: "test-session",
      imageData: "base64encodeddata",
      mediaType: "image/png",
    });
    expect(result.success).toBe(true);
  });

  it("テキストなし・画像なしのリクエストは失敗する", () => {
    const result = chatSchema.safeParse({
      message: "",
      sessionId: "test-session",
    });
    expect(result.success).toBe(false);
  });

  it("未対応のmediaTypeは失敗する", () => {
    const result = chatSchema.safeParse({
      message: "テスト",
      sessionId: "test-session",
      imageData: "base64encodeddata",
      mediaType: "image/bmp",
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

  it("messageが存在しない場合はデフォルト値を使用する", () => {
    const result = chatSchema.safeParse({
      sessionId: "test-session",
      imageData: "base64encodeddata",
      mediaType: "image/jpeg",
    });
    expect(result.success).toBe(true);
  });
});
