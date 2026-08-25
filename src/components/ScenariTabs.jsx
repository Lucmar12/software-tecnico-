import React, { useState } from "react";
import { nuovoScenario, cloneScenario } from "../utils/modelli.js";

/**
 * Gestione di più situazioni a confronto sullo stesso edificio — es.
 * "com'è oggi" vs. "dopo il cappotto": stessi ambienti, epoche
 * costruttive/trasmittanze diverse.
 *
 * Quando le situazioni sono più di una, l'utente deve indicare quale va
 * preventivata: sono alternative che si escludono a vicenda, e proporre
 * un prodotto per ciascuna riporterebbe chi legge a un confronto invece
 * che a una scelta. Con una sola situazione il selettore non compare —
 * chi non usa i confronti non deve nemmeno accorgersi che esistono.
 */
export default function ScenariTabs({
  scenari,
  scenarioAttivoId,
  scenarioProgettoId,
  onCambiaScenario,
  onCambiaScenarioProgetto,
  onAggiornaScenari,
}) {
  const [nuovoNome, setNuovoNome] = useState("");
  const piuScenari = scenari.length > 1;

  function aggiungiScenario() {
    const s = nuovoScenario(`Situazione ${scenari.length + 1}`);
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
    if (scenarioProgettoId === id) onCambiaScenarioProgetto(rimanenti[0].id);
  }

  const attivo = scenari.find((s) => s.id === scenarioAttivoId);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 items-stretch">
        {scenari.map((s) => {
          const daPreventivare = s.id === scenarioProgettoId;
          return (
            <div
              key={s.id}
              className={`rounded-lg border px-2 py-1 text-sm ${
                s.id === scenarioAttivoId ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-1">
                <button onClick={() => onCambiaScenario(s.id)} className="font-medium">
                  <input
                    value={s.nome}
                    onChange={(e) => rinominaScenario(s.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent border-none focus:outline-none w-44"
                  />
                </button>
                {piuScenari && (
                  <button onClick={() => rimuoviScenario(s.id)} className="text-red-400 hover:text-red-600 text-xs">
                    ✕
                  </button>
                )}
              </div>
              {piuScenari && (
                <label className="flex items-center gap-1.5 text-[11px] cursor-pointer pt-1 mt-1 border-t border-slate-100">
                  <input
                    type="radio"
                    name="scenario-da-preventivare"
                    checked={daPreventivare}
                    onChange={() => onCambiaScenarioProgetto(s.id)}
                  />
                  <span className={daPreventivare ? "font-semibold text-brand-700" : "text-slate-500"}>
                    {daPreventivare ? "È questa che voglio realizzare" : "Scegli questa"}
                  </span>
                </label>
              )}
            </div>
          );
        })}
        <button
          onClick={aggiungiScenario}
          className="text-sm px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-brand-400 hover:text-brand-600"
        >
          + Aggiungi una situazione da confrontare
        </button>
        {attivo && (
          <button
            onClick={() => duplicaScenario(attivo)}
            className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-500 hover:border-brand-400 hover:text-brand-600"
          >
            Copia questa e modificala (es. dopo i lavori)
          </button>
        )}
      </div>
      {piuScenari && (
        <p className="text-xs text-slate-500">
          Stai confrontando più situazioni. Il calcolo viene mostrato per tutte, ma il prodotto consigliato e il
          preventivo riguardano solo quella che hai indicato come <span className="font-semibold">"È questa che voglio realizzare"</span>.
        </p>
      )}
    </div>
  );
}
