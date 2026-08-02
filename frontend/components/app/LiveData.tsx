"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Check, FileText, Play, Radar as RadarIcon, RefreshCw, UploadCloud, UserRound, X } from "lucide-react";
import { PageHeader } from "./PageHeader";
import { EmptyState, MetricCard, RegisterList, StatusPill } from "./Ui";
import { serviceIaFetch } from "@/lib/service-ia/api";
import type { Metric, RegisterItem } from "@/lib/service-ia/types";

type ApiPage<T> = { items: T[]; total: number; page: number; page_size: number };
type Offer = { id:string; name:string; category?:string|null; status:string; price?:string|null; currency:string; updated_at:string };
type Sale = { id:string; reference:string; client_name?:string|null; payment_status:string; total_amount:string; currency:string; sale_date:string };
type Procedure = { id:string; title:string; department?:string|null; status:string; version:number; next_review_date?:string|null };
type Alert = { id:string; title:string; explanation:string; priority:string; dimension:string; status:string; confidence:number };
type Action = { id:string; title:string; status:string; priority:string; responsible_user_id?:string|null; due_date?:string|null };
type Validation = { id:string; field_name:string; old_value:unknown; proposed_value:unknown; source_type:string; confidence:number; status:string };
type Organization = { id:string; name:string; slug:string; is_active:boolean };
type Member = { id:string; user_id:string; role:string; status:string };
type Attachment = { id:string; filename:string; register_type:string; record_id:string; size_bytes:number; created_at:string };
type Rule = { id:string; rule_code:string; enabled:boolean; priority:string; parameters:Record<string,unknown> };

function label(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value).replaceAll("_", " ");
}
function money(value: string | null | undefined, currency: string) {
  if (value == null) return "Sur devis";
  const number = Number(value);
  return Number.isFinite(number) ? `${new Intl.NumberFormat("fr-FR").format(number)} ${currency}` : `${value} ${currency}`;
}
function date(value?: string | null) {
  return value ? new Intl.DateTimeFormat("fr-FR").format(new Date(value)) : "—";
}

function useApi<T>(path: string) {
  const [data,setData]=useState<T|null>(null); const [error,setError]=useState(""); const [loading,setLoading]=useState(true);
  const reload=useCallback(async()=>{setLoading(true);setError("");try{setData(await serviceIaFetch<T>(path));}catch(e){setError(e instanceof Error?e.message:"API indisponible");}finally{setLoading(false)}},[path]);
  useEffect(()=>{void reload()},[reload]); return {data,error,loading,reload};
}
function State({loading,error,empty}:{loading:boolean;error:string;empty:boolean}) {
  if(loading)return <EmptyState title="Chargement…" detail="Connexion aux données Service IA."/>;
  if(error)return <EmptyState title="Données indisponibles" detail={error}/>;
  if(empty)return <EmptyState title="Aucune donnée" detail="Aucun élément réel n’est encore enregistré pour cette organisation."/>;
  return null;
}

export function LiveRegister({kind}:{kind:"offers"|"sales"|"procedures"}) {
  const config={offers:["Offres & tarifs","Conservez un tarif officiel, ses conditions et sa période de validité."],sales:["Ventes","Suivez les ventes, les paiements et les informations à compléter."],procedures:["Procédures","Formalisez les méthodes de travail, responsables et dates de révision."]}[kind];
  const {data,error,loading}=useApi<ApiPage<Offer|Sale|Procedure>>(`/registers/${kind}`);
  const items=useMemo<RegisterItem[]>(()=>data?.items.map(item=>{
    if(kind==="offers"){const x=item as Offer;return{id:x.id,title:x.name,subtitle:x.category||"Sans catégorie",status:label(x.status),meta:`Mis à jour le ${date(x.updated_at)}`,value:money(x.price,x.currency)}}
    if(kind==="sales"){const x=item as Sale;return{id:x.id,title:x.reference,subtitle:x.client_name||"Client non renseigné",status:label(x.payment_status),meta:date(x.sale_date),value:money(x.total_amount,x.currency)}}
    const x=item as Procedure;return{id:x.id,title:x.title,subtitle:x.department||"Sans département",status:label(x.status),meta:`Version ${x.version} · Révision ${date(x.next_review_date)}`};
  })??[],[data,kind]);
  return <><PageHeader eyebrow="Registre" title={config[0]} description={config[1]}/><section className="app-panel"><State loading={loading} error={error} empty={!items.length}/>{items.length?<RegisterList items={items}/>:null}</section></>;
}

