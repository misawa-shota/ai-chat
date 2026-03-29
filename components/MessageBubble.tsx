import Markdown from "react-markdown";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Props = {
  message: Message;
  isStreaming?: boolean;
};

export default function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xs font-bold mr-2 mt-1">
          AI
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-[#1e3a5f] text-white rounded-tr-sm"
            : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-pre:bg-gray-100 prose-pre:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded">
            <Markdown>{message.content}</Markdown>
          </div>
        )}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-gray-400 ml-0.5 animate-pulse rounded-sm" />
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold ml-2 mt-1">
          You
        </div>
      )}
    </div>
  );
}
