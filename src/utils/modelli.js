/**
 * modelli.js — Factory e costanti di interfaccia per le entità applicative
 * (ambiente, scenario, lead). Le costanti di calcolo restano in
 * data/calculations.js; qui vivono solo le liste di opzioni per i form.
 */
import { ETICHETTE_EPOCA, ETICHETTE_TIPO_LOCALE } from "../data/calculations.js";
import { CAMPI_STIMABILI, CONFIGURAZIONE_PARETI_DEFAULT, applicaStime } from "./stime.js";

export const OPZIONI_ESPOSIZIONE = [
  { value: "nord", label: "Nord" },
  { value: "sud", label: "Sud" },
  { value: "est", label: "Est" },
  { value: "ovest", label: "Ovest" },
];

export const OPZIONI_EPOCA = Object.keys(ETICHETTE_EPOCA).map((value) => ({
  value,
  label: ETICHETTE_EPOCA[value],
}));

export const OPZIONI_TIPO_LOCALE = Object.keys(ETICHETTE_TIPO_LOCALE).map((value) => ({
  value,
  label: ETICHETTE_TIPO_LOCALE[value],
}));

function generaId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Un ambiente nasce con i dati geometrici che l'utente non ha modo di
 * misurare (muri esterni, finestre, occupanti) già stimati a partire da
 * superficie, altezza, pareti esposte e destinazione d'uso: il calcolo
 * è quindi disponibile fin dal primo istante e l'utente lavora per
 * correzione, non per compilazione a vuoto. I campi stimati restano
 * elencati in `campiStimati` finché non vengono inseriti a mano.
 */
export function nuovoAmbiente(overrides = {}) {
  return applicaStime({
    id: generaId(),
    nome: "Nuovo ambiente",
    // La geometria si descrive con i lati: la superficie ne deriva.
    lunghezzaM: 5,
    larghezzaM: 4,
    superficiePavimento: 20,
    altezza: 2.7,
    paretiEsterne: CONFIGURAZIONE_PARETI_DEFAULT,
    numeroFinestre: 1,
    tipoFinestra: "portafinestraDue",
    superficieMuriEsterni: 0,
    superficieFinestre: 0,
    esposizionePrevalente: "sud",
    ultimoPiano: false,
    pianoTerra: false,
    epocaCostruttiva: "1991-2005",
    numeroOccupanti: 0,
    tipoLocale: "soggiorno",
    pareteVersoNonRiscaldato: false,
    frazioneSuperficieNonRiscaldata: 30,
    campiStimati: [...CAMPI_STIMABILI],
    trasmittanzeOverride: null,
    teInvOverride: null,
    tbseOverride: null,
    ...overrides,
  });
}

/**
 * Aggiorna un campo dell'ambiente. Se il campo era ricavato in automatico,
 * l'inserimento manuale lo toglie dal ricalcolo; le derivazioni ancora
 * attive vengono comunque ricalcolate, perché il campo modificato può
 * esserne una sorgente (lati, altezza, lati esposti, serramenti, tipo
 * di locale). Unico punto di modifica, condiviso da tabella e dettagli.
 */
export function aggiornaCampoAmbiente(ambiente, campo, valore) {
  const campiStimati = (ambiente.campiStimati || []).filter((c) => c !== campo);
  return applicaStime({ ...ambiente, [campo]: valore, campiStimati });
}

/** Rimette un campo sotto il calcolo automatico. */
export function ripristinaCalcoloAutomatico(ambiente, campo) {
  const campiStimati = [...new Set([...(ambiente.campiStimati || []), campo])];
  return applicaStime({ ...ambiente, campiStimati });
}

/** Posizione in edificio come valore unico ("terra" | "intermedio" | "ultimo"). */
export function pianoAmbiente(ambiente) {
  return ambiente.ultimoPiano ? "ultimo" : ambiente.pianoTerra ? "terra" : "intermedio";
}

export function impostaPianoAmbiente(ambiente, piano) {
  return { ...ambiente, ultimoPiano: piano === "ultimo", pianoTerra: piano === "terra" };
}

export function nuovoScenario(nome = "Stato di fatto", ambienti = null) {
  return {
    id: generaId(),
    nome,
    ambienti: ambienti || [nuovoAmbiente({ nome: "Soggiorno" })],
  };
}

import { DUREZZA_INGRESSO_DEFAULT_GF, DUREZZA_RESIDUA_DEFAULT_GF, CONSUMO_LITRI_PERSONA_GIORNO_DEFAULT, AUTONOMIA_GIORNI_DEFAULT } from "./addolcitore.js";
import { PRESSIONE_RESIDUA_MINIMA_BAR_DEFAULT, PERDITE_CARICO_PCT_DEFAULT, NUMERO_BAGNI_DEFAULT } from "./pompeIdrauliche.js";

export function nuovoTrattamentoAcque(overrides = {}) {
  return {
    numeroPersone: 3,
    // La portata di punta si ricava dagli apparecchi, con lo stesso metodo
    // UNI 9182 dell'autoclave: l'impianto idrico della casa è uno solo.
    numeroBagni: NUMERO_BAGNI_DEFAULT,
    haLavatrice: true,
    durezzaIngressoGf: DUREZZA_INGRESSO_DEFAULT_GF,
    durezzaResiduaGf: DUREZZA_RESIDUA_DEFAULT_GF,
    consumoLitriPersonaGiorno: CONSUMO_LITRI_PERSONA_GIORNO_DEFAULT,
    autonomiaGiorniTarget: AUTONOMIA_GIORNI_DEFAULT,
    ...overrides,
  };
}

export function nuovaPompeIdrauliche(overrides = {}) {
  return {
    autoclave: {
      numeroPersone: 3,
      numeroPiani: 2,
      // La portata di punta si ricava dagli apparecchi installati (UNI 9182), non dal consumo giornaliero.
      numeroBagni: NUMERO_BAGNI_DEFAULT,
      haLavatrice: true,
      pressioneResiduaBar: PRESSIONE_RESIDUA_MINIMA_BAR_DEFAULT,
      perditeCaricoPct: PERDITE_CARICO_PCT_DEFAULT,
      consumoLitriPersonaGiorno: CONSUMO_LITRI_PERSONA_GIORNO_DEFAULT,
    },
    sollevamento: { attivo: false, dislivelloM: 3, portataMc: 2 },
    circolazione: { attivo: false, lunghezzaTubazioniM: 15 },
    ...overrides,
  };
}

export function cloneScenario(scenario, nuovoNome) {
  return {
    id: generaId(),
    nome: nuovoNome,
    ambienti: scenario.ambienti.map((a) => ({ ...a, id: generaId(), campiStimati: [...(a.campiStimati || [])] })),
  };
}
