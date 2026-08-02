"use client";
import { useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import type { RegisterItem } from "@/lib/service-ia/types";
import { PageHeader } from "./PageHeader";
import { PrimaryButton, RegisterList, SecondaryButton } from "./Ui";

export function RegisterPage({ eyebrow, title, description, items, cta }: { eyebrow: string; title: string; description: string; items: RegisterItem[]; cta: string }) {
 const [query,setQuery]=useState(""); const filtered=items.filter(x => `${x.title} ${x.subtitle}`.toLowerCase().includes(query.toLowerCase()));
 return <><PageHeader eyebrow={eyebrow} title={title} description={description} action={<PrimaryButton><Plus size={16}/>{cta}</PrimaryButton>}/><section className="app-panel"><div className="app-toolbar"><SearchBarControl value={query} onChange={setQuery}/><SecondaryButton><SlidersHorizontal size={16}/>Filtres</SecondaryButton></div><RegisterList items={filtered}/><div className="app-pagination"><span>{filtered.length} éléments</span><div><button disabled>Précédent</button><button>1</button><button disabled>Suivant</button></div></div></section></>;
}
function SearchBarControl({value,onChange}:{value:string;onChange:(value:string)=>void}) { return <label className="app-search"><span className="sr-only">Rechercher</span><input value={value} onChange={e=>onChange(e.target.value)} placeholder="Rechercher dans le registre…"/></label> }
