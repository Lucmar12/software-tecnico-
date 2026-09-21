import React, { useState } from "react";
import { ETICHETTE_CAMPI, areaFinestra, sviluppoParetiEsterne } from "../utils/stime.js";
import { PARAMETRI_CALCOLO, parametro, parametroDefault, parametriPerGruppo, parametriSovrascritti } from "../utils/parametriCalcolo.js";
import { aggiornaCampoAmbiente, ripristinaCalcoloAutomatico } from "../utils/modelli.js";
import { validaAmbiente } from "../utils/validazione.js";
import { TRASMITTANZE_PER_EPOCA } from "../data/calculations.js";

const inputCls =
  "mt-1 w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400";
const inputCalcolatoCls = `${inputCls} bg-slate-50 border-slate-200`;
const inputStimatoCls = `${inputCls} bg-amber-50/60 border-amber-200`;

/**
 * Dettagli di un ambiente, aperti sotto la sua riga nella tabella: i dati
 * che la riga non mostra perché si ricavano da quelli principali o
 * servono solo in casi particolari.
 *
 * - superfici di muri e finestre, calcolate dalla riga e sovrascrivibili
 *   col rilievo;
 * - quota di muro verso un locale non riscaldato (fattore b);
 * - trasmittanze reali, temperature esterne di progetto e tutti i
 *   coefficienti del calcolo.
 *
 * Nascondere il pannello dei parametri NON cancella nulla: i valori
 * inseriti restano finché non si preme esplicitamente "ripristina". Un
 * tecnico che richiude il pannello per fare spazio non deve perdere le
 * trasmittanze prese da una diagnosi energetica.
 */
