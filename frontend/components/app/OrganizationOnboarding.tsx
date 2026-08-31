"use client";

import { useState, useEffect } from "react";
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
  QrCode,
  RefreshCw,
  MessageSquare,
  Smartphone,
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
  { country: "Togo", currency: "XOF", flag: "🇹🇬", dial: "+228" },
  { country: "Côte d'Ivoire", currency: "XOF", flag: "🇨🇮", dial: "+225" },
  { country: "Bénin", currency: "XOF", flag: "🇧🇯", dial: "+229" },
  { country: "Sénégal", currency: "XOF", flag: "🇸🇳", dial: "+221" },
  { country: "Burkina Faso", currency: "XOF", flag: "🇧🇫", dial: "+226" },
  { country: "Mali", currency: "XOF", flag: "🇲🇱", dial: "+223" },
  { country: "Niger", currency: "XOF", flag: "🇳🇪", dial: "+227" },
  { country: "Guinée-Bissau", currency: "XOF", flag: "🇬🇼", dial: "+245" },
  { country: "Cameroun", currency: "XAF", flag: "🇨🇲", dial: "+237" },
  { country: "Gabon", currency: "XAF", flag: "🇬🇦", dial: "+241" },
  { country: "Congo (Brazzaville)", currency: "XAF", flag: "🇨🇬", dial: "+242" },
  { country: "Congo (RDC)", currency: "CDF", flag: "🇨🇩", dial: "+243" },
  { country: "Tchad", currency: "XAF", flag: "🇹🇩", dial: "+235" },
  { country: "Centrafrique", currency: "XAF", flag: "🇨🇫", dial: "+236" },
  { country: "Guinée équatoriale", currency: "XAF", flag: "🇬🇶", dial: "+240" },
  { country: "Guinée (Conakry)", currency: "GNF", flag: "🇬🇳", dial: "+224" },
  { country: "Ghana", currency: "GHS", flag: "🇬🇭", dial: "+233" },
  { country: "Nigeria", currency: "NGN", flag: "🇳🇬", dial: "+234" },
  { country: "Liberia", currency: "LRD", flag: "🇱🇷", dial: "+231" },
  { country: "Sierra Leone", currency: "SLE", flag: "🇸🇱", dial: "+232" },
  { country: "Gambie", currency: "GMD", flag: "🇬🇲", dial: "+220" },
  { country: "Cap-Vert", currency: "CVE", flag: "🇨🇻", dial: "+238" },
  { country: "Mauritanie", currency: "MRU", flag: "🇲🇷", dial: "+222" },

  // --- Afrique du Nord ---
  { country: "Maroc", currency: "MAD", flag: "🇲🇦", dial: "+212" },
  { country: "Algérie", currency: "DZD", flag: "🇩🇿", dial: "+213" },
  { country: "Tunisie", currency: "TND", flag: "🇹🇳", dial: "+216" },
  { country: "Égypte", currency: "EGP", flag: "🇪🇬", dial: "+20" },
  { country: "Libye", currency: "LYD", flag: "🇱🇾", dial: "+218" },

  // --- Afrique de l'Est & Australe ---
  { country: "Afrique du Sud", currency: "ZAR", flag: "🇿🇦", dial: "+27" },
  { country: "Kenya", currency: "KES", flag: "🇰🇪", dial: "+254" },
  { country: "Rwanda", currency: "RWF", flag: "🇷🇼", dial: "+250" },
  { country: "Burundi", currency: "BIF", flag: "🇧🇮", dial: "+257" },
  { country: "Tanzanie", currency: "TZS", flag: "🇹🇿", dial: "+255" },
  { country: "Ouganda", currency: "UGX", flag: "🇺🇬", dial: "+256" },
  { country: "Éthiopie", currency: "ETB", flag: "🇪🇹", dial: "+251" },
  { country: "Madagascar", currency: "MGA", flag: "🇲🇬", dial: "+261" },
  { country: "Maurice", currency: "MUR", flag: "🇲🇺", dial: "+230" },

  // --- Europe & International ---
  { country: "France", currency: "EUR", flag: "🇫🇷", dial: "+33" },
  { country: "Belgique", currency: "EUR", flag: "🇧🇪", dial: "+32" },
  { country: "Suisse", currency: "CHF", flag: "🇨🇭", dial: "+41" },
  { country: "Canada", currency: "CAD", flag: "🇨🇦", dial: "+1" },
  { country: "États-Unis", currency: "USD", flag: "🇺🇸", dial: "+1" },
];

