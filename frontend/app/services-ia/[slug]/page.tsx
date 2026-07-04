import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { getServiceIaBySlug, getServiceIaDetailContent, SERVICE_IA_ITEMS } from "../data";

type ServiceIaPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(props: ServiceIaPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const service = getServiceIaBySlug(slug);
  if (!service) {
    return { title: "Service IA | KORYXA" };
  }
  return {
    title: `${service.title} | Service IA`,
    description: service.summary,
  };
}

export default async function ServiceIaDetailPage(props: ServiceIaPageProps) {
  const { slug } = await props.params;
  const service = getServiceIaBySlug(slug);
  if (!service) notFound();
  const detailContent = getServiceIaDetailContent(slug);

  return (
    <main className="space-y-8 pb-16">
      <section className="rounded-[30px] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Service IA</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
          {detailContent?.heroTitle ?? service.title}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 sm:text-base">{service.summary}</p>

        <div className="mt-7 grid gap-3 md:grid-cols-2">
          {service.outcomes.map((outcome) => (
            <div key={outcome} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-sm text-slate-700">{outcome}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/services-ia/demande?service=${service.slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Lancer le brief
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/services-ia"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
          >
            Retour a la liste
          </Link>
        </div>
      </section>

      {detailContent ? (
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-2xl">Pourquoi ce service compte</h2>
            <div className="mt-5 space-y-4 text-sm leading-8 text-slate-600 sm:text-base">
              {detailContent.introduction.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-8 rounded-[26px] border border-sky-100 bg-sky-50/65 p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-slate-950">{detailContent.scenarioTitle ?? "Mise en situation"}</h3>
              <div className="mt-4 space-y-4 text-sm leading-8 text-slate-700 sm:text-base">
                {detailContent.scenario.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </article>

          <aside className="space-y-6">
            {detailContent.scenarioHighlights?.length ? (
              <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-7">
                <h3 className="text-lg font-semibold text-slate-950">Ce que le dirigeant voit clairement</h3>
                <div className="mt-5 space-y-3">
                  {detailContent.scenarioHighlights.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <p className="text-sm leading-6 text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-7">
              <h3 className="text-lg font-semibold text-slate-950">{detailContent.deliveryTitle ?? "Ce que KORYXA livre"}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">{detailContent.delivery}</p>

              {detailContent.deliverables?.length ? (
                <div className="mt-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {detailContent.deliverablesTitle ?? "Livrables"}
                  </p>
                  <div className="mt-4 space-y-3">
                    {detailContent.deliverables.map((item) => (
                      <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                        <p className="text-sm leading-6 text-slate-700">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 rounded-2xl bg-slate-950 px-5 py-5 text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-200">
                  {detailContent.resultTitle ?? "Resultat attendu"}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-100 sm:text-base">{detailContent.result}</p>
              </div>

              {detailContent.audience ? (
                <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-5 py-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    {detailContent.audienceTitle ?? "Pour qui"}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">{detailContent.audience}</p>
                </div>
              ) : null}
            </section>
          </aside>
        </section>
      ) : null}

      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-8">
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Autres services</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_IA_ITEMS.filter((item) => item.slug !== service.slug).map((item) => (
            <Link
              key={item.slug}
              href={`/services-ia/${item.slug}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-white hover:text-sky-700"
            >
              {item.title}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
