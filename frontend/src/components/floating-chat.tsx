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
      return <pre key={i} className="bg-[#0a0f1e] border border-[#1e3060] rounded-lg p-3 text-xs font-mono overflow-x-auto my-2 text-[#60a5fa]">{code}</pre>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="bg-[#1e3060] text-[#60a5fa] px-1.5 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    }
    // Handle newlines
    return part.split("\n").map((line, j) => (
      <React.Fragment key={`${i}-${j}`}>{j > 0 && <br />}{line}</React.Fragment>
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
          setMessages([{ id: "init", role: "ai", content: "Hey! I'm your GrowthOS Mentor. Ask me anything about your learning path, or tap a quick action below." }]);
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
        setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "ai", content: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "ai", content: "Connection lost. Try again in a moment." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "ai", content: "System error. Let's try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    await apiFetch("/chat/", { method: "DELETE" });
    setMessages([{ id: "init", role: "ai", content: "Chat cleared. What would you like to work on?" }]);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9000] flex h-14 w-14 items-center justify-center rounded-full bg-[#1e3060] border-2 border-[#3b5bdb] text-[#f0f0f0] shadow-[0_0_20px_rgba(59,91,219,0.4)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(59,91,219,0.6)] active:scale-95"
        >
          <Bot size={24} className="text-[#60a5fa]" />
          <div className="absolute top-0 right-0 w-3 h-3 bg-[#22c55e] rounded-full border-2 border-[#0a0a0a]" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[9000] flex w-[360px] sm:w-[400px] flex-col overflow-hidden rounded-2xl border border-[#1e3060] bg-[#0a0f1e] shadow-2xl h-[520px] max-h-[85vh]"
          style={{ animation: "slideUp 0.25s ease-out" }}
        >
          <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1e3060] bg-[#0d142b] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e3060]">
                <Sparkles size={14} className="text-[#60a5fa]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#f0f0f0]">GrowthOS Mentor</h3>
                <div className="flex items-center gap-1.5 text-[10px] text-[#22c55e]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-75"></span>
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#22c55e]"></span>
                  </span>
                  Online
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleClear} className="p-1.5 rounded-lg text-[#555] hover:text-[#f59e0b] hover:bg-[#1e3060] transition-colors" title="Clear chat">
                <Trash2 size={14} />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg text-[#555] hover:text-[#f0f0f0] hover:bg-[#1e3060] transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#3b5bdb] text-white rounded-br-md"
                    : "bg-[#131a2e] border border-[#1e3060] text-[#d0d0d0] rounded-bl-md"
                }`}>
                  {msg.role === "ai" ? formatAIText(msg.content) : msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#131a2e] border border-[#1e3060] text-[#60a5fa] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-xs text-[#555]">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Chips */}
          {messages.length <= 2 && !isLoading && (
            <div className="flex gap-2 px-4 pb-2 overflow-x-auto">
              {QUICK_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleSend(chip.msg)}
                  className="shrink-0 px-3 py-1.5 rounded-full border border-[#1e3060] bg-[#0d142b] text-[10px] font-mono uppercase tracking-wider text-[#60a5fa] hover:bg-[#1e3060] hover:text-white transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-[#1e3060] bg-[#0d142b] p-3">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask me anything..."
                className="w-full rounded-full border border-[#1e3060] bg-[#0a0f1e] py-2.5 pl-4 pr-12 text-sm text-[#f0f0f0] placeholder-[#555] focus:border-[#3b5bdb] focus:outline-none transition-colors"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#3b5bdb] text-white disabled:opacity-30 transition-all hover:bg-[#4c6ef5]"
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
