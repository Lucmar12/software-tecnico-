import React from "react";
import { confrontaMonoMulti } from "../utils/confrontoMonoMulti.js";
import { formattaEuro, formattaKw } from "../utils/export.js";

/**
 * Confronto fra un motore per stanza e un motore solo per tutta la casa,
 * con i prezzi di listino di entrambe le configurazioni.
 *
 * Sta qui, accanto all'interruttore che sceglie fra le due, e non nella
 * relazione: una scelta si informa mentre la si fa, non dopo.
 *
 * Non indica una vincente. Il prezzo e il numero di unità esterne sono
 * dati di fatto; dove appoggiare i motori, cosa consente il condominio e
 * che aspetto debba avere la facciata il software non lo sa, e sono
 * proprio le cose che di solito decidono.
 */
export default function ConfrontoMonoMulti({ edificio, sistemaCentralizzato }) {
  if (!edificio || edificio.risultatiAmbienti.length < 2) return null;

  const fabbisognoEdificioKw = Math.max(edificio.totaleInvernaleKw, edificio.totaleEstivoKw);
  const confronto = confrontaMonoMulti({
    risultatiAmbienti: edificio.risultatiAmbienti,
    fabbisognoEdificioKw,
    tipologiaTerminale: sistemaCentralizzato.tipologiaTerminale ?? "parete",
    livello: "intermedio",
  });

  if (!confronto) return null;
  const { mono, multi, confrontabili, differenzaPrezzo, motoriRisparmiati, numeroAmbienti } = confronto;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div>
        <h4 className="font-semibold text-slate-800 text-sm">Un motore per stanza o un motore solo?</h4>
        <p className="text-xs text-slate-400 mt-0.5">
          Confronto sui {numeroAmbienti} ambienti di questo scenario, a prezzi di listino IVA esclusa, serie
          intermedia CU-PRO. Serve a darti i numeri: la scelta dipende anche da dove puoi mettere le unità esterne.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Colonna
          titolo="Monosplit"
          sottotitolo={`${mono.unitaEsterne} unità esterne, una per ambiente`}
          attiva={sistemaCentralizzato.tipo === "nessuno"}
          prezzo={mono.prezzoTotale}
          righe={mono.macchine.map((m) => ({
            testo: m.ambiente || "Ambiente",
            dettaglio: m.prodotto ? `${m.prodotto.modello} · ${formattaKw(m.prodotto.potenzaKw)}` : "nessuna macchina a catalogo",
            prezzo: m.prodotto?.prezzoIndicativoMin ?? null,
          }))}
        />

        <Colonna
          titolo="Multisplit"
          sottotitolo="1 unità esterna per tutta la casa"
          attiva={sistemaCentralizzato.tipo === "vrf"}
          prezzo={multi.prezzoTotale}
          righe={[
            ...multi.interne.map((i) => ({
              testo: i.ambiente || "Ambiente",
              dettaglio: i.prodotto ? `${i.prodotto.modello.replace(/^ML /, "")} · ${formattaKw(i.prodotto.potenzaKw)}` : "nessuna unità interna a catalogo",
              prezzo: i.prodotto?.prezzoIndicativoMin ?? null,
            })),
            multi.esterna
              ? {
                  testo: "Unità esterna",
                  dettaglio: `${multi.esterna.modello} · ${formattaKw(multi.esterna.potenzaKw)} · fino a ${multi.esterna.maxUnitaInterne} interne`,
                  prezzo: multi.esterna.prezzoIndicativoMin,
                  evidenzia: true,
                }
              : {
                  testo: "Unità esterna",
                  dettaglio:
                    multi.motivoIndisponibilita === "attacchi"
                      ? `nessuna unità esterna collega ${numeroAmbienti} ambienti: il massimo a catalogo è 5`
                      : "nessuna unità esterna copre questa potenza",
                  prezzo: null,
                  evidenzia: true,
                },
          ]}
        />
      </div>

      {confrontabili ? (
        <p className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg p-2.5">
          Il multisplit costa{" "}
          <span className="font-semibold">
            {differenzaPrezzo === 0
              ? "quanto il monosplit"
              : `${formattaEuro(Math.abs(differenzaPrezzo))} ${differenzaPrezzo < 0 ? "in meno" : "in più"}`}
          </span>{" "}
          e toglie <span className="font-semibold">{motoriRisparmiati}</span>{" "}
          {motoriRisparmiati === 1 ? "unità esterna" : "unità esterne"} dalla facciata. In compenso un guasto
          all'unità esterna ferma tutti gli ambienti insieme, mentre con i monosplit resta fermo solo quello.
          L'unità esterna del multisplit è dimensionata su {formattaKw(fabbisognoEdificioKw)}, cioè sul carico
          dell'ora peggiore e non sulla somma dei picchi dei singoli ambienti.
        </p>
      ) : (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
          Le due configurazioni non sono confrontabili con il catalogo attuale: manca una macchina per almeno una
          delle due strade. I dettagli sono nelle colonne qui sopra.
        </p>
      )}
    </div>
  );
}

function Colonna({ titolo, sottotitolo, attiva, prezzo, righe }) {
  return (
    <div className={`rounded-lg border-2 p-3 bg-white ${attiva ? "border-brand-400" : "border-slate-200"}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-semibold text-slate-800 text-sm">{titolo}</span>
        {attiva && <span className="text-[10px] font-semibold text-brand-700 uppercase tracking-wide">selezionato</span>}
      </div>
      <p className="text-[11px] text-slate-400">{sottotitolo}</p>

      <ul className="mt-2 space-y-0.5 text-[11px] text-slate-600">
        {righe.map((r, i) => (
          <li key={i} className={`flex justify-between gap-2 ${r.evidenzia ? "pt-1 mt-1 border-t border-slate-100" : ""}`}>
            <span className="min-w-0">
              <span className="font-medium text-slate-700">{r.testo}</span>
              <span className="block text-slate-400 leading-tight">{r.dettaglio}</span>
            </span>
            <span className="tabular-nums shrink-0">{r.prezzo != null ? formattaEuro(r.prezzo) : "—"}</span>
          </li>
        ))}
      </ul>

      <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-baseline">
        <span className="text-[11px] text-slate-500">Totale materiale</span>
        <span className="text-base font-extrabold text-brand-700 tabular-nums">
          {prezzo != null ? formattaEuro(prezzo) : "—"}
        </span>
      </div>
    </div>
  );
}
