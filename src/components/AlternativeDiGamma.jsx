import React from "react";
import { trovaAlternativeDiGamma } from "../data/catalogo.js";
import { formattaEuro, formattaKw } from "../utils/export.js";

/**
 * Le tre alternative di gamma sullo stesso fabbisogno: base, intermedia e
 * top. Sono la stessa taglia con efficienza e prezzo diversi, quindi non
 * vanno mostrate come una classifica ma affiancate, in ordine di prezzo:
 * la scelta fra le tre è del cliente, non del calcolo.
 *
 * Le famiglie senza livelli — canalizzabili, cassette, console — hanno
 * una linea sola: in quel caso il componente non mostra nulla e resta il
 * catalogo comparativo.
 */
export default function AlternativeDiGamma({ fabbisognoKw, tipologiaTerminale = "parete" }) {
  const { alternative, messaggio } = trovaAlternativeDiGamma(fabbisognoKw, tipologiaTerminale);

  if (messaggio || alternative.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-slate-800">Tre alternative per lo stesso fabbisogno</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Stessa taglia, calcolata su {formattaKw(fabbisognoKw)}: cambiano efficienza e prezzo, non la capacità.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {alternative.map(({ valore, etichetta, descrizione, prodotto }, indice) => (
          <div
            key={valore}
            className={`rounded-xl border-2 p-3.5 flex flex-col gap-1 ${
              indice === 1 ? "border-brand-400 bg-brand-50/40" : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{etichetta}</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                {prodotto.classeEnergetica}
              </span>
            </div>

            <div className="text-sm font-bold text-slate-800 leading-tight">
              {prodotto.marchio} {prodotto.modello}
            </div>
            <div className="text-xs text-slate-500">
              {formattaKw(prodotto.potenzaKw)} · resa {prodotto.potenzaFreddoKw} kW in freddo, {prodotto.potenzaCaldoKw} kW in caldo
            </div>
            <div className="text-lg font-extrabold text-brand-700 mt-0.5">{formattaEuro(prodotto.prezzoIndicativoMin)}</div>
            <div className="text-[10px] text-slate-400 leading-tight">
              Unità interna {prodotto.codiceUnitaInterna} + esterna {prodotto.codiceUnitaEsterna}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight mt-1 pt-1 border-t border-slate-100">{descrizione}</p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-slate-400">
        Prezzi di listino IVA esclusa, unità interna più esterna. Non comprendono staffe, linea frigorifera,
        installazione e messa in servizio.
      </p>
    </div>
  );
}