const SECTORS = [
  { value: "retail", label: "Commerce Général & Boutique", detail: "Vente au détail, supérette, bazar, prêt-à-porter" },
  { value: "food_beverage", label: "Alimentation & Restauration", detail: "Restaurant, maquis, bar, boulangerie, traiteur" },
  { value: "materials", label: "Quincaillerie & Matériaux", detail: "BTP, outillage, pièces auto, électricité, plomberie" },
  { value: "services", label: "Prestations de Services", detail: "Cabinet, agence, consulting, salon, maintenance" },
  { value: "health", label: "Santé, Beauté & Bien-être", detail: "Pharmacie, parapharmacie, cosmétique, clinique" },
  { value: "agro", label: "Agriculture & Agroalimentaire", detail: "Production, transformation, élevage, distribution" },
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

  // Step 4: Live WhatsApp Connection
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isWaConnected, setIsWaConnected] = useState(false);
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [savedOrg, setSavedOrg] = useState<OnboardingOrganization | null>(null);
  const [pollingSession, setPollingSession] = useState(false);

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
      if (!whatsappNumber || whatsappNumber.startsWith("+")) {
        setWhatsappNumber(found.dial + " ");
      }
    }
  };

  // Sauvegarde des données et passage à l'étape 4 (Connexion WhatsApp)
  const saveAndProceedToWhatsApp = async () => {
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

      setSavedOrg(updated);
      setStep(4);
      setPollingSession(true);
    } catch (cause: any) {
      const msg = cause?.message || "La configuration n'a pas pu être enregistrée. Veuillez réessayer.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  // Polling du QR Code et de l'état de connexion WhatsApp en étape 4
  useEffect(() => {
    if (step !== 4 || !pollingSession) return;

    let timer: NodeJS.Timeout | null = null;

    const checkQr = async () => {
      try {
        const res = await serviceIaFetch<{
          status: string;
          qr: string | null;
          phone: string | null;
          user_name: string | null;
        }>("/integrations/whatsapp/session-qr");

        if (res.status === "connected") {
          setIsWaConnected(true);
          setConnectedPhone(res.phone);
        } else {
          setIsWaConnected(false);
          if (res.qr) {
            setQrCodeDataUrl(res.qr);
          }
        }
      } catch {
        // En cas d'erreur de polling
      }
    };

    checkQr();
    timer = setInterval(checkQr, 3000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, pollingSession]);

  const finishToApp = () => {
    const finalOrg = savedOrg || organization;
    onComplete(finalOrg);
    window.dispatchEvent(new CustomEvent("koryxa:organization-updated", { detail: finalOrg }));
    window.dispatchEvent(new CustomEvent("koryxa:record-created"));
    router.push(DESTINATIONS[goal] || "/espace");
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
              <small>Configuration & Assistant IA</small>
            </div>
          </div>
          <div className="onboarding-progress">
            <span>Étape {step} sur 4</span>
            <div>
              {[1, 2, 3, 4].map((item) => (
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
                  Nom complet du Dirigeant *
                  <input
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                    placeholder="Ex. Yayra Lamadokou"
                    maxLength={180}
                    required
                  />
                </label>

                <label>
                  Fonction / Titre
                  <input
                    value={responsibleRole}
                    onChange={(e) => setResponsibleRole(e.target.value)}
                    placeholder="Ex. Gérant, Fondateur, Directrice"
                    maxLength={120}
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Métier & Devise */}
        {step === 2 && (
          <div className="onboarding-body">
            <span className="onboarding-icon">
              <Globe2 size={26} />
            </span>
            <p className="app-eyebrow">Étape 2 · Secteur d'Activité & Devise</p>
            <h1 id="onboarding-title">Personnalisons votre métier</h1>
            <p>
              KORYXA adapte automatiquement le vocabulaire, les formulaires de vente et les alertes de stock à votre secteur.
            </p>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-foreground mb-2">
                  Sélectionnez votre Secteur d'Activité *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SECTORS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        businessCategory === s.value
                          ? "bg-emerald-500/10 border-emerald-600 shadow-sm ring-1 ring-emerald-500"
                          : "bg-card border-border hover:border-emerald-500/40 hover:bg-muted/30"
                      }`}
                      onClick={() => setBusinessCategory(s.value)}
                    >
                      <strong className="block text-xs font-bold text-foreground">{s.label}</strong>
                      <small className="text-[11px] text-muted-foreground block mt-0.5 leading-tight">
                        {s.detail}
                      </small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label>
                  Pays d'Implantation *
                  <select
                    value={country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full mt-1 p-2.5 rounded-xl border border-border bg-background text-sm font-semibold"
                  >
                    {COUNTRIES_AND_CURRENCIES.map((c) => (
                      <option key={c.country} value={c.country}>
                        {c.flag} {c.country} ({c.currency})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Devise Principale
                  <input
                    value={primaryCurrency}
                    disabled
                    className="w-full mt-1 p-2.5 rounded-xl border border-border bg-muted text-sm font-bold opacity-80"
                  />
                  <small className="text-muted-foreground text-[10px]">
                    Auto-configurée selon votre pays
                  </small>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: WhatsApp & Choix du Module */}
        {step === 3 && (
          <div className="onboarding-body">
            <span className="onboarding-icon">
              <PhoneCall size={26} />
            </span>
            <p className="app-eyebrow">Étape 3 · Numéro WhatsApp & Objectif</p>
            <h1 id="onboarding-title">Préparez vos ventes WhatsApp</h1>
            <p>
              Renseignez le numéro WhatsApp avec lequel vous ou vos vendeurs dicterez vos ventes.
            </p>

            <div className="space-y-4 text-left">
              <div className="onboarding-form-grid">
                <label>
                  Numéro WhatsApp Professionnel *
                  <input
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="Ex. +228 90 12 34 56"
                    maxLength={25}
                    required
                  />
                  <small className="text-emerald-700 font-medium text-[11px]">
                    ✓ Ce numéro sera automatiquement autorisé pour envoyer des ventes vocales et texte.
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
                  Par quel module souhaitez-vous démarrer ? *
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

        {/* STEP 4: Live WhatsApp QR Code Connection */}
        {step === 4 && (
          <div className="onboarding-body">
            <span className="onboarding-icon">
              <QrCode size={26} />
            </span>
            <p className="app-eyebrow">Étape 4 · Connexion WhatsApp en Direct</p>
            <h1 id="onboarding-title">Activez votre Assistant IA</h1>
            <p>
              Scannez ce QR Code avec votre téléphone WhatsApp pour connecter instantanément votre assistant.
            </p>

            <div className="my-4 flex flex-col items-center justify-center">
              {isWaConnected ? (
                <div className="rounded-3xl border-2 border-emerald-500 bg-emerald-50/70 p-6 text-center shadow-md animate-in zoom-in-95 duration-200">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="mt-4 text-lg font-extrabold text-emerald-950">
                    WhatsApp Connecté avec succès !
                  </h3>
                  <p className="mt-1.5 text-xs text-emerald-800">
                    {connectedPhone ? `Connecté au ${connectedPhone}` : "Votre session est active et sécurisée."}
                  </p>
                  <div className="mt-4 rounded-2xl bg-white/80 p-3.5 text-xs text-slate-700 font-medium border border-emerald-200">
                    🎉 Votre assistant IA KORYXA est prêt ! Vous pouvez lui envoyer des notes vocales ou messages : <em>"Vente de 3 articles à 15000"</em>.
                  </div>
                </div>
              ) : qrCodeDataUrl ? (
                <div className="flex flex-col items-center">
                  <div className="rounded-3xl border-4 border-emerald-500 bg-white p-3.5 shadow-xl">
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code WhatsApp"
                      className="h-60 w-60 object-contain rounded-2xl"
                    />
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-emerald-700 animate-pulse">
                    <RefreshCw size={14} className="animate-spin" />
                    <span>En attente de scan sur votre téléphone...</span>
                  </div>
                </div>
              ) : (
                <div className="flex h-60 w-60 flex-col items-center justify-center rounded-3xl border border-border bg-muted/40 p-6 text-center">
                  <RefreshCw size={28} className="animate-spin text-emerald-600" />
                  <span className="mt-3 text-xs font-bold text-foreground">
                    Génération du QR Code sécurisé...
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-muted/50 p-4 text-xs text-muted-foreground text-left space-y-1">
              <strong className="block text-foreground font-bold">Comment connecter ?</strong>
              <ol className="list-decimal pl-4 space-y-0.5">
                <li>Ouvrez WhatsApp sur votre smartphone.</li>
                <li>Allez dans <strong>Appareils connectés</strong> &gt; <strong>Connecter un appareil</strong>.</li>
                <li>Pointez votre appareil photo vers le QR code ci-dessus.</li>
              </ol>
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
          {step > 1 && step < 4 ? (
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
          ) : step === 3 ? (
            <button
              type="button"
              className="app-button app-button-primary"
              onClick={() => void saveAndProceedToWhatsApp()}
              disabled={busy || name.trim().length < 2}
            >
              <span>{busy ? "Enregistrement en cours…" : "Continuer vers la connexion WhatsApp"}</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <div className="flex w-full items-center justify-between gap-3">
              <button
                type="button"
                className="text-xs font-bold text-muted-foreground hover:text-foreground transition underline"
                onClick={finishToApp}
              >
                Passer cette étape & connecter plus tard
              </button>
              <button
                type="button"
                className="app-button app-button-primary"
                onClick={finishToApp}
              >
                <span>{isWaConnected ? "🚀 Accéder à mon Cockpit" : "Continuer vers mon Espace"}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </footer>
      </section>
    </div>
  );
}
