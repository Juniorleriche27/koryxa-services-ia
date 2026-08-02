"use client";

import { Building2, Check, FileText, ImagePlus, Sheet, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { compressOrganizationLogo } from "@/lib/images/compressOrganizationLogo";
import { serviceIaFetch } from "@/lib/service-ia/api";

export type OnboardingOrganization = {
  name: string;
  onboarding_completed_at?: string | null;
  logo_updated_at?: string | null;
};

const goals = [
  { value: "sales", label: "Suivre mes ventes", detail: "Centraliser ventes et encaissements", icon: undefined },
  { value: "offers", label: "Structurer mes offres", detail: "Organiser produits, services et tarifs", icon: undefined },
  { value: "procedures", label: "Formaliser mes procédures", detail: "Documenter les méthodes de travail", icon: undefined },
  { value: "imports", label: "Importer mes données", detail: "Charger un fichier CSV ou Excel", icon: Sheet },
  { value: "documents", label: "Ajouter mes documents", detail: "Rassembler les fichiers de l’entreprise", icon: FileText },
  { value: "discover", label: "Découvrir l’application", detail: "Commencer par la vue d’ensemble", icon: undefined },
] as const;

const destinations: Record<string, string> = {
  sales: "/espace/ventes",
  offers: "/espace/offres",
  procedures: "/espace/procedures",
  imports: "/espace/imports",
  documents: "/espace/documents",
  discover: "/espace",
};

export function OrganizationOnboarding({
  organization,
  onComplete,
}: {
  organization: OnboardingOrganization;
  onComplete: (organization: OnboardingOrganization) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(organization.name === "Organisation KORYXA" ? "" : organization.name);
  const [sector, setSector] = useState("");
  const [country, setCountry] = useState("");
  const [responsibleName, setResponsibleName] = useState("");
  const [responsibleRole, setResponsibleRole] = useState("");
  const [goal, setGoal] = useState("discover");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectLogo = (file?: File) => {
    if (!file) return;
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const finish = async () => {
    setBusy(true);
    setError("");
    try {
      if (logo) {
        const optimized = await compressOrganizationLogo(logo);
        const form = new FormData();
        form.set("file", optimized);
        await serviceIaFetch("/organizations/current/logo", { method: "POST", body: form });
      }
      const updated = await serviceIaFetch<OnboardingOrganization>("/organizations/current/onboarding", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          sector: sector.trim() || null,
          country: country.trim() || null,
          responsible_name: responsibleName.trim(),
          responsible_role: responsibleRole.trim(),
          primary_goal: goal,
        }),
      });
      onComplete(updated);
      window.dispatchEvent(new CustomEvent("koryxa:organization-updated", { detail: updated }));
      router.push(destinations[goal]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La configuration n’a pas pu être enregistrée.");
    } finally {
      setBusy(false);
    }
  };

  return <div className="onboarding-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
    <section className="onboarding-card">
      <header className="onboarding-head">
        <div className="onboarding-brand"><span>K</span><div><strong>KORYXA</strong><small>Mémoire opérationnelle</small></div></div>
        <div className="onboarding-progress"><span>Étape {step} sur 3</span><div>{[1, 2, 3].map(item => <i key={item} className={item <= step ? "is-done" : ""}/>)}</div></div>
      </header>

      {step === 1 && <div className="onboarding-body">
        <span className="onboarding-icon"><Building2/></span>
        <p className="app-eyebrow">Bienvenue</p>
        <h1 id="onboarding-title">Configurons votre entreprise</h1>
        <p>Ces informations permettront de personnaliser l’espace de toute votre équipe.</p>
        <div className="onboarding-form-grid">
          <label className="is-wide">Nom de l’entreprise *<input value={name} onChange={event => setName(event.target.value)} placeholder="Ex. KORYXA" maxLength={180} autoFocus/></label>
          <label>Secteur d’activité<input value={sector} onChange={event => setSector(event.target.value)} placeholder="Ex. Conseil" maxLength={120}/></label>
          <label>Pays ou zone d’activité<input value={country} onChange={event => setCountry(event.target.value)} placeholder="Ex. France" maxLength={120}/></label>
        </div>
      </div>}

      {step === 2 && <div className="onboarding-body">
        <span className="onboarding-icon"><ImagePlus/></span>
        <p className="app-eyebrow">Identité et responsable</p>
        <h1 id="onboarding-title">Qui pilote cet espace ?</h1>
        <p>Le responsable peut être le CEO, le gérant ou toute personne chargée des opérations.</p>
        <div className="onboarding-identity">
          <label className="onboarding-logo-input">
            {logoPreview ? <img src={logoPreview} alt="Aperçu du logo"/> : <><ImagePlus/><strong>Ajouter le logo</strong></>}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => selectLogo(event.target.files?.[0])}/>
            <small>PNG, JPEG ou WebP · 30 Mo maximum<br/>Compression automatique</small>
          </label>
          <div className="onboarding-form-grid">
            <label className="is-wide">Nom du responsable *<input value={responsibleName} onChange={event => setResponsibleName(event.target.value)} placeholder="Nom et prénom" maxLength={180}/></label>
            <label className="is-wide">Fonction *<input value={responsibleRole} onChange={event => setResponsibleRole(event.target.value)} placeholder="Ex. CEO, gérant, responsable des opérations" maxLength={120}/></label>
          </div>
        </div>
      </div>}

      {step === 3 && <div className="onboarding-body">
        <span className="onboarding-icon"><Sparkles/></span>
        <p className="app-eyebrow">Votre premier objectif</p>
        <h1 id="onboarding-title">Par quoi souhaitez-vous commencer ?</h1>
        <p>Nous ouvrirons directement le bon espace. Vous pourrez naturellement tout utiliser ensuite.</p>
        <div className="onboarding-goals">
          {goals.map(item => {
            const Icon = item.icon;
            return <button key={item.value} type="button" className={goal === item.value ? "is-selected" : ""} onClick={() => setGoal(item.value)}>
              <span>{Icon ? <Icon/> : <Check/>}</span><div><strong>{item.label}</strong><small>{item.detail}</small></div><i>{goal === item.value && <Check/>}</i>
            </button>;
          })}
        </div>
      </div>}

      {error && <p className="onboarding-error">{error}</p>}
      <footer className="onboarding-actions">
        {step > 1 ? <button type="button" className="app-button app-button-secondary" onClick={() => setStep(value => value - 1)} disabled={busy}>Retour</button> : <span/>}
        {step < 3
          ? <button type="button" className="app-button app-button-primary" onClick={() => setStep(value => value + 1)} disabled={(step === 1 && name.trim().length < 2) || (step === 2 && (responsibleName.trim().length < 2 || responsibleRole.trim().length < 2))}>Continuer</button>
          : <button type="button" className="app-button app-button-primary" onClick={() => void finish()} disabled={busy}>{busy ? "Préparation de votre espace…" : "Accéder à mon espace"}</button>}
      </footer>
    </section>
  </div>;
}
