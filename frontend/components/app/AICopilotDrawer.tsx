"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Send,
  Bot,
  User,
  Zap,
  TrendingUp,
  AlertTriangle,
  FileCheck2,
  ReceiptText,
  ShieldCheck,
  RotateCcw,
  Settings2,
} from "lucide-react";
import { serviceIaFetch } from "@/lib/service-ia/api";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
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
  suggested_actions: SuggestedAction[];
}

const QUICK_PROMPTS = [
  "Quelle est ma situation de trésorerie actuelle ?",
  "Quels clients dois-je relancer en priorité ?",
  "Fais-moi un résumé des alertes Radar à corriger",
  "Comment optimiser mes dépenses et ma marge brute ?",
];

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
      role: "assistant",
      content:
        "👋 **Bonjour ! Je suis Cora, votre assistante IA.**\n\nJe suis connectée en direct à vos registres (Ventes, Dépenses, Trésorerie, Radar de conformité et Procédures). Comment puis-je vous aider aujourd'hui ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [providerUsed, setProviderUsed] = useState("Knowlia Intelligence");
  const [actions, setActions] = useState<SuggestedAction[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) {
      scrollToBottom();
    }
  }, [open, messages, loading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleSend = async (textToSend?: string) => {
    const msgText = (textToSend || input).trim();
    if (!msgText || loading) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: msgText }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await serviceIaFetch<AIChatResponse>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: newMessages,
          include_financial_context: true,
          include_radar_context: true,
        }),
      });

      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
      setProviderUsed(res.provider_used);
      setActions(res.suggested_actions || []);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ Impossible de joindre le service d'intelligence pour le moment. Veuillez vérifier votre connexion ou votre configuration IA.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: SuggestedAction) => {
    if (action.action_type === "navigate" && action.payload?.path) {
      onClose();
      router.push(action.payload.path);
    } else if (action.action_type === "send_reminder") {
      onClose();
      router.push("/espace/ventes");
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
              <Bot size={20} />
            </div>
            <div>
              <h3>Cora</h3>
              <span className="kx-copilot-provider-tag">Source : {providerUsed}</span>
            </div>
          </div>

          <div className="kx-copilot-header-actions">
            <button
              type="button"
              className="kx-copilot-settings-btn"
              onClick={() => {
                onClose();
                router.push("/espace/parametres");
              }}
              title="Configurer Cora et sa source d'intelligence Knowlia"
            >
              <Settings2 size={16} />
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
              className="kx-quick-prompt-btn"
              disabled={loading}
              onClick={() => handleSend(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Messages List */}
        <div className="kx-copilot-messages">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`kx-chat-msg ${m.role === "user" ? "is-user" : "is-assistant"}`}
            >
              <div className="kx-chat-avatar">
                {m.role === "user" ? <User size={15} /> : <Bot size={15} />}
              </div>
              <div className="kx-chat-bubble-content">
                <div className="kx-chat-text" style={{ whiteSpace: "pre-wrap" }}>
                  {m.content}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="kx-chat-msg is-assistant">
              <div className="kx-chat-avatar">
                <Bot size={15} />
              </div>
              <div className="kx-chat-bubble-content">
                <div className="kx-copilot-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}

          {/* Action chips suggested by the assistant */}
          {actions.length > 0 && (
            <div className="kx-suggested-actions-block">
              <span className="kx-actions-label">Raccourcis suggérés :</span>
              <div className="kx-actions-chips">
                {actions.map((act, i) => (
                  <button
                    key={i}
                    type="button"
                    className="kx-action-chip"
                    onClick={() => handleActionClick(act)}
                  >
                    <Zap size={12} />
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
              placeholder="Demandez à Cora quelque chose sur votre entreprise…"
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
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
