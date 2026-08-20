import React, { useState } from "react";
import { elencaProgetti, salvaProgetto, eliminaProgetto } from "../utils/persistenza.js";

/**
 * Pannello di gestione progetti salvati localmente sul dispositivo
 * (localStorage): salva lo stato corrente con un nome, richiama o
 * elimina progetti già salvati. Non sincronizza tra dispositivi diversi.
 */
export default function ProgettiPanel({ statoCorrente, progettoAttivoId, onCarica, onSalvatoConSuccesso }) {
  const [aperto, setAperto] = useState(false);
  const [nomeNuovo, setNomeNuovo] = useState("");
  const [progetti, setProgetti] = useState(() => elencaProgetti());
  const [messaggio, setMessaggio] = useState("");

  function aggiorna() {
    setProgetti(elencaProgetti());
  }

  function handleSalva() {
    if (!nomeNuovo.trim()) return;
    const id = salvaProgetto(nomeNuovo.trim(), statoCorrente, progettoAttivoId);
    if (id) {
      setNomeNuovo("");
      aggiorna();
      setMessaggio("Progetto salvato.");
      onSalvatoConSuccesso?.(id);
      setTimeout(() => setMessaggio(""), 2000);
    } else {
      setMessaggio("Spazio di archiviazione locale non disponibile (es. navigazione privata).");
    }
  }

  function handleElimina(id) {
    eliminaProgetto(id);
    aggiorna();
  }

  return (
    <div className="relative no-print">
      <button
        onClick={() => setAperto((v) => !v)}
        className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:border-brand-400 hover:text-brand-700 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400"
      >
        📁 Progetti salvati
      </button>
      {aperto && (
        <div className="absolute z-40 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-3 space-y-3">
          <div className="flex gap-2">
            <input
              className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 text-sm"
              placeholder="Nome progetto (es. Via Roma 12, Perugia)"
              value={nomeNuovo}
              onChange={(e) => setNomeNuovo(e.target.value)}
            />
            <button onClick={handleSalva} className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-400">
              Salva
            </button>
          </div>
          {messaggio && <p className="text-xs text-emerald-600">{messaggio}</p>}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {progetti.length === 0 && <p className="text-xs text-slate-400 py-2">Nessun progetto salvato su questo dispositivo.</p>}
            {progetti.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <button
                  className="text-left flex-1 min-w-0 rounded-md hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 -mx-1 px-1"
                  onClick={() => {
                    onCarica(p);
                    setAperto(false);
                  }}
                >
                  <div className="font-medium text-slate-800 truncate">{p.nome}</div>
                  <div className="text-[11px] text-slate-400">{new Date(p.salvatoIl).toLocaleString("it-IT")}</div>
                </button>
                <button
                  onClick={() => handleElimina(p.id)}
                  className="text-red-400 hover:text-red-600 text-xs shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 rounded"
                >
                  Elimina
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            I progetti sono salvati solo su questo dispositivo/browser, non sono sincronizzati altrove.
          </p>
        </div>
      )}
    </div>
  );
}