export function LiveDashboard(){
  const alerts=useApi<Alert[]>("/radar/alerts"); const actions=useApi<Action[]>("/workflow/actions");
  const offers=useApi<ApiPage<Offer>>("/registers/offers?page_size=1"); const sales=useApi<ApiPage<Sale>>("/registers/sales?page_size=1"); const procedures=useApi<ApiPage<Procedure>>("/registers/procedures?page_size=1");
  const open=(alerts.data??[]).filter(x=>x.status!=="resolved"&&x.status!=="ignored"); const active=(actions.data??[]).filter(x=>x.status!=="completed"&&x.status!=="ignored");
  const metrics:Metric[]=[{label:"Alertes ouvertes",value:String(open.length),detail:"Résultats Radar réels",tone:open.length?"warning":"positive"},{label:"Actions actives",value:String(active.length),detail:"Workflow opérationnel",tone:"neutral"},{label:"Offres",value:String(offers.data?.total??0),detail:"Registre réel",tone:"neutral"},{label:"Ventes",value:String(sales.data?.total??0),detail:`${procedures.data?.total??0} procédures`,tone:"neutral"}];
  const error=alerts.error||actions.error||offers.error||sales.error||procedures.error; const loading=alerts.loading||actions.loading||offers.loading||sales.loading||procedures.loading;
  return <><PageHeader eyebrow="Vue d’ensemble" title="Votre entreprise devient plus lisible." description="Données opérationnelles chargées depuis Service IA."/><State loading={loading} error={error} empty={false}/>{!loading&&!error?<><section className="app-metrics">{metrics.map(m=><MetricCard key={m.label} metric={m}/>)}</section><section className="app-grid-two"><article className="app-panel"><div className="app-panel-head"><h2>Alertes à traiter</h2><Link href="/espace/radar">Voir Radar <ArrowRight size={15}/></Link></div>{open.slice(0,5).map(a=><div className="app-alert" key={a.id}><RadarIcon size={18}/><div><strong>{a.title}</strong><p>{a.explanation}</p></div><StatusPill>{label(a.priority)}</StatusPill></div>)}{!open.length?<EmptyState title="Aucune alerte" detail="Lancez Radar pour analyser vos registres."/>:null}</article><article className="app-panel"><div className="app-panel-head"><h2>Actions en cours</h2><Link href="/espace/actions">Tout voir <ArrowRight size={15}/></Link></div>{active.slice(0,5).map(a=><div className="app-action" key={a.id}><div><strong>{a.title}</strong><span>{a.responsible_user_id||"Non assignée"}</span></div><StatusPill>{label(a.status)}</StatusPill></div>)}{!active.length?<EmptyState title="Aucune action" detail="Les actions créées depuis Radar apparaîtront ici."/>:null}</article></section></>:null}</>;
}

export function LiveActions(){const q=useApi<Action[]>("/workflow/actions");return <><PageHeader eyebrow="Exécution" title="Actions correctives" description="Actions réelles créées depuis vos alertes."/><State loading={q.loading} error={q.error} empty={!q.data?.length}/>{q.data?.length?<section className="app-kanban">{["todo","in_progress","blocked","completed"].map(status=><div className="app-kanban-column" key={status}><div className="app-kanban-head"><strong>{label(status)}</strong><span>{q.data?.filter(a=>a.status===status).length}</span></div>{q.data?.filter(a=>a.status===status).map(a=><article className="app-task" key={a.id}><StatusPill>{label(a.priority)}</StatusPill><h3>{a.title}</h3><div><span><UserRound size={14}/>{a.responsible_user_id||"Non assignée"}</span><span><CalendarDays size={14}/>{date(a.due_date)}</span></div></article>)}</div>)}</section>:null}</>}

