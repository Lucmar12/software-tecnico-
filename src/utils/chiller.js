/**
 * chiller.js — Dimensionamento di massima di un impianto centralizzato a
 * chiller, con distribuzione ad acqua (ventilconvettori o pannelli
 * radianti) verso più ambienti — tipico di ville importanti o edifici
 * plurifamiliari con produzione unica.
 *
 * A differenza del VRF (circuito frigorifero diretto, sensibile a
 * lunghezza tubazioni/dislivello — vedi utils/vrf.js), la distribuzione
 * ad acqua non richiede un derating di questo tipo in fase di
 * pre-dimensionamento: la variabile dominante resta il fattore di
 * contemporaneità tra le utenze servite. Le perdite di carico della rete
 * idraulica e la scelta delle pompe di circolazione restano oggetto della
 * progettazione idraulica esecutiva, non di questo pre-dimensionamento.
 *
 * Il chiller residenziale/plurifamiliare tipico è aria-refrigerato: come
 * il VRF, la sua capacità resa cala alla temperatura esterna di progetto
 * rispetto al punto di prova standard dichiarato a catalogo (vedi
 * utils/deratingPompaDiCalore.js). Per un chiller ad acqua (condensazione
 * su pozzo/falda) questo derating non si applicherebbe: non essendo
 * distinto a catalogo, si assume qui il caso tipico aria-refrigerato.
 */
import { calcolaPotenzaNominaleRichiesta } from "./deratingPompaDiCalore.js";

/** Fattore di contemporaneità convenzionale per impianto a chiller residenziale/plurifamiliare. */
export const FATTORE_CONTEMPORANEITA_CHILLER_DEFAULT = 0.85;

/**
 * Dimensionamento di massima del chiller a partire dai fabbisogni già
 * calcolati (UNI EN 12831/Carrier) dei singoli ambienti serviti,
 * applicando il fattore di contemporaneità e il derating per temperatura
 * esterna di progetto (chiller aria-refrigerato).
 *
 * @param {Array<{fabbisognoDimensionamento:number}>} risultatiAmbienti
 * @param {{fattoreContemporaneita:number}} parametri
 * @param {number|null} temperaturaEsternaProgetto  teInv del comune selezionato, per il derating a bassa temperatura
 */
export function calcolaDimensionamentoChiller(risultatiAmbienti, parametri, temperaturaEsternaProgetto = null) {
  const { fattoreContemporaneita = FATTORE_CONTEMPORANEITA_CHILLER_DEFAULT } = parametri;
  const sommaFabbisogniKw = risultatiAmbienti.reduce((s, r) => s + r.fabbisognoDimensionamento, 0);
  const potenzaRichiestaKw = sommaFabbisogniKw * fattoreContemporaneita;

  const { fattoreDerating: fattoreDeratingTemperatura, potenzaNominaleRichiestaKw } =
    temperaturaEsternaProgetto != null
      ? calcolaPotenzaNominaleRichiesta(potenzaRichiestaKw, temperaturaEsternaProgetto)
      : { fattoreDerating: 1, potenzaNominaleRichiestaKw: potenzaRichiestaKw };

  return {
    numeroTerminali: risultatiAmbienti.length,
    sommaFabbisogniKw,
    fattoreContemporaneita,
    potenzaRichiestaKw,
    fattoreDeratingTemperatura,
    potenzaNominaleRichiestaKw,
  };
}
