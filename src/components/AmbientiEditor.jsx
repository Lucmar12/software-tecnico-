import React, { useState } from "react";
import AmbientiTabella from "./AmbientiTabella.jsx";
import AmbientiSemplici from "./AmbientiSemplici.jsx";

const CHIAVE_VISTA = "dimensionamento_vista_ambienti";

function leggiVista() {
  try {
    return localStorage.getItem(CHIAVE_VISTA) === "tecnica" ? "tecnica" : "semplice";
  } catch {
    return "semplice";
  }
}

/**
 * Le stanze in due viste sugli stessi dati: semplice (domande, per tutti)
 * e tecnica (la tabella completa). Si parte dalla semplice; chi preferisce
 * la tabella la ritrova alla visita successiva.
 */
export default function AmbientiEditor(props) {
  const [vista, setVista] = useState(leggiVista);
  const cambia = (v) => {
    setVista(v);
    try {
      localStorage.setItem(CHIAVE_VISTA, v);
    } catch {
      /* preferenza non salvabile: pazienza */
    }
  };
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm" role="group" aria-label="Vista delle stanze">
          {[
            ["semplice", "Vista semplice"],
            ["tecnica", "Vista tecnica"],
          ].map(([v, etichetta]) => (
            <button
              key={v}
              type="button"
              aria-pressed={vista === v}
              onClick={() => cambia(v)}
              className={`px-3 py-1.5 rounded-md ${vista === v ? "bg-brand-600 text-white font-semibold" : "text-slate-600 hover:bg-slate-50"}`}
            >
              {etichetta}
            </button>
          ))}
        </div>
      </div>
      {vista === "semplice" ? <AmbientiSemplici {...props} /> : <AmbientiTabella {...props} />}
    </div>
  );
}
