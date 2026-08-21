"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Send,
  Bot,
  User,
  Zap,
  TrendingUp,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Receipt,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Building,
  HelpCircle,
} from "lucide-react";
import { serviceIaFetch } from "@/lib/service-ia/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  agent_name?: string;
  agent_badge?: string;
  thinking_summary?: string;
  action_executed?: Record<string, any> | null;
  suggested_actions?: SuggestedAction[];
}

interface SuggestedAction {
  title: string;
  action_type: string;
  payload: Record<string, any>;
}

interface AIChatResponse {
  reply: string;
  provider_used: string;
  model_used: string;
  agent_name?: string;
  agent_badge?: string;
  thinking_summary?: string;
  action_executed?: Record<string, any> | null;
  suggested_actions: SuggestedAction[];
}

const QUICK_PROMPTS = [
  "Quelle est ma trésorerie réelle en caisse ?",
  "Quels clients dois-je relancer en priorité ?",
  "Enregistre une vente de 25 000 FCFA pour M. Paul",
  "Fais-moi un bilan des alertes Radar de conformité",
];

const THINKING_STEPS = [
  "Consultation des registres de caisse et de ventes…",
  "Analyse des créances et des marges bénéficiaires…",
  "Formulation du conseil stratégique du dirigeant…",
];

/**
 * Clean & Polish text content: removes raw markdown artifacts and parses bold/bullets cleanly.
 */
