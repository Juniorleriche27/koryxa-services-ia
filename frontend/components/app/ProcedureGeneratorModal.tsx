"use client";

import { useState } from "react";
import {
  Sparkles,
  FileCheck2,
  CheckCircle2,
  Layers,
  UserCheck,
  ArrowRight,
  Plus,
} from "lucide-react";
import { Dialog, FormError } from "./Dialog";
import { serviceIaFetch } from "@/lib/service-ia/api";

interface ProcedureStepDraft {
  step_number: number;
  title: string;
  description: string;
  role_responsible: string;
  input_required?: string | null;
  output_produced?: string | null;
}


interface GeneratedProcedure {
  title: string;
  objective: string;
  department: string;
  prerequisites: string[];
  steps: ProcedureStepDraft[];
  quality_checks: string[];
  provider_used: string;
}

export function ProcedureGeneratorModal({
  open,
  onClose,
  onProcedureCreated,
}: {
  open: boolean;
  onClose: () => void;
  onProcedureCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("Opérations");
  const [stepCount, setStepCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generated, setGenerated] = useState<GeneratedProcedure | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await serviceIaFetch<GeneratedProcedure>("/ai/generate-procedure", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          department,
          expected_steps_count: stepCount,
        }),
      });
      setGenerated(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la génération de la procédure");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToRegisters = async () => {
    if (!generated) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: generated.title,
        description: `${generated.objective}\n\nPrérequis : ${generated.prerequisites.join(", ")}`,
        department: generated.department,
        status: "validated",
        steps: generated.steps.map((s) => ({
          step_number: s.step_number,
          title: s.title,
          description: `${s.description}\n\n• Responsable : ${s.role_responsible}\n• Données d'entrée : ${s.input_required || "—"}\n• Résultat attendu : ${s.output_produced || "—"}`,
          role_required: s.role_responsible,
        })),
      };

      await serviceIaFetch("/registers/procedures", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      onProcedureCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement de la procédure");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog
      open
      title="Générateur de Procédure Métier (SOP IA)"
      description="Formalisez vos méthodes de travail et étapes opérationnelles à partir d'une simple description."
      onClose={onClose}
    >
      {!generated ? (
        <form onSubmit={handleGenerate}>
          <div className="app-form-grid">
            <label className="app-form-span">
              Titre du processus ou de la procédure *
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Ex : Clôture journalière de caisse, Gestion des réclamations clients, Inventaire…"
              />
            </label>

            <label>
              Département / Pôle *
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="Opérations">Opérations & Production</option>
                <option value="Commercial">Commercial & Vente</option>
                <option value="Finance">Finance & Comptabilité</option>
                <option value="Logistique">Logistique & Stocks</option>
                <option value="Ressources Humaines">Ressources Humaines</option>
                <option value="Service Client">Service Client & SAV</option>
              </select>
            </label>

            <label>
              Nombre d&apos;étapes souhaité
              <select
                value={stepCount}
                onChange={(e) => setStepCount(Number(e.target.value))}
              >
                <option value={3}>3 étapes (Synthétique)</option>
                <option value={4}>4 étapes (Standard)</option>
                <option value={5}>5 étapes (Détaillé)</option>
                <option value={6}>6 étapes (Complet)</option>
              </select>
            </label>

            <label className="app-form-span">
              Description de ce que l&apos;équipe doit accomplir *
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Expliquez brièvement comment l'opération se déroule : qui intervient, quels sont les points de contrôle et le résultat attendu…"
                rows={4}
              />
            </label>
          </div>

          <FormError>{error}</FormError>

          <div className="app-form-actions">
            <button type="button" className="app-button app-button-secondary" onClick={onClose}>
              Annuler
            </button>
            <button className="app-button app-button-primary" disabled={loading}>
              <Sparkles size={16} />
              <span>{loading ? "Génération de la procédure…" : "Générer avec Cora"}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="kx-generated-procedure-review">
          <div className="kx-gen-proc-head">
            <span className="kx-gen-source-badge">
              <Sparkles size={13} /> {generated.provider_used}
            </span>
            <h3>{generated.title}</h3>
            <p className="kx-gen-proc-objective">{generated.objective}</p>
          </div>

          <div className="kx-gen-steps-list">
            <h4>Étapes opérationnelles décomposées ({generated.steps.length}) :</h4>
            {generated.steps.map((st) => (
              <div key={st.step_number} className="kx-gen-step-item">
                <div className="kx-gen-step-num">{st.step_number}</div>
                <div className="kx-gen-step-body">
                  <strong>{st.title}</strong>
                  <p>{st.description}</p>
                  <div className="kx-gen-step-meta">
                    <span>
                      <UserCheck size={12} /> {st.role_responsible}
                    </span>
                    {st.output_produced && (
                      <span>
                        <CheckCircle2 size={12} /> {st.output_produced}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <FormError>{error}</FormError>

          <div className="app-form-actions">
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setGenerated(null)}
            >
              Modifier les paramètres
            </button>
            <button
              type="button"
              className="app-button app-button-primary"
              disabled={saving}
              onClick={handleSaveToRegisters}
            >
              <FileCheck2 size={16} />
              <span>{saving ? "Enregistrement…" : "Enregistrer dans le Registre"}</span>
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
