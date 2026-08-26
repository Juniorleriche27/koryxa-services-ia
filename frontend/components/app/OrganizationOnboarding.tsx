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
  CheckCircle2,
  Coins,
  History,
  Sparkles,
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
  // --- Afrique de l'Ouest & Centrale (UEMOA / CEMAC / CEDEAO) ---
  { country: "Togo", currency: "XOF", flag: "🇹🇬" },
  { country: "Côte d'Ivoire", currency: "XOF", flag: "🇨🇮" },
  { country: "Bénin", currency: "XOF", flag: "🇧🇯" },
  { country: "Sénégal", currency: "XOF", flag: "🇸🇳" },
  { country: "Burkina Faso", currency: "XOF", flag: "🇧🇫" },
  { country: "Mali", currency: "XOF", flag: "🇲🇱" },
  { country: "Niger", currency: "XOF", flag: "🇳🇪" },
  { country: "Guinée-Bissau", currency: "XOF", flag: "🇬🇼" },
  { country: "Cameroun", currency: "XAF", flag: "🇨🇲" },
  { country: "Gabon", currency: "XAF", flag: "🇬🇦" },
  { country: "Congo (Brazzaville)", currency: "XAF", flag: "🇨🇬" },
  { country: "Congo (RDC)", currency: "CDF", flag: "🇨🇩" },
  { country: "Tchad", currency: "XAF", flag: "🇹🇩" },
  { country: "Centrafrique", currency: "XAF", flag: "🇨🇫" },
  { country: "Guinée équatoriale", currency: "XAF", flag: "🇬🇶" },
  { country: "Guinée (Conakry)", currency: "GNF", flag: "🇬🇳" },
  { country: "Ghana", currency: "GHS", flag: "🇬🇭" },
  { country: "Nigeria", currency: "NGN", flag: "🇳🇬" },
  { country: "Liberia", currency: "LRD", flag: "🇱🇷" },
  { country: "Sierra Leone", currency: "SLE", flag: "🇸🇱" },
  { country: "Gambie", currency: "GMD", flag: "🇬🇲" },
  { country: "Cap-Vert", currency: "CVE", flag: "🇨🇻" },
  { country: "Mauritanie", currency: "MRU", flag: "🇲🇷" },

  // --- Afrique du Nord ---
  { country: "Maroc", currency: "MAD", flag: "🇲🇦" },
  { country: "Algérie", currency: "DZD", flag: "🇩🇿" },
  { country: "Tunisie", currency: "TND", flag: "🇹🇳" },
  { country: "Égypte", currency: "EGP", flag: "🇪🇬" },
  { country: "Libye", currency: "LYD", flag: "🇱🇾" },

  // --- Afrique de l'Est & Australe ---
  { country: "Afrique du Sud", currency: "ZAR", flag: "🇿🇦" },
  { country: "Kenya", currency: "KES", flag: "🇰🇪" },
  { country: "Rwanda", currency: "RWF", flag: "🇷🇼" },
  { country: "Burundi", currency: "BIF", flag: "🇧🇮" },
  { country: "Tanzanie", currency: "TZS", flag: "🇹🇿" },
  { country: "Ouganda", currency: "UGX", flag: "🇺🇬" },
  { country: "Éthiopie", currency: "ETB", flag: "🇪🇹" },
  { country: "Madagascar", currency: "MGA", flag: "🇲🇬" },
  { country: "Maurice", currency: "MUR", flag: "🇲🇺" },
  { country: "Comores", currency: "KMF", flag: "🇰🇲" },
  { country: "Seychelles", currency: "SCR", flag: "🇸🇨" },
  { country: "Djibouti", currency: "DJF", flag: "🇩🇯" },
  { country: "Angola", currency: "AOA", flag: "🇦🇴" },
  { country: "Mozambique", currency: "MZN", flag: "🇲🇿" },
  { country: "Zambie", currency: "ZMW", flag: "🇿🇲" },
  { country: "Zimbabwe", currency: "USD", flag: "🇿🇼" },
  { country: "Namibie", currency: "NAD", flag: "🇳🇦" },
  { country: "Botswana", currency: "BWP", flag: "🇧🇼" },

  // --- Europe ---
  { country: "France", currency: "EUR", flag: "🇫🇷" },
  { country: "Belgique", currency: "EUR", flag: "🇧🇪" },
  { country: "Suisse", currency: "CHF", flag: "🇨🇭" },
  { country: "Luxembourg", currency: "EUR", flag: "🇱🇺" },
  { country: "Allemagne", currency: "EUR", flag: "🇩🇪" },
  { country: "Royaume-Uni", currency: "GBP", flag: "🇬🇧" },
  { country: "Espagne", currency: "EUR", flag: "🇪🇸" },
  { country: "Italie", currency: "EUR", flag: "🇮🇹" },
  { country: "Portugal", currency: "EUR", flag: "🇵🇹" },
  { country: "Pays-Bas", currency: "EUR", flag: "🇳🇱" },
  { country: "Irlande", currency: "EUR", flag: "🇮🇪" },
  { country: "Autriche", currency: "EUR", flag: "🇦🇹" },
  { country: "Suède", currency: "SEK", flag: "🇸🇪" },
  { country: "Norvège", currency: "NOK", flag: "🇳🇴" },
  { country: "Danemark", currency: "DKK", flag: "🇩🇰" },
  { country: "Finlande", currency: "EUR", flag: "🇫🇮" },
  { country: "Pologne", currency: "PLN", flag: "🇵🇱" },
  { country: "Roumanie", currency: "RON", flag: "🇷🇴" },
  { country: "Grèce", currency: "EUR", flag: "🇬🇷" },
  { country: "Turquie", currency: "TRY", flag: "🇹🇷" },
  { country: "Russie", currency: "RUB", flag: "🇷🇺" },
  { country: "Ukraine", currency: "UAH", flag: "🇺🇦" },

  // --- Amériques ---
  { country: "États-Unis", currency: "USD", flag: "🇺🇸" },
  { country: "Canada", currency: "CAD", flag: "🇨🇦" },
  { country: "Brésil", currency: "BRL", flag: "🇧🇷" },
  { country: "Haïti", currency: "HTG", flag: "🇭🇹" },
  { country: "Mexique", currency: "MXN", flag: "🇲🇽" },
  { country: "Colombie", currency: "COP", flag: "🇨🇴" },
  { country: "Argentine", currency: "ARS", flag: "🇦🇷" },
  { country: "Chili", currency: "CLP", flag: "🇨🇱" },
  { country: "Pérou", currency: "PEN", flag: "🇵🇪" },
  { country: "Guadeloupe / Martinique (Antilles)", currency: "EUR", flag: "🇬🇵" },
  { country: "Guyane Française", currency: "EUR", flag: "🇬🇫" },
  { country: "La Réunion / Mayotte", currency: "EUR", flag: "🇷🇪" },

  // --- Moyen-Orient & Asie ---
  { country: "Émirats Arabes Unis (Dubaï)", currency: "AED", flag: "🇦🇪" },
  { country: "Arabie Saoudite", currency: "SAR", flag: "🇸🇦" },
  { country: "Qatar", currency: "QAR", flag: "🇶🇦" },
  { country: "Liban", currency: "USD", flag: "🇱🇧" },
  { country: "Chine", currency: "CNY", flag: "🇨🇳" },
  { country: "Inde", currency: "INR", flag: "🇮🇳" },
  { country: "Japon", currency: "JPY", flag: "🇯🇵" },
  { country: "Corée du Sud", currency: "KRW", flag: "🇰🇷" },
  { country: "Singapour", currency: "SGD", flag: "🇸🇬" },
  { country: "Indonésie", currency: "IDR", flag: "🇮🇩" },
  { country: "Malaisie", currency: "MYR", flag: "🇲🇾" },
  { country: "Thaïlande", currency: "THB", flag: "🇹🇭" },
  { country: "Vietnam", currency: "VND", flag: "🇻🇳" },

  // --- Océanie ---
  { country: "Australie", currency: "AUD", flag: "🇦🇺" },
  { country: "Nouvelle-Zélande", currency: "NZD", flag: "🇳🇿" },
  { country: "Autre Pays (International)", currency: "USD", flag: "🌐" },
];

