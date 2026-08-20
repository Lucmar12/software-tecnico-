import React from "react";

const inputCls = "mt-1 w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400";

/** Pannello opzionale per valutare la copertura, tramite fotovoltaico, dei consumi elettrici dell'impianto di climatizzazione dimensionato. */
export default function FotovoltaicoPanel({ fotovoltaico, onChange }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <label className="flex items-center gap-2 font-semibold text-slate-800">
        <input
          type="checkbox"
          checked={fotovoltaico.attivo}
          onChange={(e) => onChange({ ...fotovoltaico, attivo: e.target.checked })}
          className="h-4 w-4"
        />
        Valuta la copertura dei consumi con un impianto fotovoltaico
      </label>
      <p className="text-xs text-slate-500">
        Stima quanto un impianto FV della taglia indicata copre i consumi elettrici annui dell'impianto di
        climatizzazione, con producibilità media indicativa per l'area geografica — non sostituisce un calcolo di
        producibilità puntuale (orientamento, inclinazione, ombreggiamenti reali).
      </p>
      {fotovoltaico.attivo && (
        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Taglia impianto FV [kWp]</span>
            <input
              type="number"
              step="0.5"
              className={inputCls}
              value={fotovoltaico.kWp}
              onChange={(e) => onChange({ ...fotovoltaico, kWp: Number(e.target.value) })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm pb-1.5">
            <input
              type="checkbox"
              checked={fotovoltaico.conAccumulo}
              onChange={(e) => onChange({ ...fotovoltaico, conAccumulo: e.target.checked })}
              className="h-4 w-4"
            />
            Con sistema di accumulo (batteria)
          </label>
        </div>
      )}
    </div>
  );
}
