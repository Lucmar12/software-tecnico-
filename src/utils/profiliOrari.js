/**
 * profiliOrari.js — Andamento orario del carico estivo.
 *
 * PERCHÉ ESISTE. Il carico estivo di un ambiente non è un numero unico:
 * cambia ora per ora, perché cambiano l'irraggiamento sulla sua parete e
 * la temperatura esterna. Una stanza a est va in punta a metà mattina,
 * una a ovest nel tardo pomeriggio. Sommare i due picchi come se fossero
 * simultanei descrive una condizione che non si verifica mai e
 * sovrastima l'impianto — l'errore è lo stesso che si commetteva
 * sommando il massimo stagionale dei singoli ambienti per il generatore
 * centralizzato (vedi utils/fabbisognoImpianto.js), un livello più sotto.
 *
 * COSA FA. Calcola il carico a più ore della giornata e prende il
 * massimo: per il singolo ambiente è la sua ora di punta, per l'edificio
 * l'ora in cui la SOMMA è massima, che di norma non coincide con l'ora
 * di punta di nessuno dei suoi ambienti.
 *
 * LIMITI DICHIARATI. Non è un calcolo orario completo: non c'è inerzia
 * termica, quindi nessun ritardo fra irraggiamento sulla parete e carico
 * in ambiente (per murature pesanti il picco reale arriva più tardi e
 * più smussato), e i profili sono forme convenzionali per il centro
 * Italia in luglio, non irraggiamenti calcolati per latitudine e giorno.
 * Resta un pre-dimensionamento, ma smette di sommare condizioni
 * incompatibili fra loro.
 */

/** Ore solari a cui si valuta il carico. */
export const ORE_DI_CALCOLO = [8, 10, 12, 14, 16, 18];

/**
 * Quota dell'irraggiamento di picco che colpisce una parete verticale a
 * ciascuna ora, per esposizione (1,00 = valore di picco della stessa
 * esposizione, quello tabellato in APPORTO_SOLARE).
 *
 * Le forme riflettono il moto apparente del sole alle latitudini
 * italiane in luglio: est massimo a metà mattina, sud a mezzogiorno,
 * ovest nel tardo pomeriggio; nord riceve quasi solo diffusa, con un
 * andamento piatto che segue l'altezza del sole.
 */
export const QUOTA_IRRAGGIAMENTO = {
  est: { 8: 1.0, 10: 0.75, 12: 0.35, 14: 0.25, 16: 0.22, 18: 0.18 },
  sud: { 8: 0.45, 10: 0.8, 12: 1.0, 14: 0.8, 16: 0.45, 18: 0.2 },
  ovest: { 8: 0.18, 10: 0.22, 12: 0.35, 14: 0.75, 16: 1.0, 18: 0.7 },
  nord: { 8: 0.55, 10: 0.8, 12: 1.0, 14: 0.9, 16: 0.7, 18: 0.5 },
};

/**
 * Quota dell'escursione termica giornaliera di cui la temperatura
 * esterna resta sotto il massimo, a ciascuna ora. Il massimo si colloca
 * verso le 16, non a mezzogiorno: l'aria continua a scaldarsi finché
 * l'apporto solare supera le dispersioni.
 *
 * temperatura(ora) = tbse − escursione × quota(ora)
 */
export const QUOTA_ESCURSIONE = { 8: 0.75, 10: 0.45, 12: 0.2, 14: 0.05, 16: 0, 18: 0.1 };

/** Escursione termica giornaliera assunta quando il comune non la riporta [K]. */
export const ESCURSIONE_DEFAULT_K = 10;

/** Quota di irraggiamento per esposizione e ora (1 = picco dell'esposizione). */
export function quotaIrraggiamento(esposizione, ora) {
  const profilo = QUOTA_IRRAGGIAMENTO[esposizione] || QUOTA_IRRAGGIAMENTO.sud;
  return profilo[ora] ?? 0;
}

/** Temperatura esterna alla data ora [°C], dal massimo di progetto e dall'escursione. */
export function temperaturaEsternaOraria(tbse, escursione, ora) {
  const delta = Number.isFinite(Number(escursione)) ? Number(escursione) : ESCURSIONE_DEFAULT_K;
  return tbse - delta * (QUOTA_ESCURSIONE[ora] ?? 0);
}

/**
 * Carico estivo dell'edificio ora per ora: somma dei carichi dei singoli
 * ambienti alla stessa ora. È il modo corretto di totalizzare, e il
 * motivo per cui ogni ambiente porta con sé il proprio profilo.
 *
 * @param {Array<{profiloEstivo: Array<{ora:number, kw:number}>}>} risultatiAmbienti
 * @returns {{profilo: Array<{ora:number, kw:number}>, massimoKw:number, oraDiPunta:number|null,
 *            sommaPicchiKw:number, riduzionePerContemporaneitaPct:number}}
 */
export function profiloEstivoEdificio(risultatiAmbienti) {
  const profilo = ORE_DI_CALCOLO.map((ora, indice) => ({
    ora,
    kw: risultatiAmbienti.reduce((somma, r) => somma + (r.profiloEstivo?.[indice]?.kw ?? 0), 0),
  }));

  const punta = profilo.reduce((migliore, voce) => (migliore == null || voce.kw > migliore.kw ? voce : migliore), null);
  const sommaPicchiKw = risultatiAmbienti.reduce((somma, r) => somma + (r.estivoKw ?? 0), 0);
  const massimoKw = punta ? punta.kw : 0;

  return {
    profilo,
    massimoKw,
    oraDiPunta: punta ? punta.ora : null,
    // Conservata per trasparenza in relazione: quanta potenza si sarebbe
    // installata sommando i picchi dei singoli ambienti.
    sommaPicchiKw,
    riduzionePerContemporaneitaPct: sommaPicchiKw > 0 ? (1 - massimoKw / sommaPicchiKw) * 100 : 0,
  };
}
