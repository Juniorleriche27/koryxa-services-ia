"use client";

import { useState, useEffect } from "react";
import {
  Cpu,
  Sparkles,
  Key,
  Globe,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Save,
  Server,
  Zap,
} from "lucide-react";
import { serviceIaFetch } from "@/lib/service-ia/api";

interface AIProviderInfo {
  id: string;
  name: string;
  description: string;
}

interface AIConfigData {
  provider: "native" | "gemini" | "openai" | "cohere" | "gateway" | "knowlia";
  model_name: string;
  api_base_url?: string | null;
  temperature: number;
  custom_system_prompt?: string | null;
  has_api_key: boolean;
  available_providers: AIProviderInfo[];
}

export function AIProviderSettings() {
  const [config, setConfig] = useState<AIConfigData | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("native");
  const [modelName, setModelName] = useState("koryxa-smart-v1");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [temperature, setTemperature] = useState(0.3);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState("");

  const loadConfig = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await serviceIaFetch<AIConfigData>("/ai/config");
      setConfig(data);
      setSelectedProvider(data.provider);
      setModelName(data.model_name);
      setBaseUrl(data.api_base_url || "");
      setTemperature(data.temperature);
      setSystemPrompt(data.custom_system_prompt || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger la configuration IA");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConfig();
  }, []);

  const handleProviderSelect = (provId: string) => {
    setSelectedProvider(provId);
    if (provId === "gemini") {
      setModelName("gemini-1.5-pro");
    } else if (provId === "openai") {
      setModelName("gpt-4o");
    } else if (provId === "cohere") {
      setModelName("command-r-plus");
    } else if (provId === "gateway") {
      setModelName("custom-llama3");
      if (!baseUrl) setBaseUrl("http://localhost:11434/v1");
    } else if (provId === "knowlia") {
      setModelName("knowlia-v1");
    } else {
      setModelName("koryxa-smart-v1");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSavedSuccess(false);
    try {
      const payload: any = {
        provider: selectedProvider,
        model_name: modelName,
        api_base_url: baseUrl.trim() || null,
        temperature,
        custom_system_prompt: systemPrompt.trim() || null,
      };
      if (apiKey.trim()) {
        payload.api_key = apiKey.trim();
      }

      await serviceIaFetch("/ai/config", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setSavedSuccess(true);
      setApiKey("");
      await loadConfig();
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app-panel">
        <div className="kx-loading-indicator">Chargement de la configuration des intelligences…</div>
      </div>
    );
  }

  return (
    <div className="kx-ai-settings-container">
      <form onSubmit={handleSave} className="app-panel">
        <div className="app-panel-head">
          <div>
            <span className="app-eyebrow">Intelligence Artificielle & Modèles</span>
            <h2>Sources d&apos;Intelligence & Passerelle LLM</h2>
            <p className="app-panel-desc">
              Sélectionnez le fournisseur d&apos;intelligence de votre choix. Koryxa est conçu pour être indépendant et intègre nativement un moteur autonome ultra-performant.
            </p>
          </div>
          {savedSuccess && (
            <div className="kx-save-toast">
              <CheckCircle2 size={16} />
              <span>Configuration IA enregistrée !</span>
            </div>
          )}
        </div>

        {/* Provider Cards Grid */}
        <div className="kx-provider-cards-grid">
          {(config?.available_providers || []).map((prov) => {
            const isSelected = selectedProvider === prov.id;
            return (
              <div
                key={prov.id}
                className={`kx-provider-card ${isSelected ? "is-selected" : ""}`}
                onClick={() => handleProviderSelect(prov.id)}
              >
                <div className="kx-provider-card-head">
                  <div className="kx-provider-icon">
                    {prov.id === "native" ? (
                      <Cpu size={20} />
                    ) : prov.id === "gateway" ? (
                      <Server size={20} />
                    ) : (
                      <Sparkles size={20} />
                    )}
                  </div>
                  <div className="kx-provider-card-info">
                    <h4>{prov.name}</h4>
                    <p>{prov.description}</p>
                  </div>
                </div>

                <div className="kx-provider-card-footer">
                  <span className="kx-radio-indicator">{isSelected ? "● Actif" : "○ Sélectionner"}</span>
                  {prov.id === "native" && <span className="kx-zero-config-badge">Zéro Dépendance</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Provider Configuration Fields */}
        <div className="kx-provider-fields-box">
          <div className="app-form-grid">
            <label>
              Modèle LLM cible
              <input
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                required
                placeholder="Ex : gemini-1.5-pro, gpt-4o, command-r-plus…"
              />
            </label>

            {selectedProvider !== "native" && (
              <label>
                Clé API {selectedProvider.toUpperCase()}
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={config?.has_api_key ? "•••••••••••••••• (Déjà configurée)" : "Saisissez votre clé API…"}
                />
              </label>
            )}

            {(selectedProvider === "gateway" || selectedProvider === "openai") && (
              <label className="app-form-span">
                URL du Serveur / Custom AI Gateway (OpenAI-compatible)
                <input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="Ex : http://localhost:11434/v1 ou https://mon-serveur-ia.entreprise.com/v1"
                />
              </label>
            )}

            <label className="app-form-span">
              Consignes système personnalisées (Prompt Métier)
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Consignes particulières pour adapter les conseils du copilote à votre secteur d'activité…"
                rows={3}
              />
            </label>
          </div>
        </div>

        {error && (
          <div className="app-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="app-form-actions">
          <button type="submit" className="app-button app-button-primary" disabled={saving}>
            <Save size={16} />
            <span>{saving ? "Enregistrement…" : "Enregistrer les paramètres IA"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