function FormattedMessage({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-1.5 text-[13.5px] leading-relaxed">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lIdx} className="h-1.5" />;
        }

        // Bullet point line
        if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
          const bulletContent = trimmed.replace(/^[•\-]\s*/, "");
          return (
            <div key={lIdx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className="text-emerald-500 font-black text-sm shrink-0 mt-0.5">•</span>
              <div className="flex-1">
                {renderInlineMarkdown(bulletContent)}
              </div>
            </div>
          );
        }

        // Header line (e.g. 📊 Diagnostic, 📈 Synthèse)
        if (trimmed.startsWith("📊") || trimmed.startsWith("📈") || trimmed.startsWith("🚨") || trimmed.startsWith("🛡️") || trimmed.startsWith("📋") || trimmed.startsWith("✅") || trimmed.startsWith("💡")) {
          return (
            <div key={lIdx} className="font-bold text-foreground text-[14px] pt-1 pb-0.5 flex items-center gap-1.5">
              {renderInlineMarkdown(trimmed)}
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={lIdx} className="text-foreground/90">
            {renderInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Parses bold **text** and `code` cleanly without leaving raw asterisks
 */
function renderInlineMarkdown(content: string) {
  // Regex to split by **bold** or `code`
  const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      return (
        <strong key={i} className="font-bold text-foreground bg-primary/8 px-1 py-0.2 rounded">
          {inner}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      const inner = part.slice(1, -1);
      return (
        <code key={i} className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded border border-border">
          {inner}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function AICopilotDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-welcome",
      role: "assistant",
      agent_name: "Cora · Directrice des Opérations",
      agent_badge: "🧑‍💼 Coach Exécutif",
      content:
        "Bonjour ! Je suis Cora, votre directrice des opérations et assistante IA.\n\nJe suis connectée en temps réel à l'ensemble de vos registres (Ventes, Caisse, Dépenses, Radar et Procédures).\n\nComment puis-je vous aider aujourd'hui ? Je peux analyser vos chiffres, enregistrer une opération en direct ou vous conseiller sur vos décisions du jour.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [actions, setActions] = useState<SuggestedAction[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Typewriter streaming state for latest message
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const fullTextRef = useRef<string>("");
  const streamTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (open) {
      scrollToBottom();
    }
  }, [open, messages, loading, streamingText, scrollToBottom]);

  // Rotate thinking steps when loading
  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => {
      setThinkingIndex((prev) => (prev + 1) % THINKING_STEPS.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Smooth typewriter effect for assistant replies
  const startTypewriter = (fullText: string, onFinish: () => void) => {
    fullTextRef.current = fullText;
    let currentLength = 0;
    setStreamingText("");

    if (streamTimerRef.current) clearInterval(streamTimerRef.current);

    const stepSize = Math.max(3, Math.floor(fullText.length / 45));
    streamTimerRef.current = setInterval(() => {
      currentLength += stepSize;
      if (currentLength >= fullText.length) {
        if (streamTimerRef.current) clearInterval(streamTimerRef.current);
        setStreamingText(null);
        onFinish();
      } else {
        setStreamingText(fullText.slice(0, currentLength));
      }
    }, 18);
  };

  const handleSend = async (textToSend?: string) => {
    const msgText = (textToSend || input).trim();
    if (!msgText || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: msgText,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setActions([]);

    try {
      const res = await serviceIaFetch<AIChatResponse>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: res.reply,
        agent_name: res.agent_name || "Cora · Directrice des Opérations",
        agent_badge: res.agent_badge || "🧑‍💼 Coach Exécutif",
        thinking_summary: res.thinking_summary,
        action_executed: res.action_executed,
        suggested_actions: res.suggested_actions,
      };

      setLoading(false);

      // Trigger typewriter animation
      startTypewriter(res.reply, () => {
        setMessages([...newMessages, assistantMsg]);
        if (res.suggested_actions && res.suggested_actions.length > 0) {
          setActions(res.suggested_actions);
        }
        // If an action was executed, refresh page data
        if (res.action_executed) {
          window.dispatchEvent(new CustomEvent("koryxa:record-created"));
        }
      });
    } catch (err) {
      setLoading(false);
      setMessages([
        ...newMessages,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          agent_name: "Cora",
          agent_badge: "⚠️ Assistance",
          content: "Désolé, je rencontre une difficulté technique momentanée pour analyser cette demande.",
        },
      ]);
    }
  };

  const handleActionClick = (action: SuggestedAction) => {
    if (action.action_type === "navigate" && action.payload?.path) {
      onClose();
      router.push(action.payload.path);
    } else if (action.action_type === "send_chat" && action.payload?.prompt) {
      void handleSend(action.payload.prompt);
    } else if (action.action_type === "run_radar") {
      onClose();
      router.push("/espace/radar");
    }
  };

  if (!open) return null;

  return (
    <div className="kx-copilot-backdrop" onClick={onClose}>
      <aside className="kx-copilot-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="kx-copilot-header">
          <div className="kx-copilot-title-group">
            <div className="kx-copilot-badge-icon">
              <Bot size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">Cora</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                  Coach d'Affaires IA
                </span>
              </div>
              <span className="kx-copilot-provider-tag text-xs text-muted-foreground">
                Alimenté par le Hub Multi-Agents Knowlia
              </span>
            </div>
          </div>

          <div className="kx-copilot-header-actions">
            <button
              type="button"
              className="kx-copilot-settings-btn"
              onClick={() => {
                setMessages([
                  {
                    id: "reset-init",
                    role: "assistant",
                    agent_name: "Cora · Directrice des Opérations",
                    agent_badge: "🧑‍💼 Coach Exécutif",
                    content:
                      "Bonjour ! Comment puis-je vous assister pour piloter votre entreprise aujourd'hui ?",
                  },
                ]);
                setActions([]);
              }}
              title="Nouvelle discussion"
            >
              <RotateCcw size={16} />
            </button>
            <button type="button" className="kx-copilot-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Prompts Carousel */}
        <div className="kx-quick-prompts-bar">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              className="kx-quick-prompt-btn text-xs font-semibold"
              disabled={loading}
              onClick={() => handleSend(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Messages List */}
        <div className="kx-copilot-messages space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`kx-chat-msg ${m.role === "user" ? "is-user" : "is-assistant"}`}
            >
              <div className="kx-chat-avatar shrink-0">
                {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="kx-chat-bubble-content max-w-[88%]">
                {/* Agent Badge & Name Header */}
                {m.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      {m.agent_badge || "🧑‍💼 Coach IA"}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {m.agent_name || "Cora"}
                    </span>
                  </div>
                )}

                {/* Formatted Clean Text */}
                <div className="kx-chat-text bg-card border border-border p-3.5 rounded-2xl shadow-xs">
                  <FormattedMessage text={m.content} />
                </div>

                {/* Action Execution Result Card */}
                {m.action_executed && (
                  <div className="mt-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        {m.action_executed.type === "sale_created" ? <Receipt size={16} /> : <Wallet size={16} />}
                      </div>
                      <div>
                        <strong className="block text-xs font-bold text-foreground">
                          {m.action_executed.type === "sale_created"
                            ? `Vente validée · ${m.action_executed.reference}`
                            : `Dépense validée · ${m.action_executed.reference}`}
                        </strong>
                        <small className="text-[11px] text-muted-foreground">
                          {m.action_executed.type === "sale_created"
                            ? `Client: ${m.action_executed.client}`
                            : `Catégorie: ${m.action_executed.category}`}
                        </small>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push(
                          m.action_executed?.type === "sale_created"
                            ? "/espace/ventes"
                            : "/espace/depenses"
                        );
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1 hover:opacity-90 transition"
                    >
                      <span>Voir</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typewriter Streaming Placeholder */}
          {streamingText !== null && (
            <div className="kx-chat-msg is-assistant">
              <div className="kx-chat-avatar shrink-0">
                <Bot size={16} />
              </div>
              <div className="kx-chat-bubble-content max-w-[88%]">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    🧑‍💼 Coach Exécutif
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Cora en rédaction…
                  </span>
                </div>
                <div className="kx-chat-text bg-card border border-border p-3.5 rounded-2xl shadow-xs">
                  <FormattedMessage text={streamingText} />
                  <span className="inline-block w-2 h-4 ml-1 bg-emerald-500 animate-pulse align-middle" />
                </div>
              </div>
            </div>
          )}

          {/* Gentle Thinking Mode Animation */}
          {loading && (
            <div className="kx-chat-msg is-assistant">
              <div className="kx-chat-avatar shrink-0">
                <Bot size={16} className="text-emerald-600 animate-spin" />
              </div>
              <div className="kx-chat-bubble-content">
                <div className="p-3 rounded-2xl bg-emerald-500/8 border border-emerald-500/20 flex items-center gap-3 animate-pulse">
                  <Sparkles size={16} className="text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    {THINKING_STEPS[thinkingIndex]}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action chips suggested by the assistant */}
          {actions.length > 0 && !loading && streamingText === null && (
            <div className="kx-suggested-actions-block pt-2">
              <span className="kx-actions-label text-xs font-bold text-muted-foreground block mb-2">
                Raccourcis suggérés :
              </span>
              <div className="kx-actions-chips flex flex-wrap gap-2">
                {actions.map((act, i) => (
                  <button
                    key={i}
                    type="button"
                    className="kx-action-chip px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/15 text-primary text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    onClick={() => handleActionClick(act)}
                  >
                    <Zap size={13} />
                    <span>{act.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="kx-copilot-footer">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="kx-copilot-input-form"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez une question ou ordonnez une action (ex: Enregistre une vente de 15 000 FCFA…)"
              disabled={loading || streamingText !== null}
              autoFocus
              className="text-sm font-medium"
            />
            <button
              type="submit"
              disabled={loading || streamingText !== null || !input.trim()}
              className="kx-copilot-send-btn"
            >
              <Send size={16} />
            </button>
          </form>
          <div className="kx-copilot-input-hint">
            <span>
              Appuyez sur <strong>Entrée</strong> pour envoyer · <strong>Échap</strong> pour fermer
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}

