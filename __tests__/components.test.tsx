import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MessageBubble from "@/components/MessageBubble";
import ChatInput from "@/components/ChatInput";

describe("MessageBubble", () => {
  it("ユーザーメッセージを右寄せで表示する", () => {
    render(
      <MessageBubble message={{ role: "user", content: "こんにちは" }} />
    );
    expect(screen.getByText("こんにちは")).toBeInTheDocument();
    expect(screen.getByText("You")).toBeInTheDocument();
  });

  it("アシスタントメッセージを左寄せで表示する", () => {
    render(
      <MessageBubble
        message={{ role: "assistant", content: "はい、何でしょうか？" }}
      />
    );
    expect(screen.getByText("はい、何でしょうか？")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
  });

  it("isStreaming=trueのときカーソルを表示する", () => {
    const { container } = render(
      <MessageBubble
        message={{ role: "assistant", content: "考え中..." }}
        isStreaming
      />
    );
    // animate-pulseクラスを持つカーソル要素が存在する
    const cursor = container.querySelector(".animate-pulse");
    expect(cursor).toBeInTheDocument();
  });

  it("isStreaming=falseのときカーソルを表示しない", () => {
    const { container } = render(
      <MessageBubble
        message={{ role: "assistant", content: "完了しました" }}
        isStreaming={false}
      />
    );
    const cursor = container.querySelector(".animate-pulse");
    expect(cursor).not.toBeInTheDocument();
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

  it("空文字列では送信しない", () => {
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
});
