"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { ArrowRight, MailCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { serviceIaFetch } from "@/lib/service-ia/api";

export default function InvitationAcceptance({ token }: { token: string }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");

  const accept = async () => {
    setBusy(true);
    setError("");
    try {
      await serviceIaFetch("/invitations/accept", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      setAccepted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d’accepter cette invitation.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto my-8 max-w-2xl rounded-[2rem] border border-emerald-900/10 bg-white p-7 shadow-[0_24px_80px_rgba(5,55,39,0.10)] sm:p-12">
      <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        {accepted ? <ShieldCheck size={32} /> : <MailCheck size={32} />}
      </div>
      <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Mémoire opérationnelle</p>
      <h1 className="font-serif text-4xl text-emerald-950 sm:text-5xl">
        {accepted ? "Invitation acceptée" : "Rejoignez votre équipe"}
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-600">
        {accepted
          ? "Votre accès est actif. Vous pouvez maintenant ouvrir l’espace opérationnel de votre entreprise."
          : "Connectez-vous avec l’adresse e-mail qui a reçu cette invitation, puis confirmez votre accès."}
      </p>

      {!isLoaded ? <p className="mt-8 text-slate-500">Vérification de votre compte…</p> : null}

      {isLoaded && !isSignedIn ? (
        <div className="mt-8">
          <SignInButton mode="modal">
            <button className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 font-bold text-white transition hover:bg-emerald-700">
              Se connecter pour accepter <ArrowRight size={18} />
            </button>
          </SignInButton>
        </div>
      ) : null}

      {isLoaded && isSignedIn && !accepted ? (
        <div className="mt-8 rounded-2xl bg-emerald-50/70 p-5">
          <p className="text-sm text-slate-600">Compte connecté</p>
          <strong className="mt-1 block text-emerald-950">{user.primaryEmailAddress?.emailAddress}</strong>
          <button
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
            disabled={busy}
            onClick={() => void accept()}
          >
            {busy ? "Activation…" : "Accepter l’invitation"} <ArrowRight size={18} />
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-700" role="alert">{error}</p> : null}
      {accepted ? (
        <Link className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 font-bold text-white transition hover:bg-emerald-700" href="/espace">
          Ouvrir mon espace <ArrowRight size={18} />
        </Link>
      ) : null}
    </section>
  );
}
