import React from "react";
import { formattaEuro, formattaKw } from "../utils/export.js";

/**
 * Riepilogo dei prodotti idonei, una voce per ciascuna categoria
 * dimensionata. Dove la gamma ha più livelli sono mostrati tutti, alla
 * pari; dove c'è una macchina sola, quella.
 *
 * Nessun prodotto è marcato come "consigliato": scegliere per il cliente
 * significherebbe decidere al posto suo su budget e priorità, che il
 * software non conosce. Il suo compito è dire quali macchine coprono il
 * fabbisogno e quanto costano.
 * Il dettaglio di calcolo e le alternative restano disponibili più sotto,
 * per chi vuole approfondire. Mostrato subito dopo l'intestazione, prima
 * di ogni dettaglio tecnico.
 *
 * Quando l'utente sta confrontando più situazioni, il titolo dichiara a
 * quale si riferisce la proposta: il riferimento non va mai presunto.
 *
 * @param {Array<{chiave: string, icona: string, titolo: string, prodotto: object|null, specifica: string, messaggio: string|null}>} voci
 * @param {string|null} nomeScenario nome della situazione preventivata, se ce n'è più di una
 */
export default function RiepilogoSceltaProdotti({ voci, nomeScenario = null }) {
  const vociValide = voci.filter(Boolean);
  if (vociValide.length === 0) return null;

  // La climatizzazione ha tre livelli di gamma sullo stesso fabbisogno: si
  // presentano affiancati e a tutta larghezza, perché sono tre offerte fra
  // cui il cliente sceglie. Le altre categorie hanno una macchina sola e
  // restano nelle card compatte.
  const climaConGamma = vociValide.find((v) => v.alternativeGamma?.length >= 2);
  const altreVoci = vociValide.filter((v) => v !== climaConGamma);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
      <div>
        <h2 className="font-bold text-lg text-slate-800">Prodotto consigliato — per categoria</h2>
        {nomeScenario && (
          <p className="text-sm text-brand-700 font-semibold mt-0.5">
            Riferito alla situazione che vuoi realizzare: {nomeScenario}
          </p>
        )}
        <p className="text-xs text-slate-400 mt-0.5">
          Prodotti a catalogo idonei al fabbisogno calcolato, a prezzo di listino IVA esclusa. Dove la gamma prevede
          più livelli sono proposti tutti, alla pari: la scelta fra base, intermedia e top è tua.
        </p>
      </div>
      {climaConGamma && <BloccoGamma voce={climaConGamma} />}

      {altreVoci.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {altreVoci.map((v) => (
            <CardScelta key={v.chiave} {...v} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Le tre alternative di gamma per la climatizzazione, presentate alla
 * pari. Nessuna è marcata come consigliata: sono tre offerte valide sullo
 * stesso fabbisogno e la scelta fra base, intermedia e top dipende dal
 * budget e da quanto conta il riscaldamento, cose che il software non sa.
 * Indicarne una sposterebbe la decisione dal cliente al calcolo.
 */
function BloccoGamma({ voce }) {
  return (
    <div className="rounded-xl border-2 border-brand-400 bg-brand-50/40 p-3.5 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
        <span>{voce.icona}</span>
        <span>{voce.titolo}</span>
        <span className="font-normal normal-case tracking-normal text-slate-500">— tre alternative</span>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {voce.alternativeGamma.map(({ valore, etichetta, descrizione, prodotto }) => {
          return (
            <div key={valore} className="rounded-lg border-2 border-slate-200 bg-white p-3 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{etichetta}</span>
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                  title="Classe in raffrescamento (SEER) e in riscaldamento (SCOP)"
                >
                  {prodotto.classeEnergetica}
                  {prodotto.classeScop ? ` · ${prodotto.classeScop}` : ""}
                </span>
              </div>

              <div className="text-sm font-bold text-slate-800 leading-tight">
                {prodotto.marchio} {prodotto.modello}
              </div>
              <div className="text-xs text-slate-500">{formattaKw(prodotto.potenzaKw)}</div>
              <div className="text-base font-extrabold text-brand-700">{formattaEuro(prodotto.prezzoIndicativoMin)}</div>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{descrizione}</p>
            </div>
          );
        })}
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
          <div className="text-sm font-bold text-slate-800 leading-tight">
            {prodotto.marchio} {prodotto.modello}
          </div>
          <div className="text-xs text-slate-500">{specifica}</div>
          <div className="text-sm font-extrabold text-brand-700 mt-0.5">
            {prodotto.prezzoIndicativoMin === prodotto.prezzoIndicativoMax
              ? formattaEuro(prodotto.prezzoIndicativoMin)
              : `${formattaEuro(prodotto.prezzoIndicativoMin)}–${formattaEuro(prodotto.prezzoIndicativoMax)}`}
          </div>
        </>
      ) : (
        <p className="text-xs text-slate-500">{messaggio || "Nessun prodotto a catalogo copre questo fabbisogno — contattaci per una soluzione su misura"}</p>
      )}
    </div>
  );
}
