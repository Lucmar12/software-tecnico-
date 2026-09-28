/**
 * confrontoMonoMulti.js — Confronto economico fra impianto a monosplit e
 * impianto multisplit, a parità di ambienti serviti.
 *
 * PERCHÉ ESISTE. La scelta fra un motore per stanza e un motore solo per
 * tutta la casa era un interruttore senza criterio: il software partiva
 * da "split indipendenti" e non diceva perché. Con il listino reale il
 * confronto si può fare con i numeri, ed è quasi sempre la domanda che
 * l'utente si sta ponendo davvero.
 *
 * COSA CONFRONTA
 *   mono   una macchina completa per ambiente, dimensionata sul carico di
 *          quell'ambiente. Tante unità esterne quante sono le stanze.
 *   multi  un'unità interna per ambiente più UNA unità esterna,
 *          dimensionata sul carico simultaneo dell'edificio (vedi
 *          utils/profiliOrari.js: gli ambienti non vanno in punta alla
 *          stessa ora, quindi l'esterna è più piccola della somma).
 *
 * COSA NON DECIDE. Il prezzo e il numero di motori esterni sono dati; ma
 * quanti posti ci siano fuori per appoggiarli, se il condominio lo
 * consenta e che aspetto debba avere la facciata, il software non lo sa.
 * Per questo restituisce numeri e non una raccomandazione: la riga
 * "quante unità esterne" serve proprio a far ragionare su quello.
 */
import { CATALOGO_PRODOTTI } from "../data/catalogo.js";

/** La più piccola unità che copre il fabbisogno, fra quelle date. */
function piuPiccolaCheCopre(prodotti, fabbisognoKw) {
  const idonei = prodotti.filter((p) => p.potenzaKw >= fabbisognoKw);
  if (idonei.length === 0) return null;
  return idonei.reduce((migliore, p) => (p.potenzaKw < migliore.potenzaKw ? p : migliore));
}

/**
 * Impianto a monosplit: una macchina completa per ambiente.
 *
 * @param {Array<{ambiente:object, fabbisognoDimensionamento:number}>} risultatiAmbienti
 * @param {string} tipologiaTerminale
 * @param {string|null} livello  livello di gamma, per confrontare mele con mele
 */
export function componiImpiantoMonosplit(risultatiAmbienti, tipologiaTerminale = "parete", livello = null) {
  const candidati = CATALOGO_PRODOTTI.filter(
    (p) =>
      p.tipo === "climatizzatore_split" &&
      p.tipologiaTerminale === tipologiaTerminale &&
      (livello ? p.livello === livello : true)
  );

  const macchine = risultatiAmbienti.map((r) => ({
    ambiente: r.ambiente?.nome ?? "",
    fabbisognoKw: r.fabbisognoDimensionamento,
    prodotto: piuPiccolaCheCopre(candidati, r.fabbisognoDimensionamento),
  }));

  const completo = macchine.every((m) => m.prodotto);
  return {
    configurazione: "mono",
    completo,
    macchine,
    unitaEsterne: risultatiAmbienti.length,
    prezzoTotale: completo ? macchine.reduce((s, m) => s + m.prodotto.prezzoIndicativoMin, 0) : null,
  };
}

/**
 * Impianto multisplit: un'unità interna per ambiente più un'unica unità
 * esterna, scelta sul carico simultaneo dell'edificio e con attacchi
 * sufficienti per tutte le stanze.
 *
 * @param {number} fabbisognoEdificioKw  carico simultaneo, non la somma dei picchi
 */
export function componiImpiantoMultisplit(risultatiAmbienti, fabbisognoEdificioKw, tipologiaTerminale = "parete", livello = null) {
  const interneCandidate = CATALOGO_PRODOTTI.filter(
    (p) =>
      p.tipo === "unita_interna_multi" &&
      p.tipologiaTerminale === tipologiaTerminale &&
      (livello ? p.livello === livello : true)
  );

  const interne = risultatiAmbienti.map((r) => ({
    ambiente: r.ambiente?.nome ?? "",
    fabbisognoKw: r.fabbisognoDimensionamento,
    prodotto: piuPiccolaCheCopre(interneCandidate, r.fabbisognoDimensionamento),
  }));

  const esterneIdonee = CATALOGO_PRODOTTI.filter(
    (p) => p.tipo === "vrf" && p.maxUnitaInterne >= risultatiAmbienti.length && p.potenzaKw >= fabbisognoEdificioKw
  );
  // Fra le esterne che bastano si prende la meno cara: sono tutte
  // adeguate, quindi pagarne una più grande non aggiunge nulla.
  const esterna = esterneIdonee.length > 0 ? esterneIdonee.reduce((migliore, p) => (p.prezzoIndicativoMin < migliore.prezzoIndicativoMin ? p : migliore)) : null;

  const completo = interne.every((i) => i.prodotto) && Boolean(esterna);
  return {
    configurazione: "multi",
    completo,
    interne,
    esterna,
    unitaEsterne: 1,
    fabbisognoEdificioKw,
    prezzoInterne: interne.every((i) => i.prodotto) ? interne.reduce((s, i) => s + i.prodotto.prezzoIndicativoMin, 0) : null,
    prezzoTotale: completo ? interne.reduce((s, i) => s + i.prodotto.prezzoIndicativoMin, 0) + esterna.prezzoIndicativoMin : null,
    // Perché nessuna esterna basta: sono due impedimenti diversi e vanno
    // distinti, perché uno si risolve dividendo l'impianto e l'altro no.
    motivoIndisponibilita: esterna
      ? null
      : CATALOGO_PRODOTTI.some((p) => p.tipo === "vrf" && p.maxUnitaInterne >= risultatiAmbienti.length)
      ? "potenza"
      : "attacchi",
  };
}

/**
 * Confronto completo fra le due strade. Restituisce entrambe le
 * configurazioni e la differenza di prezzo, senza indicare una vincente.
 */
export function confrontaMonoMulti({ risultatiAmbienti, fabbisognoEdificioKw, tipologiaTerminale = "parete", livello = null }) {
  const numeroAmbienti = risultatiAmbienti.length;
  // Con un solo ambiente il multisplit non è una strada: esiste per
  // servirne più di uno da un motore solo.
  if (numeroAmbienti < 2) return null;

  const mono = componiImpiantoMonosplit(risultatiAmbienti, tipologiaTerminale, livello);
  const multi = componiImpiantoMultisplit(risultatiAmbienti, fabbisognoEdificioKw, tipologiaTerminale, livello);

  const confrontabili = mono.completo && multi.completo;
  return {
    numeroAmbienti,
    mono,
    multi,
    confrontabili,
    differenzaPrezzo: confrontabili ? multi.prezzoTotale - mono.prezzoTotale : null,
    piuEconomico: confrontabili ? (multi.prezzoTotale < mono.prezzoTotale ? "multi" : "mono") : null,
    motoriRisparmiati: numeroAmbienti - 1,
  };
}
