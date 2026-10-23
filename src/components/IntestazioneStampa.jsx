import React from "react";
import { profiloCompilato } from "../utils/profiloProfessionista.js";

/**
 * Intestazione del documento esportato/stampato: branding, titolo, comune
 * e data. Sempre visibile (anche a schermo, come riepilogo dei dati
 * inseriti) e pensata per restare leggibile quando i form di input
 * vengono nascosti in fase di stampa (classe .no-print su App.jsx).
 *
 * Se un professionista ha inserito i propri dati, la relazione è sua: il
 * suo nome e il suo logo vanno in testa, con i contatti, e l'agenzia
 * compare sotto come supporto tecnico. Il nome dell'agenzia non sparisce
 * mai — è la ragione per cui lo strumento esiste — ma non ruba la scena a
 * chi consegna il documento al proprio cliente.
 */
export default function IntestazioneStampa({ branding, comune, titolo, sottotitolo, profilo = null }) {
  const oggi = new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
  const firmata = profiloCompilato(profilo);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 print:border-0 print:rounded-none print:p-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {firmata ? (
            <Logo src={profilo.logo} nome={profilo.nome} />
          ) : (
            <Logo src={branding.logoUrl} nome={branding.nomeAzienda} />
          )}
          <div className="min-w-0">
            <div className="font-bold text-slate-800">{titolo}</div>
            {sottotitolo && <div className="text-xs text-slate-500">{sottotitolo}</div>}
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div className="font-medium text-slate-700">{firmata ? profilo.nome : branding.nomeAzienda || "[Nome azienda/agente]"}</div>
          {firmata && (
            <div>{[profilo.telefono, profilo.email, profilo.sito].filter((v) => v && v.trim()).join(" · ")}</div>
          )}
          <div>
            {comune?.nome ? `${comune.nome} — ` : ""}
            {oggi}
          </div>
        </div>
      </div>

      {firmata && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          {branding.logoUrl && <img src={branding.logoUrl} alt="" className="h-5 w-5 object-contain" />}
          <span>
            Con il supporto tecnico di <span className="font-semibold text-slate-700">{branding.nomeAzienda}</span>
          </span>
        </div>
      )}
    </div>
  );
}

function Logo({ src, nome }) {
  if (src) {
    return <img src={src} alt={nome || "Logo"} className="h-10 w-10 rounded object-contain bg-slate-50 border border-slate-200 shrink-0" />;
  }
  return (
    <div className="h-10 w-10 rounded bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
      {(nome || "AZ").slice(0, 2).toUpperCase()}
    </div>
  );
}
