"use client";

import { Ban, Building2, Copy, ImagePlus, Plus, RefreshCw, Save, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { compressOrganizationLogo } from "@/lib/images/compressOrganizationLogo";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { Dialog, FormError } from "./Dialog";
import { PageHeader } from "./PageHeader";
import { EmptyState, StatusPill } from "./Ui";

type Organization = { id: string; name: string; slug: string; logo_updated_at?: string | null };
type Member = { id: string; user_id: string; role: "owner" | "manager" | "contributor"; status: string };
type Invitation = { id: string; email: string; role: string; status: string; expires_at: string };
type InvitationCreated = Invitation & { token: string };

export default function OrganizationManagement() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [error, setError] = useState("");
  const [inviting, setInviting] = useState(false);
  const [shareLink, setShareLink] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [org, team] = await Promise.all([
        serviceIaFetch<Organization>("/organizations/current"),
        serviceIaFetch<Member[]>("/members"),
      ]);
      setOrganization(org);
      setName(org.name);
      setMembers(team);
      serviceIaFetch<Invitation[]>("/invitations").then(setInvitations).catch(() => setInvitations([]));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Organisation indisponible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const logoUrl = useMemo(() => organization?.logo_updated_at
    ? `/api/service-ia/organizations/current/logo?v=${encodeURIComponent(organization.logo_updated_at)}`
    : "", [organization?.logo_updated_at]);
  const announce = (org: Organization) => window.dispatchEvent(
    new CustomEvent("koryxa:organization-updated", { detail: org }),
  );
  const saveName = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const org = await serviceIaFetch<Organization>("/organizations/current", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });
      setOrganization(org);
      announce(org);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Mise à jour impossible");
    } finally {
      setSaving(false);
    }
  };
  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const source = event.target.files?.[0];
    event.target.value = "";
    if (!source) return;
    setLogoBusy(true);
    setError("");
    try {
      const optimized = await compressOrganizationLogo(source);
      const body = new FormData();
      body.set("file", optimized);
      const org = await serviceIaFetch<Organization>("/organizations/current/logo", { method: "POST", body });
      setOrganization(org);
      announce(org);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Logo impossible à enregistrer");
    } finally {
      setLogoBusy(false);
    }
  };
  const invite=async(event:React.FormEvent<HTMLFormElement>)=>{event.preventDefault();const data=new FormData(event.currentTarget);setError("");try{const created=await serviceIaFetch<InvitationCreated>("/invitations",{method:"POST",body:JSON.stringify({email:String(data.get("email")||""),role:String(data.get("role")||"contributor")})});setShareLink(`${window.location.origin}/invitation/${created.token}`);setInviting(false);await load()}catch(cause){setError(cause instanceof Error?cause.message:"Invitation impossible")}};
  const resend=async(item:Invitation)=>{setError("");try{const created=await serviceIaFetch<InvitationCreated>(`/invitations/${item.id}/resend`,{method:"POST"});setShareLink(`${window.location.origin}/invitation/${created.token}`);await load()}catch(cause){setError(cause instanceof Error?cause.message:"Renvoi impossible")}};
  const revoke=async(item:Invitation)=>{setError("");try{await serviceIaFetch(`/invitations/${item.id}/revoke`,{method:"POST"});await load()}catch(cause){setError(cause instanceof Error?cause.message:"Révocation impossible")}};
  const copyLink=async()=>{await navigator.clipboard.writeText(shareLink)};
  const updateRole=async(member:Member,role:Member["role"])=>{await serviceIaFetch(`/members/${member.id}/role`,{method:"PATCH",body:JSON.stringify({role})});await load()};
  if(loading)return <EmptyState title="Chargement…" detail="Récupération du profil de votre entreprise."/>;
  return <><PageHeader eyebrow="Profil de l’entreprise" title="Votre identité dans Mémoire opérationnelle" description="Personnalisez le nom et le logo visibles par tous les membres de votre espace." action={<button className="app-button app-button-primary" onClick={()=>setInviting(true)}><Plus size={16}/>Inviter</button>}/><FormError>{error}</FormError>{organization?<><section className="app-panel app-company-profile"><div className="app-company-logo-editor">{logoUrl?<img src={logoUrl} alt={`Logo de ${organization.name}`}/>:<Building2 size={34}/>}<label className="app-company-logo-action"><ImagePlus size={16}/><span>{logoBusy?"Optimisation…":"Changer le logo"}</span><input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp" disabled={logoBusy} onChange={uploadLogo}/></label><small>PNG, JPEG ou WebP · 30 Mo maximum<br/>Redimensionnement et compression automatiques</small></div><form onSubmit={saveName} className="app-company-details"><span className="app-eyebrow">Informations générales</span><label>Nom de l’entreprise<input value={name} onChange={event=>setName(event.target.value)} minLength={2} maxLength={180} required/></label><label>Identifiant de l’espace<input value={organization.slug} disabled/></label><div className="app-form-actions"><button className="app-button app-button-primary" disabled={saving||name.trim()===organization.name}><Save size={16}/>{saving?"Enregistrement…":"Enregistrer le nom"}</button></div></form></section><section className="app-panel"><div className="app-panel-head"><h2>Membres</h2><StatusPill>{members.length} membres</StatusPill></div><div className="app-list">{members.map(member=><div className="app-list-row" key={member.id}><div className="app-list-icon"><UserRound size={18}/></div><div className="app-list-main"><strong>{member.user_id}</strong><span>{member.status}</span></div><select value={member.role} onChange={event=>void updateRole(member,event.target.value as Member["role"])} aria-label={`Rôle de ${member.user_id}`}><option value="owner">Propriétaire</option><option value="manager">Responsable</option><option value="contributor">Contributeur</option></select></div>)}</div></section>{invitations.length?<section className="app-panel"><div className="app-panel-head"><h2>Invitations</h2><StatusPill>{invitations.length}</StatusPill></div><div className="app-list">{invitations.map(item=><div className="app-list-row" key={item.id}><div className="app-list-main"><strong>{item.email}</strong><span>{item.role} · expiration {new Date(item.expires_at).toLocaleDateString("fr-FR")}</span></div>{item.status==="pending"?<div className="app-list-actions"><button className="app-icon-button" onClick={()=>void resend(item)} title="Renvoyer l’invitation" aria-label={`Renvoyer l’invitation à ${item.email}`}><RefreshCw size={16}/></button><button className="app-icon-button" onClick={()=>void revoke(item)} title="Révoquer l’invitation" aria-label={`Révoquer l’invitation de ${item.email}`}><Ban size={16}/></button></div>:null}<StatusPill>{item.status}</StatusPill></div>)}</div></section>:null}</>:null}<Dialog open={inviting} onClose={()=>setInviting(false)} title="Inviter un membre"><form onSubmit={invite}><div className="app-form-grid"><label className="app-form-span">Adresse e-mail *<input name="email" type="email" required/></label><label className="app-form-span">Rôle<select name="role"><option value="contributor">Contributeur</option><option value="manager">Responsable</option></select></label></div><div className="app-form-actions"><button type="button" className="app-button app-button-secondary" onClick={()=>setInviting(false)}>Annuler</button><button className="app-button app-button-primary">Envoyer l’invitation</button></div></form></Dialog><Dialog open={Boolean(shareLink)} onClose={()=>setShareLink("")} title="Invitation prête" description="L’e-mail a été envoyé. Vous pouvez également partager ce lien manuellement."><label>Lien d’invitation<input value={shareLink} readOnly onFocus={event=>event.currentTarget.select()}/></label><div className="app-form-actions"><button className="app-button app-button-secondary" onClick={()=>void copyLink()}><Copy size={16}/>Copier le lien</button><button className="app-button app-button-primary" onClick={()=>setShareLink("")}>Terminer</button></div></Dialog></>;
}