const GOALS = [
  {
    value: "sales",
    label: "Enregistrer mes ventes & caisse",
    detail: "Encaissements, factures et créances clients",
    icon: ShoppingBag,
  },
  {
    value: "depenses",
    label: "Suivre mes achats & dépenses",
    detail: "Contrôler les sorties d'argent et fournisseurs",
    icon: Wallet,
  },
  {
    value: "offers",
    label: "Organiser mes produits & stocks",
    detail: "Catalogue d'articles, prix et alertes de stock",
    icon: Layers,
  },
  {
    value: "discover",
    label: "Accéder au Cockpit Décisionnel",
    detail: "Vue d'ensemble et score Radar dirigeant",
    icon: ShieldCheck,
  },
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

  const [name, setName] = useState(
    organization.name && organization.name !== "Organisation à configurer" && organization.name !== "Nouvelle Organisation"
      ? organization.name
      : ""
  );
  const [responsibleName, setResponsibleName] = useState(organization.responsible_name || "");
  const [responsibleRole, setResponsibleRole] = useState(organization.responsible_role || "Gérant / Dirigeant");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");

  // Step 2: Métier, Devise & Historique Financier
  const [businessCategory, setBusinessCategory] = useState<string>(organization.business_category || "retail");
  const [country, setCountry] = useState(organization.country || "Togo");
  const [primaryCurrency, setPrimaryCurrency] = useState("XOF");
  const [isExistingBusiness, setIsExistingBusiness] = useState(false);
  const [initialCashBalance, setInitialCashBalance] = useState("");
  const [historicalReceivables, setHistoricalReceivables] = useState("");

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
        try {
          const optimized = await compressOrganizationLogo(logo);
          const form = new FormData();
          form.set("file", optimized);
          await serviceIaFetch("/organizations/current/logo", { method: "POST", body: form });
        } catch {
          // Non-blocking logo error
        }
      }

      const rawCash = parseFloat(initialCashBalance.replace(/\s/g, "").replace(",", ".")) || null;
      const rawReceivables = parseFloat(historicalReceivables.replace(/\s/g, "").replace(",", ".")) || null;

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
          currency: primaryCurrency,
          initial_cash_balance: isExistingBusiness ? rawCash : null,
          historical_receivables: isExistingBusiness ? rawReceivables : null,
          whatsapp_number: whatsappNumber.trim() || null,
          city_address: cityAddress.trim() || null,
        }),
      });

      onComplete(updated);
      window.dispatchEvent(new CustomEvent("koryxa:organization-updated", { detail: updated }));
      window.dispatchEvent(new CustomEvent("koryxa:record-created"));
      router.push(DESTINATIONS[goal] || "/espace");
    } catch (cause: any) {
      const msg = cause?.message || "La configuration n'a pas pu être enregistrée. Veuillez réessayer.";
      setError(msg);
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
                  <img src={logoPreview} alt="Aperçu du logo" className="w-full h-full object-cover rounded-xl" />
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

        {/* STEP 2: Métier, Pays, Devise & Historique Financier */}
        {step === 2 && (
          <div className="onboarding-body">
            <span className="onboarding-icon">
              <Globe2 size={26} />
            </span>
            <p className="app-eyebrow">Étape 2 · Activité, Devise & Situation Financière</p>
            <h1 id="onboarding-title">Votre secteur et vos chiffres de départ</h1>
            <p>
              Précisez votre monnaie et renseignez votre réalité passée si votre entreprise est déjà en activité.
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
                  <option value="education">🎓 Écoles, Collèges, Lycées, Universités & Formation (Établissement scolaire, Institut)</option>
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
                  <option value="XAF">XAF - Franc CFA (CEMAC · Cameroun, Gabon, Congo, Tchad...)</option>
                  <option value="GNF">GNF - Franc Guinéen (Guinée)</option>
                  <option value="CDF">CDF - Franc Congolais (RDC)</option>
                  <option value="NGN">NGN - Naira (Nigeria)</option>
                  <option value="GHS">GHS - Cedi (Ghana)</option>
                  <option value="MAD">MAD - Dirham Marocain (Maroc)</option>
                  <option value="DZD">DZD - Dinar Algérien (Algérie)</option>
                  <option value="TND">TND - Dinar Tunisien (Tunisie)</option>
                  <option value="EGP">EGP - Livre Égyptienne (Égypte)</option>
                  <option value="ZAR">ZAR - Rand Sud-Africain (Afrique du Sud)</option>
                  <option value="KES">KES - Shilling Kényan (Kenya)</option>
                  <option value="RWF">RWF - Franc Rwandais (Rwanda)</option>
                  <option value="MGA">MGA - Ariary Malgache (Madagascar)</option>
                  <option value="EUR">EUR - Euro (€ · France, Europe)</option>
                  <option value="USD">USD - Dollar US ($ · International)</option>
                  <option value="CAD">CAD - Dollar Canadien (Canada)</option>
                  <option value="GBP">GBP - Livre Sterling (Royaume-Uni)</option>
                  <option value="CHF">CHF - Franc Suisse (Suisse)</option>
                  <option value="AED">AED - Dirham des Émirats (Dubaï)</option>
                  <option value="CNY">CNY - Yuan Renminbi (Chine)</option>
                  <option value="BRL">BRL - Real Brésilien (Brésil)</option>
                  <option value="HTG">HTG - Gourde Haïtienne (Haïti)</option>
                </select>
              </label>
            </div>

            {/* Existing Business vs New Business Box */}
            <div className="mt-4 p-3.5 rounded-2xl bg-card border border-border text-left">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    Avez-vous déjà un historique d'activité ou un fond de caisse existant ?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExistingBusiness(!isExistingBusiness)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                    isExistingBusiness
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {isExistingBusiness ? "Oui, entreprise existante" : "Non, nouvelle entreprise (0)"}
                </button>
              </div>

              {isExistingBusiness && (
                <div className="mt-3 pt-3 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block text-xs font-semibold">
                    Solde initial disponible en caisse ({primaryCurrency})
                    <input
                      type="text"
                      value={initialCashBalance}
                      onChange={(e) => setInitialCashBalance(e.target.value)}
                      placeholder="Ex. 150 000"
                      className="w-full mt-1 p-2.5 rounded-xl border border-border bg-background text-sm font-bold"
                    />
                    <small className="text-muted-foreground text-[10px]">
                      Montant réellement présent dans votre tiroir-caisse
                    </small>
                  </label>

                  <label className="block text-xs font-semibold">
                    Créances clients antérieures ({primaryCurrency})
                    <input
                      type="text"
                      value={historicalReceivables}
                      onChange={(e) => setHistoricalReceivables(e.target.value)}
                      placeholder="Ex. 50 000"
                      className="w-full mt-1 p-2.5 rounded-xl border border-border bg-background text-sm font-bold"
                    />
                    <small className="text-muted-foreground text-[10px]">
                      Total des factures impayées en attente d'encaissement
                    </small>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: WhatsApp, Adresse & Choix du Module de Départ */}
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
                    maxLength={25}
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
                  Par quel module souhaitez-vous démarrer aujourd'hui ? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {GOALS.map((item) => {
                    const Icon = item.icon;
                    const isSelected = goal === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        className={`p-3.5 rounded-2xl border-2 text-left flex items-start gap-3 transition-all cursor-pointer relative ${
                          isSelected
                            ? "bg-emerald-500/10 border-emerald-600 shadow-sm ring-1 ring-emerald-500"
                            : "bg-card border-border hover:border-emerald-500/40 hover:bg-muted/30"
                        }`}
                        onClick={() => setGoal(item.value)}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0 pr-6">
                          <strong className="block text-xs font-bold text-foreground">
                            {item.label}
                          </strong>
                          <small className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                            {item.detail}
                          </small>
                        </div>
                        {isSelected && (
                          <div className="absolute top-3 right-3 text-emerald-600">
                            <CheckCircle2 size={18} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold text-center">
            {error}
          </div>
        )}

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

