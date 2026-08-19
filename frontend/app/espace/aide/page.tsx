"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  HelpCircle,
  MessageSquarePlus,
  Sparkles,
  Compass,
  Mic,
  ReceiptText,
  Tag,
  Wallet,
  UserCheck,
  Radar,
  Bot,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ExternalLink,
  Send,
  Star,
  ShieldCheck,
  Printer,
  QrCode,
  Zap,
} from "lucide-react";
import clsx from "clsx";
import { getBusinessCategoryConfig, BusinessCategoryConfig } from "@/lib/service-ia/business-categories";
import { serviceIaFetch } from "@/lib/service-ia/api";

function HelpPageContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "manuel" | "faq" | "feedback") || "manuel";
  const [activeTab, setActiveTab] = useState<"manuel" | "faq" | "feedback">(initialTab);
  const [businessCategory, setBusinessCategory] = useState<string>("retail");
  const [openFaq, setOpenFaq] = useState<Record<string, boolean>>({
    faq_1: true,
  });

  // Feedback form state
  const [rating, setRating] = useState<number>(5);
  const [feedbackType, setFeedbackType] = useState<"suggestion" | "bug" | "compliment">("suggestion");
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [feedbackSent, setFeedbackSent] = useState(false);

  useEffect(() => {
    serviceIaFetch<{ business_category?: string }>("/organizations/current")
      .then((org) => {
        if (org.business_category) setBusinessCategory(org.business_category);
      })
      .catch(() => {});
  }, []);

  const proConfig: BusinessCategoryConfig = getBusinessCategoryConfig(businessCategory);

  const toggleFaq = (id: string) => {
    setOpenFaq((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;
    setFeedbackSent(true);
  };

  const handleStartTour = () => {
    window.dispatchEvent(new CustomEvent("koryxa:start-tour"));
  };

  const handleOpenVoice = () => {
    window.dispatchEvent(new CustomEvent("koryxa:open-voice"));
  };

  const faqs = [
    {
      id: "faq_1",
      question: "Comment fonctionne la reconnaissance vocale de vente ?",
      answer:
        "Cliquez simplement sur l'icône du Micro ou appuyez sur le bouton vert 'Dicter'. Parlez naturellement en indiquant l'article, la quantité, le prix et éventuellement le nom du client (ex: 'Vente de 3 robes à 15000 francs au client Marc'). L'IA détecte tout automatiquement et prépare la fiche de vente que vous pouvez valider en 1 clic.",
    },
    {
      id: "faq_2",
      question: "Que faire si je vends un article qui n'est pas encore dans mon catalogue ?",
      answer:
        "Dans la 'Caisse Express', utilisez le bandeau supérieur 'Article Libre / Vente Directe'. Tapez simplement le nom de l'article et son prix, puis cliquez sur 'Ajouter'. Vous pouvez ainsi encaisser immédiatement sans perdre une seconde.",
    },
    {
      id: "faq_3",
      question: "Comment fonctionne la Borne de Pointage QR Code ?",
      answer:
        "Rendez-vous dans 'Équipe & Opérations > Pointage' puis cliquez sur 'Ouvrir la Borne QR'. Vous pouvez afficher cet écran sur une tablette ou un smartphone fixé à l'entrée de votre magasin/bureau. Vos employés scannent le QR Code dynamique avec leur téléphone pour enregistrer leur arrivée avec contrôle anti-fraude.",
    },
    {
      id: "faq_4",
      question: "Comment Cora IA analyse-t-elle les données de mon entreprise ?",
      answer:
        "Cora IA est connectée en temps réel à vos ventes réelles, vos dépenses enregistrées, vos niveaux de stocks et les alertes de votre Radar. Appuyez sur Ctrl+J (ou ⌘J) pour lui demander : 'Quel est mon chiffre du jour ?', 'Quels sont les clients en retard de paiement ?', ou 'Quels articles sont en rupture ?'.",
    },
    {
      id: "faq_5",
      question: "Puis-je utiliser KORYXA hors-ligne (sans connexion Internet) ?",
      answer:
        "Oui ! KORYXA intègre une synchronisation différée. Si votre connexion Internet se coupe momentanément, vous pouvez continuer à saisir des encaissements. Dès le retour du réseau, vos données sont automatiquement transmises au serveur.",
    },
    {
      id: "faq_6",
      question: "Comment envoyer une relance d'impayé par WhatsApp ?",
      answer:
        "Dans le tableau de vos Ventes, repérez les ventes avec le badge orange 'Impayé'. Cliquez sur le bouton 'Relancer'. Vous pouvez choisir le ton (Courtois, Ferme ou Juridique) et cliquer sur 'Ouvrir dans WhatsApp' pour envoyer le message directement au client.",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white border border-emerald-900/50 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold tracking-wide uppercase border border-emerald-500/30">
              <Sparkles size={13} />
              Centre d&apos;Aide & Manuel Officiel • {proConfig.name}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Tout pour maîtriser KORYXA pas-à-pas
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Consultez le manuel détaillé, découvrez les astuces pour votre métier ({proConfig.shortName}) et posez vos questions en direct.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              onClick={handleStartTour}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <Compass size={16} />
              <span>Visite Guidée (2 min)</span>
            </button>
            <button
              onClick={handleOpenVoice}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-2 border border-white/20 transition cursor-pointer"
            >
              <Mic size={16} className="text-emerald-400" />
              <span>Tester le Micro</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 max-w-md">
        <button
          onClick={() => setActiveTab("manuel")}
          className={clsx(
            "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === "manuel"
              ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs font-extrabold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
          )}
        >
          <BookOpen size={15} />
          <span>Manuel Pas-à-Pas</span>
        </button>

        <button
          onClick={() => setActiveTab("faq")}
          className={clsx(
            "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === "faq"
              ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs font-extrabold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
          )}
        >
          <HelpCircle size={15} />
          <span>FAQ (Questions)</span>
        </button>

        <button
          onClick={() => setActiveTab("feedback")}
          className={clsx(
            "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === "feedback"
              ? "bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs font-extrabold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
          )}
        >
          <MessageSquarePlus size={15} />
          <span>Retours / Avis</span>
        </button>
      </div>

      {/* TAB 1: MANUEL UTILISATEUR PAS-À-PAS */}
      {activeTab === "manuel" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 grid place-items-center font-extrabold text-sm shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                    Cockpit & Bilan Opérationnel
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">Pilotage & Santé</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Le Cockpit vous donne en un coup d&apos;œil vos 4 indicateurs vitaux : Chiffre d&apos;affaires réel, montant total encaissé, créances clients à recouvrer et score Radar sur 100. Cliquez sur <strong>&apos;Bilan Opérationnel (PDF)&apos;</strong> pour imprimer ou archiver un rapport d&apos;audit certifié.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 grid place-items-center font-extrabold text-sm shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                    Dictée Vocale Intelligente
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">Saisie sans clavier</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Cliquez sur le gros bouton vert <strong>&apos;Dicter&apos;</strong> et dictez vos ventes à voix haute. Vous pouvez mentionner plusieurs ventes d&apos;affilée, le nom du client et les montants en FCFA, EUR, USD ou devises régionales. L&apos;IA structure tout instantanément.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 grid place-items-center font-extrabold text-sm shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                    Caisse Express & Ventes
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">Point de Vente (POS)</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Encaissez vos clients en sélectionnant vos articles ou en utilisant l&apos;<strong>Article Libre</strong>. Choisissez le mode de règlement (Espèces, Wave, Orange Money, MTN MoMo, Carte), calculez la monnaie à rendre et imprimez le ticket de caisse en un clic.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 grid place-items-center font-extrabold text-sm shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                    Relances d&apos;Impayés par IA
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">Recouvrement WhatsApp</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Pour chaque facture ou vente impayée, cliquez sur <strong>&apos;Relancer&apos;</strong>. L&apos;IA rédige automatiquement un message personnalisé selon le nombre de jours de retard avec 3 tonalités au choix (Courtoise, Ferme, Juridique) prêt à envoyer sur WhatsApp.
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 grid place-items-center font-extrabold text-sm shrink-0">
                  5
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                    Borne de Pointage QR Code
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">Présence & Anti-fraude</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Affichez la <strong>Borne QR Code</strong> sur une tablette à l&apos;entrée. Vos vendeurs et collaborateurs scannent le QR Code dynamique avec leur smartphone pour valider leur arrivée avec géolocalisation et calcul d&apos;heures travaillées.
              </p>
            </div>

            {/* Step 6 */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 grid place-items-center font-extrabold text-sm shrink-0">
                  6
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                    Radar Sentinelle & Cora IA
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">Contrôle 24/7</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Le Radar analyse en continu la complétude, la fraîcheur et la cohérence de vos données. Ouvrez <strong>Cora IA (Ctrl+J)</strong> à tout moment pour poser des questions ou générer de nouvelles procédures de travail.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FOIRE AUX QUESTIONS (FAQ) */}
      {activeTab === "faq" && (
        <div className="space-y-3">
          {faqs.map((faq) => {
            const isOpen = Boolean(openFaq[faq.id]);
            return (
              <div
                key={faq.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <strong className="text-sm font-bold text-slate-950 dark:text-white">
                    {faq.question}
                  </strong>
                  {isOpen ? (
                    <ChevronUp size={18} className="text-emerald-600 shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: RETOURS & SUGGESTIONS */}
      {activeTab === "feedback" && (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
          {feedbackSent ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 grid place-items-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">
                Merci pour votre retour précieux !
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                Votre avis a bien été transmis à l&apos;équipe produit KORYXA pour continuer à améliorer votre expérience au quotidien.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFeedbackSent(false);
                  setFeedbackMessage("");
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendFeedback} className="space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
                  Votre avis compte énormément pour nous
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Une idée d&apos;amélioration, un besoin particulier ou un retour sur l&apos;utilisation ? Dites-le nous directement !
                </p>
              </div>

              {/* Star Rating */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Votre appréciation globale :
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        size={24}
                        fill={star <= rating ? "#f59e0b" : "none"}
                        stroke="#f59e0b"
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-500 ml-2">
                    {rating === 5 ? "Exceptionnel ! ⭐⭐⭐⭐⭐" : `${rating} / 5`}
                  </span>
                </div>
              </div>

              {/* Feedback Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Type de retour :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "suggestion", label: "💡 Suggestion d'idée" },
                    { id: "bug", label: "🛠️ Signalement de bug" },
                    { id: "compliment", label: "❤️ Témoignage" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFeedbackType(cat.id as any)}
                      className={clsx(
                        "p-2.5 rounded-xl border text-xs font-bold text-center transition cursor-pointer",
                        feedbackType === cat.id
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Votre message ou suggestion :
                </label>
                <textarea
                  required
                  rows={4}
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Expliquez ce qui vous ferait gagner encore plus de temps dans votre gestion quotidienne..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Send size={14} />
                  <span>Envoyer mon retour</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-bold text-slate-500">Chargement du centre d&apos;aide...</div>}>
      <HelpPageContent />
    </Suspense>
  );
}
