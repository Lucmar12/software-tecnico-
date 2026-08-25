import React, { useState } from "react";
import AmbienteForm from "./AmbienteForm.jsx";
import { nuovoAmbiente } from "../utils/modelli.js";
import { ambienteValido } from "../utils/validazione.js";
import { ETICHETTE_TIPO_LOCALE } from "../data/calculations.js";

const ETICHETTE_PIANO = {
  terra: "piano terra",
  intermedio: "piano intermedio",
  ultimo: "ultimo piano",
};

/** Riga di riepilogo di un ambiente chiuso: i dati che lo rendono riconoscibile a colpo d'occhio. */
function riassunto(ambiente) {
  const piano = ambiente.ultimoPiano ? "ultimo" : ambiente.pianoTerra ? "terra" : "intermedio";
  const pareti = ambiente.paretiEsterne ?? 1;
  return [
    `${ambiente.superficiePavimento} m²`,
    ETICHETTE_TIPO_LOCALE[ambiente.tipoLocale] || ETICHETTE_TIPO_LOCALE.altro,
    ETICHETTE_PIANO[piano],
    `${pareti} ${pareti === 1 ? "parete esterna" : "pareti esterne"}`,
  ].join(" · ");
}

/**
 * Gestione della lista di ambienti di uno scenario: aggiunta, modifica,
 * rimozione.
 *
 * Gli ambienti già compilati correttamente vengono chiusi in una riga di
 * riepilogo, così che una casa da sei locali resti leggibile invece di
 * diventare una colonna di sessanta campi. Un ambiente con errori è
 * sempre mostrato aperto: la correzione non deve mai restare nascosta
 * dietro un click.
 */
export default function AmbientiList({ ambienti, onChange }) {
  // Con un solo ambiente non c'è niente da riassumere: si parte aperti.
  const [apertiIds, setApertiIds] = useState(() => (ambienti.length <= 1 ? ambienti.map((a) => a.id) : []));

  function aggiornaAmbiente(id, ambienteAggiornato) {
    onChange(ambienti.map((a) => (a.id === id ? ambienteAggiornato : a)));
  }

  function rimuoviAmbiente(id) {
    onChange(ambienti.filter((a) => a.id !== id));
    setApertiIds(apertiIds.filter((x) => x !== id));
  }

  function aggiungiAmbiente() {
    const ambiente = nuovoAmbiente({ nome: `Ambiente ${ambienti.length + 1}` });
    onChange([...ambienti, ambiente]);
    setApertiIds([...apertiIds, ambiente.id]);
  }

  function toggle(id) {
    setApertiIds(apertiIds.includes(id) ? apertiIds.filter((x) => x !== id) : [...apertiIds, id]);
  }

  return (
    <div className="space-y-3">
      {ambienti.map((a) => {
        const valido = ambienteValido(a);
        // Un ambiente da correggere resta sempre visibile per intero.
        const aperto = apertiIds.includes(a.id) || !valido;

        if (aperto) {
          return (
            <div key={a.id}>
              {valido && (
                <button
                  onClick={() => toggle(a.id)}
                  className="w-full text-right text-[11px] text-slate-400 hover:text-brand-600 pb-1 focus:outline-none"
                >
                  Chiudi ▲
                </button>
              )}
              <AmbienteForm
                ambiente={a}
                onChange={(agg) => aggiornaAmbiente(a.id, agg)}
                onRemove={() => rimuoviAmbiente(a.id)}
              />
            </div>
          );
        }

        return (
          <button
            key={a.id}
            onClick={() => toggle(a.id)}
            className="w-full flex items-center justify-between gap-3 text-left bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-brand-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <span className="min-w-0">
              <span className="block font-semibold text-slate-800 text-sm truncate">{a.nome}</span>
              <span className="block text-xs text-slate-400 truncate">{riassunto(a)}</span>
            </span>
            <span className="text-xs text-brand-700 shrink-0">Modifica ▼</span>
          </button>
        );
      })}
      <button
        onClick={aggiungiAmbiente}
        className="w-full border-2 border-dashed border-slate-300 rounded-xl py-3 text-sm font-medium text-slate-500 hover:border-brand-400 hover:text-brand-600 transition focus:outline-none focus:ring-2 focus:ring-brand-400"
      >
        + Aggiungi ambiente
      </button>
    </div>
  );
}
