"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Globe2,
  ImagePlus,
  PhoneCall,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Layers,
  Wallet,
} from "lucide-react";
import { compressOrganizationLogo } from "@/lib/images/compressOrganizationLogo";
import { serviceIaFetch } from "@/lib/service-ia/api";
import BrandLogo from "@/components/layout/BrandLogo";

export type OnboardingOrganization = {
  name: string;
  business_category?: string;
  country?: string | null;
  sector?: string | null;
  responsible_name?: string | null;
  responsible_role?: string | null;
  onboarding_completed_at?: string | null;
  logo_updated_at?: string | null;
};

const COUNTRIES_AND_CURRENCIES = [
  { country: "Togo", currency: "XOF", flag: "🇹🇬" },
  { country: "Côte d'Ivoire", currency: "XOF", flag: "🇨🇮" },
  { country: "Bénin", currency: "XOF", flag: "🇧🇯" },
  { country: "Sénégal", currency: "XOF", flag: "🇸🇳" },
  { country: "Cameroun", currency: "XAF", flag: "🇨🇲" },
  { country: "Guinée", currency: "GNF", flag: "🇬🇳" },
  { country: "Mali", currency: "XOF", flag: "🇲🇱" },
  { country: "Burkina Faso", currency: "XOF", flag: "🇧🇫" },
  { country: "Gabon", currency: "XAF", flag: "🇬🇦" },
  { country: "Congo (RDC)", currency: "CDF", flag: "🇨🇩" },
  { country: "France / Europe", currency: "EUR", flag: "🇫🇷" },
  { country: "États-Unis / International", currency: "USD", flag: "🇺🇸" },
];

const GOALS = [
  { value: "sales", label: "Enregistrer mes ventes & caisse", detail: "Encaissements, factures et créances clients", icon: ShoppingBag },
  { value: "depenses", label: "Suivre mes achats & dépenses", detail: "Contrôler les sorties d'argent et fournisseurs", icon: Wallet },
  { value: "offers", label: "Organiser mes produits & stocks", detail: "Catalogue d'articles, prix et alertes de stock", icon: Layers },
  { value: "discover", label: "Accéder au Cockpit Décisionnel", detail: "Vue d'ensemble et score Radar dirigeant", icon: ShieldCheck },
];

