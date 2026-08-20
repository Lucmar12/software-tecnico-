import React from "react";
import AmbienteForm from "./AmbienteForm.jsx";
import { nuovoAmbiente } from "../utils/modelli.js";

/** Gestione della lista di ambienti di uno scenario: aggiunta, modifica, rimozione. */
export default function AmbientiList({ ambienti, onChange }) {
  function aggiornaAmbiente(id, ambienteAggiornato) {
    onChange(ambienti.map((a) => (a.id === id ? ambienteAggiornato : a)));
  }

  function rimuoviAmbiente(id) {
    onChange(ambienti.filter((a) => a.id !== id));
  }

  function aggiungiAmbiente() {
    onChange([...ambienti, nuovoAmbiente({ nome: `Ambiente ${ambienti.length + 1}` })]);
  }

  return (
    <div className="space-y-3">
      {ambienti.map((a) => (
        <AmbienteForm
          key={a.id}
          ambiente={a}
          onChange={(agg) => aggiornaAmbiente(a.id, agg)}
          onRemove={() => rimuoviAmbiente(a.id)}
        />
      ))}
      <button
        onClick={aggiungiAmbiente}
        className="w-full border-2 border-dashed border-slate-300 rounded-xl py-3 text-sm font-medium text-slate-500 hover:border-brand-400 hover:text-brand-600 transition focus:outline-none focus:ring-2 focus:ring-brand-400"
      >
        + Aggiungi ambiente
      </button>
    </div>
  );
}
