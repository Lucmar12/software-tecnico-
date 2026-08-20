import React from "react";
import { FATTORE_CONTEMPORANEITA_DEFAULT } from "../utils/vrf.js";
import { FATTORE_CONTEMPORANEITA_CHILLER_DEFAULT } from "../utils/chiller.js";

const inputCls = "mt-1 w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400";

/**
 * Selettore del tipo di impianto di distribuzione, in alternativa a split
 * indipendenti: VRF/multi-split centralizzato (circuito frigorifero
 * diretto) o chiller con distribuzione ad acqua (ventilconvettori/
 * pannelli radianti). Le due tipologie sono alternative tra loro — un
 * ambiente non può essere servito contemporaneamente da entrambe.
 * Richiede almeno 2 ambienti (un impianto centralizzato ha senso solo
 * per servirne più di uno). In modalità Venditore mostra solo la scelta
 * del tipo, senza i parametri tecnici (contemporaneità, tubazioni,
 * dislivello): quei valori restano ai default e vengono comunque
 * applicati al calcolo, ma non sono pensati per una compilazione rapida
 * da sopralluogo — restano modificabili solo passando a Ingegnere.
 */
export default function SistemaCentralizzatoPanel({ sistemaCentralizzato, onChange, numeroAmbienti, modalita }) {
  if (numeroAmbienti < 2) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 text-xs text-slate-500">
        Sistema centralizzato (VRF o chiller) — disponibile aggiungendo almeno un secondo ambiente: un impianto
        centralizzato ha senso solo per servirne più di uno.
      </div>
    );
  }

  function setTipo(tipo) {
    onChange({
      ...sistemaCentralizzato,
      tipo,
      fattoreContemporaneita: tipo === "chiller" ? FATTORE_CONTEMPORANEITA_CHILLER_DEFAULT : FATTORE_CONTEMPORANEITA_DEFAULT,
    });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-slate-800">Sistema di distribuzione</h3>
      <div className="grid sm:grid-cols-3 gap-2">
        <OpzioneTipo
          attivo={sistemaCentralizzato.tipo === "nessuno"}
          onClick={() => setTipo("nessuno")}
          titolo="Split indipendenti"
          descrizione="Un'unità per ambiente (default)"
        />
        <OpzioneTipo
          attivo={sistemaCentralizzato.tipo === "vrf"}
          onClick={() => setTipo("vrf")}
          titolo="VRF / multi-split"
          descrizione="Unità esterna unica, circuito frigorifero diretto"
        />
        <OpzioneTipo
          attivo={sistemaCentralizzato.tipo === "chiller"}
          onClick={() => setTipo("chiller")}
          titolo="Chiller"
          descrizione="Produzione centralizzata, distribuzione ad acqua"
        />
      </div>

      {sistemaCentralizzato.tipo === "vrf" && modalita !== "ingegnere" && (
        <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
          Un'unica unità esterna servirà tutti gli ambienti inseriti. Fattore di contemporaneità e derating per
          tubazioni/dislivello sono calcolati con valori convenzionali di default — modificabili passando alla
          modalità Ingegnere.
        </p>
      )}
      {sistemaCentralizzato.tipo === "vrf" && modalita === "ingegnere" && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Un'unica unità esterna serve tutti gli ambienti inseriti. Il dimensionamento applica un fattore di
            contemporaneità e un derating per lunghezza tubazioni/dislivello — valori convenzionali indicativi, da
            verificare sulle curve reali del produttore selezionato in fase esecutiva.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Fattore di contemporaneità</span>
              <input
                type="number"
                step="0.05"
                min="0.5"
                max="1"
                className={inputCls}
                value={sistemaCentralizzato.fattoreContemporaneita}
                onChange={(e) => onChange({ ...sistemaCentralizzato, fattoreContemporaneita: Number(e.target.value) })}
              />
              <span className="text-[11px] text-slate-400">Default {FATTORE_CONTEMPORANEITA_DEFAULT} (residenziale)</span>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Lunghezza tubazioni equivalente [m]</span>
              <input
                type="number"
                className={inputCls}
                value={sistemaCentralizzato.lunghezzaEquivalenteM}
                onChange={(e) => onChange({ ...sistemaCentralizzato, lunghezzaEquivalenteM: Number(e.target.value) })}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Dislivello unità esterna/interne [m]</span>
              <input
                type="number"
                className={inputCls}
                value={sistemaCentralizzato.dislivelloM}
                onChange={(e) => onChange({ ...sistemaCentralizzato, dislivelloM: Number(e.target.value) })}
              />
            </label>
          </div>
        </div>
      )}

      {sistemaCentralizzato.tipo === "chiller" && modalita !== "ingegnere" && (
        <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
          Produzione centralizzata con distribuzione ad acqua verso ventilconvettori o pannelli radianti. Il fattore
          di contemporaneità è calcolato con un valore convenzionale di default — modificabile passando alla
          modalità Ingegnere.
        </p>
      )}
      {sistemaCentralizzato.tipo === "chiller" && modalita === "ingegnere" && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Produzione centralizzata con distribuzione ad acqua verso ventilconvettori o pannelli radianti. Il
            dimensionamento applica un fattore di contemporaneità tra le utenze servite; perdite di carico della rete
            idraulica e scelta delle pompe restano oggetto della progettazione idraulica esecutiva.
          </p>
          <label className="block max-w-xs">
            <span className="text-xs font-medium text-slate-500">Fattore di contemporaneità</span>
            <input
              type="number"
              step="0.05"
              min="0.5"
              max="1"
              className={inputCls}
              value={sistemaCentralizzato.fattoreContemporaneita}
              onChange={(e) => onChange({ ...sistemaCentralizzato, fattoreContemporaneita: Number(e.target.value) })}
            />
            <span className="text-[11px] text-slate-400">Default {FATTORE_CONTEMPORANEITA_CHILLER_DEFAULT} (residenziale/plurifamiliare)</span>
          </label>
        </div>
      )}
    </div>
  );
}

function OpzioneTipo({ attivo, onClick, titolo, descrizione }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-lg border-2 p-3 transition-all duration-150 active:scale-[0.99] ${
        attivo ? "border-brand-500 bg-brand-50 shadow-md shadow-brand-500/10" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="font-medium text-sm text-slate-800">{titolo}</div>
      <div className="text-[11px] text-slate-500">{descrizione}</div>
    </button>
  );
}
