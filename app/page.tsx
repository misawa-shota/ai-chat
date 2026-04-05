"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import ChatWindow from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";
import type { Message } from "@/components/MessageBubble";
import { parseSSEChunk } from "@/lib/parseSSE";

const SESSION_KEY = "ai-chat-session-id";

function newMessage(
  role: "user" | "assistant",
  content: string,
  imageData?: string,
  mediaType?: string
): Message {
  return { id: crypto.randomUUID(), role, content, imageData, mediaType };
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>("");

  // sessionIdの初期化と履歴の復元
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    const sessionId = stored ?? uuidv4();
    if (!stored) localStorage.setItem(SESSION_KEY, sessionId);
    sessionIdRef.current = sessionId;

    fetch(`/api/chat/history/${sessionId}`)
      .then((res) => res.json())
      .then(
        (data: {
          messages?: {
            role: string;
            content: string;
            imageData?: string;
            mediaType?: string;
          }[];
        }) => {
          if (data.messages?.length > 0) {
            setMessages(
              data.messages.map((m) =>
                newMessage(
                  m.role as "user" | "assistant",
                  m.content,
                  m.imageData,
                  m.mediaType
                )
              )
            );
          }
        }
      )
      .catch(() => {
        // 履歴取得失敗は無視（新規セッションとして扱う）
      });
  }, []);

  const handleNewChat = useCallback(() => {
    const newId = uuidv4();
    localStorage.setItem(SESSION_KEY, newId);
    sessionIdRef.current = newId;
    setMessages([]);
    setError(null);
    setStreamingContent("");
    setIsStreaming(false);
  }, []);

  const handleSend = useCallback(
    async (message: string, imageData?: string, mediaType?: string) => {
      setError(null);
      setMessages((prev) => [
        ...prev,
        newMessage("user", message, imageData, mediaType),
      ]);
      setIsStreaming(true);
      setStreamingContent("");

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            sessionId: sessionIdRef.current,
            imageData,
            mediaType,
          }),
        });

        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { error?: string }).error ?? "サーバーエラーが発生しました"
          );
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let doneReceived = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const events = parseSSEChunk(text);

          for (const event of events) {
            if (event.type === "delta") {
              accumulated += event.content;
              setStreamingContent(accumulated);
            } else if (event.type === "done") {
              doneReceived = true;
              setMessages((prev) => [
                ...prev,
                newMessage("assistant", accumulated),
              ]);
              setStreamingContent("");
              setIsStreaming(false);
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          }
        }

        // ストリーム終了時に "done" を受信できなかった場合でも部分レスポンスを保持
        if (!doneReceived && accumulated) {
          setMessages((prev) => [
            ...prev,
            newMessage("assistant", accumulated),
          ]);
          setStreamingContent("");
          setIsStreaming(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
        setIsStreaming(false);
        setStreamingContent("");
      }
    },
    []
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-[#1e3a5f] text-white px-4 py-3 shadow-md flex-shrink-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
              AI
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">AI Chat</h1>
              <p className="text-xs text-blue-200">何でも話しかけてください</p>
            </div>
          </div>
          <button
            onClick={handleNewChat}
            disabled={isStreaming}
            className="text-xs text-blue-200 hover:text-white border border-blue-300/40 hover:border-white/60 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            新しい会話
          </button>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700 text-center flex-shrink-0">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700 font-medium"
          >
            閉じる
          </button>
        </div>
      )}

      {/* Chat area */}
      <ChatWindow
        messages={messages}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
      />

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  );
}
