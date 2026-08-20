import React, { useState } from "react";
import { nuovoScenario, cloneScenario } from "../utils/modelli.js";

/**
 * Gestione di più scenari a confronto sullo stesso edificio — es. "stato
 * di fatto" vs. "post-riqualificazione con cappotto": stessi ambienti,
 * epoche costruttive/trasmittanze diverse.
 */
export default function ScenariTabs({ scenari, scenarioAttivoId, onCambiaScenario, onAggiornaScenari }) {
  const [nuovoNome, setNuovoNome] = useState("");

  function aggiungiScenario() {
    const s = nuovoScenario(`Scenario ${scenari.length + 1}`);
    onAggiornaScenari([...scenari, s]);
    onCambiaScenario(s.id);
  }

  function duplicaScenario(scenario) {
    const nome = nuovoNome.trim() || `${scenario.nome} (copia)`;
    const s = cloneScenario(scenario, nome);
    onAggiornaScenari([...scenari, s]);
    onCambiaScenario(s.id);
    setNuovoNome("");
  }

  function rinominaScenario(id, nome) {
    onAggiornaScenari(scenari.map((s) => (s.id === id ? { ...s, nome } : s)));
  }

  function rimuoviScenario(id) {
    if (scenari.length <= 1) return;
    const rimanenti = scenari.filter((s) => s.id !== id);
    onAggiornaScenari(rimanenti);
    if (scenarioAttivoId === id) onCambiaScenario(rimanenti[0].id);
  }

  const attivo = scenari.find((s) => s.id === scenarioAttivoId);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-center">
        {scenari.map((s) => (
          <div
            key={s.id}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-sm ${
              s.id === scenarioAttivoId ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white"
            }`}
          >
            <button onClick={() => onCambiaScenario(s.id)} className="font-medium">
              <input
                value={s.nome}
                onChange={(e) => rinominaScenario(s.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="bg-transparent border-none focus:outline-none w-32"
              />
            </button>
            {scenari.length > 1 && (
              <button onClick={() => rimuoviScenario(s.id)} className="text-red-400 hover:text-red-600 text-xs">
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          onClick={aggiungiScenario}
          className="text-sm px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-brand-400 hover:text-brand-600"
        >
          + Nuovo scenario
        </button>
        {attivo && (
          <button
            onClick={() => duplicaScenario(attivo)}
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-500 hover:border-brand-400 hover:text-brand-600"
          >
            Duplica scenario corrente (es. post-riqualificazione)
          </button>
        )}
      </div>
    </div>
  );
}
