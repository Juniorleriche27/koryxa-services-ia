import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServiceProjectWizard from "@/components/forms/ServiceProjectWizard";
import { getService, serviceCatalog } from "@/lib/services/catalog";
export function generateStaticParams(){return serviceCatalog.map(s=>({pillar:s.pillarSlug,service:s.slug}));}
export async function generateMetadata({params}:{params:Promise<{pillar:string;service:string}>}):Promise<Metadata>{const x=await params;const s=getService(x.pillar,x.service);return s?{title:`Demande — ${s.title} | KORYXA`,description:`Formulaire dédié au service ${s.title}.`}:{title:"Service introuvable"};}
export default async function Page({params}:{params:Promise<{pillar:string;service:string}>}){const x=await params;const s=getService(x.pillar,x.service);if(!s)notFound();return <div className="pt-6 sm:pt-10"><ServiceProjectWizard service={s} origin={`/services/${s.pillarSlug}/${s.slug}`}/></div>}
