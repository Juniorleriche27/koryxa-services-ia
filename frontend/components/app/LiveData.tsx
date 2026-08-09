"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Download,
  FileText,
  Plus,
  Play,
  Radar as RadarIcon,
  RefreshCw,
  Search,
  UploadCloud,
  UserRound,
  X,
  Sparkles,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { PageHeader } from "./PageHeader";
import { EmptyState, MetricCard, RegisterList, StatusPill } from "./Ui";
import { serviceIaFetch } from "@/lib/service-ia/api";
import type { Metric, RegisterItem } from "@/lib/service-ia/types";
import { RegisterCreateDialog } from "./RegisterCreateDialog";
import { Dialog, FormError } from "./Dialog";
import { directUpload, prepareDocumentUpload } from "@/lib/files/directUpload";
import {
  SalesTableInteractive,
  SaleItem,
  formatMoney,
  formatDate,
import { ExecutiveDashboard } from "./ExecutiveDashboard";
import { ProcedureGeneratorModal } from "./ProcedureGeneratorModal";
import { AIProviderSettings } from "./AIProviderSettings";


type ApiPage<T> = { items: T[]; total: number; page: number; page_size: number };
type Offer = {
  id: string;
  name: string;
  category?: string | null;
  status: string;
  price?: string | null;
  currency: string;
  billing_unit?: string | null;
  conditions?: string | null;
  updated_at: string;
};
type Sale = SaleItem;
type Procedure = {
  id: string;
  title: string;
  objective?: string | null;
  department?: string | null;
  status: string;
  version: number;
  responsible_user_id?: string | null;
  next_review_date?: string | null;
};
type Alert = {
  id: string;
  title: string;
  explanation: string;
  priority: string;
  dimension: string;
  status: string;
  confidence: number;
};
type Action = {
  id: string;
  title: string;
  status: string;
  priority: string;
  responsible_user_id?: string | null;
  due_date?: string | null;
};
type Validation = {
  id: string;
  field_name: string;
  old_value: unknown;
  proposed_value: unknown;
  source_type: string;
  confidence: number;
  status: string;
};
type Organization = { id: string; name: string; slug: string; is_active: boolean };
type Member = { id: string; user_id: string; role: string; status: string };
type Attachment = {
  id: string;
  filename: string;
  register_type: string;
  record_id: string;
  size_bytes: number;
  created_at: string;
};
type Rule = {
  id: string;
  rule_code: string;
  enabled: boolean;
  priority: string;
  parameters: Record<string, unknown>;
};
type Invitation = { id: string; email: string; role: string; status: string; expires_at: string };

function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await serviceIaFetch<T>(path));
    } catch (e) {
      setError(e instanceof Error ? e.message : "API indisponible");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload };
}

function State({ loading, error, empty }: { loading: boolean; error: string; empty: boolean }) {
  if (loading) return <EmptyState title="Chargement…" detail="Connexion aux données Service IA." />;
  if (error) return <EmptyState title="Données indisponibles" detail={error} />;
  if (empty)
    return (
      <EmptyState
        title="Aucune donnée"
        detail="Aucun élément réel n’est encore enregistré pour cette organisation."
      />
    );
  return null;
}

