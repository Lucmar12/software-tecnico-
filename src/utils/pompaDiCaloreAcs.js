/**
 * pompaDiCaloreAcs.js — Dimensionamento della potenza termica necessaria
 * per la produzione di ACS tramite pompa di calore: scaldacqua a pompa
 * di calore integrato (accumulo + pompa di calore nello stesso
 * apparecchio) o bollitore con pompa di calore dedicata (accumulo puro
 * abbinato a una pompa di calore aria-acqua separata).
 *
 * METODOLOGIA: a differenza del fabbisogno di ACS (UNI 9182, già
 * calcolato in calcolaBollitore), la potenza della pompa di calore non è
 * data da una norma specifica: si ricava da un bilancio energetico
 * elementare — l'energia termica necessaria per portare l'intero volume
 * di accumulo dalla temperatura di rete al set-point, distribuita sul
 * tempo di ricarica ritenuto accettabile per l'utenza (tipicamente nelle
 * ore notturne/di minor prelievo). È pratica di dimensionamento
 * corrente, non un calcolo esecutivo: la selezione finale del modello
 * resta soggetta alle curve di resa reali del produttore alla
 * temperatura dell'aria esterna di progetto.
 */

/**
 * Salto termico convenzionale per il riscaldamento dell'ACS, da
 * temperatura di rete a set-point [K]. Allineato allo stesso ΔT=30K già
 * usato in calcolaBollitore (data/calculations.js) per il fabbisogno
 * energetico annuo: la stessa grandezza fisica (riscaldamento dell'ACS)
 * deve usare lo stesso ΔT ovunque nell'applicazione.
 */
export const DELTA_T_ACS_DEFAULT = 30;
/** Tempo di ricarica convenzionale dell'accumulo, tipicamente nelle ore di minor prelievo [h]. */
export const TEMPO_RICARICA_DEFAULT_ORE = 6;
/** COP tipico di uno scaldacqua/pompa di calore per ACS a punto di prova convenzionale (aria esterna ~15°C, mandata ~55°C). */
export const COP_ACS_DEFAULT = 3.2;

/**
 * Potenza termica ed elettrica richieste alla pompa di calore per
 * ricaricare l'accumulo nel tempo desiderato.
 * @param {number} capacitaLitri     Capacità dell'accumulo [l] (da calcolaBollitore)
 * @param {number} tempoRicaricaOre  Tempo di ricarica desiderato [h]
 * @param {number} deltaT            Salto termico di riscaldamento [K]
 * @param {number} cop               Coefficiente di prestazione della pompa di calore
 */
export function calcolaPotenzaPompaCaloreAcs({
  capacitaLitri,
  tempoRicaricaOre = TEMPO_RICARICA_DEFAULT_ORE,
  deltaT = DELTA_T_ACS_DEFAULT,
  cop = COP_ACS_DEFAULT,
}) {
  const energiaTermicaRichiestaKwh = (capacitaLitri * 1.163 * deltaT) / 1000;
  const potenzaTermicaRichiestaKw = energiaTermicaRichiestaKwh / tempoRicaricaOre;
  const potenzaElettricaAssorbitaKw = potenzaTermicaRichiestaKw / cop;
  return { energiaTermicaRichiestaKwh, potenzaTermicaRichiestaKw, potenzaElettricaAssorbitaKw, tempoRicaricaOre, deltaT, cop };
}

/** Consumo elettrico annuo stimato per produzione ACS tramite pompa di calore, a partire dal fabbisogno termico annuo (UNI 9182, calcolaBollitore) e dal COP dichiarato. */
export function calcolaConsumoAnnuoAcsPompaDiCalore(kWhAnnoTermico, cop = COP_ACS_DEFAULT) {
  return kWhAnnoTermico / cop;
}
