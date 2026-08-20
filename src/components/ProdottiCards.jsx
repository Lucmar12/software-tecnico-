import React from "react";
import { trovaProdottiConsigliati } from "../data/catalogo.js";
import { confrontaClassiEnergetiche } from "../data/calculations.js";
import { formattaEuro } from "../utils/export.js";
import { PREZZO_KWH_ELETTRICO } from "../utils/prezziEnergia.js";
import { calcolaDetrazioneStimata, ALIQUOTA_ECOBONUS_DEFAULT } from "../utils/incentivi.js";

/** Maggiorazione indicativa per stimare il prezzo "chiavi in mano" (unità + installazione) a partire dal solo prezzo del prodotto — PLACEHOLDER, la manodopera reale va sempre quotata a parte. */
const MAGGIORAZIONE_INSTALLAZIONE_PCT = 30;

/**
 * Card prodotto grandi e visive (modalità Venditore): prezzo in vista,
 * badge "Consigliato" sul primo prodotto, differenza di costo in
 * bolletta tra classi energetiche, stima prezzo chiavi in mano con
 * Ecobonus.
 */
export default function ProdottiCards({ fabbisognoKw, oreFunzionamento, tipo = "climatizzatore_split", numeroUnitaRichieste = null, selezionati, onToggleSelezione }) {
  const { consigliati, messaggio } = trovaProdottiConsigliati(fabbisognoKw, tipo, numeroUnitaRichieste);

  if (messaggio) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 text-sm text-slate-500 text-center">
        {messaggio}
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {consigliati.map((p, i) => {
        const confronto = confrontaClassiEnergetiche(fabbisognoKw, oreFunzionamento, "riscaldamento");
        const costoQuestaClasse = confronto.find((c) => c.classe === p.classeEnergetica)?.kWhAnno * PREZZO_KWH_ELETTRICO;
        const costoClasseA = confronto.find((c) => c.classe === "A")?.kWhAnno * PREZZO_KWH_ELETTRICO;
        const risparmio = costoClasseA - costoQuestaClasse;
        const selezionato = selezionati.includes(`${p.marchio}|${p.modello}`);

        const prezzoInstallatoMax = p.prezzoIndicativoMax * (1 + MAGGIORAZIONE_INSTALLAZIONE_PCT / 100);
        const { detrazioneStimata, prezzoNettoStimato } = calcolaDetrazioneStimata(prezzoInstallatoMax);

        return (
          <div
            key={`${p.marchio}-${p.modello}`}
            className={`relative bg-white border rounded-2xl p-4 flex flex-col gap-2 shadow-sm ${
              i === 0 ? "border-brand-400 ring-2 ring-brand-100" : "border-slate-200"
            }`}
          >
            {i === 0 && (
              <span className="absolute -top-2.5 left-4 bg-brand-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                Consigliato
              </span>
            )}
            <div className="text-xs text-slate-400">{p.marchio}</div>
            <div className="font-bold text-slate-800 text-lg">{p.modello}</div>
            <div className="text-sm text-slate-500">
              {p.potenzaKw} kW{p.potenzaBtu ? ` (${p.potenzaBtu.toLocaleString("it-IT")} BTU/h)` : ""} · classe{" "}
              <span className="font-semibold text-emerald-600">{p.classeEnergetica}</span>
            </div>
            <div className="text-2xl font-extrabold text-brand-700">
              {formattaEuro(p.prezzoIndicativoMin)}
              <span className="text-sm font-normal text-slate-400"> – {formattaEuro(p.prezzoIndicativoMax)}</span>
            </div>
            <div className="text-[11px] text-slate-400">Prezzo indicativo unità, IVA escl. — PLACEHOLDER</div>
            {p.schedaTecnicaUrl && (
              <a href={p.schedaTecnicaUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 underline w-fit">
                Scheda tecnica ↗
              </a>
            )}

            <div className="mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Stima chiavi in mano (+{MAGGIORAZIONE_INSTALLAZIONE_PCT}% installazione)</span>
                <span className="font-semibold">{formattaEuro(prezzoInstallatoMax)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Con Ecobonus {ALIQUOTA_ECOBONUS_DEFAULT}%</span>
                <span className="font-semibold">− {formattaEuro(detrazioneStimata)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-800">
                <span>Netto stimato cliente</span>
                <span>{formattaEuro(prezzoNettoStimato)}</span>
              </div>
              <p className="text-[10px] text-slate-400 pt-0.5">
                Stime indicative (installazione, Ecobonus {ALIQUOTA_ECOBONUS_DEFAULT}%) — da verificare caso per caso,
                non sono un preventivo vincolante.
              </p>
            </div>

            {risparmio > 5 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 text-xs text-emerald-800">
                Fino a <strong>{formattaEuro(risparmio)}/anno</strong> in meno rispetto a un modello in classe A, a
                parità di fabbisogno.
              </div>
            )}

            <label className="mt-2 flex items-center gap-2 text-sm no-print">
              <input
                type="checkbox"
                checked={selezionato}
                onChange={() => onToggleSelezione(p)}
                className="h-4 w-4"
              />
              Includi nel preventivo
            </label>
          </div>
        );
      })}
    </div>
  );
}
