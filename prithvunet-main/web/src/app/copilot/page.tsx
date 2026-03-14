"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Lightbulb, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "What is the current air quality in Delhi?",
  "If Tata Steel reduces SO₂ emissions by 30%, what's the impact?",
  "Which cities have the worst water quality right now?",
  "Predict AQI for Mumbai for the next 3 days",
  "Why is PM₂.₅ so high in IGI Airport area?",
  "Compare noise levels across residential zones",
  "What actions can reduce AQI below 100 in Kolkata?",
  "Show me industrial compliance trends",
];

async function callCopilotAPI(message: string): Promise<string> {
  try {
    const res = await fetch("/api/copilot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return `Sorry, I encountered an error: ${err.error || res.statusText}. Please try again.`;
    }
    const data = await res.json();
    return data.reply || "I couldn't generate a response. Please try again.";
  } catch {
    return "Sorry, I'm unable to connect to the AI service right now. Please check your connection and try again.";
  }
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm **PrithviNet AI Copilot** 🌍\n\nI can help you analyze environmental data, run what-if scenarios, and provide compliance insights. Try asking me anything about air quality, water monitoring, noise levels, or industrial compliance!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const query = text || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const response = await callCopilotAPI(query);
    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMsg]);
    setIsTyping(false);
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card px-6 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600">
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">AI Copilot</h1>
          <p className="text-xs text-muted">Environmental analysis & what-if scenarios</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                  <Bot size={16} className="text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-white"
                    : "border border-border bg-card text-gray-300"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div
                    className="prose prose-sm prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/## (.*)/g, '<h3 class="text-white text-base font-semibold mt-3 mb-1">$1</h3>')
                        .replace(/### (.*)/g, '<h4 class="text-white text-sm font-semibold mt-2 mb-1">$1</h4>')
                        .replace(/\n/g, "<br/>")
                        .replace(/\|(.*)\|/g, (match) => {
                          const cells = match.split("|").filter(Boolean);
                          return `<div class="flex gap-4 text-xs py-0.5">${cells.map((c) => `<span class="min-w-[60px]">${c.trim()}</span>`).join("")}</div>`;
                        }),
                    }}
                  />
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <User size={16} className="text-white" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                <Bot size={16} className="text-primary" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
                <Loader2 size={14} className="animate-spin text-primary" />
                <span className="text-xs text-muted">Analyzing data...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="border-t border-border bg-card/50 px-6 py-3">
          <div className="mx-auto max-w-3xl">
            <div className="mb-2 flex items-center gap-1 text-xs text-muted">
              <Lightbulb size={12} /> Suggested queries
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted transition-colors hover:border-primary/50 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-3xl gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask about air quality, water data, what-if scenarios..."
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-white placeholder:text-muted focus:border-primary focus:outline-none"
            disabled={isTyping}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
