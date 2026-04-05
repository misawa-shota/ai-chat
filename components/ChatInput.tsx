"use client";

import { useRef, useState, useCallback } from "react";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type ImageAttachment = {
  data: string;
  mediaType: string;
  previewUrl: string;
};

type Props = {
  onSend: (message: string, imageData?: string, mediaType?: string) => void;
  disabled: boolean;
};

export default function ChatInput({ onSend, disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<ImageAttachment | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    setFileError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError("JPEG / PNG / GIF / WebP のみ対応しています");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError("ファイルサイズは5MB以下にしてください");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // result is "data:<mediaType>;base64,<data>"
      const base64 = result.split(",")[1];
      setImage({
        data: base64,
        mediaType: file.type,
        previewUrl: result,
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSend = () => {
    const value = textareaRef.current?.value.trim() ?? "";
    if (!value && !image) return;
    if (disabled) return;
    if (image) {
      onSend(value, image.data, image.mediaType);
    } else {
      onSend(value);
    }
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    }
    setImage(null);
    setFileError(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const removeImage = () => {
    setImage(null);
    setFileError(null);
  };

  return (
    <div
      className={`border-t border-gray-200 bg-white px-4 py-3 transition-colors ${isDragging ? "bg-blue-50 border-blue-300" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="max-w-2xl mx-auto">
        {isDragging && (
          <div className="text-center text-sm text-blue-500 mb-2 pointer-events-none">
            画像をここにドロップ
          </div>
        )}
        {fileError && (
          <p className="text-xs text-red-500 mb-1">{fileError}</p>
        )}
        {image && (
          <div className="mb-2 relative inline-block">
            <img
              src={image.previewUrl}
              alt="プレビュー"
              className="h-20 rounded-lg object-cover border border-gray-200"
            />
            <button
              onClick={removeImage}
              aria-label="画像を削除"
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-600 text-white flex items-center justify-center text-xs hover:bg-gray-800 transition-colors"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            onChange={handleFileChange}
            className="hidden"
            aria-label="画像ファイルを選択"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            aria-label="画像を添付"
            title="画像を添付 (JPEG/PNG/GIF/WebP, 最大5MB)"
            className="flex-shrink-0 w-10 h-10 rounded-xl border border-gray-300 text-gray-500 flex items-center justify-center hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>
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
    </div>
  );
}
