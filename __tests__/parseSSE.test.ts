import { describe, it, expect } from "vitest";
import { parseSSEChunk } from "@/lib/parseSSE";

describe("parseSSEChunk", () => {
  it("deltaイベントを正しくパースする", () => {
    const input = 'data: {"type":"delta","content":"こん"}\n';
    const result = parseSSEChunk(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: "delta", content: "こん" });
  });

  it("doneイベントを正しくパースする", () => {
    const input = 'data: {"type":"done"}\n';
    const result = parseSSEChunk(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: "done" });
  });

  it("errorイベントを正しくパースする", () => {
    const input = 'data: {"type":"error","message":"AI応答の生成に失敗しました"}\n';
    const result = parseSSEChunk(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      type: "error",
      message: "AI応答の生成に失敗しました",
    });
  });

  it("複数のイベントを含むチャンクを正しくパースする", () => {
    const input = [
      'data: {"type":"delta","content":"こん"}',
      'data: {"type":"delta","content":"にちは"}',
      'data: {"type":"done"}',
    ].join("\n");
    const result = parseSSEChunk(input);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ type: "delta", content: "こん" });
    expect(result[1]).toEqual({ type: "delta", content: "にちは" });
    expect(result[2]).toEqual({ type: "done" });
  });

  it("data: プレフィックスがない行を無視する", () => {
    const input = "id: 1\nevent: message\ndata: {\"type\":\"done\"}\n";
    const result = parseSSEChunk(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: "done" });
  });

  it("空のdata行を無視する", () => {
    const input = "data: \ndata: {\"type\":\"done\"}\n";
    const result = parseSSEChunk(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: "done" });
  });

  it("不正なJSONを無視して残りのイベントを返す", () => {
    const input = [
      "data: {invalid json}",
      'data: {"type":"done"}',
    ].join("\n");
    const result = parseSSEChunk(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: "done" });
  });

  it("空文字列に対して空配列を返す", () => {
    expect(parseSSEChunk("")).toEqual([]);
  });

  it("不明なtypeのイベントを無視する", () => {
    const input = 'data: {"type":"unknown","foo":"bar"}\n';
    const result = parseSSEChunk(input);
    expect(result).toHaveLength(0);
  });
});
