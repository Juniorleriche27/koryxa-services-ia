"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getServiceIaBySlug, getServiceQuestionSet, type ServiceIaQuestion } from "../data";

type Props = {
  serviceSlug: string;
};

type ServiceAnswers = Record<string, string | string[]>;

type FormState = {
  company: string;
  sector: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  country: string;
  project_brief: string;
  timeline: string;
  budget: string;
  service_answers: ServiceAnswers;
};

const TOTAL_STEPS = 4;

function buildInitialState(): FormState {
  return {
    company: "",
    sector: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    country: "",
    project_brief: "",
    timeline: "",
    budget: "",
    service_answers: {},
  };
}

export default function ServiceIaFunnelClient({ serviceSlug }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<FormState>(() => buildInitialState());
  const [touched, setTouched] = useState(false);

  const currentService = useMemo(() => getServiceIaBySlug(serviceSlug), [serviceSlug]);
  const serviceQuestions = useMemo<ServiceIaQuestion[]>(
    () => getServiceQuestionSet(serviceSlug),
    [serviceSlug],
  );

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function getTextAnswer(key: string): string {
    const value = state.service_answers[key];
    return typeof value === "string" ? value : "";
  }

  function getArrayAnswer(key: string): string[] {
    const value = state.service_answers[key];
    return Array.isArray(value) ? value : [];
  }

  function setTextAnswer(key: string, value: string) {
    setState((prev) => ({
      ...prev,
      service_answers: {
        ...prev.service_answers,
        [key]: value,
      },
    }));
  }

  function toggleArrayAnswer(key: string, optionValue: string) {
    setState((prev) => {
      const current = Array.isArray(prev.service_answers[key]) ? (prev.service_answers[key] as string[]) : [];
      const exists = current.includes(optionValue);
      const next = exists ? current.filter((item) => item !== optionValue) : [...current, optionValue];
      return {
        ...prev,
        service_answers: {
          ...prev.service_answers,
          [key]: next,
        },
      };
    });
  }

  function isQuestionAnswered(question: ServiceIaQuestion): boolean {
    if (!question.required) return true;
    if (question.input === "checkbox") {
      return getArrayAnswer(question.key).length > 0;
    }
    return getTextAnswer(question.key).trim().length > 0;
  }

  function validateStep(targetStep: number): boolean {
    if (targetStep === 1) {
      return Boolean(
        state.company.trim() &&
          state.sector.trim() &&
          state.contact_name.trim() &&
          state.contact_email.trim() &&
          state.contact_phone.trim(),
      );
    }
    if (targetStep === 2) {
      return serviceQuestions.every((question) => isQuestionAnswered(question));
    }
    if (targetStep === 3) {
      return Boolean(state.project_brief.trim());
    }
    return true;
  }

  function nextStep() {
    setTouched(true);
    if (!validateStep(step)) return;
    setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
    setTouched(false);
  }

  function prevStep() {
    setStep((prev) => Math.max(1, prev - 1));
    setTouched(false);
  }

  function submitBrief() {
    const params = new URLSearchParams();
    params.set("service", serviceSlug);
    params.set("company", state.company);
    params.set("sector", state.sector);
    params.set("contact_name", state.contact_name);
    params.set("contact_email", state.contact_email);
    params.set("contact_phone", state.contact_phone);
    if (state.country.trim()) params.set("country", state.country.trim());
    params.set("project_brief", state.project_brief);
    if (state.timeline.trim()) params.set("timeline", state.timeline.trim());
    if (state.budget.trim()) params.set("budget", state.budget.trim());

    for (const question of serviceQuestions) {
      const answer = state.service_answers[question.key];
      if (Array.isArray(answer) && answer.length > 0) {
        params.set(`q_${question.key}`, answer.join("|"));
      } else if (typeof answer === "string" && answer.trim()) {
        params.set(`q_${question.key}`, answer.trim());
      }
    }

    router.push(`/services-ia/confirmation?${params.toString()}`);
  }

  function renderQuestion(question: ServiceIaQuestion) {
    if (question.input === "textarea") {
      return (
        <textarea
          rows={4}
          value={getTextAnswer(question.key)}
          onChange={(event) => setTextAnswer(question.key, event.target.value)}
          placeholder={question.placeholder}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
        />
      );
    }

    if (question.input === "text") {
      return (
        <input
          value={getTextAnswer(question.key)}
          onChange={(event) => setTextAnswer(question.key, event.target.value)}
          placeholder={question.placeholder}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
        />
      );
    }

    if (question.input === "select") {
      return (
        <select
          value={getTextAnswer(question.key)}
          onChange={(event) => setTextAnswer(question.key, event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
        >
          <option value="">Choisir...</option>
          {question.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (question.input === "radio") {
      return (
        <div className="grid gap-2">
          {question.options?.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            >
              <input
                type="radio"
                name={`radio-${question.key}`}
                checked={getTextAnswer(question.key) === option.value}
                onChange={() => setTextAnswer(question.key, option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      );
    }

    return (
      <div className="grid gap-2">
        {question.options?.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
          >
            <input
              type="checkbox"
              checked={getArrayAnswer(question.key).includes(option.value)}
              onChange={() => toggleArrayAnswer(question.key, option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  if (!currentService) {
    return (
      <section className="rounded-[30px] border border-rose-200 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-9">
        <p className="text-sm font-medium text-rose-600">Service introuvable. Retournez a la liste des services.</p>
      </section>
    );
  }

  const stepValid = validateStep(step);

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-9">
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Brief Service IA</p>
        <p className="text-xs font-semibold text-slate-500">Etape {step}/{TOTAL_STEPS}</p>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#0284c7,#38bdf8)] transition-all"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {step === 1 ? (
        <div className="mt-6 grid gap-5">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Etape 1: premier contact</h2>
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Entreprise
              <input
                value={state.company}
                onChange={(event) => updateField("company", event.target.value)}
                placeholder="Nom de l'entreprise"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Secteur d'activite
              <input
                value={state.sector}
                onChange={(event) => updateField("sector", event.target.value)}
                placeholder="Ex: retail, sante, education, industrie"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              />
            </label>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Contact principal
              <input
                value={state.contact_name}
                onChange={(event) => updateField("contact_name", event.target.value)}
                placeholder="Nom complet"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                value={state.contact_email}
                onChange={(event) => updateField("contact_email", event.target.value)}
                placeholder="contact@entreprise.com"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Telephone
              <input
                value={state.contact_phone}
                onChange={(event) => updateField("contact_phone", event.target.value)}
                placeholder="+228 ..."
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Pays (optionnel)
            <input
              value={state.country}
              onChange={(event) => updateField("country", event.target.value)}
              placeholder="Ex: Togo, Cote d'Ivoire, Senegal"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            />
          </label>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-6 grid gap-5">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Etape 2: questions du service</h2>
          <p className="text-sm leading-7 text-slate-600">
            Repondez aux questions ci-dessous pour nous donner un contexte metier precis.
          </p>
          {serviceQuestions.map((question) => (
            <label key={question.key} className="grid gap-2 text-sm font-medium text-slate-700">
              <span>
                {question.label}
                {question.required ? <span className="ml-1 text-rose-600">*</span> : null}
              </span>
              {renderQuestion(question)}
              {question.helper ? <span className="text-xs text-slate-500">{question.helper}</span> : null}
            </label>
          ))}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-6 grid gap-5">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Etape 3: besoin detaille</h2>
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Decrivez votre besoin en detail
            <textarea
              rows={5}
              value={state.project_brief}
              onChange={(event) => updateField("project_brief", event.target.value)}
              placeholder="Contexte, attentes, contraintes, livrable attendu."
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
            />
          </label>
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Timeline souhaitee (optionnel)
              <select
                value={state.timeline}
                onChange={(event) => updateField("timeline", event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              >
                <option value="">Choisir...</option>
                <option value="2_4_semaines">2 a 4 semaines</option>
                <option value="1_2_mois">1 a 2 mois</option>
                <option value="3_mois_plus">3 mois et plus</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Budget indicatif (optionnel)
              <select
                value={state.budget}
                onChange={(event) => updateField("budget", event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
              >
                <option value="">Choisir...</option>
                <option value="moins_5000">Moins de 5 000 EUR</option>
                <option value="5000_15000">5 000 a 15 000 EUR</option>
                <option value="15000_plus">15 000 EUR et plus</option>
              </select>
            </label>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="mt-6 grid gap-5">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Etape 4: validation</h2>
          <p className="text-sm leading-7 text-slate-600">
            Verifiez les elements, puis envoyez votre demande.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Entreprise</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{state.company}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Contact</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{state.contact_name}</p>
              <p className="text-xs text-slate-500">{state.contact_email}</p>
              <p className="text-xs text-slate-500">{state.contact_phone}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Besoin detaille</p>
            <p className="mt-2 text-sm leading-7 text-slate-700">{state.project_brief}</p>
          </div>
        </div>
      ) : null}

      {!stepValid && touched ? (
        <p className="mt-4 text-sm font-medium text-rose-600">Veuillez completer les champs requis pour continuer.</p>
      ) : null}

      <div className="mt-7 flex flex-wrap gap-3">
        {step > 1 ? (
          <button
            type="button"
            onClick={prevStep}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
          >
            Retour
          </button>
        ) : (
          <Link
            href="/services-ia"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
          >
            Retour aux services
          </Link>
        )}

        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={nextStep}
            className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Continuer
          </button>
        ) : (
          <button
            type="button"
            onClick={submitBrief}
            className="inline-flex items-center rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Envoyer la demande
          </button>
        )}
      </div>
    </section>
  );
}
