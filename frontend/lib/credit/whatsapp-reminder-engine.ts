/**
 * CAURI - Moteur de Relance Conversationnelle Stratégique Multi-Tons
 * Conçu pour WhatsApp, SMS et Email en contexte UEMOA / Afrique.
 */

import { formatTreasuryMoney } from "../radar/cashflow-projection";
import { CreditTier } from "./client-scoring";

export type ReminderTone = "proximity" | "courteous" | "firm" | "legal";
export type ReminderTiming = "upcoming" | "due_today" | "overdue";

export interface ReminderPayloadOptions {
  clientName?: string | null;
  clientPhone?: string | null;
  reference: string;
  totalAmount: number;
  paidAmount?: number;
  balanceDue?: number;
  dueDate?: string | null;
  overdueDays?: number;
  currency?: string;
  organizationName?: string;
  publicToken?: string | null;
  tone?: ReminderTone;
  timing?: ReminderTiming;
  clientTier?: CreditTier;
  baseUrl?: string;
}

export interface GeneratedReminderMessage {
  subject: string;
  body: string;
  whatsappUrl: string;
  cleanPhone: string;
  tone: ReminderTone;
  hasSmartDoc: boolean;
}

export function cleanWhatsAppPhone(phone?: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/[^0-9]/g, "");
  // Si numéro local sans indicatif (ex: 8 ou 10 chiffres en Côte d'Ivoire ou Sénégal)
  // On conserve les chiffres bruts
  return digits;
}

