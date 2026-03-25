export type SSEEvent =
  | { type: "delta"; content: string }
  | { type: "done" }
  | { type: "error"; message: string };

/**
 * SSEのテキストチャンクから "data: {...}" 行を抽出してパースする
 */
export function parseSSEChunk(text: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    const raw = line.slice(6).trim();
    if (!raw) continue;

    try {
      const event = JSON.parse(raw) as SSEEvent;
      if (
        event.type === "delta" ||
        event.type === "done" ||
        event.type === "error"
      ) {
        events.push(event);
      }
    } catch {
      // 不正なJSONは無視
    }
  }

  return events;
}