export function LiveRegister({ kind }: { kind: "offers" | "sales" | "procedures" }) {
  const config = {
    offers: ["Offres & tarifs", "Conservez un tarif officiel, ses conditions et sa période de validité."],
    sales: ["Ventes & Recouvrement", "Suivez vos ventes, vos paiements et vos encaissements effectifs."],
    procedures: ["Procédures & Méthodes", "Formalisez les méthodes de travail, responsables et dates de révision."],
  }[kind];

  const api = useApi<ApiPage<Offer | Sale | Procedure>>(`/registers/${kind}`);
  const [creating, setCreating] = useState(false);
  const [aiProcedureOpen, setAiProcedureOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);

  const offers = kind === "offers" ? ((api.data?.items as Offer[]) ?? []) : [];
  const sales = kind === "sales" ? ((api.data?.items as Sale[]) ?? []) : [];
  const procedures = kind === "procedures" ? ((api.data?.items as Procedure[]) ?? []) : [];

  const filteredOffers = useMemo(() => {
    if (!query.trim()) return offers;
    const q = query.toLowerCase();
    return offers.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        (o.category || "").toLowerCase().includes(q) ||
        (o.description || "").toLowerCase().includes(q)
    );
  }, [offers, query]);

  const filteredProcedures = useMemo(() => {
    if (!query.trim()) return procedures;
    const q = query.toLowerCase();
    return procedures.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.department || "").toLowerCase().includes(q) ||
        (p.objective || "").toLowerCase().includes(q)
    );
  }, [procedures, query]);

  return (
    <>
      <PageHeader
        eyebrow="Registre"
        title={config[0]}
        description={config[1]}
        action={
          <div className="kx-header-actions-row">
            {kind === "procedures" && (
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => setAiProcedureOpen(true)}
                title="Générer automatiquement une procédure opérationnelle standardisée"
              >
                <Sparkles size={16} />
                <span>Générer par IA (SOP)</span>
              </button>
            )}
            <button className="app-button app-button-primary" onClick={() => setCreating(true)}>
              <Plus size={16} />
              <span>Ajouter</span>
            </button>
          </div>
        }
      />


      <section className="app-panel">
        <State
          loading={api.loading}
          error={api.error}
          empty={!api.loading && !api.error && (api.data?.items.length ?? 0) === 0}
        />

        {/* Specialized Interactive Table for Sales */}
        {kind === "sales" && sales.length > 0 && (
          <SalesTableInteractive
            sales={sales}
            onSelect={setSelectedSale}
            onRefresh={api.reload}
          />
        )}

        {/* Interactive Offers View */}
        {kind === "offers" && offers.length > 0 && (
          <div className="kx-offers-section">
            <div className="app-toolbar">
              <label className="app-search">
                <Search size={17} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher une offre par nom, catégorie ou description…"
                />
              </label>
              <button className="app-button app-button-secondary" onClick={() => void api.reload()}>
                <RefreshCw size={15} />
                <span>Actualiser</span>
              </button>
            </div>

            <div className="kx-offers-cards-grid">
              {filteredOffers.map((offer) => (
                <article
                  key={offer.id}
                  className="kx-offer-card"
                  onClick={() => setSelectedOffer(offer)}
                >
                  <div className="kx-offer-card-head">
                    <span className="kx-offer-cat">{offer.category || "Général"}</span>
                    <StatusPill>{formatLabel(offer.status)}</StatusPill>
                  </div>
                  <h3>{offer.name}</h3>
                  <div className="kx-offer-price-row">
                    <strong>{formatMoney(offer.price, offer.currency)}</strong>
                    {offer.billing_unit && <small>/ {offer.billing_unit}</small>}
                  </div>
                  <div className="kx-offer-foot">
                    <span>Mis à jour le {formatDate(offer.updated_at)}</span>
                    <button className="app-text-button">Détails →</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Procedures View */}
        {kind === "procedures" && procedures.length > 0 && (
          <div className="kx-procedures-section">
            <div className="app-toolbar">
              <label className="app-search">
                <Search size={17} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher une procédure par titre, département ou objectif…"
                />
              </label>
              <button className="app-button app-button-secondary" onClick={() => void api.reload()}>
                <RefreshCw size={15} />
                <span>Actualiser</span>
              </button>
            </div>

            <div className="app-list">
              {filteredProcedures.map((proc) => (
                <div
                  key={proc.id}
                  className="app-list-row kx-proc-row"
                  onClick={() => setSelectedProcedure(proc)}
                >
                  <div className="app-list-icon">
                    <FileText size={18} />
                  </div>
                  <div className="app-list-main">
                    <strong>{proc.title}</strong>
                    <span>
                      {proc.department || "Général"} · Version {proc.version} · Révision :{" "}
                      {formatDate(proc.next_review_date)}
                    </span>
                  </div>
                  <StatusPill>{formatLabel(proc.status)}</StatusPill>
                  <button className="app-button app-button-secondary kx-btn-sm">Consulter</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Dialogs */}
      <RegisterCreateDialog
        kind={kind}
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={api.reload}
      />

      <ProcedureGeneratorModal
        open={aiProcedureOpen}
        onClose={() => setAiProcedureOpen(false)}
        onProcedureCreated={api.reload}
      />

      <SaleDetails sale={selectedSale} onClose={() => setSelectedSale(null)} />
      <OfferDetails offer={selectedOffer} onClose={() => setSelectedOffer(null)} />
      <ProcedureDetails procedure={selectedProcedure} onClose={() => setSelectedProcedure(null)} />

    </>
  );
}

function SaleDetails({ sale, onClose }: { sale: Sale | null; onClose: () => void }) {
  if (!sale) return null;
  const fields = [
    ["Date de vente", formatDate(sale.sale_date)],
    ["Client", formatLabel(sale.client_name)],
    ["Offre ou service", sale.item_label],
    ["Quantité", formatLabel(sale.quantity)],
    ["Prix unitaire", formatMoney(sale.unit_price, sale.currency)],
    ["Réduction", formatMoney(sale.discount, sale.currency)],
    ["Devise", sale.currency],
    ["État du paiement", formatLabel(sale.payment_status)],
    ["Mode de paiement", formatLabel(sale.payment_method)],
    ["Canal de vente", formatLabel(sale.sales_channel)],
    ["Statut du registre", formatLabel(sale.status)],
    ["Source", formatLabel(sale.source)],
    ["Vendeur", formatLabel(sale.seller_user_id)],
    ["Identifiant de l’offre", formatLabel(sale.offer_id)],
    ["Créée le", formatDate(sale.created_at)],
    ["Dernière modification", formatDate(sale.updated_at)],
  ];

  return (
    <Dialog
      open
      title={`Vente ${sale.reference}`}
      description="Vue détaillée de toutes les informations enregistrées."
      onClose={onClose}
    >
      <div className="app-sale-summary">
        <div>
          <span>Montant total</span>
          <strong>{formatMoney(sale.total_amount, sale.currency)}</strong>
        </div>
        <StatusPill>{formatLabel(sale.payment_status)}</StatusPill>
      </div>
      <div className="app-detail-grid">
        {fields.map(([name, value]) => (
          <div key={name}>
            <span>{name}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="app-detail-comment">
        <span>Commentaire</span>
        <p>{formatLabel(sale.comment)}</p>
      </div>
      <div className="app-form-actions">
        <button className="app-button app-button-primary" onClick={onClose}>
          Fermer
        </button>
      </div>
    </Dialog>
  );
}

function OfferDetails({ offer, onClose }: { offer: Offer | null; onClose: () => void }) {
  if (!offer) return null;
  return (
    <Dialog
      open
      title={`Offre : ${offer.name}`}
      description="Tarif officiel et conditions commerciales."
      onClose={onClose}
    >
      <div className="app-sale-summary">
        <div>
          <span>Tarif officiel</span>
          <strong>{formatMoney(offer.price, offer.currency)}</strong>
        </div>
        <StatusPill>{formatLabel(offer.status)}</StatusPill>
      </div>
      <div className="app-detail-grid">
        <div>
          <span>Catégorie</span>
          <strong>{offer.category || "Général"}</strong>
        </div>
        <div>
          <span>Unité de facturation</span>
          <strong>{offer.billing_unit || "Unité"}</strong>
        </div>
        <div>
          <span>Dernière mise à jour</span>
          <strong>{formatDate(offer.updated_at)}</strong>
        </div>
      </div>
      {offer.conditions && (
        <div className="app-detail-comment">
          <span>Conditions d&apos;application</span>
          <p>{offer.conditions}</p>
        </div>
      )}
      <div className="app-form-actions">
        <button className="app-button app-button-primary" onClick={onClose}>
          Fermer
        </button>
      </div>
    </Dialog>
  );
}

function ProcedureDetails({
  procedure,
  onClose,
}: {
  procedure: Procedure | null;
  onClose: () => void;
}) {
  if (!procedure) return null;
  return (
    <Dialog
      open
      title={`Procédure : ${procedure.title}`}
      description="Méthode de travail et gouvernance interne."
      onClose={onClose}
    >
      <div className="app-sale-summary">
        <div>
          <span>Département</span>
          <strong>{procedure.department || "Général"}</strong>
        </div>
        <StatusPill>{formatLabel(procedure.status)}</StatusPill>
      </div>
      <div className="app-detail-grid">
        <div>
          <span>Responsable assigné</span>
          <strong>{procedure.responsible_user_id || "Non assigné"}</strong>
        </div>
        <div>
          <span>Version</span>
          <strong>v{procedure.version}</strong>
        </div>
        <div>
          <span>Prochaine révision</span>
          <strong>{formatDate(procedure.next_review_date)}</strong>
        </div>
      </div>
      {procedure.objective && (
        <div className="app-detail-comment">
          <span>Objectif attendu</span>
          <p>{procedure.objective}</p>
        </div>
      )}
      <div className="app-form-actions">
        <button className="app-button app-button-primary" onClick={onClose}>
          Fermer
        </button>
      </div>
    </Dialog>
  );
}

export function LiveDashboard() {
  const summaryApi = useApi<{
    total_sales_count: number;
    total_sales_amount: number | string;
    total_paid_amount: number | string;
    total_unpaid_amount: number | string;
    total_partial_amount: number | string;
    offers_count: number;
    procedures_count: number;
    primary_currency: string;
    recent_sales: SaleItem[];
  }>("/registers/summary");

  const alerts = useApi<Alert[]>("/radar/alerts");
  const actions = useApi<Action[]>("/workflow/actions");
  const org = useApi<Organization>("/organizations/current");
  const [radarRunning, setRadarRunning] = useState(false);
  const [creatingKind, setCreatingKind] = useState<"offers" | "sales" | "procedures" | null>(null);

  const triggerRadar = async () => {
    setRadarRunning(true);
    try {
      await serviceIaFetch("/radar/runs", { method: "POST" });
      await alerts.reload();
      await summaryApi.reload();
    } finally {
      setRadarRunning(false);
    }
  };

  const resolveAlert = async (id: string) => {
    await serviceIaFetch(`/radar/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "resolved" }),
    });
    await alerts.reload();
  };

  const createActionFromAlert = async (alert: Alert) => {
    await serviceIaFetch("/workflow/actions", {
      method: "POST",
      body: JSON.stringify({
        alert_id: alert.id,
        title: alert.title,
        description: alert.explanation,
        priority: alert.priority,
      }),
    });
    await serviceIaFetch(`/radar/alerts/${alert.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "acknowledged" }),
    });
    await alerts.reload();
    await actions.reload();
  };

  const error = summaryApi.error || alerts.error || actions.error;
  const loading = summaryApi.loading || alerts.loading || actions.loading;

  return (
    <>
      <State loading={loading} error={error} empty={false} />
      {!loading && !error && (
        <ExecutiveDashboard
          summary={summaryApi.data}
          alerts={alerts.data ?? []}
          actions={actions.data ?? []}
          organizationName={org.data?.name ?? "Organisation KORYXA"}
          onOpenCreate={(kind) => setCreatingKind(kind)}
          onTriggerRadar={triggerRadar}
          radarRunning={radarRunning}
          onResolveAlert={resolveAlert}
          onCreateActionFromAlert={createActionFromAlert}
        />
      )}

      {creatingKind && (
        <RegisterCreateDialog
          kind={creatingKind}
          open={Boolean(creatingKind)}
          onClose={() => setCreatingKind(null)}
          onCreated={() => {
            void summaryApi.reload();
          }}
        />
      )}
    </>
  );
}

export function LiveActions() {
  const q = useApi<Action[]>("/workflow/actions");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await serviceIaFetch("/workflow/actions", {
        method: "POST",
        body: JSON.stringify({
          title: String(data.get("title") || ""),
          description: String(data.get("description") || "") || null,
          priority: String(data.get("priority") || "normal"),
          responsible_user_id: String(data.get("responsible_user_id") || "") || null,
          due_date: String(data.get("due_date") || "") || null,
        }),
      });
      await q.reload();
      setCreating(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création impossible");
    } finally {
      setSaving(false);
    }
  };

  const move = async (action: Action, status: string) => {
    await serviceIaFetch(`/workflow/actions/${action.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await q.reload();
  };

  return (
    <>
      <PageHeader
        eyebrow="Exécution"
        title="Actions correctives"
        description="Créez, assignez et faites progresser les actions issues de Radar."
        action={
          <button className="app-button app-button-primary" onClick={() => setCreating(true)}>
            <Plus size={16} />
            <span>Nouvelle action</span>
          </button>
        }
      />
      <State loading={q.loading} error={q.error} empty={!q.data?.length} />
      {q.data?.length ? (
        <section className="app-kanban">
          {["todo", "in_progress", "blocked", "completed"].map((status) => (
            <div className="app-kanban-column" key={status}>
              <div className="app-kanban-head">
                <strong>{formatLabel(status)}</strong>
                <span>{q.data?.filter((a) => a.status === status).length}</span>
              </div>
              {q.data
                ?.filter((a) => a.status === status)
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
                      {status !== "in_progress" && status !== "completed" ? (
                        <button className="app-text-button" onClick={() => void move(a, "in_progress")}>
                          Démarrer
                        </button>
                      ) : null}
                      {status !== "completed" ? (
                        <button className="app-text-button" onClick={() => void move(a, "completed")}>
                          Terminer
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
            </div>
          ))}
        </section>
      ) : null}

      <Dialog open={creating} onClose={() => setCreating(false)} title="Créer une action">
        <form onSubmit={create}>
          <div className="app-form-grid">
            <label className="app-form-span">
              Titre *<input name="title" required minLength={2} />
            </label>
            <label>
              Priorité
              <select name="priority">
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
          <FormError>{error}</FormError>
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

export function LiveRadar() {
  const q = useApi<Alert[]>("/radar/alerts");
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    try {
      await serviceIaFetch("/radar/runs", { method: "POST" });
      await q.reload();
    } finally {
      setRunning(false);
    }
  };

  const update = async (id: string, status: string) => {
    await serviceIaFetch(`/radar/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await q.reload();
  };

  const action = async (a: Alert) => {
    await serviceIaFetch("/workflow/actions", {
      method: "POST",
      body: JSON.stringify({
        alert_id: a.id,
        title: a.title,
        description: a.explanation,
        priority: a.priority,
      }),
    });
    await update(a.id, "acknowledged");
  };

  return (
    <>
      <PageHeader
        eyebrow="Qualité des données"
        title="Knowlia Radar"
        description="Analysez chaque alerte, créez une action ou marquez-la comme traitée."
        action={
          <button className="app-button app-button-primary" disabled={running} onClick={run}>
            <Play size={16} />
            <span>{running ? "Analyse…" : "Lancer Radar"}</span>
          </button>
        }
      />
      <State loading={q.loading} error={q.error} empty={!q.data?.length} />
      {q.data?.length ? (
        <section className="app-panel">
          <div className="app-alert-list">
            {q.data.map((a) => (
              <article className="app-alert app-alert-large" key={a.id}>
                <RadarIcon size={18} />
                <div>
                  <strong>{a.title}</strong>
                  <p>{a.explanation}</p>
                  <div className="app-alert-tags">
                    <span>{formatLabel(a.dimension)}</span>
                    <span>{formatLabel(a.status)}</span>
                  </div>
                </div>
                <StatusPill>{formatLabel(a.priority)}</StatusPill>
                <div className="app-row-actions">
                  {a.status !== "resolved" ? (
                    <button className="app-button app-button-secondary" onClick={() => void action(a)}>
                      Créer une action
                    </button>
                  ) : null}
                  {a.status !== "resolved" ? (
                    <button className="app-text-button" onClick={() => void update(a.id, "resolved")}>
                      Résoudre
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

export function LiveValidations() {
  const q = useApi<Validation[]>("/workflow/validations?status=pending");

  const decide = async (id: string, decision: "accepted" | "rejected") => {
    await serviceIaFetch(`/workflow/validations/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision, justification: "Décision depuis l’espace Service IA" }),
    });
    await q.reload();
  };

  return (
    <>
      <PageHeader
        eyebrow="Contrôle humain"
        title="Validations"
        description="Propositions réelles en attente de décision."
      />
      <State loading={q.loading} error={q.error} empty={!q.data?.length} />
      {q.data?.length ? (
        <section className="app-panel">
          <div className="app-validation-list">
            {q.data.map((v) => (
              <article className="app-validation" key={v.id}>
                <div className="app-validation-head">
                  <div>
                    <strong>{v.field_name}</strong>
                    <span>{formatLabel(v.source_type)}</span>
                  </div>
                  <StatusPill>{Math.round(v.confidence * 100)}%</StatusPill>
                </div>
                <div className="app-change">
                  <div>
                    <small>Valeur actuelle</small>
                    <strong>{formatLabel(v.old_value)}</strong>
                  </div>
                  <span>→</span>
                  <div>
                    <small>Valeur proposée</small>
                    <strong>{formatLabel(v.proposed_value)}</strong>
                  </div>
                </div>
                <div className="app-validation-actions">
                  <button
                    className="app-button app-button-secondary"
                    onClick={() => void decide(v.id, "rejected")}
                  >
                    <X size={15} />
                    <span>Rejeter</span>
                  </button>
                  <button
                    className="app-button app-button-primary"
                    onClick={() => void decide(v.id, "accepted")}
                  >
                    <Check size={15} />
                    <span>Accepter</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

export function LiveOrganization() {
  const org = useApi<Organization>("/organizations/current");
  const members = useApi<Member[]>("/members");
  const invitations = useApi<Invitation[]>("/invitations");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");

  const invite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await serviceIaFetch("/invitations", {
        method: "POST",
        body: JSON.stringify({
          email: String(data.get("email") || ""),
          role: String(data.get("role") || "contributor"),
        }),
      });
      await invitations.reload();
      setInviting(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invitation impossible");
    }
  };

  const role = async (member: Member, value: string) => {
    await serviceIaFetch(`/members/${member.id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role: value }),
    });
    await members.reload();
  };

  return (
    <>
      <PageHeader
        eyebrow="Équipe"
        title="Organisation & membres"
        description="Gérez les membres, leurs rôles et les invitations."
        action={
          <button className="app-button app-button-primary" onClick={() => setInviting(true)}>
            <Plus size={16} />
            <span>Inviter</span>
          </button>
        }
      />
      <State loading={org.loading || members.loading} error={org.error || members.error} empty={false} />
      {org.data && members.data ? (
        <>
          <section className="app-panel">
            <div className="app-panel-head">
              <div>
                <span className="app-eyebrow">Organisation</span>
                <h2>{org.data.name}</h2>
              </div>
              <StatusPill>{members.data.length} membres</StatusPill>
            </div>
            <div className="app-list">
              {members.data.map((m) => (
                <div className="app-list-row" key={m.id}>
                  <div className="app-list-icon">
                    <UserRound size={18} />
                  </div>
                  <div className="app-list-main">
                    <strong>{m.user_id}</strong>
                    <span>{formatLabel(m.status)}</span>
                  </div>
                  <select
                    value={m.role}
                    onChange={(event) => void role(m, event.target.value)}
                    aria-label={`Rôle de ${m.user_id}`}
                  >
                    <option value="owner">Propriétaire</option>
                    <option value="manager">Responsable</option>
                    <option value="contributor">Contributeur</option>
                    <option value="viewer">Lecteur</option>
                  </select>
                </div>
              ))}
            </div>
          </section>

          {invitations.data?.length ? (
            <section className="app-panel">
              <div className="app-panel-head">
                <h2>Invitations</h2>
                <StatusPill>{invitations.data.length}</StatusPill>
              </div>
              <div className="app-list">
                {invitations.data.map((i) => (
                  <div className="app-list-row" key={i.id}>
                    <div className="app-list-main">
                      <strong>{i.email}</strong>
                      <span>
                        {formatLabel(i.role)} · expire le {formatDate(i.expires_at)}
                      </span>
                    </div>
                    <StatusPill>{formatLabel(i.status)}</StatusPill>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      <Dialog open={inviting} onClose={() => setInviting(false)} title="Inviter un membre">
        <form onSubmit={invite}>
          <div className="app-form-grid">
            <label className="app-form-span">
              Adresse e-mail *<input name="email" type="email" required />
            </label>
            <label className="app-form-span">
              Rôle
              <select name="role">
                <option value="contributor">Contributeur</option>
                <option value="manager">Responsable</option>
                <option value="viewer">Lecteur</option>
              </select>
            </label>
          </div>
          <FormError>{error}</FormError>
          <div className="app-form-actions">
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setInviting(false)}
            >
              Annuler
            </button>
            <button className="app-button app-button-primary">Envoyer l’invitation</button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function LiveDocuments() {
  const [registerType, setRegisterType] = useState("offers");
  const [recordId, setRecordId] = useState("");
  const [items, setItems] = useState<Attachment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!recordId.trim()) return;
    setLoading(true);
    setError("");
    try {
      setItems(
        await serviceIaFetch(
          `/imports/attachments?register_type=${encodeURIComponent(
            registerType
          )}&record_id=${encodeURIComponent(recordId.trim())}`
        )
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Documents indisponibles");
    } finally {
      setLoading(false);
    }
  };

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const source = event.target.files?.[0];
    if (!source || !recordId.trim()) return;
    setLoading(true);
    setError("");
    try {
      const file = await prepareDocumentUpload(source);
      await directUpload("attachment", registerType, file, recordId.trim());
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ajout impossible");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Mémoire documentaire"
        title="Documents & Knowlia"
        description="Ajoutez et consultez les justificatifs associés aux registres."
      />
      <section className="app-panel">
        <div className="app-toolbar">
          <select value={registerType} onChange={(e) => setRegisterType(e.target.value)}>
            <option value="offers">Offre</option>
            <option value="sales">Vente</option>
            <option value="procedures">Procédure</option>
          </select>
          <input
            value={recordId}
            onChange={(e) => setRecordId(e.target.value)}
            placeholder="Identifiant de l’élément"
          />
          <button className="app-button app-button-secondary" onClick={() => void load()}>
            Charger
          </button>
          <label className="app-button app-button-primary">
            Ajouter un fichier
            <input
              className="sr-only"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.png,.jpg,.jpeg,.webp,.zip"
              onChange={upload}
              disabled={!recordId.trim()}
            />
          </label>
        </div>
        <p className="app-panel-note">
          PDF, Office, texte, données, images ou ZIP · 100 Mo maximum. Les images sont optimisées automatiquement.
        </p>
        <State loading={loading} error={error} empty={!loading && !error && !items.length} />
        {items.length ? (
          <div className="app-list">
            {items.map((d) => (
              <article className="app-list-row" key={d.id}>
                <div className="app-list-icon">
                  <FileText size={19} />
                </div>
                <div className="app-list-main">
                  <strong>{d.filename}</strong>
                  <span>
                    {d.register_type} ·{" "}
                    {d.size_bytes >= 1048576
                      ? `${(d.size_bytes / 1048576).toFixed(1)} Mo`
                      : `${Math.ceil(d.size_bytes / 1024)} Ko`}
                  </span>
                </div>
                <StatusPill>{formatDate(d.created_at)}</StatusPill>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}

export function LiveSettings() {
  const q = useApi<Rule[]>("/radar/rules");

  const update = async (rule: Rule, patch: Record<string, unknown>) => {
    await serviceIaFetch(`/radar/rules/${rule.rule_code}`, {
      method: "PUT",
      body: JSON.stringify({
        enabled: rule.enabled,
        priority: rule.priority,
        parameters: rule.parameters,
        ...patch,
      }),
    });
    await q.reload();
  };

  return (
    <>
      <AIProviderSettings />

      <PageHeader
        eyebrow="Contrôle & Qualité"
        title="Règles de Sentinelle Radar"
        description="Activez les règles de détection et adaptez leur niveau de priorité."
      />
      <State loading={q.loading} error={q.error} empty={!q.data?.length} />
      {q.data?.length ? (
        <section className="app-panel">
          <div className="app-list">
            {q.data.map((r) => (
              <article className="app-list-row" key={r.id}>
                <div className="app-list-main">
                  <strong>{r.rule_code}</strong>
                  <span>{Object.keys(r.parameters).length} paramètres configurés</span>
                </div>
                <select
                  value={r.priority}
                  onChange={(event) => void update(r, { priority: event.target.value })}
                  aria-label={`Priorité de ${r.rule_code}`}
                >
                  <option value="low">Faible</option>
                  <option value="normal">Normale</option>
                  <option value="high">Haute</option>
                  <option value="critical">Critique</option>
                </select>
                <button
                  className={`app-button ${r.enabled ? "app-button-secondary" : "app-button-primary"}`}
                  onClick={() => void update(r, { enabled: !r.enabled })}
                >
                  {r.enabled ? "Désactiver" : "Activer"}
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );

}

export function LiveImports() {
  const [file, setFile] = useState<File | null>(null);
  const [registerType, setRegisterType] = useState("offers");
  const [preview, setPreview] = useState<{
    id: string;
    row_count: number;
    suggested_mapping: Record<string, string>;
    errors: unknown[];
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const selectFile = (selected: File | null) => {
    setError("");
    if (selected && selected.size > 100 * 1024 * 1024) {
      setFile(null);
      setError("Le fichier ne doit pas dépasser 100 Mo.");
      return;
    }
    setFile(selected);
    setPreview(null);
  };

  const send = async () => {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      setPreview(await directUpload("import", registerType, file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import impossible");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!preview) return;
    setBusy(true);
    setError("");
    try {
      await serviceIaFetch(`/imports/${preview.id}/confirm`, {
        method: "POST",
        body: JSON.stringify({ column_mapping: preview.suggested_mapping }),
      });
      setPreview(null);
      setFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Confirmation impossible");
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    window.location.href = `/api/service-ia/imports/export/${registerType}`;
  };

  return (
    <>
      <PageHeader
        eyebrow="Migration"
        title="Importer vos données"
        description="Prévisualisez, contrôlez puis confirmez vos données existantes."
        action={
          <button className="app-button app-button-secondary" onClick={exportCsv}>
            <Download size={16} />
            <span>Exporter CSV</span>
          </button>
        }
      />
      <section className="app-panel app-upload">
        <label>
          Registre
          <select
            value={registerType}
            onChange={(e) => {
              setRegisterType(e.target.value);
              setPreview(null);
            }}
          >
            <option value="offers">Offres</option>
            <option value="sales">Ventes</option>
            <option value="procedures">Procédures</option>
          </select>
        </label>
        <label className="app-dropzone">
          <input
            type="file"
            accept=".csv,.tsv,.xlsx,.json"
            onChange={(e) => selectFile(e.target.files?.[0] ?? null)}
          />
          <UploadCloud size={34} />
          <strong>{file ? file.name : "Déposez votre fichier ici"}</strong>
          <span>CSV, TSV, XLSX ou JSON · 100 Mo maximum</span>
        </label>
        <FormError>{error}</FormError>
        {file && !preview ? (
          <button
            className="app-button app-button-primary"
            disabled={busy}
            onClick={() => void send()}
          >
            {busy ? "Envoi et analyse…" : "Prévisualiser"}
          </button>
        ) : null}
        {preview ? (
          <div className="app-import-preview">
            <h2>{preview.row_count} lignes détectées</h2>
            <StatusPill>{preview.errors.length} erreurs</StatusPill>
            {Object.entries(preview.suggested_mapping).map(([from, to]) => (
              <div className="app-mapping" key={from}>
                <span>
                  {from} → {to}
                </span>
              </div>
            ))}
            <button
              className="app-button app-button-primary"
              disabled={busy || preview.errors.length > 0}
              onClick={() => void confirm()}
            >
              {busy ? "Import…" : "Confirmer l’import"}
            </button>
          </div>
        ) : null}
      </section>
    </>
  );
}
