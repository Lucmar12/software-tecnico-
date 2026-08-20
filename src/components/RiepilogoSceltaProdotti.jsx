import React from "react";
import { formattaEuro } from "../utils/export.js";

/**
 * Riepilogo "Prodotto consigliato": una card per ciascuna categoria
 * dimensionata, con il SOLO prodotto in cima alla classifica (non un
 * confronto tra alternative) — lo scopo è portare chi legge dritto alla
 * scelta di un prodotto preciso, non offrire un'ulteriore comparazione.
 * Il dettaglio di calcolo e le alternative restano disponibili più sotto,
 * per chi vuole approfondire. Mostrato sia in modalità Ingegnere (subito
 * dopo l'intestazione, prima dei dettagli tecnici) sia in modalità
 * Venditore (in cima ai risultati).
 *
 * @param {Array<{chiave: string, icona: string, titolo: string, prodotto: object|null, specifica: string, messaggio: string|null}>} voci
 */
export default function RiepilogoSceltaProdotti({ voci }) {
  const vociValide = voci.filter(Boolean);
  if (vociValide.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
      <div>
        <h2 className="font-bold text-lg text-slate-800">Prodotto consigliato — per categoria</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          La proposta con il miglior compromesso classe energetica/prezzo tra i prodotti a catalogo idonei al
          fabbisogno calcolato. Dettaglio di calcolo e alternative disponibili più sotto.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {vociValide.map((v) => (
          <CardScelta key={v.chiave} {...v} />
        ))}
      </div>
    </div>
  );
}

function CardScelta({ icona, titolo, prodotto, specifica, messaggio }) {
  return (
    <div className="rounded-xl border-2 border-brand-400 bg-brand-50/40 p-3.5 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
        <span>{icona}</span>
        <span>{titolo}</span>
      </div>
      {prodotto ? (
        <>
          <div className="text-[11px] font-semibold text-brand-600">✓ Scelta consigliata</div>
          <div className="text-sm font-bold text-slate-800 leading-tight">
            {prodotto.marchio} {prodotto.modello}
          </div>
          <div className="text-xs text-slate-500">{specifica}</div>
          <div className="text-sm font-extrabold text-brand-700 mt-0.5">
            {formattaEuro(prodotto.prezzoIndicativoMin)}–{formattaEuro(prodotto.prezzoIndicativoMax)}
          </div>
        </>
      ) : (
        <p className="text-xs text-slate-500">{messaggio || "Nessun prodotto a catalogo copre questo fabbisogno — contattaci per una soluzione su misura"}</p>
      )}
    </div>
  );
}
