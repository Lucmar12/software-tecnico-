import React, { useEffect, useRef, useState } from "react";
import AmbienteDettagli from "./AmbienteDettagli.jsx";
import { nuovoAmbiente, aggiornaCampoAmbiente, pianoAmbiente, impostaPianoAmbiente } from "../utils/modelli.js";
import { OPZIONI_PARETI_ESTERNE, TIPI_FINESTRA } from "../utils/stime.js";
import { validaAmbiente } from "../utils/validazione.js";
import { calcolaAmbienteConOverride, isAmbienteNonStandard } from "../utils/overrides.js";
import { profiloEstivoEdificio } from "../utils/profiliOrari.js";
import { ETICHETTE_EPOCA, ETICHETTE_TIPO_LOCALE } from "../data/calculations.js";

/** Etichette brevi per le celle: il testo completo resta nel tooltip e nei dettagli. */
const TIPI_LOCALE = [
  { value: "soggiorno", breve: "Soggiorno" },
  { value: "camera", breve: "Camera" },
  { value: "cucina", breve: "Cucina" },
  { value: "bagno", breve: "Bagno" },
  { value: "altro", breve: "Altro" },
];
const EPOCHE = [
  { value: "ante-1975", breve: "< 1975" },
  { value: "1976-1990", breve: "1976–90" },
  { value: "1991-2005", breve: "1991–05" },
  { value: "2006-2015", breve: "2006–15" },
  { value: "post-2015", breve: "> 2015" },
];
const ESPOSIZIONI = ["nord", "est", "sud", "ovest"];
const PIANI = [
  { value: "terra", breve: "Terra" },
  { value: "intermedio", breve: "Intermedio" },
  { value: "ultimo", breve: "Ultimo" },
];

const cella = "px-1 py-1 align-top";
/**
 * Colonne fisse: il nome a sinistra da 640 px, i risultati a destra da
 * 768 px. Sotto queste soglie restano libere: su un telefono due colonne
 * fisse occuperebbero l'intera larghezza e i campi da compilare, che
 * scorrono in mezzo, non sarebbero mai visibili.
 */
const fissaSinistra = "sm:sticky sm:left-0 sm:shadow-[6px_0_6px_-6px_rgba(15,23,42,0.18)]";
const fissaDestra = "md:sticky md:right-0 md:shadow-[-6px_0_6px_-6px_rgba(15,23,42,0.18)]";
// Le frecce di incremento dei campi numerici rubano ~16 px per cella e nelle
// colonne strette troncavano il valore (2,7 m letto come "2"): si nascondono.
const senzaFrecce = "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
const inputBase =
  `w-full border rounded-md px-1.5 py-1 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-400 ${senzaFrecce}`;

/**
 * Larghezza minima di ogni controllo. In una tabella a layout automatico un
 * controllo `w-full` non impone nulla alla propria colonna, che si
 * restringe fino a tagliare il contenuto: un valore tecnico troncato è
 * peggio di un valore assente, perché si legge sbagliato. Ogni colonna
 * garantisce quindi lo spazio per il suo valore più lungo.
 */
const LARGHEZZA = {
  nome: "min-w-[130px]",
  tipo: "min-w-[112px]",
  lato: "min-w-[62px]",
  altezza: "min-w-[56px]",
  pareti: "min-w-[112px]",
  conteggio: "min-w-[44px]",
  serramento: "min-w-[146px]",
  esposizione: "min-w-[86px]",
  piano: "min-w-[108px]",
  epoca: "min-w-[96px]",
};

function classeInput(errore, extra = "") {
  return `${inputBase} ${errore ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"} ${extra}`;
}

/**
 * Ambienti di uno scenario in forma di tabella: una riga per stanza, una
 * colonna per dato.
 *
 * La tabella rende visibili tutti gli ambienti insieme — cosa che un
 * elenco di schede non permette — e affianca a ogni riga il carico
 * invernale ed estivo che produce, così l'effetto di una misura cambiata
 * si legge subito e una stanza anomala salta all'occhio per confronto con
 * le altre. In fondo, i totali.
 *
 * I dati derivati e i coefficienti di calcolo stanno nei dettagli, aperti
 * sotto la riga: la riga mostra solo ciò che si misura o si osserva.
 * Gli errori non si nascondono mai: la cella sbagliata diventa rossa e il
 * messaggio compare sotto la riga, dettagli aperti o chiusi.
 */
