/**
 * colonneAmbienti.js — Definizione unica delle colonne della tabella
 * degli ambienti.
 *
 * Intestazioni e legenda nascono da qui. Tenerle separate significherebbe
 * che prima o poi divergono: si rinomina una colonna e la legenda continua
 * a spiegarne un'altra, che è peggio di non averla. Un controllo in
 * verifica/motore.mjs pretende che ogni colonna abbia significato e
 * origine dichiarati.
 *
 * `origine` dice all'utente da dove viene il numero che ha davanti, che è
 * la domanda che conta quando si legge una tabella tecnica:
 *   - "inserito"      lo scrivi tu;
 *   - "calcolato"     deriva esattamente da quello che hai inserito;
 *   - "convenzionale" è un valore assunto in mancanza del dato reale, da
 *                     confermare (in tabella ha la cella gialla).
 */

export const COLONNE_AMBIENTI = [
  {
    chiave: "nome",
    intestazione: "Ambiente",
    origine: "inserito",
    significato: "Nome della stanza, come la chiami tu: serve a riconoscerla in tabella e nella relazione.",
  },
  {
    chiave: "tipoLocale",
    intestazione: "Tipo",
    origine: "inserito",
    significato:
      "Destinazione d'uso del locale. Determina i ricambi d'aria convenzionali (UNI 10339: un bagno ne richiede quattro volte un soggiorno) e il numero di persone assunto.",
  },
  {
    chiave: "lunghezza",
    intestazione: "Lungh.",
    unita: "m",
    origine: "inserito",
    significato: "Il lato più lungo della stanza, misurato all'interno.",
  },
  {
    chiave: "larghezza",
    intestazione: "Largh.",
    unita: "m",
    origine: "inserito",
    significato: "Il lato più corto della stanza, misurato all'interno.",
  },
  {
    chiave: "altezza",
    intestazione: "Alt.",
    unita: "m",
    origine: "inserito",
    significato: "Altezza interna, da pavimento a soffitto. Con la superficie dà il volume d'aria da riscaldare o raffrescare.",
  },
  {
    chiave: "superficie",
    intestazione: "Sup.",
    unita: "m²",
    origine: "calcolato",
    significato: "Superficie di pavimento: lunghezza × larghezza.",
  },
  {
    chiave: "paretiEsterne",
    intestazione: "Lati esterni",
    origine: "inserito",
    significato:
      "Quali lati della stanza confinano con l'esterno. Da qui esce la superficie delle pareti che disperdono: è il motivo per cui si chiedono i due lati e non i metri quadri.",
  },
  {
    chiave: "numeroFinestre",
    intestazione: "Finestre",
    origine: "inserito",
    significato: "Quante finestre e portefinestre ci sono nell'ambiente.",
  },
  {
    chiave: "tipoFinestra",
    intestazione: "Serramento",
    origine: "inserito",
    significato:
      "Misura del serramento prevalente. Numero × superficie del tipo scelto dà la superficie vetrata, che pesa sia d'inverno (il vetro disperde più del muro) sia d'estate (il sole entra dal vetro).",
  },
  {
    chiave: "esposizione",
    intestazione: "Esposizione",
    origine: "inserito",
    significato:
      "Orientamento prevalente della parete esterna. Decide quanto sole prende l'ambiente e a che ora: est a metà mattina, sud a mezzogiorno, ovest nel tardo pomeriggio.",
  },
  {
    chiave: "piano",
    intestazione: "Piano",
    origine: "inserito",
    significato:
      "Posizione nell'edificio. Il piano terra aggiunge la dispersione verso il terreno, l'ultimo piano quella verso la copertura: a parità di tutto il resto disperdono più di un piano intermedio.",
  },
  {
    chiave: "epoca",
    intestazione: "Costruito",
    origine: "inserito",
    significato:
      "Epoca di costruzione. In assenza di una diagnosi energetica fissa le trasmittanze di riferimento di muri, tetto, pavimento e vetri: una casa di prima del 1975 disperde circa cinque volte una post 2015.",
  },
  {
    chiave: "numeroOccupanti",
    intestazione: "Persone",
    origine: "convenzionale",
    significato:
      "Quante persone si considerano presenti nell'ambiente. Ognuna cede circa 130 W, quindi incide sul carico estivo e non su quello invernale. È dedotto dal tipo di locale e dalla superficie finché non inserisci il numero reale: per questo la cella è gialla.",
  },
  {
    chiave: "invernale",
    intestazione: "Inverno",
    unita: "kW",
    origine: "calcolato",
    significato:
      "Potenza necessaria a mantenere 20 °C nel giorno più freddo di progetto (UNI EN 12831): dispersioni attraverso muri, vetri, tetto e pavimento, più l'aria di rinnovo.",
  },
  {
    chiave: "estivo",
    intestazione: "Estate",
    unita: "kW",
    origine: "calcolato",
    significato:
      "Potenza necessaria a mantenere 26 °C nell'ora peggiore della giornata (metodo Carrier): sole dai vetri, calore attraverso le pareti, persone, apparecchiature e aria di rinnovo, questa sia raffreddata sia deumidificata.",
  },
];

/** Convenzioni grafiche della tabella, spiegate insieme alle colonne. */
export const CONVENZIONI_TABELLA = [
  { segno: "giallo", testo: "Cella gialla: valore convenzionale, assunto in mancanza del dato reale. Sovrascrivilo se lo conosci." },
  { segno: "rosso", testo: "Cella rossa: valore non valido. Il motivo compare in rosso sotto la riga e il calcolo di quell'ambiente resta sospeso." },
  { segno: "pallino", testo: "Pallino accanto a Dettagli: ambiente con coefficienti di calcolo modificati a mano, segnalato anche in relazione." },
  {
    segno: "totale",
    testo:
      "Il totale estivo non è la somma della colonna: gli ambienti non vanno in punta alla stessa ora, quindi si somma ora per ora e si prende il massimo.",
  },
];

/** Intestazione completa di una colonna, unità compresa. */
export function intestazioneColonna(colonna) {
  return colonna.unita ? `${colonna.intestazione} [${colonna.unita}]` : colonna.intestazione;
}