export function LiveRadar(){const q=useApi<Alert[]>("/radar/alerts");const [running,setRunning]=useState(false);const run=async()=>{setRunning(true);try{await serviceIaFetch("/radar/runs",{method:"POST"});await q.reload()}finally{setRunning(false)}};return <><PageHeader eyebrow="Qualité des données" title="Knowlia Radar" description="Alertes calculées par le moteur Radar." action={<button className="app-button app-button-primary" disabled={running} onClick={run}><Play size={16}/>{running?"Analyse…":"Lancer Radar"}</button>}/><State loading={q.loading} error={q.error} empty={!q.data?.length}/>{q.data?.length?<section className="app-panel"><div className="app-alert-list">{q.data.map(a=><article className="app-alert app-alert-large" key={a.id}><RadarIcon size={18}/><div><strong>{a.title}</strong><p>{a.explanation}</p><div className="app-alert-tags"><span>{label(a.dimension)}</span><span>{label(a.status)}</span></div></div><StatusPill>{label(a.priority)}</StatusPill></article>)}</div></section>:null}</>}

export function LiveValidations(){const q=useApi<Validation[]>("/workflow/validations?status=pending");const decide=async(id:string,decision:"accepted"|"rejected")=>{await serviceIaFetch(`/workflow/validations/${id}/decision`,{method:"POST",body:JSON.stringify({decision,justification:"Décision depuis l’espace Service IA"})});await q.reload()};return <><PageHeader eyebrow="Contrôle humain" title="Validations" description="Propositions réelles en attente de décision."/><State loading={q.loading} error={q.error} empty={!q.data?.length}/>{q.data?.length?<section className="app-panel"><div className="app-validation-list">{q.data.map(v=><article className="app-validation" key={v.id}><div className="app-validation-head"><div><strong>{v.field_name}</strong><span>{label(v.source_type)}</span></div><StatusPill>{Math.round(v.confidence*100)}%</StatusPill></div><div className="app-change"><div><small>Valeur actuelle</small><strong>{label(v.old_value)}</strong></div><span>→</span><div><small>Valeur proposée</small><strong>{label(v.proposed_value)}</strong></div></div><div className="app-validation-actions"><button className="app-button app-button-secondary" onClick={()=>void decide(v.id,"rejected")}><X size={15}/>Rejeter</button><button className="app-button app-button-primary" onClick={()=>void decide(v.id,"accepted")}><Check size={15}/>Accepter</button></div></article>)}</div></section>:null}</>}

export function LiveOrganization(){const org=useApi<Organization>("/organizations/current");const members=useApi<Member[]>("/members");return <><PageHeader eyebrow="Équipe" title="Organisation & membres" description="Organisation et droits renvoyés par le backend."/><State loading={org.loading||members.loading} error={org.error||members.error} empty={false}/>{org.data&&members.data?<section className="app-panel"><div className="app-panel-head"><div><span className="app-eyebrow">Organisation</span><h2>{org.data.name}</h2></div><StatusPill>{members.data.length} membres</StatusPill></div><div className="app-list">{members.data.map(m=><div className="app-list-row" key={m.id}><div className="app-list-icon"><UserRound size={18}/></div><div className="app-list-main"><strong>{m.user_id}</strong><span>{label(m.role)}</span></div><StatusPill>{label(m.status)}</StatusPill></div>)}</div></section>:null}</>}

