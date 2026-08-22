"use client";
import { useI18n } from "@/lib/i18n";

import React, { useState } from "react";
import { Plus, UserRound } from "lucide-react";
import { PageHeader } from "../PageHeader";
import { EmptyState, StatusPill } from "../Ui";
import { Dialog, FormError } from "../Dialog";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { formatDate, formatLabel } from "../RegistersTable";

export type OrgMember = { id: string; user_id: string; role: string; status: string };
export type OrgInvitation = { id: string; email: string; role: string; status: string; expires_at: string };
export type OrgData = { id: string; name: string; slug: string; is_active: boolean };

export function OrganizationSection({
  org,
  members,
  invitations,
  loading,
  error,
  onReload,
}: {
  org: OrgData | null;
  members: OrgMember[] | null;
  invitations: OrgInvitation[] | null;
  loading: boolean;
  error: string;
  onReload: () => Promise<void>;
}) {
  const { t } = useI18n();
  const [inviting, setInviting] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const invite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    try {
      await serviceIaFetch("/invitations", {
        method: "POST",
        body: JSON.stringify({
          email: String(data.get("email") || ""),
          role: String(data.get("role") || "contributor"),
        }),
      });
      await onReload();
      setInviting(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Invitation impossible");
    } finally {
      setSubmitting(false);
    }
  };

  const changeRole = async (member: OrgMember, newRole: string) => {
    await serviceIaFetch(`/members/${member.id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role: newRole }),
    });
    await onReload();
  };

  return (
    <>
      <PageHeader
        eyebrow="Équipe"
        title="Organisation & Membres"
        description="Gérez les collaborateurs, leurs rôles d'accès et les invitations d'équipe."
        action={
          <button className="app-button app-button-primary" onClick={() => setInviting(true)}>
            <Plus size={16} />
            <span>Inviter un collaborateur</span>
          </button>
        }
      />

      {loading && <EmptyState title="Chargement…" detail="Récupération des membres de l'équipe." />}
      {error && <EmptyState title="Données indisponibles" detail={error} />}

      {org && members && (
        <>
          <section className="app-panel">
            <div className="app-panel-head">
              <div>
                <span className="app-eyebrow">Organisation active</span>
                <h2>{org.name}</h2>
              </div>
              <StatusPill>{members.length} membres</StatusPill>
            </div>
            <div className="app-list">
              {members.map((m) => (
                <div className="app-list-row" key={m.id}>
                  <div className="app-list-icon">
                    <UserRound size={18} />
                  </div>
                  <div className="app-list-main">
                    <strong>{m.user_id}</strong>
                    <span>Statut : {formatLabel(m.status)}</span>
                  </div>
                  <select
                    value={m.role}
                    onChange={(event) => void changeRole(m, event.target.value)}
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

          {invitations && invitations.length > 0 && (
            <section className="app-panel">
              <div className="app-panel-head">
                <h2>{t("org_tab_invites")}</h2>
                <StatusPill>{invitations.length}</StatusPill>
              </div>
              <div className="app-list">
                {invitations.map((i) => (
                  <div className="app-list-row" key={i.id}>
                    <div className="app-list-main">
                      <strong>{i.email}</strong>
                      <span>
                        Rôle : {formatLabel(i.role)} · Expire le {formatDate(i.expires_at)}
                      </span>
                    </div>
                    <StatusPill>{formatLabel(i.status)}</StatusPill>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <Dialog open={inviting} onClose={() => setInviting(false)} title="Inviter un collaborateur">
        <form onSubmit={invite}>
          <div className="app-form-grid">
            <label className="app-form-span">
              Adresse e-mail *<input name="email" type="email" required placeholder="nom@entreprise.com" />
            </label>
            <label className="app-form-span">
              Rôle
              <select name="role" defaultValue="contributor">
                <option value="contributor">Contributeur (saisie et consultation)</option>
                <option value="manager">Responsable (gestion et validation)</option>
                <option value="viewer">Lecteur (consultation seule)</option>
              </select>
            </label>
          </div>
          <FormError>{formError}</FormError>
          <div className="app-form-actions">
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setInviting(false)}
            >
              Annuler
            </button>
            <button className="app-button app-button-primary" disabled={submitting}>
              {submitting ? "Envoi…" : "Envoyer l'invitation"}
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