export function generateStrategicPaymentReminder(
  options: ReminderPayloadOptions
): GeneratedReminderMessage {
  const {
    clientName = "Cher Client",
    clientPhone,
    reference,
    totalAmount,
    paidAmount = 0,
    dueDate,
    overdueDays = 0,
    currency = "XOF",
    organizationName = "Notre Entreprise",
    publicToken,
    tone = "courteous",
    timing = overdueDays > 0 ? "overdue" : "due_today",
    baseUrl,
  } = options;

  const resolvedBaseUrl =
    baseUrl ||
    (typeof window !== "undefined" && window.location.origin && !window.location.origin.includes("localhost")
      ? window.location.origin
      : "https://cauri.app");

  const docUrl = publicToken ? `${resolvedBaseUrl}/d/${publicToken}` : "";
  const remaining = options.balanceDue ?? Math.max(0, totalAmount - paidAmount);
  const formattedBalance = formatTreasuryMoney(remaining, currency);
  const formattedTotal = formatTreasuryMoney(totalAmount, currency);
  const formattedPaid = formatTreasuryMoney(paidAmount, currency);
  const hasPartial = paidAmount > 0 && remaining > 0;
  const name = clientName?.trim() || "Cher Partenaire";

  let subject = "";
  let body = "";

  // 1. TON : PROXIMITÉ & ENTENTE COMMERCIALE (Confiance, partenariat de terrain)
  if (tone === "proximity") {
    subject = `Nouvelles de ${organizationName} - Suivi de votre facture ${reference}`;
    body =
      `Bonjour ${name},\n\n` +
      `J'espère que vous vous portez bien ainsi que vos activités.\n\n` +
      `Je vous contacte au sujet de notre facture *${reference}* d'un montant de *${formattedBalance}*` +
      (hasPartial ? ` (dont acompte de ${formattedPaid} déjà bien enregistré, merci)` : "") +
      `.\n\n` +
      (overdueDays > 0
        ? `L'échéance convenue est passée depuis ${overdueDays} jour${overdueDays > 1 ? "s" : ""}. Connaissant la qualité de notre relation, je sais qu'il s'agit d'un simple oubli dans votre planning.\n`
        : `L'échéance arrive à terme aujourd'hui.\n`);

    if (docUrl) {
      body +=
        `\nPour vous faciliter la tâche, vous pouvez consulter la facture détaillée et la régler directement en 1 clic (Wave, Orange Money, Moov ou Carte) sur ce lien sécurisé :\n` +
        `👉 ${docUrl}\n`;
    }

    body +=
      `\nFaites-moi signe dès que c'est fait afin que je bloque la confirmation de notre côté.\n\n` +
      `Bien cordialement,\n*${organizationName}*`;
  }

  // 2. TON : COURTOIS & BIENVEILLANT (Rappel standard professionnel)
  else if (tone === "courteous") {
    subject =
      timing === "upcoming"
        ? `Rappel préventif : Échéance facture ${reference}`
        : `Suivi de règlement : Facture ${reference}`;

    body =
      `Bonjour ${name},\n\n` +
      `Sauf erreur de notre part, nous vous informons que le solde de votre facture *${reference}* ` +
      `s'élève à *${formattedBalance}* (sur un montant total de ${formattedTotal}` +
      (hasPartial ? `, acompte versé : ${formattedPaid}` : "") +
      `).\n\n`;

    if (timing === "upcoming") {
      body += `Pour rappel, l'échéance est fixée au ${dueDate || "prochainement"}.\n`;
    } else if (overdueDays > 0) {
      body += `Ce montant est arrivé à échéance depuis ${overdueDays} jour${overdueDays > 1 ? "s" : ""}.\n`;
    } else {
      body += `Cette facture arrive à échéance ce jour.\n`;
    }

    if (docUrl) {
      body +=
        `\n📄 Consultez le document certifié et réglez en ligne en 1 clic :\n` +
        `👉 ${docUrl}\n`;
    }

    body +=
      `\nModalités acceptées : Wave, Orange Money, MTN MoMo, Moov Money, Virement bancaire ou Espèces en caisse.\n\n` +
      `Merci pour votre confiance.\n*${organizationName}*`;
  }

  // 3. TON : FERME & PRÉCIS (Échéance largement dépassée, rappel comptable)
  else if (tone === "firm") {
    subject = `IMPORTANT : Règlement en attente - Facture ${reference}`;
    body =
      `Madame, Monsieur ${name},\n\n` +
      `Nos registres comptables indiquent que la facture *${reference}*, émise pour un montant de *${formattedTotal}*, ` +
      `présente à ce jour un solde impayé de *${formattedBalance}*.\n\n` +
      `Cette créance est échue depuis maintenant *${overdueDays} jours*.\n\n` +
      `Afin de préserver la fluidité de nos relations commerciales et d'éviter tout blocage de vos prochaines commandes ou livraisons, ` +
      `nous vous prions de bien vouloir régulariser cette situation sous 48 heures.\n`;

    if (docUrl) {
      body +=
        `\nLien de règlement instantané sécurisé :\n` +
        `👉 ${docUrl}\n`;
    }

    body +=
      `\nSi votre règlement a été effectué récemment, merci de nous transmettre le reçu de transaction.\n\n` +
      `Service Comptabilité & Recouvrement\n*${organizationName}*`;
  }

  // 4. TON : JURIDIQUE / MISE EN DEMEURE (Pré-contentieux)
  else {
    subject = `MISE EN DEMEURE AVANT CONTENTIEUX : Facture ${reference}`;
    body =
      `À L'ATTENTION DE : ${name}\n\n` +
      `OBJET : MISE EN DEMEURE DE PAYER - DOSSIER RÉF. ${reference}\n\n` +
      `Malgré nos précédentes relances, nous constatons qu'à la date de ce jour, la facture *${reference}* ` +
      `d'un montant restant dû de *${formattedBalance}* demeure impayée (retard de ${overdueDays} jours).\n\n` +
      `Par la présente, nous vous mettons formellement en demeure de procéder au règlement intégral sous un délai strict de 72 heures.\n\n` +
      `À défaut de paiement dans ce délai, votre dossier sera immédiatement transmis à notre service juridique ou à notre cabinet de recouvrement, ` +
      `avec application des pénalités légales et suspension définitive de tout compte commercial.\n`;

    if (docUrl) {
      body +=
        `\nRèglement de régularisation en ligne :\n` +
        `👉 ${docUrl}\n`;
    }

    body +=
      `\nFait pour valoir ce que de droit.\n` +
      `Direction Financière & Affaires Juridiques\n*${organizationName}*`;
  }

  const cleanPhone = cleanWhatsAppPhone(clientPhone);
  const encodedText = encodeURIComponent(body);
  const whatsappUrl = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  return {
    subject,
    body,
    whatsappUrl,
    cleanPhone,
    tone,
    hasSmartDoc: Boolean(docUrl),
  };
}
