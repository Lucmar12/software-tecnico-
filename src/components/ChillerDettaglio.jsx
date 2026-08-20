import React from "react";
import CatalogoTabella from "./CatalogoTabella.jsx";
import { calcolaDimensionamentoChiller } from "../utils/chiller.js";
import { formattaKw } from "../utils/export.js";

/** Dettaglio del dimensionamento di un impianto centralizzato a chiller con distribuzione ad acqua, derating per temperatura esterna di progetto e catalogo tecnico dedicato. Con `compatto` mostra solo l'esito finale, senza i passaggi tecnici intermedi. */
export default function ChillerDettaglio({ risultatiAmbienti, sistemaCentralizzato, comune, mostraCatalogo = true, compatto = false }) {
  if (sistemaCentralizzato.tipo !== "chiller" || risultatiAmbienti.length < 2) return null;
  const d = calcolaDimensionamentoChiller(risultatiAmbienti, sistemaCentralizzato, comune?.teInv);

  if (compatto) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-slate-800">Impianto centralizzato a chiller</h3>
        <div className="text-sm text-slate-600">
          {d.numeroTerminali} terminali serviti da un chiller da{" "}
          <strong className="text-slate-800">{formattaKw(comune ? d.potenzaNominaleRichiestaKw : d.potenzaRichiestaKw)}</strong>.
        </div>
        {mostraCatalogo && <CatalogoTabella fabbisognoKw={comune ? d.potenzaNominaleRichiestaKw : d.potenzaRichiestaKw} tipo="chiller" />}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-slate-800">Dimensionamento impianto centralizzato a chiller</h3>
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
        Il fattore di contemporaneità è un valore convenzionale indicativo per un pre-dimensionamento speditivo:
        perdite di carico della rete idraulica, scelta delle pompe di circolazione e bilanciamento dei circuiti
        restano oggetto della progettazione idraulica esecutiva.
      </p>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <Riga label="Terminali serviti (ventilconvettori/pannelli)" value={d.numeroTerminali} />
        <Riga label="Somma fabbisogni ambienti" value={formattaKw(d.sommaFabbisogniKw)} />
        <Riga label="Fattore di contemporaneità" value={`× ${d.fattoreContemporaneita}`} />
        <Riga label="Potenza richiesta (a condizioni reali)" value={<strong>{formattaKw(d.potenzaRichiestaKw)}</strong>} />
        {comune && (
          <>
            <Riga
              label="Fattore di derating per temperatura esterna"
              value={`× ${d.fattoreDeratingTemperatura.toFixed(2)}`}
              nota={`a ${comune.teInv}°C, chiller aria-refrigerato, rispetto al punto di prova standard +7°C`}
            />
            <Riga label="Potenza nominale richiesta (punto di prova +7°C)" value={<strong>{formattaKw(d.potenzaNominaleRichiestaKw)}</strong>} />
          </>
        )}
      </div>
      {mostraCatalogo && <CatalogoTabella fabbisognoKw={comune ? d.potenzaNominaleRichiestaKw : d.potenzaRichiestaKw} tipo="chiller" />}
    </div>
  );
}

function Riga({ label, value, nota }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1">
      <span className="text-slate-500">
        {label}
        {nota && <span className="block text-[11px] text-slate-400">{nota}</span>}
      </span>
      <span className="font-medium text-slate-800 shrink-0 ml-3 text-right tabular-nums">{value}</span>
    </div>
  );
}
