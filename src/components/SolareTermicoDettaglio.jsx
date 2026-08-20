import React from "react";
import { calcolaBollitore } from "../data/calculations.js";
import { trovaPannelliSolariConsigliati } from "../data/catalogo.js";
import { calcolaRisparmioSolareTermico } from "../utils/fotovoltaico.js";

/** Dettaglio dell'integrazione del bollitore con un impianto solare termico: quota di fabbisogno coperta e prodotto consigliato. */
export default function SolareTermicoDettaglio({ acs, solareTermico }) {
  if (!solareTermico.attivo) return null;
  const bollitore = calcolaBollitore(acs.numeroPersone, acs.abitudine);
  const risparmio = calcolaRisparmioSolareTermico(bollitore.kWhAnno, solareTermico.coperturaPct);
  const { consigliati, messaggio } = trovaPannelliSolariConsigliati(bollitore.litriConsigliati);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-slate-800">Integrazione solare termico — ACS</h3>
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <div className="text-xs text-emerald-700">Copertura solare attesa</div>
          <div className="text-xl font-bold text-emerald-800">{risparmio.coperturaPct}%</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="text-xs text-slate-500">Energia coperta dal solare</div>
          <div className="text-xl font-bold text-slate-800">{Math.round(risparmio.kWhCopertiDaSolare).toLocaleString("it-IT")} kWh/anno</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="text-xs text-slate-500">Fabbisogno residuo bollitore</div>
          <div className="text-xl font-bold text-slate-800">{Math.round(risparmio.kWhResiduiDaImpianto).toLocaleString("it-IT")} kWh/anno</div>
        </div>
      </div>
      {messaggio ? (
        <p className="text-xs text-slate-400">{messaggio}</p>
      ) : (
        <ul className="text-xs text-slate-500 list-disc list-inside">
          {consigliati.map((p) => (
            <li key={p.modello}>
              {p.marchio} {p.modello} — {p.capacitaLitri} L accumulo
              {p.schedaTecnicaUrl && (
                <>
                  {" "}
                  <a href={p.schedaTecnicaUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                    scheda ↗
                  </a>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
