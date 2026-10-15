import React, { useState } from "react";
import {
  COMBUSTIBILI,
  APPARECCHI,
  DISTRIBUZIONI,
  RENDIMENTO_DEFAULT,
  ambientiServiti,
  dimensionaBiomassa,
  descrizioneApparecchio,
} from "../utils/biomassa.js";
import { formattaEuro } from "../utils/export.js";

const inputCls =
  "mt-1 w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400";

/**
 * Inserimento per stufe e camini.
 *
 * Le domande sono quelle che chiunque sa rispondere — cosa vuoi bruciare,
 * che apparecchio, se scalda solo la stanza o tutta la casa, quali stanze
 * — perché il resto lo ricava il calcolo dagli ambienti già descritti in
 * tabella. Rendimento e potere calorifico sono già compilati e restano in
 * fondo, per chi ha la scheda tecnica del modello.
 */
export default function BiomassaForm({ biomassa, onChange, ambienti, onChangeAmbienti, edificio, comune }) {
  const [avanzateAperte, setAvanzateAperte] = useState(biomassa.rendimento != null || biomassa.pciKwhKg != null);
  const set = (campo, valore) => onChange({ ...biomassa, [campo]: valore });

  const combustibile = COMBUSTIBILI[biomassa.combustibile];
  const { ambienti: serviti, implicita } = ambientiServiti(ambienti, biomassa.distribuzione);
  const idServiti = new Set(serviti.map((a) => a.id));

  function toggleAmbiente(id) {
    const nuovi = new Set(idServiti);
    if (nuovi.has(id)) {
      // Una stufa ad aria scalda almeno l'ambiente in cui si trova.
      if (nuovi.size === 1) return;
      nuovi.delete(id);
    } else {
      nuovi.add(id);
    }
    onChangeAmbienti(ambienti.map((a) => ({ ...a, servitoDaBiomassa: nuovi.has(a.id) })));
  }

  const anteprima = edificio && comune ? dimensionaBiomassa({ risultatiAmbienti: edificio.risultatiAmbienti, comune, biomassa }) : null;
  const rendimentoDefault = RENDIMENTO_DEFAULT[biomassa.combustibile]?.[biomassa.apparecchio];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
      <Gruppo titolo="Cosa vuoi bruciare?">
        {Object.entries(COMBUSTIBILI).map(([valore, c]) => (
          <Opzione key={valore} attiva={biomassa.combustibile === valore} onClick={() => set("combustibile", valore)} titolo={c.etichetta} />
        ))}
      </Gruppo>

      <Gruppo titolo="Che apparecchio?">
        {Object.entries(APPARECCHI).map(([valore, a]) => (
          <Opzione key={valore} attiva={biomassa.apparecchio === valore} onClick={() => set("apparecchio", valore)} titolo={a.etichetta} descrizione={a.descrizione} />
        ))}
      </Gruppo>

      <Gruppo titolo="Scalda solo la stanza o tutta la casa?">
        {Object.entries(DISTRIBUZIONI).map(([valore, d]) => (
          <Opzione key={valore} attiva={biomassa.distribuzione === valore} onClick={() => set("distribuzione", valore)} titolo={d.etichetta} descrizione={d.descrizione} />
        ))}
      </Gruppo>

      {biomassa.distribuzione === "aria" ? (
        <div className="space-y-2">
          <div>
            <h4 className="text-sm font-semibold text-slate-700">Quali ambienti scalda?</h4>
            <p className="text-xs text-slate-500">
              Quello in cui la metti e quelli aperti verso di esso. Le camere dietro una porta chiusa no: se le conti, la
              stufa risulta troppo grande e il soggiorno diventa un forno.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ambienti.map((a) => {
              const attivo = idServiti.has(a.id);
              return (
                <label
                  key={a.id}
                  className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border cursor-pointer select-none ${
                    attivo ? "border-brand-400 bg-brand-50 text-brand-800" : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <input type="checkbox" checked={attivo} onChange={() => toggleAmbiente(a.id)} />
                  {a.nome || "Ambiente"}
                </label>
              );
            })}
          </div>
          {implicita && (
            <p className="text-[11px] text-amber-700">Abbiamo considerato il soggiorno: conferma o cambia gli ambienti qui sopra.</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
          Un apparecchio idro scalda l'acqua dell'impianto, quindi serve tutti i {ambienti.length} ambienti della tabella.
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Quanta parte del riscaldamento fa? [%]</span>
          <input
            type="number"
            min="0"
            max="100"
            step="5"
            className={inputCls}
            value={biomassa.quotaCoperturaPct}
            onChange={(e) => set("quotaCoperturaPct", Number(e.target.value))}
          />
          <span className="text-[11px] text-slate-400">100 se è il riscaldamento principale, meno se integra un altro impianto</span>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-500">
            Prezzo del {combustibile.etichetta.toLowerCase()} [€ al {combustibile.unitaVendita.nome}
            {combustibile.unitaVendita.nome === "sacco" ? ` da ${combustibile.unitaVendita.kg} kg` : ""}]
          </span>
          <input
            type="number"
            min="0"
            step="0.1"
            className={inputCls}
            value={biomassa.prezzoUnita ?? combustibile.prezzoUnitaDefault}
            onChange={(e) => set("prezzoUnita", e.target.value === "" ? null : Number(e.target.value))}
          />
          <span className="text-[11px] text-slate-400">{combustibile.notaPrezzo}</span>
        </label>
      </div>

      {anteprima && (
        <div className="text-sm bg-brand-50 border border-brand-200 rounded-lg p-3 space-y-1">
          <div className="font-semibold text-brand-900">{descrizioneApparecchio(anteprima)}</div>
          <div className="text-xs text-brand-800">
            Circa {Math.round(anteprima.unitaAnno)} {anteprima.combustibile.unitaVendita.plurale} l'anno ·{" "}
            {formattaEuro(anteprima.costoAnnuo)} di combustibile
          </div>
          {anteprima.avvertenze.map((a, i) => (
            <p key={i} className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 mt-1">
              {a}
            </p>
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-slate-100">
        <button className="text-xs text-brand-700 underline" onClick={() => setAvanzateAperte((v) => !v)}>
          {avanzateAperte ? "Nascondi rendimento e potere calorifico" : "Rendimento e potere calorifico (dalla scheda tecnica)"}
        </button>
        {avanzateAperte && (
          <div className="grid sm:grid-cols-2 gap-3 mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <label className="block text-[11px]">
              <span className="text-slate-600">Rendimento dell'apparecchio [%]</span>
              <input
                type="number"
                min="30"
                max="100"
                step="1"
                className={inputCls}
                value={Math.round((biomassa.rendimento ?? rendimentoDefault) * 100)}
                onChange={(e) => set("rendimento", e.target.value === "" ? null : Number(e.target.value) / 100)}
              />
              <span className="text-[10px] text-slate-400 block">
                Valore tipico per {APPARECCHI[biomassa.apparecchio].etichetta.toLowerCase()} a {combustibile.etichetta.toLowerCase()}:{" "}
                {Math.round(rendimentoDefault * 100)}%. Quello del modello è sulla scheda tecnica.
              </span>
            </label>
            <label className="block text-[11px]">
              <span className="text-slate-600">Potere calorifico inferiore [kWh/kg]</span>
              <input
                type="number"
                min="2"
                max="6"
                step="0.1"
                className={inputCls}
                value={biomassa.pciKwhKg ?? combustibile.pciKwhKg}
                onChange={(e) => set("pciKwhKg", e.target.value === "" ? null : Number(e.target.value))}
              />
              <span className="text-[10px] text-slate-400 block">{combustibile.fontePci}</span>
            </label>
            {(biomassa.rendimento != null || biomassa.pciKwhKg != null) && (
              <button
                className="text-[11px] text-brand-700 underline justify-self-start"
                onClick={() => onChange({ ...biomassa, rendimento: null, pciKwhKg: null })}
              >
                Torna ai valori di riferimento
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Gruppo({ titolo, children }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-slate-700">{titolo}</h4>
      <div className="grid sm:grid-cols-2 gap-2">{children}</div>
    </div>
  );
}

function Opzione({ attiva, onClick, titolo, descrizione }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={attiva}
      className={`text-left rounded-lg border-2 px-3 py-2 transition-colors ${
        attiva ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="font-semibold text-sm text-slate-800">{titolo}</div>
      {descrizione && <div className="text-xs text-slate-500 leading-snug">{descrizione}</div>}
    </button>
  );
}
