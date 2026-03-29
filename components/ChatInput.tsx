"use client";

import { useRef } from "react";

type Props = {
  onSend: (message: string) => void;
  disabled: boolean;
};

export default function ChatInput({ onSend, disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const value = textareaRef.current?.value.trim();
    if (!value || disabled) return;
    onSend(value);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-end gap-3">
        <textarea
          ref={textareaRef}
          rows={1}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
          placeholder="メッセージを入力... (Enterで送信 / Shift+Enterで改行)"
          className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 placeholder:text-gray-400 transition-all"
          style={{ minHeight: "42px", maxHeight: "120px" }}
        />
        <button
          onClick={handleSend}
          disabled={disabled}
          aria-label="送信"
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#1e3a5f] text-white flex items-center justify-center hover:bg-[#2d5282] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