export function LiveDocuments(){const [registerType,setRegisterType]=useState("offer");const [recordId,setRecordId]=useState("");const [items,setItems]=useState<Attachment[]>([]);const [error,setError]=useState("");const [loading,setLoading]=useState(false);const load=async()=>{if(!recordId.trim())return;setLoading(true);setError("");try{setItems(await serviceIaFetch(`/imports/attachments?register_type=${encodeURIComponent(registerType)}&record_id=${encodeURIComponent(recordId.trim())}`))}catch(e){setError(e instanceof Error?e.message:"Documents indisponibles")}finally{setLoading(false)}};return <><PageHeader eyebrow="Mémoire documentaire" title="Documents & Knowlia" description="Documents réellement enregistrés pour un élément de registre."/><section className="app-panel"><div className="app-toolbar"><select value={registerType} onChange={e=>setRegisterType(e.target.value)}><option value="offer">Offre</option><option value="sale">Vente</option><option value="procedure">Procédure</option></select><input value={recordId} onChange={e=>setRecordId(e.target.value)} placeholder="Identifiant de l’élément"/><button className="app-button app-button-primary" onClick={()=>void load()}>Charger</button></div><State loading={loading} error={error} empty={!loading&&!error&&!items.length}/>{items.length?<div className="app-list">{items.map(d=><article className="app-list-row" key={d.id}><div className="app-list-icon"><FileText size={19}/></div><div className="app-list-main"><strong>{d.filename}</strong><span>{d.register_type} · {Math.ceil(d.size_bytes/1024)} Ko</span></div><StatusPill>{date(d.created_at)}</StatusPill><RefreshCw size={17}/></article>)}</div>:null}</section></>}

export function LiveSettings(){const q=useApi<Rule[]>("/radar/rules");return <><PageHeader eyebrow="Configuration" title="Paramètres Radar" description="Règles réellement configurées dans le backend."/><State loading={q.loading} error={q.error} empty={!q.data?.length}/>{q.data?.length?<section className="app-panel"><div className="app-list">{q.data.map(r=><article className="app-list-row" key={r.id}><div className="app-list-main"><strong>{r.rule_code}</strong><span>{Object.keys(r.parameters).length} paramètres</span></div><StatusPill>{r.enabled?"Activée":"Désactivée"}</StatusPill><StatusPill>{label(r.priority)}</StatusPill></article>)}</div></section>:null}</>}

export function LiveImports(){const [file,setFile]=useState<File|null>(null);const [registerType,setRegisterType]=useState("offers");const [preview,setPreview]=useState<{id:string;row_count:number;suggested_mapping:Record<string,string>;errors:unknown[]}|null>(null);const [error,setError]=useState("");const send=async()=>{if(!file)return;setError("");const body=new FormData();body.set("file",file);body.set("register_type",registerType);try{setPreview(await serviceIaFetch("/imports/preview",{method:"POST",body}))}catch(e){setError(e instanceof Error?e.message:"Import impossible")}};const confirm=async()=>{if(!preview)return;await serviceIaFetch(`/imports/${preview.id}/confirm`,{method:"POST",body:JSON.stringify({column_mapping:preview.suggested_mapping})});setPreview(null);setFile(null)};return <><PageHeader eyebrow="Migration" title="Importer vos données" description="Aperçu et confirmation via le backend réel."/><section className="app-panel app-upload"><label>Registre<select value={registerType} onChange={e=>setRegisterType(e.target.value)}><option value="offers">Offres</option><option value="sales">Ventes</option><option value="procedures">Procédures</option></select></label><label className="app-dropzone"><input type="file" accept=".csv,.xlsx" onChange={e=>setFile(e.target.files?.[0]??null)}/><UploadCloud size={34}/><strong>{file?file.name:"Déposez votre fichier ici"}</strong><span>CSV ou XLSX · 10 Mo maximum</span></label>{error?<p role="alert">{error}</p>:null}{file&&!preview?<button className="app-button app-button-primary" onClick={()=>void send()}>Prévisualiser</button>:null}{preview?<div className="app-import-preview"><h2>{preview.row_count} lignes détectées</h2><StatusPill>{preview.errors.length} erreurs</StatusPill>{Object.entries(preview.suggested_mapping).map(([from,to])=><div className="app-mapping" key={from}><span>{from} → {to}</span></div>)}<button className="app-button app-button-primary" onClick={()=>void confirm()}>Confirmer l’import</button></div>:null}</section></>}
