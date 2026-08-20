import React from "react";

const inputCls = "mt-1 w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400";

/** Pannello opzionale per valutare l'integrazione del bollitore con un impianto solare termico, che riduce il fabbisogno energetico annuo residuo. */
export default function SolareTermicoPanel({ solareTermico, onChange }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <label className="flex items-center gap-2 font-semibold text-slate-800">
        <input
          type="checkbox"
          checked={solareTermico.attivo}
          onChange={(e) => onChange({ ...solareTermico, attivo: e.target.checked })}
          className="h-4 w-4"
        />
        Valuta l'integrazione con solare termico per l'ACS
      </label>
      <p className="text-xs text-slate-500">
        Riduce il fabbisogno energetico annuo residuo del bollitore in base a una copertura solare convenzionale
        indicativa per l'area centro Italia/Umbria — non sostituisce un calcolo di producibilità puntuale.
      </p>
      {solareTermico.attivo && (
        <label className="block max-w-xs">
          <span className="text-xs font-medium text-slate-500">Copertura solare attesa del fabbisogno ACS [%]</span>
          <input
            type="number"
            min="0"
            max="90"
            className={inputCls}
            value={solareTermico.coperturaPct}
            onChange={(e) => onChange({ ...solareTermico, coperturaPct: Number(e.target.value) })}
          />
        </label>
      )}
    </div>
  );
}
