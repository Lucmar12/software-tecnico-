import React, { useState } from "react";
import { OPZIONI_ESPOSIZIONE, OPZIONI_EPOCA, OPZIONI_TIPO_LOCALE } from "../utils/modelli.js";
import { ETICHETTE_CAMPI, OPZIONI_PARETI_ESTERNE, TIPI_FINESTRA, areaFinestra, sviluppoParetiEsterne, applicaStime } from "../utils/stime.js";
import { PARAMETRI_CALCOLO, parametro, parametroDefault, parametriPerGruppo, parametriSovrascritti } from "../utils/parametriCalcolo.js";
import { validaAmbiente } from "../utils/validazione.js";
import { TRASMITTANZE_PER_EPOCA } from "../data/calculations.js";

/**
 * Pannello di tutti i coefficienti che entrano nel calcolo dell'ambiente.
 *
 * Ogni campo parte dal valore normativo o di pratica corrente già
 * compilato, mostra la propria unità di misura e dichiara la fonte da
 * cui proviene. Chi ha il dato reale — una diagnosi energetica, il
 * bulbo umido del comune, l'affollamento effettivo — lo scrive e il
 * calcolo smette di essere una convenzione. Chi non lo tocca ottiene
 * comunque un risultato verosimile.
 *
 * Le costanti fisiche (capacità termica e calore latente dell'aria,
 * calore specifico dell'acqua) non compaiono qui di proposito: non sono
 * scelte di progetto.
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
    const { parametri, ...resto } = ambiente;
    onChange(resto);
  }

  const quantiModificati = PARAMETRI_CALCOLO.filter((p) => inseriti[p.chiave] != null).length;

  return (
    <div className="pt-3 mt-1 border-t border-amber-200 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] text-amber-800">
          Coefficienti applicati a questo ambiente. Sono già compilati con il valore normativo: modificane uno solo
          se disponi del dato reale.
        </p>
        {quantiModificati > 0 && (
          <button onClick={ripristinaTutti} className="text-[11px] text-brand-700 underline shrink-0">
            Ripristina i valori normativi
          </button>
        )}
      </div>

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
                      <button
                        type="button"
                        onClick={() => impostaParametro(p.chiave, null)}
                        className="text-[10px] text-brand-700 underline"
                      >
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
 * `badge` distingue i due casi che non vanno confusi: "calcolato" è un
 * valore esatto derivato da ciò che l'utente ha dichiarato, "stimato" è
 * una convenzione di progetto in mancanza del dato reale.
 */
