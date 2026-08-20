import React from "react";
import { BRANDING_FISSO } from "../utils/brandingFisso.js";

/**
 * Header applicativo: branding fisso (nome, logo) — non modificabile
 * dall'interfaccia, sempre quello dell'agente che distribuisce il
 * software. Nessun selettore di modalità: l'app è un'unica pagina, con
 * lo stesso input completo e lo stesso output per chiunque la usi.
 */
export default function Header() {
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
      </div>
    </header>
  );
}
