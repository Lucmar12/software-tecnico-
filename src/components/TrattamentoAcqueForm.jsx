import React from "react";
import {
  DUREZZA_INGRESSO_DEFAULT_GF,
  DUREZZA_RESIDUA_DEFAULT_GF,
  CONSUMO_LITRI_PERSONA_GIORNO_DEFAULT,
  AUTONOMIA_GIORNI_DEFAULT,
} from "../utils/addolcitore.js";

const inputCls = "mt-1 w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400";

/**
 * Input per il dimensionamento dell'addolcitore a scambio ionico: durezza
 * dell'acqua in ingresso (°fH), numero persone/consumo idrico e durezza
 * residua obiettivo. In modalità Venditore la durezza in ingresso, il
 * consumo pro capite e l'autonomia tra rigenerazioni restano ai valori
 * convenzionali di default (dichiarati come stima); in modalità Ingegnere
 * sono tutti sovrascrivibili.
 */
export default function TrattamentoAcqueForm({ trattamentoAcque, onChange, modalita }) {
  const isIngegnere = modalita === "ingegnere";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-slate-800">Trattamento acque — addolcitore</h3>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Numero persone in abitazione</span>
          <input
            type="number"
            min="1"
            className={inputCls}
            value={trattamentoAcque.numeroPersone}
            onChange={(e) => onChange({ ...trattamentoAcque, numeroPersone: Number(e.target.value) })}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Durezza acqua in ingresso [°fH]</span>
          <input
            type="number"
            min="0"
            className={inputCls}
            value={trattamentoAcque.durezzaIngressoGf ?? DUREZZA_INGRESSO_DEFAULT_GF}
            onChange={(e) => onChange({ ...trattamentoAcque, durezzaIngressoGf: Number(e.target.value) })}
          />
          <span className="text-[11px] text-slate-400">
            {isIngegnere ? "Da analisi puntuale o dato del gestore idrico — default indicativo Umbria" : `Default ${DUREZZA_INGRESSO_DEFAULT_GF} °fH (stima media Umbria) — da verificare`}
          </span>
        </label>
      </div>

      {!isIngegnere && (
        <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
          Consumo idrico pro capite ({CONSUMO_LITRI_PERSONA_GIORNO_DEFAULT} l/persona/giorno), durezza residua
          obiettivo ({DUREZZA_RESIDUA_DEFAULT_GF} °fH) e autonomia tra rigenerazioni ({AUTONOMIA_GIORNI_DEFAULT} giorni)
          calcolati con valori convenzionali di default — modificabili passando alla modalità Ingegnere.
        </p>
      )}
      {isIngegnere && (
        <div className="grid sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Durezza residua obiettivo [°fH]</span>
            <input
              type="number"
              min="0"
              className={inputCls}
              value={trattamentoAcque.durezzaResiduaGf ?? DUREZZA_RESIDUA_DEFAULT_GF}
              onChange={(e) => onChange({ ...trattamentoAcque, durezzaResiduaGf: Number(e.target.value) })}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Consumo idrico pro capite [l/persona/giorno]</span>
            <input
              type="number"
              min="1"
              className={inputCls}
              value={trattamentoAcque.consumoLitriPersonaGiorno ?? CONSUMO_LITRI_PERSONA_GIORNO_DEFAULT}
              onChange={(e) => onChange({ ...trattamentoAcque, consumoLitriPersonaGiorno: Number(e.target.value) })}
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Autonomia target tra rigenerazioni [giorni]</span>
            <input
              type="number"
              min="1"
              className={inputCls}
              value={trattamentoAcque.autonomiaGiorniTarget ?? AUTONOMIA_GIORNI_DEFAULT}
              onChange={(e) => onChange({ ...trattamentoAcque, autonomiaGiorniTarget: Number(e.target.value) })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
