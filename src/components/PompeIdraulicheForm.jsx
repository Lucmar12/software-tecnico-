import React from "react";
import { PRESSIONE_RESIDUA_MINIMA_BAR_DEFAULT, PERDITE_CARICO_PCT_DEFAULT, CONSUMO_LITRI_PERSONA_GIORNO_DEFAULT } from "../utils/pompeIdrauliche.js";

const inputCls = "mt-1 w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400";

/**
 * Input per il dimensionamento delle pompe idrauliche domestiche:
 * autoclave (sempre richiesta — portata di punta e prevalenza dalla
 * pressione residua minima UNI 9182), pompa di sollevamento e pompa di
 * circolazione (ricircolo ACS), entrambe attivabili solo se presenti
 * nell'impianto. Tutti i coefficienti di dettaglio (perdite di carico,
 * pressione residua) sono espliciti e sovrascrivibili.
 */
export default function PompeIdraulicheForm({ pompeIdrauliche, onChange }) {
  const autoclave = pompeIdrauliche.autoclave;
  const sollevamento = pompeIdrauliche.sollevamento;
  const circolazione = pompeIdrauliche.circolazione;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
      <h3 className="font-semibold text-slate-800">Pompe idrauliche</h3>

      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Autoclave (gruppo di pressurizzazione)</span>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Numero persone in abitazione</span>
            <input
              type="number"
              min="1"
              className={inputCls}
              value={autoclave.numeroPersone}
              onChange={(e) => onChange({ ...pompeIdrauliche, autoclave: { ...autoclave, numeroPersone: Number(e.target.value) } })}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Numero di piani serviti</span>
            <input
              type="number"
              min="1"
              className={inputCls}
              value={autoclave.numeroPiani}
              onChange={(e) => onChange({ ...pompeIdrauliche, autoclave: { ...autoclave, numeroPiani: Number(e.target.value) } })}
            />
          </label>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Pressione residua minima [bar]</span>
              <input
                type="number"
                step="0.1"
                min="0.5"
                className={inputCls}
                value={autoclave.pressioneResiduaBar ?? PRESSIONE_RESIDUA_MINIMA_BAR_DEFAULT}
                onChange={(e) => onChange({ ...pompeIdrauliche, autoclave: { ...autoclave, pressioneResiduaBar: Number(e.target.value) } })}
              />
              <span className="text-[11px] text-slate-400">Default {PRESSIONE_RESIDUA_MINIMA_BAR_DEFAULT} bar (UNI 9182)</span>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Perdite di carico rete [%]</span>
              <input
                type="number"
                min="0"
                className={inputCls}
                value={autoclave.perditeCaricoPct ?? PERDITE_CARICO_PCT_DEFAULT}
                onChange={(e) => onChange({ ...pompeIdrauliche, autoclave: { ...autoclave, perditeCaricoPct: Number(e.target.value) } })}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Consumo idrico pro capite [l/persona/giorno]</span>
              <input
                type="number"
                min="1"
                className={inputCls}
                value={autoclave.consumoLitriPersonaGiorno ?? CONSUMO_LITRI_PERSONA_GIORNO_DEFAULT}
                onChange={(e) => onChange({ ...pompeIdrauliche, autoclave: { ...autoclave, consumoLitriPersonaGiorno: Number(e.target.value) } })}
              />
            </label>
        </div>
      </div>

      <ToggleSezione
        titolo="Pompa di sollevamento"
        descrizione="Da cisterna/pozzo o locale interrato verso la rete di distribuzione"
        attivo={sollevamento.attivo}
        onToggle={() => onChange({ ...pompeIdrauliche, sollevamento: { ...sollevamento, attivo: !sollevamento.attivo } })}
      >
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Dislivello geodetico [m]</span>
            <input
              type="number"
              min="0"
              className={inputCls}
              value={sollevamento.dislivelloM}
              onChange={(e) => onChange({ ...pompeIdrauliche, sollevamento: { ...sollevamento, dislivelloM: Number(e.target.value) } })}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Portata richiesta [m³/h]</span>
            <input
              type="number"
              step="0.1"
              min="0"
              className={inputCls}
              value={sollevamento.portataMc}
              onChange={(e) => onChange({ ...pompeIdrauliche, sollevamento: { ...sollevamento, portataMc: Number(e.target.value) } })}
            />
          </label>
        </div>
      </ToggleSezione>

      <ToggleSezione
        titolo="Pompa di circolazione (ricircolo ACS)"
        descrizione="Dimensionamento semplificato dalla lunghezza della rete di distribuzione ACS"
        attivo={circolazione.attivo}
        onToggle={() => onChange({ ...pompeIdrauliche, circolazione: { ...circolazione, attivo: !circolazione.attivo } })}
      >
        <label className="block max-w-xs">
          <span className="text-xs font-medium text-slate-500">Lunghezza tubazioni ricircolo [m]</span>
          <input
            type="number"
            min="0"
            className={inputCls}
            value={circolazione.lunghezzaTubazioniM}
            onChange={(e) => onChange({ ...pompeIdrauliche, circolazione: { ...circolazione, lunghezzaTubazioniM: Number(e.target.value) } })}
          />
        </label>
      </ToggleSezione>
    </div>
  );
}

function ToggleSezione({ titolo, descrizione, attivo, onToggle, children }) {
  return (
    <div className="pt-3 border-t border-slate-100 space-y-3">
      <button onClick={onToggle} className="w-full flex items-center gap-2 text-left">
        <span
          className={`h-5 w-5 rounded-md border-2 flex items-center justify-center text-white text-xs shrink-0 transition-colors duration-150 ${
            attivo ? "bg-brand-600 border-brand-600" : "border-slate-300"
          }`}
        >
          {attivo && "✓"}
        </span>
        <span>
          <span className="text-sm font-medium text-slate-800">{titolo}</span>
          <span className="block text-[11px] text-slate-400">{descrizione}</span>
        </span>
      </button>
      {attivo && children}
    </div>
  );
}
