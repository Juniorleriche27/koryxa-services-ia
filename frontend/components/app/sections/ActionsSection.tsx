"use client";
import { useI18n } from "@/lib/i18n";

import React, { useState } from "react";
import { Plus, UserRound, CalendarDays } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { EmptyState, StatusPill, TableSkeleton } from "../Ui";
import { Dialog, FormError } from "../Dialog";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { formatDate, formatLabel } from "../RegistersTable";

export type ActionItem = {
  id: string;
  title: string;
  status: string;
  priority: string;
  responsible_user_id?: string | null;
  due_date?: string | null;
  description?: string | null;
};

export function ActionsSection({
  data,
  loading,
  error,
  onReload,
}: {
  data: ActionItem[] | null;
  loading: boolean;
  error: string;
  onReload: () => Promise<void>;
}) {
  const { t, lang } = useI18n();
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const formData = new FormData(event.currentTarget);
    try {
      await serviceIaFetch("/workflow/actions", {
        method: "POST",
        body: JSON.stringify({
          title: String(formData.get("title") || ""),
          description: String(formData.get("description") || "") || null,
          priority: String(formData.get("priority") || "normal"),
          responsible_user_id: String(formData.get("responsible_user_id") || "") || null,
          due_date: String(formData.get("due_date") || "") || null,
        }),
      });
      await onReload();
      setCreating(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Création impossible");
    } finally {
      setSaving(false);
    }
  };

  const move = async (action: ActionItem, status: string) => {
    await serviceIaFetch(`/workflow/actions/${action.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await onReload();
  };

  return (
    <>
            <PageHeader
        eyebrow={t("actions_eyebrow")}
        title={t("actions_title_page")}
        description={t("actions_desc_page")}
        action={
          <button className="app-button app-button-primary" onClick={() => setCreating(true)}>
            <Plus size={16} />
            <span>{t("actions_btn_new")}</span>
          </button>
        }
      />

      {loading && <TableSkeleton />}
      {error && <EmptyState title={t("common_error")} detail={error} onRetry={onReload} />}
      {!loading && !error && (!data || data.length === 0) && (
        <EmptyState
          title={t("actions_empty_title")}
          detail={t("actions_empty_desc")}
          onRetry={onReload}
        />
      )}

      {data && data.length > 0 && (
        <section className="app-kanban">
          {["todo", "in_progress", "blocked", "completed"].map((status) => (
            <div className="app-kanban-column" key={status}>
              <div className="app-kanban-head">
                <strong>{formatLabel(status, lang)}</strong>
                <span>{data.filter((a) => a.status === status).length}</span>
              </div>
              {data
                .filter((a) => a.status === status)
                .map((a) => (
                  <article className="app-task" key={a.id}>
                    <StatusPill>{formatLabel(a.priority)}</StatusPill>
                    <h3>{a.title}</h3>
                    <div>
                      <span>
                        <UserRound size={14} />
                        {a.responsible_user_id || "Non assignée"}
                      </span>
                      <span>
                        <CalendarDays size={14} />
                        {formatDate(a.due_date)}
                      </span>
                    </div>
                    <div className="app-row-actions">
                      {status !== "in_progress" && status !== "completed" && (
                        <button
                          className="app-text-button"
                          onClick={() => void move(a, "in_progress")}
                        >
                          Démarrer
                        </button>
                      )}
                      {status !== "completed" && (
                        <button
                          className="app-text-button"
                          onClick={() => void move(a, "completed")}
                        >
                          Terminer
                        </button>
                      )}
                    </div>
                  </article>
                ))}
            </div>
          ))}
        </section>
      )}

      <Dialog open={creating} onClose={() => setCreating(false)} title="Créer une action">
        <form onSubmit={create}>
          <div className="app-form-grid">
            <label className="app-form-span">
              Titre *<input name="title" required minLength={2} />
            </label>
            <label>
              Priorité
              <select name="priority" defaultValue="normal">
                <option value="low">Faible</option>
                <option value="normal">Normale</option>
                <option value="high">Haute</option>
                <option value="critical">Critique</option>
              </select>
            </label>
            <label>
              Échéance
              <input name="due_date" type="date" />
            </label>
            <label className="app-form-span">
              Responsable (identifiant KORYXA)
              <input name="responsible_user_id" />
            </label>
            <label className="app-form-span">
              Description
              <textarea name="description" />
            </label>
          </div>
          <FormError>{formError}</FormError>
          <div className="app-form-actions">
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setCreating(false)}
            >
              Annuler
            </button>
            <button className="app-button app-button-primary" disabled={saving}>
              {saving ? "Création…" : "Créer"}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
