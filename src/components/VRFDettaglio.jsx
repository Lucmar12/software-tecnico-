import React from "react";
import CatalogoTabella from "./CatalogoTabella.jsx";
import { calcolaDimensionamentoVRF } from "../utils/vrf.js";
import { formattaKw } from "../utils/export.js";

/** Dettaglio del dimensionamento di un sistema VRF/multi-split centralizzato, con derating per tubazioni/dislivello, derating per temperatura esterna di progetto e catalogo tecnico dedicato. Con `compatto` mostra solo l'esito finale, senza i passaggi tecnici intermedi. */
export default function VRFDettaglio({ risultatiAmbienti, sistemaCentralizzato, comune, mostraCatalogo = true, compatto = false }) {
  if (sistemaCentralizzato.tipo !== "vrf" || risultatiAmbienti.length < 2) return null;
  const d = calcolaDimensionamentoVRF(risultatiAmbienti, sistemaCentralizzato, comune?.teInv);

  if (compatto) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-slate-800">Sistema VRF/multi-split centralizzato</h3>
        <div className="text-sm text-slate-600">
          {d.numeroUnitaInterne} unità interne servite da un'unica unità esterna da{" "}
          <strong className="text-slate-800">{formattaKw(comune ? d.potenzaNominaleRichiestaKw : d.potenzaRichiestaUnitaEsternaKw)}</strong>.
        </div>
        {mostraCatalogo && (
          <CatalogoTabella
            fabbisognoKw={comune ? d.potenzaNominaleRichiestaKw : d.potenzaRichiestaUnitaEsternaKw}
            tipo="vrf"
            numeroUnitaRichieste={d.numeroUnitaInterne}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-slate-800">Dimensionamento sistema VRF/multi-split centralizzato</h3>
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
        Fattore di contemporaneità e derating sono valori convenzionali indicativi per un pre-dimensionamento
        speditivo: verificare sempre le curve reali del produttore/modello selezionato in fase esecutiva.
      </p>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <Riga label="Unità interne collegate" value={d.numeroUnitaInterne} />
        <Riga label="Somma fabbisogni ambienti" value={formattaKw(d.sommaFabbisogniKw)} />
        <Riga label="Fattore di contemporaneità" value={`× ${d.fattoreContemporaneita}`} />
        <Riga label="Potenza con contemporaneità" value={formattaKw(d.potenzaConContemporaneitaKw)} />
        <Riga label="Lunghezza tubazioni equivalente" value={`${d.lunghezzaEquivalenteM} m`} />
        <Riga label="Dislivello" value={`${d.dislivelloM} m`} />
        <Riga label="Fattore di derating tubazioni/dislivello" value={`× ${d.fattoreDeratingTubazioni.toFixed(2)}`} />
        <Riga label="Potenza richiesta unità esterna (a condizioni reali)" value={<strong>{formattaKw(d.potenzaRichiestaUnitaEsternaKw)}</strong>} />
        {comune && (
          <>
            <Riga
              label="Fattore di derating per temperatura esterna"
              value={`× ${d.fattoreDeratingTemperatura.toFixed(2)}`}
              nota={`a ${comune.teInv}°C, rispetto al punto di prova standard +7°C`}
            />
            <Riga label="Potenza nominale richiesta (punto di prova +7°C)" value={<strong>{formattaKw(d.potenzaNominaleRichiestaKw)}</strong>} />
          </>
        )}
      </div>
      {d.derateSignificativo && (
        <p className="text-xs text-amber-700">
          Il derating complessivo stimato è significativo: con tubazioni molto lunghe, dislivelli elevati o
          temperature esterne di progetto molto basse valutare la suddivisione in più unità esterne o un modello con
          maggiore capacità a bassa temperatura.
        </p>
      )}
      {mostraCatalogo && (
        <CatalogoTabella
          fabbisognoKw={comune ? d.potenzaNominaleRichiestaKw : d.potenzaRichiestaUnitaEsternaKw}
          tipo="vrf"
          numeroUnitaRichieste={d.numeroUnitaInterne}
        />
      )}
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