function Campo({ label, children, errore, stimato, badge = "stimato", nota, onRipristinaStima }) {
  const coloreBadge = badge === "calcolato" ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-800";
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500 flex items-center gap-1 flex-wrap">
        {label}
        {stimato && <span className={`text-[10px] ${coloreBadge} px-1 rounded font-semibold`}>{badge}</span>}
        {!stimato && onRipristinaStima && (
          <button
            type="button"
            onClick={onRipristinaStima}
            className="text-[10px] text-brand-700 underline font-medium"
          >
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

const inputCls =
  "mt-1 w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400";

const inputCalcolatoCls = `${inputCls} bg-slate-50 border-slate-200`;
const inputStimatoCls = `${inputCls} bg-amber-50/60 border-amber-200`;

/**
 * Form di input per un singolo ambiente.
 *
 * L'ordine dei campi segue quello che l'utente sa senza misurare
 * (superficie, altezza, destinazione d'uso, pareti esposte, piano,
 * epoca); i dati che richiederebbero un rilievo — superficie dei muri
 * esterni, superficie finestrata, occupanti — sono raggruppati a parte e
 * precompilati per stima (vedi utils/stime.js), modificabili in
 * qualunque momento e ripristinabili alla stima.
 *
 * In coda, chiusi di default, gli override di trasmittanze e temperature
 * di progetto per chi dispone di una diagnosi energetica.
 */
export default function AmbienteForm({ ambiente, onChange, onRemove }) {
  const [overrideAperto, setOverrideAperto] = useState(
    Boolean(ambiente.trasmittanzeOverride || ambiente.teInvOverride != null || ambiente.tbseOverride != null)
  );
  const errori = validaAmbiente(ambiente);
  const stimati = new Set(ambiente.campiStimati || []);

  /**
   * Aggiorna un campo. Se il campo era stimato, l'inserimento manuale lo
   * fa uscire dalla lista dei campi stimati; in ogni caso le stime
   * ancora attive vengono ricalcolate, perché il campo appena modificato
   * può esserne una sorgente (superficie, altezza, pareti, tipo locale).
   */
  function set(campo, valore) {
    const campiStimati = (ambiente.campiStimati || []).filter((c) => c !== campo);
    onChange(applicaStime({ ...ambiente, [campo]: valore, campiStimati }));
  }

  /** Rimette un campo sotto il controllo del calcolo automatico. */
  function ripristinaStima(campo) {
    const campiStimati = [...new Set([...(ambiente.campiStimati || []), campo])];
    onChange(applicaStime({ ...ambiente, campiStimati }));
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

  const sviluppoM = sviluppoParetiEsterne(ambiente);
  const sovrascritti = parametriSovrascritti(ambiente);

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
        <Campo label="Lunghezza [m]" errore={errori.lunghezzaM} nota="il lato più lungo della stanza">
          <input
            type="number"
            step="0.1"
            min="0"
            className={inputCls}
            value={ambiente.lunghezzaM}
            onChange={(e) => set("lunghezzaM", Number(e.target.value))}
          />
        </Campo>

        <Campo label="Larghezza [m]" errore={errori.larghezzaM} nota={`superficie: ${(ambiente.superficiePavimento || 0).toFixed(2)} m²`}>
          <input
            type="number"
            step="0.1"
            min="0"
            className={inputCls}
            value={ambiente.larghezzaM}
            onChange={(e) => set("larghezzaM", Number(e.target.value))}
          />
        </Campo>

        <Campo label="Altezza interna [m]" errore={errori.altezza}>
          <input
            type="number"
            step="0.1"
            className={inputCls}
            value={ambiente.altezza}
            onChange={(e) => set("altezza", Number(e.target.value))}
          />
        </Campo>

        <Campo label="Tipo locale" nota="Determina i ricambi d'aria convenzionali (UNI 10339)">
          <select className={inputCls} value={ambiente.tipoLocale || "soggiorno"} onChange={(e) => set("tipoLocale", e.target.value)}>
            {OPZIONI_TIPO_LOCALE.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Quali lati danno sull'esterno" nota={`sviluppo esposto: ${sviluppoM.toFixed(2)} m`}>
          <select className={inputCls} value={ambiente.paretiEsterne} onChange={(e) => set("paretiEsterne", e.target.value)}>
            {OPZIONI_PARETI_ESTERNE.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Quante finestre" errore={errori.numeroFinestre}>
          <input
            type="number"
            min="0"
            className={inputCls}
            value={ambiente.numeroFinestre}
            onChange={(e) => set("numeroFinestre", Number(e.target.value))}
          />
        </Campo>

        <Campo label="Tipo di serramento" nota={`${areaFinestra(ambiente.tipoFinestra).toFixed(2)} m² ciascuno`}>
          <select className={inputCls} value={ambiente.tipoFinestra} onChange={(e) => set("tipoFinestra", e.target.value)}>
            {TIPI_FINESTRA.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
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
      </div>

      <div className="pt-3 border-t border-slate-100 space-y-2">
        <p className="text-[11px] text-slate-500">
          Ricavati esattamente dai dati inseriti sopra — lati, altezza, lati esposti, numero e tipo di serramenti.
          Sovrascrivili solo se hai il rilievo con le misure effettive.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Campo
            label={`${ETICHETTE_CAMPI.superficieMuriEsterni} [m²]`}
            errore={errori.superficieMuriEsterni}
            badge="calcolato"
            stimato={stimati.has("superficieMuriEsterni")}
            nota={stimati.has("superficieMuriEsterni") ? `${sviluppoM.toFixed(2)} m di sviluppo × ${ambiente.altezza} m di altezza` : null}
            onRipristinaStima={() => ripristinaStima("superficieMuriEsterni")}
          >
            <input
              type="number"
              className={stimati.has("superficieMuriEsterni") ? inputCalcolatoCls : inputCls}
              value={ambiente.superficieMuriEsterni}
              onChange={(e) => set("superficieMuriEsterni", Number(e.target.value))}
            />
          </Campo>

          <Campo
            label={`${ETICHETTE_CAMPI.superficieFinestre} [m²]`}
            errore={errori.superficieFinestre}
            badge="calcolato"
            stimato={stimati.has("superficieFinestre")}
            nota={stimati.has("superficieFinestre") ? `${ambiente.numeroFinestre} × ${areaFinestra(ambiente.tipoFinestra).toFixed(2)} m²` : null}
            onRipristinaStima={() => ripristinaStima("superficieFinestre")}
          >
            <input
              type="number"
              step="0.1"
              className={stimati.has("superficieFinestre") ? inputCalcolatoCls : inputCls}
              value={ambiente.superficieFinestre}
              onChange={(e) => set("superficieFinestre", Number(e.target.value))}
            />
          </Campo>

          <Campo
            label={ETICHETTE_CAMPI.numeroOccupanti}
            errore={errori.numeroOccupanti}
            stimato={stimati.has("numeroOccupanti")}
            nota={stimati.has("numeroOccupanti") ? "affollamento convenzionale del tipo di locale" : null}
            onRipristinaStima={() => ripristinaStima("numeroOccupanti")}
          >
            <input
              type="number"
              className={stimati.has("numeroOccupanti") ? inputStimatoCls : inputCls}
              value={ambiente.numeroOccupanti}
              onChange={(e) => set("numeroOccupanti", Number(e.target.value))}
            />
          </Campo>
        </div>
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
            {overrideAperto ? "Nascondi i parametri di calcolo" : "Mostra tutti i parametri di calcolo (trasmittanze, temperature, coefficienti)"}
            {sovrascritti.length > 0 && (
              <span className="ml-2 text-[10px] bg-brand-100 text-brand-800 px-1.5 py-0.5 rounded font-semibold no-underline">
                {sovrascritti.length} {sovrascritti.length === 1 ? "modificato" : "modificati"}
              </span>
            )}
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

              <PannelloParametri ambiente={ambiente} onChange={onChange} />
            </div>
          )}
        </div>
    </div>
  );
}
