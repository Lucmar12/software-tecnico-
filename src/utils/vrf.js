/**
 * vrf.js — Dimensionamento di massima di un sistema VRF/multi-split
 * centralizzato (unità esterna unica per più ambienti).
 *
 * ATTENZIONE METODOLOGICA: a differenza delle formule di calcolaEdificio
 * (UNI EN 12831, metodo Carrier), non esiste una norma unica che fissi il
 * fattore di contemporaneità e le curve di derating per lunghezza
 * tubazioni/dislivello di un sistema VRF: questi dati sono specifici per
 * ciascun produttore e modello e vanno sempre verificati sulla scheda
 * tecnica dell'unità esterna effettivamente selezionata (i valori qui
 * usati sono stime convenzionali di larga massima per un
 * pre-dimensionamento speditivo, non un calcolo esecutivo).
 *
 * Il sistema VRF è inoltre una macchina aria-esterna: oltre al derating
 * per tubazioni/dislivello, la sua capacità resa cala alla temperatura
 * esterna di progetto rispetto al punto di prova standard dichiarato a
 * catalogo (vedi utils/deratingPompaDiCalore.js).
 */
import { calcolaPotenzaNominaleRichiesta } from "./deratingPompaDiCalore.js";

/** Fattore di contemporaneità convenzionale per impianto VRF residenziale (tutti gli ambienti raramente al massimo carico contemporaneamente). */
export const FATTORE_CONTEMPORANEITA_DEFAULT = 0.8;

const LUNGHEZZA_RIFERIMENTO_M = 30; // oltre questa soglia si applica derating per lunghezza tubazioni
const DISLIVELLO_RIFERIMENTO_M = 10; // oltre questa soglia si applica derating per dislivello
const CALO_PERC_PER_METRO_LUNGHEZZA = 0.003; // -0.3%/m oltre soglia — valore indicativo
const CALO_PERC_PER_METRO_DISLIVELLO = 0.005; // -0.5%/m oltre soglia — valore indicativo
const FATTORE_DERATING_MINIMO = 0.5; // sotto questa soglia il pre-dimensionamento non è più attendibile: serve verifica progettuale puntuale

/**
 * Fattore di derating della capacità dell'unità esterna per effetto della
 * lunghezza equivalente delle tubazioni frigorifere e del dislivello tra
 * unità esterna e interne più sfavorita.
 * @returns {number} Fattore moltiplicativo (1 = nessun derating)
 */
export function calcolaFattoreDeratingVRF({ lunghezzaEquivalenteM, dislivelloM }) {
  const eccessoLunghezza = Math.max(0, lunghezzaEquivalenteM - LUNGHEZZA_RIFERIMENTO_M);
  const eccessoDislivello = Math.max(0, Math.abs(dislivelloM) - DISLIVELLO_RIFERIMENTO_M);
  const caloPercentuale = eccessoLunghezza * CALO_PERC_PER_METRO_LUNGHEZZA + eccessoDislivello * CALO_PERC_PER_METRO_DISLIVELLO;
  return Math.max(FATTORE_DERATING_MINIMO, 1 - caloPercentuale);
}

/**
 * Dimensionamento di massima dell'unità esterna VRF a partire dai
 * fabbisogni già calcolati (UNI EN 12831/Carrier) dei singoli ambienti
 * collegati, applicando fattore di contemporaneità, derating per
 * tubazioni/dislivello e derating per temperatura esterna di progetto
 * (rispetto al punto di prova standard a cui è dichiarata la potenza a
 * catalogo).
 *
 * @param {Array<{fabbisognoDimensionamento:number}>} risultatiAmbienti  Risultati di calcolaAmbiente/calcolaAmbienteConOverride
 * @param {{fattoreContemporaneita:number, lunghezzaEquivalenteM:number, dislivelloM:number}} parametri
 * @param {number|null} temperaturaEsternaProgetto  teInv del comune selezionato, per il derating a bassa temperatura
 */
export function calcolaDimensionamentoVRF(risultatiAmbienti, parametri, temperaturaEsternaProgetto = null) {
  const { fattoreContemporaneita = FATTORE_CONTEMPORANEITA_DEFAULT, lunghezzaEquivalenteM, dislivelloM } = parametri;
  const sommaFabbisogniKw = risultatiAmbienti.reduce((s, r) => s + r.fabbisognoDimensionamento, 0);
  const potenzaConContemporaneitaKw = sommaFabbisogniKw * fattoreContemporaneita;
  const fattoreDeratingTubazioni = calcolaFattoreDeratingVRF({ lunghezzaEquivalenteM, dislivelloM });
  const potenzaRichiestaUnitaEsternaKw = potenzaConContemporaneitaKw / fattoreDeratingTubazioni;

  const { fattoreDerating: fattoreDeratingTemperatura, potenzaNominaleRichiestaKw } =
    temperaturaEsternaProgetto != null
      ? calcolaPotenzaNominaleRichiesta(potenzaRichiestaUnitaEsternaKw, temperaturaEsternaProgetto)
      : { fattoreDerating: 1, potenzaNominaleRichiestaKw: potenzaRichiestaUnitaEsternaKw };

  return {
    numeroUnitaInterne: risultatiAmbienti.length,
    sommaFabbisogniKw,
    fattoreContemporaneita,
    potenzaConContemporaneitaKw,
    lunghezzaEquivalenteM,
    dislivelloM,
    fattoreDeratingTubazioni,
    potenzaRichiestaUnitaEsternaKw,
    fattoreDeratingTemperatura,
    potenzaNominaleRichiestaKw,
    derateSignificativo: fattoreDeratingTubazioni < 0.85 || fattoreDeratingTemperatura < 0.85,
  };
}
