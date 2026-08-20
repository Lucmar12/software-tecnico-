import React from "react";
import AmbienteForm from "./AmbienteForm.jsx";
import { nuovoAmbiente } from "../utils/modelli.js";
import { completaAmbienteConStime } from "../utils/stime.js";

/**
 * Gestione della lista di ambienti di uno scenario: aggiunta, modifica,
 * rimozione. In modalità Venditore i nuovi ambienti vengono creati con i
 * campi di dettaglio costruttivo pre-compilati da stima automatica
 * (superficie muri esterni, superficie finestre), segnalata come tale.
 */
export default function AmbientiList({ ambienti, modalita, onChange }) {
  function aggiornaAmbiente(id, ambienteAggiornato) {
    onChange(ambienti.map((a) => (a.id === id ? ambienteAggiornato : a)));
  }

  function rimuoviAmbiente(id) {
    onChange(ambienti.filter((a) => a.id !== id));
  }

  function aggiungiAmbiente() {
    const base = nuovoAmbiente({ nome: `Ambiente ${ambienti.length + 1}` });
    const ambiente =
      modalita === "venditore"
        ? completaAmbienteConStime({
            id: base.id,
            nome: base.nome,
            superficiePavimento: base.superficiePavimento,
            esposizionePrevalente: base.esposizionePrevalente,
            ultimoPiano: false,
            pianoTerra: false,
            epocaCostruttiva: base.epocaCostruttiva,
            tipoLocale: base.tipoLocale,
            pareteVersoNonRiscaldato: false,
            frazioneSuperficieNonRiscaldata: 30,
            trasmittanzeOverride: null,
            teInvOverride: null,
            tbseOverride: null,
          })
        : base;
    onChange([...ambienti, ambiente]);
  }

  return (
    <div className="space-y-3">
      {ambienti.map((a) => (
        <AmbienteForm
          key={a.id}
          ambiente={a}
          modalita={modalita}
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
