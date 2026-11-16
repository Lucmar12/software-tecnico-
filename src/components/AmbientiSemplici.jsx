import React from "react";
import { nuovoAmbiente, aggiornaCampoAmbiente, OPZIONI_EPOCA } from "../utils/modelli.js";
import { validaAmbiente } from "../utils/validazione.js";
import { calcolaAmbienteConOverride } from "../utils/overrides.js";
import { formattaKw } from "../utils/export.js";

/**
 * Le stanze raccontate con domande semplici, per chi non ha mai letto
 * una relazione tecnica. Scrive gli stessi campi della tabella, quindi il
 * calcolo è identico: cambia solo il modo di chiedere.
 *
 * Quello che vale per tutta la casa (epoca, altezza dei soffitti, dove
 * si trova) si chiede una volta sola e si applica a tutte le stanze. Il
 * resto ha valori standard, modificabili nella vista tecnica.
 */

const TIPI = [
  { value: "soggiorno", label: "Soggiorno" },
  { value: "camera", label: "Camera" },
  { value: "cucina", label: "Cucina" },
  { value: "bagno", label: "Bagno" },
  { value: "altro", label: "Altro" },
];

const MURI = [
  { n: 1, value: "latoLungo" },
  { n: 2, value: "angolo" },
  { n: 3, value: "tre" },
  { n: 4, value: "tutti" },
];
const MURI_DA_VALORE = { latoCorto: 1, latoLungo: 1, angolo: 2, tre: 3, tutti: 4 };

const FINESTRE = [
  { value: "piccola", label: "Piccole (bagno)" },
  { value: "dueAnte", label: "Normali" },
  { value: "portafinestraDue", label: "Portefinestre" },
  { value: "vetrata", label: "Grandi vetrate" },
];

const SOLE = [
  { value: "nord", label: "Nord — poco sole" },
  { value: "est", label: "Est — sole al mattino" },
  { value: "sud", label: "Sud — sole quasi tutto il giorno" },
  { value: "ovest", label: "Ovest — sole al pomeriggio" },
];

/** Dove si trova l'abitazione: decide tetto e pavimento verso terra di ogni stanza. */
const POSIZIONI = [
  { value: "intermedio", label: "Appartamento con piani sopra e sotto", ultimo: false, terra: false },
  { value: "terra", label: "Appartamento al piano terra", ultimo: false, terra: true },
  { value: "ultimo", label: "Appartamento all'ultimo piano, sotto il tetto", ultimo: true, terra: false },
  { value: "casaUnPiano", label: "Casa indipendente su un piano", ultimo: true, terra: true },
  { value: "casaDuePiani", label: "Casa indipendente su due piani", duePiani: true },
];

function posizioneDa(ambienti) {
  if (ambienti.length === 0) return "intermedio";
  const tutti = (f) => ambienti.every(f);
  if (tutti((a) => a.ultimoPiano && a.pianoTerra)) return "casaUnPiano";
  if (ambienti.some((a) => a.pianoTerra) && ambienti.some((a) => a.ultimoPiano) && tutti((a) => a.pianoTerra !== a.ultimoPiano))
    return "casaDuePiani";
  if (tutti((a) => a.ultimoPiano && !a.pianoTerra)) return "ultimo";
  if (tutti((a) => a.pianoTerra && !a.ultimoPiano)) return "terra";
  return "intermedio";
}

const grande = "text-base";
const inputCls = `mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 ${grande} focus:outline-none focus:ring-2 focus:ring-brand-400`;

