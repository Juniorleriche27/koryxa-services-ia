import type { Metadata } from "next";
import Link from "next/link";
import ServiceIaFunnelClient from "../_components/ServiceIaFunnelClient";
import { SERVICE_IA_ITEMS, getServiceIaBySlug } from "../data";

type Props = {
  searchParams: Promise<{ service?: string }>;
};

export const metadata: Metadata = {
  title: "Demande | Service IA",
  description: "Tunnel de vente Service IA avec questions adaptees a chaque offre.",
};

export default async function ServiceIaDemandePage({ searchParams }: Props) {
  const query = await searchParams;
  const resolvedService = getServiceIaBySlug(query.service ?? "");

  if (!resolvedService) {
    return (
      <main className="space-y-8 pb-16">
        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Service IA</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
            Choisissez un service pour demarrer le brief
          </h1>
          <p className="mt-4 text-sm leading-8 text-slate-600 sm:text-base">
            Pour eviter toute confusion, le brief demarre uniquement avec un service precise.
          </p>
        </section>

        <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-9">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_IA_ITEMS.map((service) => (
              <Link
                key={service.slug}
                href={`/services-ia/demande?service=${service.slug}`}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-white hover:text-sky-700"
              >
                {service.title}
              </Link>
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="space-y-8 pb-16">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Service IA</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
          Demande de prestation: {resolvedService.title}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 sm:text-base">
          Repondez a quelques questions claires sur votre besoin. Notre equipe vous recontacte avec une
          proposition adaptee au service demande.
        </p>
      </section>

      <ServiceIaFunnelClient serviceSlug={resolvedService.slug} />
    </main>
  );
}
