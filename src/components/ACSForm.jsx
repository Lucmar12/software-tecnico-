import React from "react";
import { ETICHETTE_ABITUDINE_ACS, LITRI_ACS_PER_PERSONA } from "../data/calculations.js";
import { TEMPO_RICARICA_DEFAULT_ORE, COP_ACS_DEFAULT } from "../utils/pompaDiCaloreAcs.js";

const inputCls = "mt-1 w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400";

const OPZIONI_GENERATORE = [
  { value: "elettrico", label: "Bollitore elettrico tradizionale (resistenza)" },
  { value: "pompa_di_calore_integrata", label: "Scaldacqua a pompa di calore (accumulo + PdC integrati)" },
  { value: "pompa_di_calore_dedicata", label: "Bollitore con pompa di calore aria-acqua dedicata" },
];

/**
 * Input per il dimensionamento della produzione ACS: numero occupanti e
 * abitudine di consumo (UNI 9182, capacità di accumulo), più il tipo di
 * generatore. Se il generatore è una pompa di calore (integrata nello
 * scaldacqua o dedicata e abbinata a un accumulo puro), richiede anche il
 * tempo di ricarica desiderato e il COP di riferimento, necessari per
 * calcolare la potenza [kW] della macchina — non è solo una scelta di
 * capacità in litri.
 */
export default function ACSForm({ acs, onChange }) {
  const generatore = acs.generatore || "elettrico";
  const isPompaDiCalore = generatore !== "elettrico";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-slate-800">Acqua calda sanitaria (ACS)</h3>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Numero persone in abitazione</span>
          <input
            type="number"
            min="1"
            className={inputCls}
            value={acs.numeroPersone}
            onChange={(e) => onChange({ ...acs, numeroPersone: Number(e.target.value) })}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Abitudine di consumo</span>
          <select className={inputCls} value={acs.abitudine} onChange={(e) => onChange({ ...acs, abitudine: e.target.value })}>
            {Object.keys(LITRI_ACS_PER_PERSONA).map((k) => (
              <option key={k} value={k}>
                {ETICHETTE_ABITUDINE_ACS[k]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block pt-2 border-t border-slate-100">
        <span className="text-xs font-medium text-slate-500">Generatore</span>
        <select className={inputCls} value={generatore} onChange={(e) => onChange({ ...acs, generatore: e.target.value })}>
          {OPZIONI_GENERATORE.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {isPompaDiCalore && (
        <div className="grid sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Tempo di ricarica desiderato [h]</span>
            <input
              type="number"
              min="1"
              className={inputCls}
              value={acs.tempoRicaricaOre ?? TEMPO_RICARICA_DEFAULT_ORE}
              onChange={(e) => onChange({ ...acs, tempoRicaricaOre: Number(e.target.value) })}
            />
            <span className="text-[11px] text-slate-400">Tipicamente nelle ore di minor prelievo (es. notturne)</span>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">COP di riferimento</span>
            <input
              type="number"
              step="0.1"
              min="1"
              className={inputCls}
              value={acs.cop ?? COP_ACS_DEFAULT}
              onChange={(e) => onChange({ ...acs, cop: Number(e.target.value) })}
            />
            <span className="text-[11px] text-slate-400">Default {COP_ACS_DEFAULT} (punto di prova convenzionale)</span>
          </label>
        </div>
      )}
    </div>
  );
}