function Scelta({ opzioni, valore, onScegli, piccolo = false }) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {opzioni.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={valore === o.value}
          onClick={() => onScegli(o.value)}
          className={`rounded-lg border-2 ${piccolo ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-base"} ${
            valore === o.value ? "border-brand-500 bg-brand-50 font-semibold" : "border-slate-200 hover:border-slate-300 bg-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Domanda({ testo, aiuto, children, errore }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">{testo}</p>
      {aiuto && <p className="text-xs text-slate-500">{aiuto}</p>}
      {children}
      {errore && <p className="text-sm text-red-600 mt-1">{errore}</p>}
    </div>
  );
}

export default function AmbientiSemplici({ ambienti, onChange, comune }) {
  const primo = ambienti[0];
  const posizione = posizioneDa(ambienti);
  const duePiani = posizione === "casaDuePiani";

  const aggiorna = (id, nuovo) => onChange(ambienti.map((a) => (a.id === id ? nuovo : a)));
  const aTutte = (campo, valore) => onChange(ambienti.map((a) => aggiornaCampoAmbiente(a, campo, valore)));

  const impostaPosizione = (valore) => {
    const p = POSIZIONI.find((x) => x.value === valore);
    onChange(
      ambienti.map((a) => {
        if (p.duePiani) {
          // Le stanze già al piano di sopra restano lì, le altre vanno sotto.
          const sopra = a.ultimoPiano && !a.pianoTerra;
          return { ...a, ultimoPiano: sopra, pianoTerra: !sopra };
        }
        return { ...a, ultimoPiano: p.ultimo, pianoTerra: p.terra };
      })
    );
  };

  const aggiungi = () => {
    const base = primo ?? {};
    const nuovo = nuovoAmbiente({
      nome: `Stanza ${ambienti.length + 1}`,
      tipoLocale: "camera",
      epocaCostruttiva: base.epocaCostruttiva ?? "1991-2005",
      altezza: base.altezza ?? 2.7,
      ultimoPiano: duePiani ? false : base.ultimoPiano ?? false,
      pianoTerra: duePiani ? true : base.pianoTerra ?? false,
    });
    onChange([...ambienti, nuovo]);
  };

  return (
    <div className="space-y-4">
      {/* Domande sulla casa, una volta sola */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        <p className="font-bold text-slate-800 text-lg">La casa</p>
        <Domanda testo="Quando è stata costruita?" aiuto="Se è stata isolata di recente (cappotto, infissi nuovi), scegli un periodo più recente.">
          <Scelta
            piccolo
            opzioni={OPZIONI_EPOCA}
            valore={primo?.epocaCostruttiva}
            onScegli={(v) => aTutte("epocaCostruttiva", v)}
          />
        </Domanda>
        <Domanda testo="Che tipo di abitazione è?">
          <Scelta piccolo opzioni={POSIZIONI} valore={posizione} onScegli={impostaPosizione} />
        </Domanda>
        <Domanda testo="Quanto sono alti i soffitti? (metri)" aiuto="Di solito 2,70. Se il soffitto è inclinato, usa la vista tecnica.">
          <input
            type="number"
            step="0.05"
            min="2"
            className={`${inputCls} max-w-[10rem]`}
            value={primo?.altezza ?? 2.7}
            onChange={(e) => aTutte("altezza", Number(e.target.value))}
          />
        </Domanda>
      </div>

      {/* Una scheda per stanza */}
      {ambienti.map((a, i) => {
        const errori = validaAmbiente(a);
        const valido = Object.keys(errori).length === 0;
        const calcolo = valido && comune ? calcolaAmbienteConOverride(a, comune) : null;
        const set = (campo, valore) => aggiorna(a.id, aggiornaCampoAmbiente(a, campo, valore));
        const scegliTipo = (tipo) => {
          // Il nome segue il tipo finché non è stato scritto a mano.
          const nomeGenerico = /^(Stanza|Ambiente|Nuovo ambiente) ?\d*$/.test(a.nome) || TIPI.some((t) => t.label === a.nome);
          const conTipo = aggiornaCampoAmbiente(a, "tipoLocale", tipo);
          aggiorna(a.id, nomeGenerico ? { ...conTipo, nome: TIPI.find((t) => t.value === tipo).label } : conTipo);
        };
        return (
          <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-brand-600 text-white text-sm font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <input
                className={`flex-1 border-b-2 border-slate-200 focus:border-brand-500 outline-none text-lg font-bold text-slate-800 py-1`}
                value={a.nome}
                aria-label="Nome della stanza"
                onChange={(e) => set("nome", e.target.value)}
              />
              {ambienti.length > 1 && (
                <button type="button" onClick={() => onChange(ambienti.filter((x) => x.id !== a.id))} className="text-sm text-slate-500 hover:text-red-600 px-2 py-1">
                  Togli
                </button>
              )}
            </div>

            <Domanda testo="Che stanza è?">
              <Scelta piccolo opzioni={TIPI} valore={a.tipoLocale} onScegli={scegliTipo} />
            </Domanda>

            <Domanda testo="Quanto è grande? (metri)" errore={errori.lunghezzaM || errori.larghezzaM || errori.superficiePavimento}>
              <div className="flex items-center gap-2 mt-1">
                <input type="number" step="0.1" min="0" aria-label="Lunghezza" className={`${inputCls} mt-0 max-w-[7rem]`} value={a.lunghezzaM ?? ""} onChange={(e) => set("lunghezzaM", Number(e.target.value))} />
                <span className="text-lg text-slate-500">×</span>
                <input type="number" step="0.1" min="0" aria-label="Larghezza" className={`${inputCls} mt-0 max-w-[7rem]`} value={a.larghezzaM ?? ""} onChange={(e) => set("larghezzaM", Number(e.target.value))} />
                <span className="text-sm text-slate-500">= {Number(a.superficiePavimento || 0).toLocaleString("it-IT")} m²</span>
              </div>
            </Domanda>

            {duePiani && (
              <Domanda testo="A che piano è?">
                <Scelta
                  piccolo
                  opzioni={[
                    { value: "sotto", label: "Piano di sotto" },
                    { value: "sopra", label: "Piano di sopra" },
                  ]}
                  valore={a.ultimoPiano ? "sopra" : "sotto"}
                  onScegli={(v) => aggiorna(a.id, { ...a, ultimoPiano: v === "sopra", pianoTerra: v === "sotto" })}
                />
              </Domanda>
            )}

            <Domanda testo="Quanti muri danno all'esterno?" aiuto="Conta i muri che hanno fuori l'aperto, non quelli verso un'altra stanza.">
              <Scelta
                opzioni={MURI.map((m) => ({ value: m.value, label: String(m.n) }))}
                valore={MURI.find((m) => m.n === MURI_DA_VALORE[a.paretiEsterne])?.value}
                onScegli={(v) => set("paretiEsterne", v)}
              />
            </Domanda>

            <Domanda testo="Quante finestre ci sono, e come sono?">
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <button type="button" aria-label="Una finestra in meno" className="w-10 h-10 rounded-lg border-2 border-slate-200 text-xl" onClick={() => set("numeroFinestre", Math.max(0, (a.numeroFinestre || 0) - 1))}>
                    −
                  </button>
                  <span className="w-10 text-center text-lg font-semibold tabular-nums">{a.numeroFinestre ?? 0}</span>
                  <button type="button" aria-label="Una finestra in più" className="w-10 h-10 rounded-lg border-2 border-slate-200 text-xl" onClick={() => set("numeroFinestre", (a.numeroFinestre || 0) + 1)}>
                    +
                  </button>
                </div>
                {a.numeroFinestre > 0 && (
                  <Scelta piccolo opzioni={FINESTRE} valore={FINESTRE.some((f) => f.value === a.tipoFinestra) ? a.tipoFinestra : null} onScegli={(v) => set("tipoFinestra", v)} />
                )}
              </div>
              {errori.superficieFinestre && <p className="text-sm text-red-600 mt-1">{errori.superficieFinestre}</p>}
            </Domanda>

            <Domanda testo="Da che parte guardano le finestre?">
              <Scelta piccolo opzioni={SOLE} valore={a.esposizionePrevalente} onScegli={(v) => set("esposizionePrevalente", v)} />
            </Domanda>

            {Object.keys(errori).length > 0 && !errori.lunghezzaM && !errori.larghezzaM && !errori.superficiePavimento && !errori.superficieFinestre && (
              <p className="text-sm text-red-600">{Object.values(errori)[0]}</p>
            )}

            {calcolo && (
              <p className="text-base bg-slate-50 rounded-lg px-3 py-2">
                Per questa stanza servono circa <strong>{formattaKw(calcolo.invernaleKw)}</strong> per scaldare e{" "}
                <strong>{formattaKw(calcolo.estivoKw)}</strong> per rinfrescare.
              </p>
            )}
          </div>
        );
      })}

      <button type="button" onClick={aggiungi} className="w-full rounded-xl border-2 border-dashed border-slate-300 py-3 text-base font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-700">
        + Aggiungi una stanza
      </button>
      {!comune && <p className="text-sm text-amber-700">Scegli il comune qui sopra per vedere quanta potenza serve.</p>}
    </div>
  );
}
