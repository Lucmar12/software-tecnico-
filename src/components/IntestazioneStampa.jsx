import React from "react";

/**
 * Intestazione del documento esportato/stampato: branding, titolo, comune
 * e data. Sempre visibile (anche a schermo, come riepilogo dei dati
 * inseriti) e pensata per restare leggibile quando i form di input
 * vengono nascosti in fase di stampa (classe .no-print su App.jsx).
 */
export default function IntestazioneStampa({ branding, comune, titolo, sottotitolo }) {
  const oggi = new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 print:border-0 print:rounded-none print:p-0">
      <div className="flex items-center gap-3">
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt="Logo" className="h-10 w-10 rounded object-contain bg-slate-50 border border-slate-200" />
        ) : (
          <div className="h-10 w-10 rounded bg-brand-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            {(branding.nomeAzienda || "AZ").slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <div className="font-bold text-slate-800">{titolo}</div>
          {sottotitolo && <div className="text-xs text-slate-500">{sottotitolo}</div>}
        </div>
      </div>
      <div className="text-right text-xs text-slate-500">
        <div className="font-medium text-slate-700">{branding.nomeAzienda || "[Nome azienda/agente]"}</div>
        <div>{comune?.nome ? `${comune.nome} — ` : ""}{oggi}</div>
      </div>
    </div>
  );
}