const DESTINATIONS: Record<string, string> = {
  sales: "/espace/ventes",
  depenses: "/espace/depenses",
  offers: "/espace/offres",
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

  // Step 1: Identité
  const [name, setName] = useState(
    organization.name && !organization.name.includes("Organisation") ? organization.name : ""
  );
  const [responsibleName, setResponsibleName] = useState(organization.responsible_name || "");
  const [responsibleRole, setResponsibleRole] = useState(organization.responsible_role || "Gérant / Dirigeant");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");

  // Step 2: Métier & Devise
  const [businessCategory, setBusinessCategory] = useState<string>(organization.business_category || "retail");
  const [country, setCountry] = useState(organization.country || "Togo");
  const [primaryCurrency, setPrimaryCurrency] = useState("XOF");

  // Step 3: WhatsApp, Adresse & Caisse
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [cityAddress, setCityAddress] = useState("");
  const [goal, setGoal] = useState("sales");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectLogo = (file?: File) => {
    if (!file) return;
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleCountryChange = (selectedCountry: string) => {
    setCountry(selectedCountry);
    const found = COUNTRIES_AND_CURRENCIES.find((c) => c.country === selectedCountry);
    if (found) {
      setPrimaryCurrency(found.currency);
    }
  };

  const finish = async () => {
    if (name.trim().length < 2) {
      setError("Veuillez renseigner le nom officiel de votre entreprise.");
      setStep(1);
      return;
    }
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
          business_category: businessCategory,
          country: country.trim(),
          sector: businessCategory,
          responsible_name: responsibleName.trim() || "Dirigeant",
          responsible_role: responsibleRole.trim() || "Gérant",
          primary_goal: goal,
        }),
      });

      onComplete(updated);
      window.dispatchEvent(new CustomEvent("koryxa:organization-updated", { detail: updated }));
      router.push(DESTINATIONS[goal] || "/espace");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La configuration n'a pas pu être enregistrée.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="onboarding-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <section className="onboarding-card">
        {/* Top Header */}
        <header className="onboarding-head">
          <div className="onboarding-brand">
            <BrandLogo className="onboarding-brand-logo" />
            <div>
              <strong>KORYXA</strong>
              <small>Configuration Initiale de l'Entreprise</small>
            </div>
          </div>
          <div className="onboarding-progress">
            <span>Étape {step} sur 3</span>
            <div>
              {[1, 2, 3].map((item) => (
                <i key={item} className={item <= step ? "is-done" : ""} />
              ))}
            </div>
          </div>
        </header>

        {/* STEP 1: Identité & Logo */}
        {step === 1 && (
          <div className="onboarding-body">
            <span className="onboarding-icon">
              <Building2 size={26} />
            </span>
            <p className="app-eyebrow">Étape 1 · Identité Officielle</p>
            <h1 id="onboarding-title">Comment s'appelle votre Entreprise ?</h1>
            <p>
              Ces informations apparaîtront sur vos factures, reçus WhatsApp et documents officiels.
            </p>

            <div className="onboarding-identity">
              {/* Logo Upload Box */}
              <label className="onboarding-logo-input" title="Cliquez pour importer votre logo">
                {logoPreview ? (
                  <img src={logoPreview} alt="Aperçu du logo" />
                ) : (
                  <>
                    <ImagePlus size={32} />
                    <strong>Logo ou Enseigne</strong>
                    <small>Cliquez pour choisir une photo</small>
                  </>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => selectLogo(event.target.files?.[0])}
                />
              </label>

              {/* Form inputs */}
              <div className="onboarding-form-grid">
                <label className="is-wide">
                  Nom commercial de l'Entreprise *
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex. KORYXA Store, Étoile de Lomé, Quincaillerie Moderne"
                    maxLength={180}
                    autoFocus
                    required
                  />
                </label>

                <label>
                  Nom complet du Dirigeant / Gérant *
                  <input
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                    placeholder="Ex. Junior LERICHE"
                    maxLength={180}
                    required
                  />
                </label>

                <label>
                  Fonction dans l'entreprise
                  <input
                    value={responsibleRole}
                    onChange={(e) => setResponsibleRole(e.target.value)}
                    placeholder="Ex. Gérant, Directeur Général, Fondateur"
                    maxLength={120}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Métier, Pays & Devise */}
        {step === 2 && (
          <div className="onboarding-body">
            <span className="onboarding-icon">
              <Globe2 size={26} />
            </span>
            <p className="app-eyebrow">Étape 2 · Activité & Monnaie</p>
            <h1 id="onboarding-title">Votre secteur et votre devise</h1>
            <p>
              L'application adaptera automatiquement le vocabulaire, les registres de caisse et les calculs de TVA.
            </p>

            <div className="onboarding-form-grid">
              <label className="is-wide">
                Secteur / Catégorie d'Activité *
                <select
                  value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}
                  className="w-full mt-1.5 p-3 rounded-xl border border-border bg-background text-sm font-semibold focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="retail">🛍️ Commerce, Vente & Distribution (Boutique, Épicerie, Dépôt, Quincaillerie)</option>
                  <option value="services">💼 Prestation de Services, Agence & Conseil (Cabinet, Prestataire, Freelance)</option>
                  <option value="hospitality">🍽️ Restauration, Bar, Café & Hôtellerie (Restaurant, Fast-food, Hôtel)</option>
                  <option value="crafts">✂️ Artisanat, BTP & Production (Atelier, Couture, Menuiserie, Imprimerie)</option>
                  <option value="association">🤝 Association, Fondation & ONG (Club, Organisation à but non lucratif)</option>
                </select>
              </label>

              <label>
                Pays d'implantation *
                <select
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full mt-1.5 p-3 rounded-xl border border-border bg-background text-sm font-semibold focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {COUNTRIES_AND_CURRENCIES.map((c) => (
                    <option key={c.country} value={c.country}>
                      {c.flag} {c.country}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Devise de Caisse & Factures *
                <select
                  value={primaryCurrency}
                  onChange={(e) => setPrimaryCurrency(e.target.value)}
                  className="w-full mt-1.5 p-3 rounded-xl border border-border bg-background text-sm font-semibold focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="XOF">XOF - Franc CFA (UEMOA · Togo, Côte d'Ivoire, Bénin, Sénégal...)</option>
                  <option value="XAF">XAF - Franc CFA (CEMAC · Cameroun, Gabon, Congo...)</option>
                  <option value="GNF">GNF - Franc Guinéen (Guinée)</option>
                  <option value="CDF">CDF - Franc Congolais (RDC)</option>
                  <option value="EUR">EUR - Euro (€ · France, Europe)</option>
                  <option value="USD">USD - Dollar US ($ · International)</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {/* STEP 3: WhatsApp, Adresse & Caisse Initiale */}
        {step === 3 && (
          <div className="onboarding-body">
            <span className="onboarding-icon">
              <PhoneCall size={26} />
            </span>
            <p className="app-eyebrow">Étape 3 · Contact & Caisse de Départ</p>
            <h1 id="onboarding-title">Connectons vos opérations</h1>
            <p>
              Renseignez votre WhatsApp pour les ventes instantanées et choisissez votre premier écran.
            </p>

            <div className="space-y-4 text-left">
              <div className="onboarding-form-grid">
                <label>
                  Numéro WhatsApp Professionnel
                  <input
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="Ex. +228 90 00 00 00"
                    maxLength={20}
                  />
                  <small className="text-muted-foreground text-[11px]">
                    Utilisé pour la dictée vocale et l'envoi des reçus clients
                  </small>
                </label>

                <label>
                  Ville & Adresse / Marché / Quartier
                  <input
                    value={cityAddress}
                    onChange={(e) => setCityAddress(e.target.value)}
                    placeholder="Ex. Grand Marché de Lomé, Assivito"
                    maxLength={150}
                  />
                </label>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-foreground mb-2">
                  Par quel module souhaitez-vous démarrer aujourd'hui ?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {GOALS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        className={`p-3 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
                          goal === item.value
                            ? "bg-primary/10 border-primary shadow-xs"
                            : "bg-card border-border hover:border-primary/50"
                        }`}
                        onClick={() => setGoal(item.value)}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            goal === item.value
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <strong className="block text-xs font-bold text-foreground">
                            {item.label}
                          </strong>
                          <small className="text-[11px] text-muted-foreground leading-tight block">
                            {item.detail}
                          </small>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && <p className="onboarding-error">{error}</p>}

        {/* Footer Actions */}
        <footer className="onboarding-actions">
          {step > 1 ? (
            <button
              type="button"
              className="app-button app-button-secondary"
              onClick={() => setStep((v) => v - 1)}
              disabled={busy}
            >
              Retour
            </button>
          ) : (
            <span />
          )}

          {step < 3 ? (
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => {
                if (step === 1 && name.trim().length < 2) {
                  setError("Veuillez renseigner le nom de votre entreprise.");
                  return;
                }
                setError("");
                setStep((v) => v + 1);
              }}
              disabled={step === 1 && name.trim().length < 2}
            >
              <span>Continuer</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => void finish()}
              disabled={busy || name.trim().length < 2}
            >
              <span>{busy ? "Finalisation en cours…" : "🚀 Valider & Accéder à mon Espace"}</span>
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
