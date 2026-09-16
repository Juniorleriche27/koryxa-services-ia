"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  Building2,
  User,
  Tag,
  ShieldCheck,
  Clock,
  ArrowRight,
  Sparkles,
  Compass,
  Check,
  Globe,
} from "lucide-react";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { BUSINESS_SECTORS } from "@/components/app/ContactModal";

export default function ContactPage() {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [businessSector, setBusinessSector] = useState("services");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !companyName.trim() || !whatsappPhone.trim() || !email.trim()) {
      setError("Veuillez renseigner tous les champs obligatoires (*).");
      return;
    }

    const cleanPhone = whatsappPhone.trim();
    if (!cleanPhone.startsWith("+") && !cleanPhone.startsWith("00")) {
      setError(
        "Le numéro WhatsApp doit obligatoirement inclure l'indicatif international du pays avec '+' (ex: +228..., +225..., +33..., +221...)."
      );
      return;
    }

    setSubmitting(true);
    try {
      await serviceIaFetch<{ success: boolean; message: string }>("/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          company_name: companyName.trim(),
          business_sector: businessSector,
          whatsapp_phone: cleanPhone,
          email: email.trim().toLowerCase(),
          message: message.trim() || null,
        }),
      });

      setSuccess(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'envoi de votre demande. Vous pouvez aussi nous contacter directement sur WhatsApp."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappDirectUrl = `https://wa.me/22892092572?text=${encodeURIComponent(
    `Bonjour KORYXA, je m'appelle ${fullName || "un dirigeant"} (${companyName || "mon entreprise"}). Je souhaite une démonstration de CAURI pour mon activité.`
  )}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
            <Compass size={14} />
            <span>Échange Direct &amp; Démonstration</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight mb-4">
            Parlez de vos opérations avec l&apos;équipe KORYXA
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Vous souhaitez découvrir comment <strong>CAURI</strong> s&apos;adapte à votre secteur et simplifie le pilotage de votre entreprise ? Remplissez ce formulaire ou écrivez-nous directement.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Direct Contacts & Reassurance */}
          <div className="lg:col-span-5 space-y-6">
            {/* Direct WhatsApp Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 text-white shadow-xl border border-emerald-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 grid place-items-center border border-emerald-500/40">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">WhatsApp Direct</h3>
                  <p className="text-xs text-emerald-300">Échange immédiat avec un conseiller</p>
                </div>
              </div>
              <p className="text-sm text-slate-300 mb-5 leading-relaxed">
                Posez vos questions ou planifiez un créneau de démo en direct sur notre ligne WhatsApp officielle :
              </p>
              <a
                href="https://wa.me/22892092572?text=Bonjour%20KORYXA,%20je%20souhaite%20en%20savoir%20plus%20sur%20CAURI%20pour%20mon%20entreprise."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-bold text-sm shadow-md transition transform hover:-translate-y-0.5"
              >
                <MessageSquare size={18} />
                <span>+228 92 09 25 72</span>
              </a>
            </div>

            {/* Email & Phone Details */}
            <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Coordonnées Officielles
              </h4>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center shrink-0 border border-emerald-500/20">
                  <Mail size={16} />
                </div>
                <div>
                  <strong className="block text-xs font-semibold text-muted-foreground">Courriel de Contact</strong>
                  <a href="mailto:contact@koryxa.fr" className="text-sm font-bold text-foreground hover:text-emerald-600 transition">
                    contact@koryxa.fr
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center shrink-0 border border-emerald-500/20">
                  <Phone size={16} />
                </div>
                <div>
                  <strong className="block text-xs font-semibold text-muted-foreground">Ligne Téléphonique</strong>
                  <a href="tel:+22892092572" className="text-sm font-bold text-foreground hover:text-emerald-600 transition">
                    +228 92 09 25 72
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 grid place-items-center shrink-0 border border-emerald-500/20">
                  <Globe size={16} />
                </div>
                <div>
                  <strong className="block text-xs font-semibold text-muted-foreground">Plateforme Web</strong>
                  <a href="https://cauri.koryxa.fr" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-emerald-600 hover:underline">
                    cauri.koryxa.fr
                  </a>
                </div>
              </div>
            </div>

            {/* Commitments & Reassurance */}
            <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-3">
              <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Nos Engagements
              </h4>
              <div className="flex items-center gap-2.5 text-xs text-foreground font-medium">
                <Check size={16} className="text-emerald-600 shrink-0" />
                <span>Réponse garantie en moins de 2 heures ouvrées</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-foreground font-medium">
                <Check size={16} className="text-emerald-600 shrink-0" />
                <span>Démonstration personnalisée selon votre métier</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-foreground font-medium">
                <Check size={16} className="text-emerald-600 shrink-0" />
                <span>Confidentialité stricte de vos données opérationnelles</span>
              </div>
            </div>
          </div>

          {/* Right Column: 5-Point Interactive Contact Form */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xl">
              {success ? (
                <div className="text-center py-10 space-y-5">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 grid place-items-center mx-auto border border-emerald-500/30">
                    <CheckCircle2 size={44} />
                  </div>
                  <h3 className="text-2xl font-black text-foreground">Demande transmise avec succès !</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Merci <strong>{fullName}</strong>. Votre demande pour <strong>{companyName}</strong> a bien été enregistrée et notifiée à notre direction.
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                    Un conseiller KORYXA prendra contact avec vous sur le <strong>{whatsappPhone}</strong> sous 2h.
                  </p>

                  <div className="pt-6 border-t border-border flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href={whatsappDirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition"
                    >
                      <MessageSquare size={16} />
                      <span>Continuer sur WhatsApp maintenant</span>
                    </a>
                    <Link
                      href="/espace"
                      className="inline-flex items-center justify-center py-3 px-6 rounded-2xl border border-border font-bold text-sm hover:bg-muted transition"
                    >
                      Accéder à CAURI
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="border-b border-border pb-4 mb-2">
                    <h2 className="text-xl font-bold text-foreground">Formulaire de Contact &amp; Démo</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Les champs marqués d&apos;un astérisque (*) sont obligatoires.
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 text-xs font-semibold">
                      {error}
                    </div>
                  )}

                  {/* 1. Nom Complet */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                      <User size={14} className="text-emerald-600" />
                      <span>1. Nom &amp; Prénom *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Marc Mensah"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition shadow-2xs"
                    />
                  </div>

                  {/* 2. Entreprise */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                      <Building2 size={14} className="text-emerald-600" />
                      <span>2. Nom de l&apos;entreprise ou organisation *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Koryxa Solutions SARL"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition shadow-2xs"
                    />
                  </div>

                  {/* 3. Secteur Métier */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                      <Tag size={14} className="text-emerald-600" />
                      <span>3. Secteur d&apos;activité métier *</span>
                    </label>
                    <select
                      value={businessSector}
                      onChange={(e) => setBusinessSector(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition shadow-2xs"
                    >
                      {BUSINESS_SECTORS.map((s) => (
                        <option key={s.id} value={s.label}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Téléphone WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                      <Phone size={14} className="text-emerald-600" />
                      <span>4. Téléphone WhatsApp (avec indicatif pays) *</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="ex: +228 92 09 25 72 ou +225 07..."
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition shadow-2xs"
                    />
                  </div>

                  {/* 5. Email Professionnel */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                      <Mail size={14} className="text-emerald-600" />
                      <span>5. Email professionnel *</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="ex: direction@entreprise.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition shadow-2xs"
                    />
                  </div>

                  {/* Optional Message */}
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Votre besoin spécifique ou question (Optionnel)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="ex: Nous souhaitons suivre nos encaissements et la trésorerie sur 3 boutiques..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition resize-none shadow-2xs"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Send size={18} />
                    <span>{submitting ? "Transmission en cours…" : "Envoyer ma demande à KORYXA"}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
