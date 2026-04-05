import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MessageBubble from "@/components/MessageBubble";
import ChatInput from "@/components/ChatInput";
import ChatWindow from "@/components/ChatWindow";
import type { Message } from "@/components/MessageBubble";

const msg = (role: "user" | "assistant", content: string): Message => ({
  id: crypto.randomUUID(),
  role,
  content,
});

describe("MessageBubble", () => {
  it("ユーザーメッセージを右寄せで表示する", () => {
    render(<MessageBubble message={msg("user", "こんにちは")} />);
    expect(screen.getByText("こんにちは")).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
  });

  it("アシスタントメッセージを左寄せで表示する", () => {
    render(
      <MessageBubble message={msg("assistant", "はい、何でしょうか？")} />
    );
    expect(screen.getByText("はい、何でしょうか？")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
  });

  it("isStreaming=trueのときカーソルを表示する", () => {
    const { container } = render(
      <MessageBubble message={msg("assistant", "考え中...")} isStreaming />
    );
    const cursor = container.querySelector(".animate-pulse");
    expect(cursor).toBeInTheDocument();
  });

  it("isStreaming=falseのときカーソルを表示しない", () => {
    const { container } = render(
      <MessageBubble
        message={msg("assistant", "完了しました")}
        isStreaming={false}
      />
    );
    const cursor = container.querySelector(".animate-pulse");
    expect(cursor).not.toBeInTheDocument();
  });

  it("imageDataがある場合は画像を表示する", () => {
    const messageWithImage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: "この画像は？",
      imageData: "abc123",
      mediaType: "image/png",
    };
    render(<MessageBubble message={messageWithImage} />);
    const img = screen.getByAltText("添付画像");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "data:image/png;base64,abc123");
  });
});

describe("ChatInput", () => {
  it("Enterキーでメッセージを送信する", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} disabled={false} />);
    const textarea = screen.getByRole("textbox");

    fireEvent.change(textarea, { target: { value: "テストメッセージ" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    expect(onSend).toHaveBeenCalledWith("テストメッセージ");
  });

  it("Shift+Enterでは送信しない", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} disabled={false} />);
    const textarea = screen.getByRole("textbox");

    fireEvent.change(textarea, { target: { value: "テストメッセージ" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it("空文字列・画像なしでは送信しない", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} disabled={false} />);
    const textarea = screen.getByRole("textbox");

    fireEvent.change(textarea, { target: { value: "   " } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    expect(onSend).not.toHaveBeenCalled();
  });

  it("disabled=trueのとき送信ボタンが無効化される", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} disabled={true} />);
    const button = screen.getByRole("button", { name: "送信" });
    expect(button).toBeDisabled();
  });

  it("disabled=trueのときEnterキーで送信しない", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} disabled={true} />);
    const textarea = screen.getByRole("textbox");

    fireEvent.change(textarea, { target: { value: "テスト" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    expect(onSend).not.toHaveBeenCalled();
  });

  it("送信ボタンクリックでメッセージを送信する", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} disabled={false} />);
    const textarea = screen.getByRole("textbox");
    const button = screen.getByRole("button", { name: "送信" });

    fireEvent.change(textarea, { target: { value: "ボタン送信テスト" } });
    fireEvent.click(button);

    expect(onSend).toHaveBeenCalledWith("ボタン送信テスト");
  });

  it("画像添付ボタンが表示される", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} disabled={false} />);
    const attachButton = screen.getByRole("button", { name: "画像を添付" });
    expect(attachButton).toBeInTheDocument();
  });

  it("disabled=trueのとき画像添付ボタンが無効化される", () => {
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} disabled={true} />);
    const attachButton = screen.getByRole("button", { name: "画像を添付" });
    expect(attachButton).toBeDisabled();
  });
});

describe("ChatWindow", () => {
  it("メッセージ一覧を表示する", () => {
    const messages: Message[] = [
      msg("user", "こんにちは"),
      msg("assistant", "はい！"),
    ];
    render(
      <ChatWindow messages={messages} streamingContent="" isStreaming={false} />
    );
    expect(screen.getByText("こんにちは")).toBeInTheDocument();
    expect(screen.getByText("はい！")).toBeInTheDocument();
  });

  it("メッセージが空のとき空状態プレースホルダーを表示する", () => {
    render(
      <ChatWindow messages={[]} streamingContent="" isStreaming={false} />
    );
    expect(screen.getByText("何でも話しかけてください")).toBeInTheDocument();
  });

  it("ストリーミング中にローディングドットを表示する", () => {
    const { container } = render(
      <ChatWindow messages={[]} streamingContent="" isStreaming={true} />
    );
    const dots = container.querySelectorAll(".animate-bounce");
    expect(dots.length).toBe(3);
  });

  it("ストリーミングコンテンツを表示する", () => {
    render(
      <ChatWindow
        messages={[]}
        streamingContent="考えています..."
        isStreaming={true}
      />
    );
    expect(screen.getByText("考えています...")).toBeInTheDocument();
  });
});
