import React from "react";

/**
 * Intestazione di sezione con badge numerato, usata per le fasi di input
 * (Comune, Ambienti, ACS, ecc.). Dà al form la percezione di un percorso
 * guidato in passi, non di un lungo elenco di card indistinte.
 */
export default function StepHeader({ numero, titolo, sottotitolo }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center justify-center h-7 w-7 rounded-full bg-brand-600 text-white text-sm font-bold shrink-0">
        {numero}
      </span>
      <div>
        <h2 className="font-bold text-slate-800 leading-tight">{titolo}</h2>
        {sottotitolo && <p className="text-xs text-slate-400 leading-tight">{sottotitolo}</p>}
      </div>
    </div>
  );
}
