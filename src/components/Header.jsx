import React from "react";
import { BRANDING_FISSO } from "../utils/brandingFisso.js";

/**
 * Header applicativo: branding fisso (nome, logo) — non modificabile
 * dall'interfaccia, sempre quello dell'agente che distribuisce il
 * software — e selettore di modalità Ingegnere/Venditore, sempre
 * raggiungibile senza perdita dei dati inseriti.
 */
export default function Header({ modalita, onCambiaModalita }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={BRANDING_FISSO.logoUrl}
            alt={BRANDING_FISSO.nomeAzienda}
            className="h-9 w-9 rounded object-contain bg-slate-50 border border-slate-200"
          />
          <div className="text-left min-w-0">
            <div className="font-semibold text-slate-800 truncate">{BRANDING_FISSO.nomeAzienda}</div>
            <div className="text-xs text-slate-400">Dimensionamento impianti di climatizzazione</div>
          </div>
        </div>

        {modalita && (
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 text-sm">
            <button
              onClick={() => onCambiaModalita("ingegnere")}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                modalita === "ingegnere" ? "bg-white shadow text-brand-700" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Ingegnere / Tecnico
            </button>
            <button
              onClick={() => onCambiaModalita("venditore")}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                modalita === "venditore" ? "bg-white shadow text-brand-700" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Venditore / Installatore
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
