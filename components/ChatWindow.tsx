"use client";

import { useEffect, useRef } from "react";
import MessageBubble, { type Message } from "./MessageBubble";

type Props = {
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
};

export default function ChatWindow({
  messages,
  streamingContent,
  isStreaming,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-2xl mx-auto">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p className="text-base">何でも話しかけてください</p>
            <p className="text-sm mt-1">AIがお答えします</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {isStreaming && streamingContent && (
          <MessageBubble
            message={{ role: "assistant", content: streamingContent }}
            isStreaming
          />
        )}

        {isStreaming && !streamingContent && (
          <div className="flex justify-start mb-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xs font-bold mr-2 mt-1">
              AI
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <span className="flex gap-1 items-center h-4">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
