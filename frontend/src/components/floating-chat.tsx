import React, { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Sparkles, Loader2, Trash2 } from "lucide-react";
import { apiFetch } from "../lib/api-client";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

function formatAIText(text: string) {
  // Simple markdown: **bold**, `code`, ```blocks```, newlines
  const parts = text.split(/(```[\s\S]*?```|\*\*.*?\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const code = part.slice(3, -3).replace(/^\w+\n/, "");
      return (
        <pre
          key={i}
          className="bg-black/50 border border-white/10 rounded-lg p-3 text-[13px] font-mono overflow-x-auto my-2 text-gray-300 shadow-inner"
        >
          {code}
        </pre>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="bg-white/10 text-[#22c55e] px-1.5 py-0.5 rounded text-[13px] font-mono border border-white/5"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    // Handle newlines
    return part.split("\n").map((line, j) => (
      <React.Fragment key={`${i}-${j}`}>
        {j > 0 && <br />}
        {line}
      </React.Fragment>
    ));
  });
}

const QUICK_CHIPS = [
  { label: "Quiz me", msg: "Quiz me on what I'm currently studying" },
  { label: "My stats", msg: "What are my current stats and level?" },
  { label: "What next?", msg: "What should I study next to level up?" },
];

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch("/chat/")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMessages(data);
        } else {
          setMessages([
            {
              id: "init",
              role: "ai",
              content:
                "Hey! I'm your GrowthOS Mentor. Ask me anything about your learning path, or tap a quick action below.",
            },
          ]);
        }
      })
      .catch(() => {});
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await apiFetch("/chat/", {
        method: "POST",
        body: JSON.stringify({ message: userMsg.content }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "ai", content: data.reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "ai",
            content: "Connection lost. Try again in a moment.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "ai", content: "System error. Let's try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    await apiFetch("/chat/", { method: "DELETE" });
    setMessages([
      { id: "init", role: "ai", content: "Chat cleared. What would you like to work on?" },
    ]);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9000] flex h-14 w-14 items-center justify-center rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.15)] transition-all duration-300 hover:scale-105 hover:bg-black hover:border-[#22c55e]/50 hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] active:scale-95 group"
        >
          <Bot size={24} className="transition-transform group-hover:scale-110" />
          <div className="absolute top-0 right-0 w-3 h-3 bg-[#22c55e] rounded-full border-2 border-[#030303] shadow-[0_0_8px_#22c55e] animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[9000] flex w-[360px] sm:w-[400px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#030303]/95 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] h-[520px] max-h-[85vh]"
          style={{ animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-950/30 border border-[#22c55e]/20">
                <Sparkles size={16} className="text-[#22c55e]" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-gray-100 tracking-wide">GrowthOS Mentor</h3>
                <div className="flex items-center gap-1.5 text-xs font-mono tracking-widest uppercase text-[#22c55e]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#22c55e]"></span>
                  </span>
                  Online
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                className="p-2 rounded-md text-gray-400 hover:text-red-400 hover:bg-white/[0.04] transition-colors"
                title="Clear chat"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-white/[0.05] border border-white/10 text-gray-200 rounded-br-sm"
                      : "bg-black/40 border border-[#22c55e]/20 text-gray-300 rounded-bl-sm shadow-[0_0_15px_rgba(34,197,94,0.05)]"
                  }`}
                >
                  {msg.role === "ai" ? formatAIText(msg.content) : msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-black/40 border border-[#22c55e]/20 text-[#22c55e] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.05)]">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-[14px] text-gray-300">Processing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Chips */}
          {messages.length <= 2 && !isLoading && (
            <div className="flex gap-2 px-5 pb-3 overflow-x-auto scrollbar-none">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleSend(chip.msg)}
                  className="shrink-0 px-3 py-1.5 rounded-md border border-white/5 bg-white/[0.02] text-[10px] font-mono uppercase tracking-widest text-gray-400 hover:bg-[#22c55e]/10 hover:border-[#22c55e]/30 hover:text-[#22c55e] transition-all"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-white/5 bg-white/[0.01] p-4">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask me anything..."
                className="w-full rounded-xl border border-white/10 bg-black/50 py-3 pl-4 pr-12 text-[14px] text-gray-200 placeholder-gray-600 focus:border-[#22c55e]/50 focus:outline-none focus:ring-1 focus:ring-[#22c55e]/50 transition-all shadow-inner"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#22c55e] text-black disabled:opacity-30 disabled:bg-white/10 disabled:text-white transition-all hover:bg-[#16a34a]"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
