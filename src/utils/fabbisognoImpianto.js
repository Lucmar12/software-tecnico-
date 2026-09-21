/**
 * fabbisognoImpianto.js — Fabbisogno che deve coprire un generatore
 * UNICO al servizio di più ambienti (VRF, chiller, pompa di calore
 * centralizzata).
 *
 * METODOLOGIA: la potenza di un generatore centralizzato è il maggiore
 * fra il totale invernale e il totale estivo dell'edificio servito, NON
 * la somma dei massimi stagionali dei singoli ambienti.
 *
 * La differenza non è formale. Sommando ambiente per ambiente il massimo
 * fra inverno ed estate si costruisce una condizione che non esiste:
 * significherebbe che la stanza a nord chiede la sua punta invernale
 * mentre nello stesso istante la stanza a ovest chiede la sua punta
 * estiva. Una macchina sola non lavora in riscaldamento e in
 * raffrescamento contemporaneamente: le due stagioni vanno totalizzate
 * separatamente e poi confrontate. La somma dei massimi è sempre maggiore
 * o uguale al massimo delle somme, quindi l'errore va sistematicamente
 * verso il sovradimensionamento — costo d'acquisto più alto e, con le
 * macchine inverter, funzionamento cronico a carico parziale.
 *
 * Resta invece corretto usare il massimo per ambiente quando la macchina
 * serve QUEL solo ambiente (climatizzatore split): lì la stessa unità
 * deve coprire entrambe le stagioni di quel locale.
 *
 * Lo stesso principio vale dentro la stagione estiva: il totale non è la
 * somma dei picchi dei singoli ambienti, ma il massimo della loro somma
 * ora per ora (vedi utils/profiliOrari.js). Est e ovest non vanno in
 * punta insieme.
 */
import { profiloEstivoEdificio } from "./profiliOrari.js";

/**
 * @param {Array<{invernaleKw:number, estivoKw:number, fabbisognoDimensionamento:number}>} risultatiAmbienti
 * @returns {{totaleInvernaleKw:number, totaleEstivoKw:number, sommaFabbisogniKw:number,
 *            stagioneDimensionante:"invernale"|"estiva",
 *            sommaMassimiPerAmbienteKw:number, sovradimensionamentoEvitatoPct:number}}
 */
export function fabbisognoDiImpianto(risultatiAmbienti) {
  const totaleInvernaleKw = risultatiAmbienti.reduce((s, r) => s + r.invernaleKw, 0);
  const estivo = profiloEstivoEdificio(risultatiAmbienti);
  const totaleEstivoKw = estivo.massimoKw;
  const sommaFabbisogniKw = Math.max(totaleInvernaleKw, totaleEstivoKw);

  // Conservato per trasparenza in relazione: quanto si sarebbe speso in
  // potenza installata sommando i massimi per ambiente.
  const sommaMassimiPerAmbienteKw = risultatiAmbienti.reduce((s, r) => s + r.fabbisognoDimensionamento, 0);

  return {
    totaleInvernaleKw,
    totaleEstivoKw,
    oraDiPuntaEstiva: estivo.oraDiPunta,
    sommaFabbisogniKw,
    stagioneDimensionante: totaleEstivoKw > totaleInvernaleKw ? "estiva" : "invernale",
    sommaMassimiPerAmbienteKw,
    sovradimensionamentoEvitatoPct:
      sommaFabbisogniKw > 0 ? (sommaMassimiPerAmbienteKw / sommaFabbisogniKw - 1) * 100 : 0,
  };
}
