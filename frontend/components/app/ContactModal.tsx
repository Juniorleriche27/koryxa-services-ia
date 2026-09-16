"use client";

import { useState } from "react";
import {
  X,
  Send,
  MessageSquare,
  Mail,
  Phone,
  CheckCircle2,
  Building2,
  User,
  Tag,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { serviceIaFetch } from "@/lib/service-ia/api";

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
  defaultSector?: string;
}

export const BUSINESS_SECTORS = [
  { id: "services", label: "💼 Services, Conseil & B2B" },
  { id: "retail", label: "🛍️ Commerce, Boutique & Vente" },
  { id: "hospitality", label: "🍽️ Restauration & Hôtellerie" },
  { id: "crafts", label: "🛠️ Artisanat, Industrie & Atelier" },
  { id: "association", label: "🤝 Association, ONG & Communauté" },
  { id: "other", label: "🌐 Autre secteur d'activité" },
];

export function ContactModal({ open, onClose, defaultSector = "services" }: ContactModalProps) {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [businessSector, setBusinessSector] = useState(defaultSector);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!fullName.trim() || !companyName.trim() || !whatsappPhone.trim() || !email.trim()) {
      setError("Veuillez renseigner tous les champs obligatoires (*).");
      return;
    }

    const cleanPhone = whatsappPhone.trim();
    if (!cleanPhone.startsWith("+") && !cleanPhone.startsWith("00")) {
      setError(
        "Le numéro WhatsApp doit obligatoirement inclure l'indicatif international du pays avec '+' (ex: +228..., +225..., +33...)."
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
          : "Une erreur est survenue. Vous pouvez aussi nous contacter directement sur WhatsApp."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappDirectUrl = `https://wa.me/22892092572?text=${encodeURIComponent(
    `Bonjour KORYXA, je m'appelle ${fullName || "un dirigeant"} (${companyName || "mon entreprise"}). Je souhaite une démonstration de CAURI pour mon activité.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 grid place-items-center shrink-0 border border-emerald-500/30">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                Nous Contacter &amp; Démo
              </h3>
              <p className="text-xs text-emerald-300/80">
                Échangez directement avec l&apos;équipe KORYXA pour CAURI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 max-h-[calc(85vh-90px)] overflow-y-auto">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 grid place-items-center mx-auto border border-emerald-500/30">
                <CheckCircle2 size={36} />
              </div>
              <h4 className="text-xl font-bold text-foreground">Demande transmise avec succès !</h4>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Merci <strong>{fullName}</strong>. Notre équipe a bien reçu votre demande pour <strong>{companyName}</strong> et vous recontactera sous 2 heures ouvrées.
              </p>

              <div className="pt-4 border-t border-border/80 flex flex-col gap-2.5">
                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition"
                >
                  <MessageSquare size={16} />
                  <span>Continuer directement sur WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* 1. Full Name */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                  <User size={13} className="text-emerald-600" />
                  <span>1. Nom complet *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Marc Mensah"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                />
              </div>

              {/* 2. Company Name */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Building2 size={13} className="text-emerald-600" />
                  <span>2. Nom de l&apos;entreprise ou organisation *</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Koryxa Solutions SARL"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                />
              </div>

              {/* 3. Business Sector */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Tag size={13} className="text-emerald-600" />
                  <span>3. Secteur d&apos;activité métier *</span>
                </label>
                <select
                  value={businessSector}
                  onChange={(e) => setBusinessSector(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                >
                  {BUSINESS_SECTORS.map((s) => (
                    <option key={s.id} value={s.label}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. WhatsApp Phone */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Phone size={13} className="text-emerald-600" />
                  <span>4. Téléphone WhatsApp (avec indicatif pays) *</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="ex: +228 92 09 25 72 ou +225 07..."
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                />
              </div>

              {/* 5. Email */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Mail size={13} className="text-emerald-600" />
                  <span>5. Email professionnel *</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="ex: direction@entreprise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                />
              </div>

              {/* Optional Message */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Votre besoin ou questions (Optionnel)
                </label>
                <textarea
                  rows={2}
                  placeholder="ex: Je souhaite tester le suivi de trésorerie et la gestion des ventes sur plusieurs points de vente..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition resize-none"
                />
              </div>

              {/* Direct WhatsApp Callout */}
              <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Besoin d&apos;une réponse immédiate ?</span>
                <a
                  href="https://wa.me/22892092572?text=Bonjour%20KORYXA,%20je%20souhaite%20une%20d%C3%A9monstration%20de%20CAURI%20pour%20mon%20entreprise."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <MessageSquare size={12} />
                  <span>WhatsApp direct (+228 92 09 25 72)</span>
                </a>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{submitting ? "Transmission en cours…" : "Envoyer ma demande"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
