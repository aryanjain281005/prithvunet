"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Lightbulb, Loader2, FileText, Radar, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ScenarioArtifact {
  scenarioId: string;
  reportId?: string;
  region: string;
  reductionPct: number;
  predictedRisk: number;
  delta: number;
  persisted: boolean;
  source: string;
  reportContent?: string;
}

interface BrowserLocation {
  lat: number;
  lng: number;
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

function isWhatIfQuery(message: string): boolean {
  return /(what\s*if|impact|simulate|reduce|reduction|shutdown|intervention|top-?k)/i.test(message);
}

function extractReductionPct(message: string): number {
  const match = message.match(/(\d{1,2})\s*%/);
  if (!match) {
    return 20;
  }
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed)) {
    return 20;
  }
  return Math.max(5, Math.min(90, parsed));
}

function extractRegion(message: string, fallback?: string): string {
  const match = message.match(/\bin\s+([a-zA-Z\s]{3,40})/i);
  if (match?.[1]) {
    return match[1].trim();
  }
  if (fallback && fallback.trim()) {
    return fallback.trim();
  }
  return "Unknown";
}

export default function CopilotPage() {
  const { user, role } = useAuth();
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
  const [artifact, setArtifact] = useState<ScenarioArtifact | null>(null);
  const [artifactError, setArtifactError] = useState("");
  const [location, setLocation] = useState<BrowserLocation | null>(null);
  const [locationReady, setLocationReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(`copilot-${Date.now()}`);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationReady(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationReady(true);
      },
      () => {
        setLocationReady(true);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
    );
  }, []);

  const callCopilotAPI = async (message: string): Promise<string> => {
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          context: {
            region: user?.region || "Unknown",
            source: "copilot_page",
            locationEnabled: Boolean(location),
          },
          userId: user?.id,
          role,
          sessionId: sessionIdRef.current,
          location,
        }),
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
  };

  const runScenarioArtifacts = async (query: string) => {
    const region = extractRegion(query, user?.region);
    const reductionPct = extractReductionPct(query);

    const simulationRes = await fetch("/api/copilot/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user?.id,
        region,
        scenarioType: "policy_what_if",
        intervention: {
          reductionPct,
          notes: query,
        },
        baseline: {
          riskIndex: user?.region && region === user.region ? 180 : 220,
        },
        meteorology: {
          humidity: 60,
          windSpeed: 3,
        },
      }),
    });

    const simulationPayload = (await simulationRes.json()) as {
      error?: string;
      scenarioId?: string;
      region?: string;
      predictedRisk?: number;
      delta?: number;
      reductionPct?: number;
      persisted?: boolean;
    };

    if (!simulationRes.ok || !simulationPayload.scenarioId) {
      throw new Error(simulationPayload.error || "Unable to generate simulation artifact");
    }

    const reportRes = await fetch("/api/copilot/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: simulationPayload.scenarioId,
        format: "markdown",
        requestedBy: user?.id || "anonymous",
      }),
    });

    const reportPayload = (await reportRes.json()) as {
      error?: string;
      reportId?: string;
      content?: string;
      source?: string;
      persisted?: boolean;
    };

    if (!reportRes.ok || !reportPayload.reportId) {
      throw new Error(reportPayload.error || "Unable to generate report artifact");
    }

    setArtifact({
      scenarioId: simulationPayload.scenarioId,
      reportId: reportPayload.reportId,
      region: simulationPayload.region || region,
      reductionPct: simulationPayload.reductionPct || reductionPct,
      predictedRisk: simulationPayload.predictedRisk || 0,
      delta: simulationPayload.delta || 0,
      persisted: Boolean(simulationPayload.persisted && reportPayload.persisted),
      source: reportPayload.source || (simulationPayload.persisted ? "supabase" : "runtime"),
      reportContent: reportPayload.content,
    });
  };

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
    setArtifactError("");

    const response = await callCopilotAPI(query);
    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: response,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMsg]);

    if (isWhatIfQuery(query)) {
      try {
        await runScenarioArtifacts(query);
      } catch (err) {
        setArtifact(null);
        setArtifactError(err instanceof Error ? err.message : "Unable to generate scenario artifacts");
      }
    }

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
        <div className="ml-auto flex items-center gap-3 text-[11px] text-zinc-400">
          <span className="rounded-full border border-white/10 px-2 py-1">
            {user?.region || "Unknown region"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1">
            <MapPin size={12} className={location ? "text-emerald-300" : "text-zinc-500"} />
            {location ? "Geo context on" : locationReady ? "Geo context off" : "Locating"}
          </span>
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

          {artifact && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <div className="flex flex-wrap items-center gap-2">
                <Radar size={16} />
                <p className="font-semibold text-white">Scenario Artifact Generated</p>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-zinc-200">
                  {artifact.source}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-zinc-400">Scenario ID</p>
                  <p className="mt-1 font-medium text-white">{artifact.scenarioId}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-zinc-400">Report ID</p>
                  <p className="mt-1 font-medium text-white">{artifact.reportId || "--"}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-zinc-400">Improvement</p>
                  <p className="mt-1 font-medium text-white">{artifact.delta.toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-black/20 p-3">
                  <p className="text-zinc-400">Predicted Risk</p>
                  <p className="mt-1 font-medium text-white">{artifact.predictedRisk.toFixed(2)}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-200">
                Region: {artifact.region} • Reduction: {artifact.reductionPct}% • Persisted: {String(artifact.persisted)}
              </p>
              {artifact.reportContent && (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-200">
                  <div className="mb-2 flex items-center gap-2 text-white">
                    <FileText size={14} /> Report Preview
                  </div>
                  <p className="line-clamp-6 whitespace-pre-wrap">{artifact.reportContent}</p>
                </div>
              )}
            </div>
          )}

          {artifactError && (
            <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-100">
              {artifactError}
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
