import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getQuestionOptionLabel, getServiceIaBySlug, getServiceQuestionSet } from "../data";

type Props = {
  searchParams: Promise<{
    service?: string;
    company?: string;
    sector?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    country?: string;
    project_brief?: string;
    timeline?: string;
    budget?: string;
    [key: string]: string | undefined;
  }>;
};

export const metadata: Metadata = {
  title: "Confirmation | Service IA",
  description: "Confirmation de demande Service IA.",
};

export default async function ServiceIaConfirmationPage({ searchParams }: Props) {
  const query = await searchParams;
  const service = getServiceIaBySlug(query.service ?? "");
  const serviceQuestions = getServiceQuestionSet(service?.slug ?? "");

  const serviceAnswers = serviceQuestions
    .map((question) => {
      const raw = query[`q_${question.key}`] || "";
      if (!raw.trim()) return null;
      if (question.input === "checkbox") {
        const values = raw.split("|").filter(Boolean);
        const labels = values.map((value) => getQuestionOptionLabel(question, value));
        return { label: question.label, value: labels.join(", ") };
      }
      if (question.input === "radio" || question.input === "select") {
        return { label: question.label, value: getQuestionOptionLabel(question, raw) };
      }
      return { label: question.label, value: raw };
    })
    .filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <main className="space-y-8 pb-16">
      <section className="rounded-[30px] border border-emerald-200 bg-[linear-gradient(145deg,#f0fdf4_0%,#ffffff_100%)] p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-9">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Demande envoyee</h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 sm:text-base">
          Votre premier contact est bien enregistre. L'equipe KORYXA revient vers vous sous 72h avec la prochaine etape.
        </p>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-9">
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Recapitulatif</h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Service</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{service?.title ?? "Non precise"}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Entreprise</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{query.company || "Non precisee"}</p>
            <p className="text-xs text-slate-500">{query.sector || ""}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Contact</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{query.contact_name || "Non precise"}</p>
            <p className="text-xs text-slate-500">{query.contact_email || ""}</p>
            <p className="text-xs text-slate-500">{query.contact_phone || ""}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Cadence</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{query.timeline || "A definir"}</p>
            <p className="text-xs text-slate-500">{query.budget || "Budget a confirmer"}</p>
            <p className="text-xs text-slate-500">{query.country || ""}</p>
          </div>
        </div>

        {serviceAnswers.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Reponses metier</p>
            <div className="mt-3 grid gap-3">
              {serviceAnswers.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-700">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {query.project_brief ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Besoin detaille</p>
            <p className="mt-2 text-sm text-slate-700">{query.project_brief}</p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/services-ia"
            className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Retour a Service IA
          </Link>
          <Link
            href="/services-ia/demande"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
          >
            Envoyer une autre demande
          </Link>
        </div>
      </section>
    </main>
  );
}