export default function AmbienteDettagli({ ambiente, onChange }) {
  const sovrascritti = parametriSovrascritti(ambiente);
  const haOverride = Boolean(ambiente.trasmittanzeOverride || ambiente.teInvOverride != null || ambiente.tbseOverride != null);
  const [parametriAperti, setParametriAperti] = useState(haOverride || sovrascritti.length > 0);

  const errori = validaAmbiente(ambiente);
  const derivati = new Set(ambiente.campiStimati || []);
  const sviluppoM = sviluppoParetiEsterne(ambiente);

  const set = (campo, valore) => onChange(aggiornaCampoAmbiente(ambiente, campo, valore));
  const ripristina = (campo) => onChange(ripristinaCalcoloAutomatico(ambiente, campo));

  function toggleTrasmittanze(attivo) {
    onChange({
      ...ambiente,
      trasmittanzeOverride: attivo ? { ...TRASMITTANZE_PER_EPOCA[ambiente.epocaCostruttiva] } : null,
    });
  }

  const quantiModificati = sovrascritti.length + (haOverride ? 1 : 0);

  return (
    <div className="space-y-3 text-left">
      <div className="grid sm:grid-cols-3 gap-3">
        <Campo
          label={`${ETICHETTE_CAMPI.superficieMuriEsterni} [m²]`}
          errore={errori.superficieMuriEsterni}
          badge="calcolato"
          derivato={derivati.has("superficieMuriEsterni")}
          nota={derivati.has("superficieMuriEsterni") ? `${sviluppoM.toFixed(2)} m di sviluppo × ${ambiente.altezza} m di altezza` : null}
          onRipristina={() => ripristina("superficieMuriEsterni")}
        >
          <input
            type="number"
            step="0.1"
            className={derivati.has("superficieMuriEsterni") ? inputCalcolatoCls : inputCls}
            value={ambiente.superficieMuriEsterni}
            onChange={(e) => set("superficieMuriEsterni", Number(e.target.value))}
          />
        </Campo>

        <Campo
          label={`${ETICHETTE_CAMPI.superficieFinestre} [m²]`}
          errore={errori.superficieFinestre}
          badge="calcolato"
          derivato={derivati.has("superficieFinestre")}
          nota={derivati.has("superficieFinestre") ? `${ambiente.numeroFinestre} × ${areaFinestra(ambiente.tipoFinestra).toFixed(2)} m²` : null}
          onRipristina={() => ripristina("superficieFinestre")}
        >
          <input
            type="number"
            step="0.01"
            className={derivati.has("superficieFinestre") ? inputCalcolatoCls : inputCls}
            value={ambiente.superficieFinestre}
            onChange={(e) => set("superficieFinestre", Number(e.target.value))}
          />
        </Campo>

        <div className="text-[11px] text-slate-500 self-center">
          Muri e finestre sono ricavati dai dati della riga. Sovrascrivili solo se hai il rilievo con le misure
          effettive: il valore inserito smette di essere ricalcolato.
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100">
        <label className="flex items-start gap-2 text-xs">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={Boolean(ambiente.pareteVersoNonRiscaldato)}
            onChange={(e) => set("pareteVersoNonRiscaldato", e.target.checked)}
          />
          <span className="text-slate-600">
            Parte del muro esterno affaccia su un locale NON riscaldato (vano scala, garage, cantina) anziché
            sull'esterno — riduce la dispersione di quella quota (fattore b, UNI EN 12831)
          </span>
        </label>
        {ambiente.pareteVersoNonRiscaldato && (
          <label className="block max-w-xs text-xs mt-2">
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
      </div>

      <div className="pt-2 border-t border-slate-100">
        <button className="text-xs text-brand-700 underline" onClick={() => setParametriAperti((v) => !v)}>
          {parametriAperti ? "Nascondi i parametri di calcolo" : "Mostra tutti i parametri di calcolo (trasmittanze, temperature, coefficienti)"}
        </button>
        {quantiModificati > 0 && (
          <span className="ml-2 text-[10px] bg-brand-100 text-brand-800 px-1.5 py-0.5 rounded font-semibold">
            {quantiModificati} {quantiModificati === 1 ? "valore modificato" : "valori modificati"}
          </span>
        )}

        {parametriAperti && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3">
            <p className="text-[11px] text-amber-800">
              Tutti i valori sono già compilati con il dato normativo. Modificane uno solo se disponi del dato reale:
              il calcolo di questo ambiente verrà segnalato come non standard e i valori inseriti riportati in
              relazione.
            </p>

            <div>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={Boolean(ambiente.trasmittanzeOverride)} onChange={(e) => toggleTrasmittanze(e.target.checked)} />
                Trasmittanze reali (U) al posto dei valori per epoca costruttiva
              </label>
              {ambiente.trasmittanzeOverride && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {["muro", "tetto", "pavimento", "vetro"].map((k) => (
                    <label key={k} className="text-[11px]">
                      U {k} [W/m²K]
                      <input
                        type="number"
                        step="0.01"
                        className={inputCls}
                        value={ambiente.trasmittanzeOverride[k]}
                        onChange={(e) =>
                          onChange({ ...ambiente, trasmittanzeOverride: { ...ambiente.trasmittanzeOverride, [k]: Number(e.target.value) } })
                        }
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px]">
                Temperatura esterna di progetto invernale [°C]
                <input
                  type="number"
                  step="0.5"
                  className={inputCls}
                  value={ambiente.teInvOverride ?? ""}
                  placeholder="valore del comune"
                  onChange={(e) => set("teInvOverride", e.target.value === "" ? null : Number(e.target.value))}
                />
              </label>
              <label className="text-[11px]">
                Temperatura esterna di progetto estiva [°C]
                <input
                  type="number"
                  step="0.5"
                  className={inputCls}
                  value={ambiente.tbseOverride ?? ""}
                  placeholder="valore del comune"
                  onChange={(e) => set("tbseOverride", e.target.value === "" ? null : Number(e.target.value))}
                />
              </label>
            </div>

            <PannelloParametri ambiente={ambiente} onChange={onChange} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Tutti i coefficienti che entrano nel calcolo dell'ambiente, già
 * compilati col valore normativo e con la fonte dichiarata. Le costanti
 * fisiche non compaiono di proposito: non sono scelte di progetto.
 */
function PannelloParametri({ ambiente, onChange }) {
  const inseriti = ambiente.parametri || {};

  function impostaParametro(chiave, valore) {
    const parametri = { ...inseriti };
    if (valore === "" || valore == null) delete parametri[chiave];
    else parametri[chiave] = Number(valore);
    onChange({ ...ambiente, parametri });
  }

  function ripristinaTutti() {
    onChange({ ...ambiente, parametri: {}, trasmittanzeOverride: null, teInvOverride: null, tbseOverride: null });
  }

  const quantiInseriti = PARAMETRI_CALCOLO.filter((p) => inseriti[p.chiave] != null).length;
  const haOverride = Boolean(ambiente.trasmittanzeOverride || ambiente.teInvOverride != null || ambiente.tbseOverride != null);

  return (
    <div className="pt-3 border-t border-amber-200 space-y-3">
      {(quantiInseriti > 0 || haOverride) && (
        <div className="text-right">
          <button onClick={ripristinaTutti} className="text-[11px] text-brand-700 underline">
            Ripristina tutti i valori normativi
          </button>
        </div>
      )}

      {parametriPerGruppo().map((gruppo) => (
        <div key={gruppo.nome}>
          <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700">{gruppo.nome}</span>
          <div className="grid sm:grid-cols-2 gap-2 mt-1">
            {gruppo.parametri.map((p) => {
              const predefinito = parametroDefault(ambiente, p.chiave);
              const modificato = inseriti[p.chiave] != null;
              return (
                <label key={p.chiave} className="block text-[11px]">
                  <span className="flex items-center gap-1 flex-wrap text-slate-600">
                    {p.etichetta} [{p.unita}]
                    {modificato && (
                      <button type="button" onClick={() => impostaParametro(p.chiave, null)} className="text-[10px] text-brand-700 underline">
                        torna a {predefinito}
                      </button>
                    )}
                  </span>
                  <input
                    type="number"
                    step={p.passo}
                    min={p.min}
                    max={p.max}
                    className={`${inputCls} ${modificato ? "border-brand-400 bg-brand-50/50" : "bg-white"}`}
                    value={parametro(ambiente, p.chiave)}
                    onChange={(e) => impostaParametro(p.chiave, e.target.value)}
                  />
                  <span className="text-[10px] text-slate-400 leading-tight block">{p.fonte}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * `badge` distingue due casi che non vanno confusi: "calcolato" è un valore
 * esatto derivato da dati dichiarati, "stimato" una convenzione di progetto.
 */
function Campo({ label, children, errore, derivato, badge = "stimato", nota, onRipristina }) {
  const coloreBadge = badge === "calcolato" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-800";
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500 flex items-center gap-1 flex-wrap">
        {label}
        {derivato && <span className={`text-[10px] ${coloreBadge} px-1 rounded font-semibold`}>{badge}</span>}
        {!derivato && onRipristina && (
          <button type="button" onClick={onRipristina} className="text-[10px] text-brand-700 underline font-medium">
            ricalcola automaticamente
          </button>
        )}
      </span>
      {children}
      {nota && <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">{nota}</span>}
      {errore && <span className="text-[11px] text-red-600">{errore}</span>}
    </label>
  );
}
