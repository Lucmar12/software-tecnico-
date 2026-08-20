/**
 * co2.js — Stima delle emissioni di CO2 associate al consumo energetico
 * dell'impianto, per il confronto tra scenari (es. stato di fatto vs.
 * riqualificazione) e tra impianto esistente e nuovo impianto.
 *
 * Fattori di emissione medi indicativi (mix elettrico nazionale italiano
 * e combustione gas naturale) — fonte: valori medi di riferimento
 * ISPRA/letteratura tecnica corrente. Da aggiornare periodicamente e da
 * non usare per dichiarazioni ufficiali di risparmio emissivo, per le
 * quali sono richiesti fattori aggiornati all'anno di riferimento.
 */

/** kg di CO2 equivalente per kWh elettrico prelevato dalla rete (mix medio nazionale italiano). */
export const FATTORE_EMISSIONE_ELETTRICO = 0.257;

/** kg di CO2 equivalente per kWh termico prodotto da gas naturale (potere calorifico convenzionale). */
export const FATTORE_EMISSIONE_GAS = 0.202;

/** kg di CO2 equivalente per kWh termico prodotto da gasolio. */
export const FATTORE_EMISSIONE_GASOLIO = 0.267;

export function calcolaCO2Annua(kWhAnno, fonte = "elettrico") {
  const fattore =
    fonte === "gas" ? FATTORE_EMISSIONE_GAS : fonte === "gasolio" ? FATTORE_EMISSIONE_GASOLIO : FATTORE_EMISSIONE_ELETTRICO;
  return kWhAnno * fattore;
}
