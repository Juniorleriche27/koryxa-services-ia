"use client";
import { useI18n } from "@/lib/i18n";

import React, { useMemo, useState } from "react";
import {
  Plus,
  UserRound,
  CalendarDays,
  Check,
  Play,
  PauseCircle,
  RotateCcw,
  Search,
  List,
  Columns3,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { EmptyState, TableSkeleton } from "../Ui";
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

type StatusFilter = "all" | "todo" | "in_progress" | "blocked" | "completed";
type ViewMode = "list" | "board";

const STATUS_ORDER = ["todo", "in_progress", "blocked", "completed"] as const;

const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

const PRIORITY_STYLE: Record<string, { badge: string; border: string; dot: string }> = {
  critical: {
    badge: "bg-red-50 text-red-700 border-red-200",
    border: "border-l-red-600",
    dot: "bg-red-600",
  },
  high: {
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    border: "border-l-amber-500",
    dot: "bg-amber-500",
  },
  normal: {
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    border: "border-l-emerald-600",
    dot: "bg-emerald-600",
  },
  low: {
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    border: "border-l-slate-300",
    dot: "bg-slate-400",
  },
};

const STATUS_BADGE: Record<string, string> = {
  todo: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  blocked: "bg-rose-50 text-rose-700 border-rose-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
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
  const [movingId, setMovingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

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
    setMovingId(action.id);
    try {
      await serviceIaFetch(`/workflow/actions/${action.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await onReload();
    } finally {
      setMovingId(null);
    }
  };

  const counts = useMemo(() => {
    const list = data ?? [];
    return {
      all: list.length,
      todo: list.filter((a) => a.status === "todo").length,
      in_progress: list.filter((a) => a.status === "in_progress").length,
      blocked: list.filter((a) => a.status === "blocked").length,
      completed: list.filter((a) => a.status === "completed").length,
      urgent: list.filter(
        (a) => a.status !== "completed" && (a.priority === "critical" || a.priority === "high")
      ).length,
      active: list.filter((a) => a.status !== "completed").length,
    };
  }, [data]);

  const filteredItems = useMemo(() => {
    const list = data ?? [];
    const normalizedQuery = query.trim().toLowerCase();
    return list
      .filter((item) => (filter === "all" ? true : item.status === filter))
      .filter((item) => {
        if (!normalizedQuery) return true;
        return (
          item.title.toLowerCase().includes(normalizedQuery) ||
          (item.description || "").toLowerCase().includes(normalizedQuery) ||
          (item.responsible_user_id || "").toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((a, b) => {
        const aDone = a.status === "completed" ? 1 : 0;
        const bDone = b.status === "completed" ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        const pA = PRIORITY_WEIGHT[a.priority] ?? 2;
        const pB = PRIORITY_WEIGHT[b.priority] ?? 2;
        return pA - pB;
      });
  }, [data, filter, query]);

  const renderPriorityBadge = (priority: string) => {
    const style = PRIORITY_STYLE[priority] ?? PRIORITY_STYLE.normal;
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${style.badge}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
        {formatLabel(priority, lang)}
      </span>
    );
  };

  const renderActionButtons = (action: ActionItem, compact = false) => {
    const busy = movingId === action.id;
    const baseBtn = compact
      ? "inline-flex items-center justify-center gap-1.5 min-h-9 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50"
      : "inline-flex items-center justify-center gap-1.5 min-h-10 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50";

    if (action.status === "completed") {
      return (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 size={15} /> Traité
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => void move(action, "todo")}
            className={`${baseBtn} border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900`}
          >
            <RotateCcw size={13} />
            Rouvrir
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-2">
        {action.status === "todo" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void move(action, "in_progress")}
            className={`${baseBtn} border border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100`}
          >
            <Play size={13} />
            Démarrer
          </button>
        )}
        {action.status === "in_progress" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void move(action, "blocked")}
            className={`${baseBtn} border border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200`}
          >
            <PauseCircle size={13} />
            Bloquer
          </button>
        )}
        {action.status === "blocked" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void move(action, "in_progress")}
            className={`${baseBtn} border border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100`}
          >
            <Play size={13} />
            Reprendre
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => void move(action, "completed")}
          className={`${baseBtn} bg-emerald-800 text-white hover:bg-emerald-900 shadow-2xs`}
        >
          <Check size={14} />
          Terminer
        </button>
      </div>
    );
  };

  const renderColumn = (status: (typeof STATUS_ORDER)[number]) => {
    const colItems = (data ?? []).filter((a) => a.status === status);
    return (
      <div
        className="flex flex-col gap-3 rounded-2xl border border-emerald-950/10 bg-white/80 p-3.5 min-h-[280px]"
        key={status}
        data-empty={colItems.length > 0 ? "false" : "true"}
      >
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <strong className="text-xs font-bold uppercase tracking-wide text-slate-700">
            {formatLabel(status, lang)}
          </strong>
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-lg bg-emerald-50 px-2 text-xs font-bold text-emerald-800 tabular-nums">
            {colItems.length}
          </span>
        </div>
        {colItems.length === 0 ? (
          <p className="my-auto py-8 text-center text-xs text-slate-400">Aucune action</p>
        ) : (
          colItems.map((a) => {
            const pStyle = PRIORITY_STYLE[a.priority] ?? PRIORITY_STYLE.normal;
            return (
              <article
                className={`app-task flex flex-col gap-2.5 rounded-xl border border-slate-200/80 border-l-4 ${pStyle.border} bg-white p-3.5 shadow-2xs transition hover:shadow-sm`}
                key={a.id}
              >
                <div>{renderPriorityBadge(a.priority)}</div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{a.title}</h3>
                {a.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{a.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <UserRound size={12} />
                    {a.responsible_user_id || "Non assignée"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={12} />
                    {formatDate(a.due_date)}
                  </span>
                </div>
                <div className="pt-2.5 mt-1 border-t border-slate-100">
                  {renderActionButtons(a, true)}
                </div>
              </article>
            );
          })
        )}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* EN-TÊTE DIRECT ET ÉPURÉ */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-4 border-b border-emerald-950/10">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
              Direction · Pilotage
            </span>
            <h1 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">
              Actions et décisions
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {counts.active > 0
                ? `${counts.active} action${counts.active > 1 ? "s" : ""} active${counts.active > 1 ? "s" : ""}${
                    counts.urgent > 0
                      ? ` dont ${counts.urgent} prioritaire${counts.urgent > 1 ? "s" : ""} à arbitrer`
                      : ""
                  }.`
                : "Suivez vos décisions, leurs responsables et leurs échéances."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sélecteur de vue Liste / Tableau */}
            <div
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-2xs"
              role="group"
              aria-label="Mode d'affichage"
            >
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  viewMode === "list"
                    ? "bg-emerald-800 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <List size={14} />
                Liste
              </button>
              <button
                type="button"
                onClick={() => setViewMode("board")}
                aria-pressed={viewMode === "board"}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  viewMode === "board"
                    ? "bg-emerald-800 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <Columns3 size={14} />
                Tableau
              </button>
            </div>

            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900 cursor-pointer"
              onClick={() => setCreating(true)}
            >
              <Plus size={16} />
              <span>{t("actions_btn_new").replace(/^\s*\+\s*/, "")}</span>
            </button>
          </div>
        </header>

        {/* BARRE DE FILTRES + RECHERCHE */}
        {data && data.length > 0 && viewMode === "list" && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filtrer par statut">
              {(
                [
                  ["all", "Toutes", counts.all],
                  ["todo", "À faire", counts.todo],
                  ["in_progress", "En cours", counts.in_progress],
                  ["blocked", "Bloquées", counts.blocked],
                  ["completed", "Terminées", counts.completed],
                ] as const
              ).map(([key, label, count]) => {
                const active = filter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFilter(key)}
                    className={`inline-flex items-center gap-1.5 min-h-9 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                      active
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-900"
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums ${
                        active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une action..."
                aria-label="Rechercher une action"
                className="w-full min-h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>
        )}

        {/* ÉTATS DE CHARGEMENT / ERREUR / VIDE */}
        {loading && !data && <TableSkeleton />}
        {error && !data && <EmptyState title={t("common_error")} detail={error} onRetry={onReload} />}
        {!loading && !error && (!data || data.length === 0) && (
          <EmptyState
            title={t("actions_empty_title")}
            detail={t("actions_empty_desc")}
            onRetry={onReload}
          />
        )}

        {/* VUE LISTE PRIORISÉE (PAR DÉFAUT — CLAIRE ET ACTIONNABLE) */}
        {data && data.length > 0 && viewMode === "list" && (
          <section className="flex flex-col gap-3" aria-label="Liste des actions et décisions">
            {filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-10 text-center">
                <AlertCircle size={22} className="mx-auto text-slate-400" />
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  Aucune action ne correspond à ce filtre.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFilter("all");
                    setQuery("");
                  }}
                  className="mt-3 text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
                >
                  Afficher toutes les actions
                </button>
              </div>
            ) : (
              filteredItems.map((action) => {
                const pStyle = PRIORITY_STYLE[action.priority] ?? PRIORITY_STYLE.normal;
                const statusStyle = STATUS_BADGE[action.status] ?? STATUS_BADGE.todo;
                const isDone = action.status === "completed";
                return (
                  <article
                    key={action.id}
                    className={`app-task flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/90 border-l-4 ${pStyle.border} bg-white p-4 sm:p-5 shadow-2xs transition hover:border-emerald-300 hover:shadow-sm ${
                      isDone ? "opacity-75 bg-slate-50/70" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {renderPriorityBadge(action.priority)}
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle}`}
                        >
                          {formatLabel(action.status, lang)}
                        </span>
                      </div>

                      <div>
                        <h3
                          className={`text-[15px] font-bold text-slate-950 leading-snug ${
                            isDone ? "line-through text-slate-500" : ""
                          }`}
                        >
                          {action.title}
                        </h3>
                        {action.description && (
                          <p className="mt-1 text-xs leading-relaxed text-slate-600 max-w-2xl">
                            {action.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <UserRound size={13} className="text-slate-400" />
                          {action.responsible_user_id || "Non assignée"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={13} className="text-slate-400" />
                          {action.due_date ? formatDate(action.due_date) : "Aucune échéance"}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {renderActionButtons(action)}
                    </div>
                  </article>
                );
              })
            )}
          </section>
        )}

        {/* VUE TABLEAU 4 COLONNES (OPTIONNELLE EN 1 CLIC) */}
        {data && data.length > 0 && viewMode === "board" && (
          <section className="cauri-actions-board" aria-label="Suivi des actions par statut">
            <div className="cauri-actions-four-columns grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
              {STATUS_ORDER.map(renderColumn)}
            </div>
          </section>
        )}
      </div>

      {/* DIALOGUE CRÉATION D'UNE ACTION */}
      <Dialog open={creating} onClose={() => setCreating(false)} title="Créer une action ou décision">
        <form onSubmit={create} className="space-y-4">
          <div className="app-form-grid">
            <label className="app-form-span">
              Titre de l&apos;action *
              <input
                name="title"
                required
                minLength={2}
                placeholder="Ex : Valider l'écart de caisse du 17/11"
              />
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
              Responsable (nom ou identifiant)
              <input name="responsible_user_id" placeholder="Optionnel" />
            </label>
            <label className="app-form-span">
              Détails / Contexte
              <textarea
                name="description"
                rows={3}
                placeholder="Précisez la décision à prendre ou le contexte utile..."
              />
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
              {saving ? "Création…" : "Créer l'action"}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
