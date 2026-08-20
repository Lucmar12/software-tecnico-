import React, { useState } from "react";
import { OPZIONI_ESPOSIZIONE, OPZIONI_EPOCA, OPZIONI_TIPO_LOCALE } from "../utils/modelli.js";
import { ETICHETTE_CAMPI } from "../utils/stime.js";
import { validaAmbiente } from "../utils/validazione.js";
import { TRASMITTANZE_PER_EPOCA } from "../data/calculations.js";

function Campo({ label, children, errore, stimato }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
        {label}
        {stimato && (
          <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded font-semibold">da verificare</span>
        )}
      </span>
      {children}
      {errore && <span className="text-[11px] text-red-600">{errore}</span>}
    </label>
  );
}

const inputCls =
  "mt-1 w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400";

/**
 * Form di input per un singolo ambiente: tutti i campi di dettaglio
 * costruttivo, più la possibilità di sovrascrivere trasmittanze e
 * temperature di progetto (con avviso di calcolo non standard).
 */
export default function AmbienteForm({ ambiente, onChange, onRemove }) {
  const [overrideAperto, setOverrideAperto] = useState(
    Boolean(ambiente.trasmittanzeOverride || ambiente.teInvOverride != null || ambiente.tbseOverride != null)
  );
  const errori = validaAmbiente(ambiente);
  const stimati = new Set(ambiente.campiStimati || []);

  function set(campo, valore) {
    const nuovoCampiStimati = (ambiente.campiStimati || []).filter((c) => c !== campo);
    onChange({ ...ambiente, [campo]: valore, campiStimati: nuovoCampiStimati });
  }

  function setPiano(tipo) {
    onChange({
      ...ambiente,
      ultimoPiano: tipo === "ultimo",
      pianoTerra: tipo === "terra",
    });
  }

  const pianoAttuale = ambiente.ultimoPiano ? "ultimo" : ambiente.pianoTerra ? "terra" : "intermedio";

  function toggleOverrideTrasmittanze(attivo) {
    if (attivo) {
      onChange({ ...ambiente, trasmittanzeOverride: { ...TRASMITTANZE_PER_EPOCA[ambiente.epocaCostruttiva] } });
    } else {
      onChange({ ...ambiente, trasmittanzeOverride: null });
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <input
          value={ambiente.nome}
          onChange={(e) => set("nome", e.target.value)}
          className="font-semibold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-brand-400 focus:outline-none px-0.5"
          placeholder="Nome ambiente (es. Cucina)"
        />
        <button onClick={onRemove} className="text-xs text-red-500 hover:text-red-700 shrink-0">
          Rimuovi
        </button>
      </div>
      {errori.nome && <p className="text-[11px] text-red-600 -mt-2">{errori.nome}</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Campo label="Superficie pavimento [m²]" errore={errori.superficiePavimento}>
          <input
            type="number"
            className={inputCls}
            value={ambiente.superficiePavimento}
            onChange={(e) => set("superficiePavimento", Number(e.target.value))}
          />
        </Campo>

        <Campo label={ETICHETTE_CAMPI.altezza} errore={errori.altezza} stimato={stimati.has("altezza")}>
          <input
            type="number"
            step="0.1"
            className={inputCls}
            value={ambiente.altezza}
            onChange={(e) => set("altezza", Number(e.target.value))}
          />
        </Campo>

        <Campo label={ETICHETTE_CAMPI.superficieMuriEsterni} errore={errori.superficieMuriEsterni} stimato={stimati.has("superficieMuriEsterni")}>
          <input
            type="number"
            className={inputCls}
            value={ambiente.superficieMuriEsterni}
            onChange={(e) => set("superficieMuriEsterni", Number(e.target.value))}
          />
        </Campo>

        <Campo label={ETICHETTE_CAMPI.superficieFinestre} errore={errori.superficieFinestre} stimato={stimati.has("superficieFinestre")}>
          <input
            type="number"
            className={inputCls}
            value={ambiente.superficieFinestre}
            onChange={(e) => set("superficieFinestre", Number(e.target.value))}
          />
        </Campo>

        <Campo label="Esposizione prevalente">
          <select
            className={inputCls}
            value={ambiente.esposizionePrevalente}
            onChange={(e) => set("esposizionePrevalente", e.target.value)}
          >
            {OPZIONI_ESPOSIZIONE.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Piano" errore={errori.piano}>
          <select className={inputCls} value={pianoAttuale} onChange={(e) => setPiano(e.target.value)}>
            <option value="terra">Piano terra</option>
            <option value="intermedio">Piano intermedio</option>
            <option value="ultimo">Ultimo piano</option>
          </select>
        </Campo>

        <Campo label="Epoca costruttiva">
          <select
            className={inputCls}
            value={ambiente.epocaCostruttiva}
            onChange={(e) => set("epocaCostruttiva", e.target.value)}
          >
            {OPZIONI_EPOCA.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label={ETICHETTE_CAMPI.numeroOccupanti} errore={errori.numeroOccupanti} stimato={stimati.has("numeroOccupanti")}>
          <input
            type="number"
            className={inputCls}
            value={ambiente.numeroOccupanti}
            onChange={(e) => set("numeroOccupanti", Number(e.target.value))}
          />
        </Campo>

        <Campo label="Tipo locale">
          <select className={inputCls} value={ambiente.tipoLocale || "soggiorno"} onChange={(e) => set("tipoLocale", e.target.value)}>
            {OPZIONI_TIPO_LOCALE.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-400">Determina i ricambi d'aria convenzionali (UNI 10339)</span>
        </Campo>
      </div>

      <label className="flex items-start gap-2 text-xs pt-2 border-t border-slate-100">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={Boolean(ambiente.pareteVersoNonRiscaldato)}
          onChange={(e) => set("pareteVersoNonRiscaldato", e.target.checked)}
        />
        <span className="text-slate-600">
          Parte della superficie di muro esterno affaccia su un ambiente NON riscaldato (vano scala, garage,
          cantina) anziché sull'esterno — riduce la dispersione di quella quota (fattore b, UNI EN 12831)
        </span>
      </label>
      {ambiente.pareteVersoNonRiscaldato && (
        <label className="block max-w-xs text-xs">
          <span className="text-slate-500">Quota di muro esterno verso il locale non riscaldato [%]</span>
          <input
            type="number"
            min="0"
            max="100"
            className={inputCls}
            value={ambiente.frazioneSuperficieNonRiscaldata ?? 30}
            onChange={(e) => set("frazioneSuperficieNonRiscaldata", Number(e.target.value))}
          />
        </label>
      )}

      <div className="pt-2 border-t border-slate-100">
          <button
            className="text-xs text-brand-700 underline"
            onClick={() => {
              const nuovo = !overrideAperto;
              setOverrideAperto(nuovo);
              if (!nuovo) onChange({ ...ambiente, trasmittanzeOverride: null, teInvOverride: null, tbseOverride: null });
            }}
          >
            {overrideAperto ? "Nascondi override coefficienti normativi" : "Sovrascrivi coefficienti normativi (dati da diagnosi energetica)"}
          </button>

          {overrideAperto && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
              <p className="text-[11px] text-amber-800">
                Attenzione: sovrascrivendo trasmittanze e/o temperature di progetto il calcolo non è più standard
                UNI EN 12831 con dati tabellari — verrà usato il valore inserito, segnalato in relazione.
              </p>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={Boolean(ambiente.trasmittanzeOverride)}
                  onChange={(e) => toggleOverrideTrasmittanze(e.target.checked)}
                />
                Trasmittanze reali (U) al posto del valore per epoca costruttiva
              </label>
              {ambiente.trasmittanzeOverride && (
                <div className="grid grid-cols-4 gap-2">
                  {["muro", "tetto", "pavimento", "vetro"].map((k) => (
                    <label key={k} className="text-[11px]">
                      U {k} [W/m²K]
                      <input
                        type="number"
                        step="0.01"
                        className={inputCls}
                        value={ambiente.trasmittanzeOverride[k]}
                        onChange={(e) =>
                          onChange({
                            ...ambiente,
                            trasmittanzeOverride: { ...ambiente.trasmittanzeOverride, [k]: Number(e.target.value) },
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px]">
                  T. invernale progetto personalizzata [°C]
                  <input
                    type="number"
                    className={inputCls}
                    value={ambiente.teInvOverride ?? ""}
                    placeholder="usa valore comune"
                    onChange={(e) => set("teInvOverride", e.target.value === "" ? null : Number(e.target.value))}
                  />
                </label>
                <label className="text-[11px]">
                  T. estiva progetto personalizzata [°C]
                  <input
                    type="number"
                    className={inputCls}
                    value={ambiente.tbseOverride ?? ""}
                    placeholder="usa valore comune"
                    onChange={(e) => set("tbseOverride", e.target.value === "" ? null : Number(e.target.value))}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
