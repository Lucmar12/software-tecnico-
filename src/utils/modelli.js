/**
 * modelli.js — Factory e costanti di interfaccia per le entità applicative
 * (ambiente, scenario, lead). Le costanti di calcolo restano in
 * data/calculations.js; qui vivono solo le liste di opzioni per i form.
 */
import { ETICHETTE_EPOCA, ETICHETTE_TIPO_LOCALE } from "../data/calculations.js";

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

export function nuovoAmbiente(overrides = {}) {
  return {
    id: generaId(),
    nome: "Nuovo ambiente",
    superficiePavimento: 14,
    altezza: 2.7,
    superficieMuriEsterni: 9,
    superficieFinestre: 2,
    esposizionePrevalente: "sud",
    ultimoPiano: false,
    pianoTerra: false,
    epocaCostruttiva: "1991-2005",
    numeroOccupanti: 1,
    tipoLocale: "soggiorno",
    pareteVersoNonRiscaldato: false,
    frazioneSuperficieNonRiscaldata: 30,
    campiStimati: [],
    trasmittanzeOverride: null,
    teInvOverride: null,
    tbseOverride: null,
    ...overrides,
  };
}

export function nuovoScenario(nome = "Stato di fatto", ambienti = null) {
  return {
    id: generaId(),
    nome,
    ambienti: ambienti || [nuovoAmbiente({ nome: "Soggiorno" })],
  };
}

import { DUREZZA_INGRESSO_DEFAULT_GF, DUREZZA_RESIDUA_DEFAULT_GF, CONSUMO_LITRI_PERSONA_GIORNO_DEFAULT, AUTONOMIA_GIORNI_DEFAULT } from "./addolcitore.js";
import { PRESSIONE_RESIDUA_MINIMA_BAR_DEFAULT, PERDITE_CARICO_PCT_DEFAULT } from "./pompeIdrauliche.js";

export function nuovoTrattamentoAcque(overrides = {}) {
  return {
    numeroPersone: 3,
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