export default function AmbientiTabella({ ambienti, onChange, comune }) {
  const [dettagliAperti, setDettagliAperti] = useState([]);

  // Sui monitor le barre di scorrimento compaiono solo durante lo scorrimento:
  // senza un avviso esplicito le colonne fuori schermo passano inosservate.
  const contenitoreRef = useRef(null);
  const [haColonneNascoste, setHaColonneNascoste] = useState(false);
  useEffect(() => {
    const el = contenitoreRef.current;
    if (!el) return undefined;
    const misura = () => setHaColonneNascoste(el.scrollWidth > el.clientWidth + 1);
    misura();
    const osservatore = typeof ResizeObserver !== "undefined" ? new ResizeObserver(misura) : null;
    osservatore?.observe(el);
    window.addEventListener("resize", misura);
    return () => {
      osservatore?.disconnect();
      window.removeEventListener("resize", misura);
    };
  }, [ambienti.length, dettagliAperti.length]);

  const aggiorna = (id, nuovo) => onChange(ambienti.map((a) => (a.id === id ? nuovo : a)));
  const rimuovi = (id) => {
    onChange(ambienti.filter((a) => a.id !== id));
    setDettagliAperti((ids) => ids.filter((x) => x !== id));
  };
  const aggiungi = () => onChange([...ambienti, nuovoAmbiente({ nome: `Ambiente ${ambienti.length + 1}` })]);
  const toggleDettagli = (id) => setDettagliAperti((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const risultati = ambienti.map((a) => {
    const errori = validaAmbiente(a);
    const valido = Object.keys(errori).length === 0;
    return { ambiente: a, errori, calcolo: valido && comune ? calcolaAmbienteConOverride(a, comune) : null };
  });

  const totaleSuperficie = ambienti.reduce((s, a) => s + (Number(a.superficiePavimento) || 0), 0);
  const calcolati = risultati.filter((r) => r.calcolo);
  const totaleInvernale = calcolati.reduce((s, r) => s + r.calcolo.invernaleKw, 0);
  // Il totale estivo NON è la somma della colonna: ogni ambiente porta il
  // proprio picco, ma i picchi cadono a ore diverse. Si somma ora per ora
  // e si prende il massimo, coerentemente con la relazione di calcolo.
  const estivoEdificio = profiloEstivoEdificio(calcolati.map((r) => r.calcolo));
  const totaleEstivo = estivoEdificio.massimoKw;
  const sfasamentoEstivo = estivoEdificio.riduzionePerContemporaneitaPct > 0.5;
  const totaliCompleti = comune && calcolati.length === ambienti.length && ambienti.length > 0;
  const numeroColonne = 14;

  return (
    <div className="bg-white border border-slate-200 rounded-xl">
      <div className="overflow-x-auto" ref={contenitoreRef}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-[11px] text-slate-500 text-left border-b border-slate-200 bg-slate-50">
              <th className={`${cella} pl-3 z-10 bg-slate-50 ${fissaSinistra}`}>Ambiente</th>
              <th className={`${cella} w-[105px]`}>Tipo</th>
              <th className={`${cella} w-[70px]`} title="Il lato più lungo della stanza">Lungh. [m]</th>
              <th className={`${cella} w-[70px]`}>Largh. [m]</th>
              <th className={`${cella} w-[62px]`}>Alt. [m]</th>
              <th className={`${cella} w-[62px] text-right`}>Sup. [m²]</th>
              <th className={`${cella} w-[120px]`}>Lati esterni</th>
              <th className={`${cella} w-[52px]`} title="Numero di finestre e portefinestre">Fin. [n]</th>
              <th className={`${cella} w-[140px]`}>Serramento</th>
              <th className={`${cella} w-[78px]`}>Espos.</th>
              <th className={`${cella} w-[98px]`}>Piano</th>
              <th className={`${cella} w-[118px]`}>Costruito</th>
              <th className={`${cella} w-[58px]`} title="Occupanti di progetto">Occ. [n]</th>
              <th className={`${cella} pr-3 z-10 bg-slate-50 ${fissaDestra}`}>
                <div className="flex items-end gap-1">
                  <span className="w-14 text-right text-sky-700">Inv. [kW]</span>
                  <span className="w-14 text-right text-amber-700">Est. [kW]</span>
                  <span className="w-[5.5rem]" />
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {risultati.map(({ ambiente: a, errori, calcolo }, indice) => {
              const set = (campo, valore) => aggiorna(a.id, aggiornaCampoAmbiente(a, campo, valore));
              const aperto = dettagliAperti.includes(a.id);
              const messaggiErrore = Object.values(errori);
              const occupantiStimati = (a.campiStimati || []).includes("numeroOccupanti");
              const nonStandard = isAmbienteNonStandard(a);

              return (
                <React.Fragment key={a.id}>
                  <tr className={`border-b border-slate-100 ${aperto ? "bg-brand-50/30" : "hover:bg-slate-50/60"}`}>
                    <td className={`${cella} pl-3 z-10 ${aperto ? "bg-brand-50" : "bg-white"} ${fissaSinistra}`}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 tabular-nums w-4 text-right">{indice + 1}</span>
                        <input className={classeInput(errori.nome, `font-medium ${LARGHEZZA.nome}`)} value={a.nome} placeholder="es. Cucina" onChange={(e) => set("nome", e.target.value)} />
                      </div>
                    </td>
                    <td className={cella}>
                      <select className={classeInput(false, LARGHEZZA.tipo)} value={a.tipoLocale || "soggiorno"} title={ETICHETTE_TIPO_LOCALE[a.tipoLocale]} onChange={(e) => set("tipoLocale", e.target.value)}>
                        {TIPI_LOCALE.map((o) => (
                          <option key={o.value} value={o.value}>{o.breve}</option>
                        ))}
                      </select>
                    </td>
                    <td className={cella}>
                      <input type="number" step="0.1" min="0" className={classeInput(errori.lunghezzaM, LARGHEZZA.lato)} title={errori.lunghezzaM} value={a.lunghezzaM} onChange={(e) => set("lunghezzaM", Number(e.target.value))} />
                    </td>
                    <td className={cella}>
                      <input type="number" step="0.1" min="0" className={classeInput(errori.larghezzaM, LARGHEZZA.lato)} title={errori.larghezzaM} value={a.larghezzaM} onChange={(e) => set("larghezzaM", Number(e.target.value))} />
                    </td>
                    <td className={cella}>
                      <input type="number" step="0.05" min="0" className={classeInput(errori.altezza, LARGHEZZA.altezza)} title={errori.altezza} value={a.altezza} onChange={(e) => set("altezza", Number(e.target.value))} />
                    </td>
                    <td className={`${cella} pt-2.5 text-right tabular-nums text-slate-600`}>{(Number(a.superficiePavimento) || 0).toFixed(2)}</td>
                    <td className={cella}>
                      <select className={classeInput(false, LARGHEZZA.pareti)} value={a.paretiEsterne} onChange={(e) => set("paretiEsterne", e.target.value)}>
                        {OPZIONI_PARETI_ESTERNE.map((o) => (
                          <option key={o.value} value={o.value} title={o.label}>{o.breve}</option>
                        ))}
                      </select>
                    </td>
                    <td className={cella}>
                      <input type="number" min="0" step="1" className={classeInput(errori.numeroFinestre, LARGHEZZA.conteggio)} title={errori.numeroFinestre} value={a.numeroFinestre} onChange={(e) => set("numeroFinestre", Number(e.target.value))} />
                    </td>
                    <td className={cella}>
                      <select className={classeInput(errori.superficieFinestre, LARGHEZZA.serramento)} title={errori.superficieFinestre} value={a.tipoFinestra} onChange={(e) => set("tipoFinestra", e.target.value)}>
                        {TIPI_FINESTRA.map((t) => (
                          <option key={t.value} value={t.value} title={t.label}>{t.breve}</option>
                        ))}
                      </select>
                    </td>
                    <td className={cella}>
                      <select className={classeInput(false, LARGHEZZA.esposizione)} value={a.esposizionePrevalente} onChange={(e) => set("esposizionePrevalente", e.target.value)}>
                        {ESPOSIZIONI.map((v) => (
                          <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td className={cella}>
                      <select className={classeInput(errori.piano, LARGHEZZA.piano)} value={pianoAmbiente(a)} onChange={(e) => aggiorna(a.id, impostaPianoAmbiente(a, e.target.value))}>
                        {PIANI.map((o) => (
                          <option key={o.value} value={o.value}>{o.breve}</option>
                        ))}
                      </select>
                    </td>
                    <td className={cella}>
                      <select className={classeInput(false, LARGHEZZA.epoca)} value={a.epocaCostruttiva} title={ETICHETTE_EPOCA[a.epocaCostruttiva]} onChange={(e) => set("epocaCostruttiva", e.target.value)}>
                        {EPOCHE.map((o) => (
                          <option key={o.value} value={o.value}>{o.breve}</option>
                        ))}
                      </select>
                    </td>
                    <td className={cella}>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        title={occupantiStimati ? "Affollamento convenzionale del tipo di locale: inserisci il numero reale se lo conosci" : "Valore inserito"}
                        className={classeInput(errori.numeroOccupanti, `${LARGHEZZA.conteggio} ${occupantiStimati ? "bg-amber-50 border-amber-300" : ""}`)}
                        value={a.numeroOccupanti}
                        onChange={(e) => set("numeroOccupanti", Number(e.target.value))}
                      />
                    </td>
                    <td className={`${cella} pr-3 z-10 ${aperto ? "bg-brand-50" : "bg-white"} ${fissaDestra}`}>
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span className="w-14 text-right tabular-nums font-semibold text-sky-800">{calcolo ? calcolo.invernaleKw.toFixed(2) : "—"}</span>
                        <span className="w-14 text-right tabular-nums font-semibold text-amber-800">{calcolo ? calcolo.estivoKw.toFixed(2) : "—"}</span>
                        <span className="w-[5.5rem] flex items-center justify-end gap-0.5">
                          <button
                            onClick={() => toggleDettagli(a.id)}
                            aria-expanded={aperto}
                            className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                              aperto ? "bg-brand-600 border-brand-600 text-white" : "border-slate-300 text-slate-600 hover:border-brand-400 hover:text-brand-700"
                            }`}
                            title="Superfici derivate, locale non riscaldato, parametri di calcolo"
                          >
                            {nonStandard && !aperto && <span className="mr-1 text-brand-600">●</span>}
                            Dettagli
                          </button>
                          <button onClick={() => rimuovi(a.id)} className="text-slate-400 hover:text-red-600 px-1" title={`Rimuovi ${a.nome}`} aria-label={`Rimuovi ${a.nome}`}>
                            ✕
                          </button>
                        </span>
                      </div>
                    </td>
                  </tr>

                  {messaggiErrore.length > 0 && (
                    <tr className="border-b border-slate-100 bg-red-50/60">
                      <td colSpan={numeroColonne} className="pl-9 pr-2 py-1.5 text-[11px] text-red-700">
                        <span className="sm:sticky sm:left-9">
                        {messaggiErrore.join(" · ")}
                        </span>
                      </td>
                    </tr>
                  )}

                  {aperto && (
                    <tr className="border-b border-slate-200 bg-brand-50/30">
                      <td colSpan={numeroColonne} className="pl-9 pr-2 pb-4 pt-2">
                        {/* Il pannello resta ancorato a sinistra e largo quanto l'area visibile,
                            così si legge per intero anche con la tabella scorsa in orizzontale. */}
                        <div className="sm:sticky sm:left-9 max-w-[calc(100vw-6rem)] lg:max-w-5xl">
                          <AmbienteDettagli ambiente={a} onChange={(nuovo) => aggiorna(a.id, nuovo)} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50 text-sm">
              <td className={`${cella} pl-3 py-2 font-semibold text-slate-700 z-10 bg-slate-50 whitespace-nowrap ${fissaSinistra}`}>
                Totale · {ambienti.length} {ambienti.length === 1 ? "ambiente" : "ambienti"}
              </td>
              <td className={cella} colSpan={4}>
              </td>
              <td className={`${cella} py-2 text-right tabular-nums font-semibold text-slate-700`}>{totaleSuperficie.toFixed(2)}</td>
              <td colSpan={7} className={`${cella} py-2 text-[11px] text-slate-400`}>
                {!comune
                  ? "Seleziona il comune per vedere i carichi"
                  : !totaliCompleti
                  ? "Totale parziale: correggi le righe in rosso"
                  : sfasamentoEstivo
                  ? `Estivo: massimo alle ${estivoEdificio.oraDiPunta}:00, non la somma della colonna — gli ambienti non vanno in punta alla stessa ora`
                  : "Invernale: somma dei carichi. Estivo: massimo della somma ora per ora"}
              </td>
              <td className={`${cella} pr-3 py-2 z-10 bg-slate-50 ${fissaDestra}`}>
                <div className="flex items-center gap-1">
                  <span className="w-14 text-right tabular-nums font-bold text-sky-800">{comune ? totaleInvernale.toFixed(2) : "—"}</span>
                  <span className="w-14 text-right tabular-nums font-bold text-amber-800">{comune ? totaleEstivo.toFixed(2) : "—"}</span>
                  <span className="w-[5.5rem]" />
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-t border-slate-100">
        <button
          onClick={aggiungi}
          className="text-sm font-medium px-3 py-1.5 rounded-lg border-2 border-dashed border-slate-300 text-slate-600 hover:border-brand-400 hover:text-brand-700 transition focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          + Aggiungi ambiente
        </button>
        <span className="text-[11px] text-slate-400">
          {haColonneNascoste && <span className="text-brand-700 font-medium">Scorri la tabella in orizzontale per vedere tutte le colonne ⟷ · </span>}
          Celle gialle: valore convenzionale da confermare · <span className="text-brand-600">●</span> ambiente con parametri modificati
        </span>
      </div>
    </div>
  );
}
