/**
 * incentivi.js — Stima indicativa della detrazione fiscale applicabile
 * (Ecobonus/Conto Termico) sul prezzo dell'impianto.
 *
 * ATTENZIONE: le aliquote e i requisiti di accesso agli incentivi
 * cambiano periodicamente per norma di legge (Legge di Bilancio annuale)
 * e dipendono da fattori non verificabili da questo strumento (tipologia
 * di immobile, prima/seconda casa, cumulabilità, rispetto dei requisiti
 * tecnici minimi UNI/TS 11300, ecc.). Il valore qui prodotto è
 * puramente indicativo: l'accesso effettivo va sempre verificato con un
 * commercialista/CAF o con il tecnico abilitato che asseveri l'intervento.
 */

/** Aliquota Ecobonus indicativa di default per sostituzione impianto di climatizzazione con pompa di calore [%]. */
export const ALIQUOTA_ECOBONUS_DEFAULT = 50;

export function calcolaDetrazioneStimata(prezzoInstallato, aliquotaPct = ALIQUOTA_ECOBONUS_DEFAULT) {
  const detrazioneStimata = prezzoInstallato * (aliquotaPct / 100);
  const prezzoNettoStimato = prezzoInstallato - detrazioneStimata;
  return { detrazioneStimata, prezzoNettoStimato, aliquotaPct };
}
