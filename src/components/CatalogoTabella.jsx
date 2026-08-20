import React from "react";
import { trovaProdottiConsigliati } from "../data/catalogo.js";
import { formattaEuro } from "../utils/export.js";

/**
 * Catalogo prodotti come tabella tecnica comparativa (modalità
 * Ingegnere): potenza, SCOP/SEER, classe energetica in primo piano; il
 * prezzo resta presente ma non è l'elemento guida della scelta.
 */
export default function CatalogoTabella({ fabbisognoKw, tipo = "climatizzatore_split", titolo, numeroUnitaRichieste = null }) {
  const { consigliati, messaggio } = trovaProdottiConsigliati(fabbisognoKw, tipo, numeroUnitaRichieste);

  if (messaggio) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-500">
        {titolo && <div className="font-medium text-slate-700 mb-1">{titolo}</div>}
        {messaggio}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {titolo && <div className="font-medium text-slate-700 mb-2">{titolo}</div>}
      <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="text-left px-3 py-2">Modello</th>
            <th className="text-right px-3 py-2">Potenza</th>
            <th className="text-right px-3 py-2">Classe</th>
            <th className="text-right px-3 py-2">SEER</th>
            <th className="text-right px-3 py-2">SCOP</th>
            <th className="text-right px-3 py-2">Prezzo indicativo (IVA escl.)</th>
            <th className="text-right px-3 py-2">Scheda</th>
          </tr>
        </thead>
        <tbody>
          {consigliati.map((p, i) => (
            <tr key={`${p.marchio}-${p.modello}`} className="border-t border-slate-100">
              <td className="px-3 py-2">
                <div className="font-medium text-slate-800">
                  {p.marchio} {p.modello}
                  {i === 0 && (
                    <span className="ml-2 text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-semibold">
                      Consigliato
                    </span>
                  )}
                </div>
              </td>
              <td className="text-right px-3 py-2">
                {p.potenzaKw} kW{p.potenzaBtu ? ` (${p.potenzaBtu.toLocaleString("it-IT")} BTU/h)` : ""}
              </td>
              <td className="text-right px-3 py-2">{p.classeEnergetica}</td>
              <td className="text-right px-3 py-2">{p.seer ?? "-"}</td>
              <td className="text-right px-3 py-2">{p.scop ?? "-"}</td>
              <td className="text-right px-3 py-2 text-slate-500">
                {formattaEuro(p.prezzoIndicativoMin)} – {formattaEuro(p.prezzoIndicativoMax)}
              </td>
              <td className="text-right px-3 py-2">
                {p.schedaTecnicaUrl ? (
                  <a href={p.schedaTecnicaUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 underline no-print">
                    apri ↗
                  </a>
                ) : (
                  <span className="text-slate-300">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-slate-400 mt-1">
        Prezzi indicativi PLACEHOLDER, solo unità, IVA esclusa — da sostituire con listino reale del marchio
        rappresentato.
      </p>
    </div>
  );
}
