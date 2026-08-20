/**
 * prezziEnergia.js — Prezzi medi indicativi dei vettori energetici, usati
 * per tradurre i consumi stimati in costo annuo e per il confronto tra
 * impianti. PLACEHOLDER: sostituire con valori aggiornati o con il
 * prezzo realmente pagato dal cliente, se noto.
 */
export const PREZZO_KWH_ELETTRICO = 0.28; // €/kWh
export const PREZZO_KWH_GAS = 0.12; // €/kWh termico da gas naturale
export const PREZZO_KWH_GASOLIO = 0.14; // €/kWh termico da gasolio

export function prezzoPerFonte(fonte) {
  if (fonte === "gas") return PREZZO_KWH_GAS;
  if (fonte === "gasolio") return PREZZO_KWH_GASOLIO;
  return PREZZO_KWH_ELETTRICO;
}
