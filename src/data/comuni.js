/**
 * comuni.js — Dataset climatico di riferimento per il dimensionamento
 * degli impianti di climatizzazione residenziale.
 *
 * Riferimenti normativi:
 * - UNI 5364        : temperatura esterna di progetto invernale (teInv)
 * - UNI 10339        : temperatura a bulbo secco estiva (tbse) ed escursione
 *                       termica giornaliera di progetto
 * - DPR 412/93        : zone climatiche comunali (gradi giorno) e periodi
 *                       convenzionali di accensione degli impianti termici
 * - UNI 10349        : metodo di correzione altimetrica della temperatura
 *                       esterna di progetto per comuni non tabellati
 *
 * ATTENZIONE: i valori numerici di questo file sono dati di riferimento
 * normativo/tecnico. NON modificare i valori senza una verifica puntuale
 * sulle tabelle UNI vigenti — un valore alterato invalida ogni calcolo
 * a valle (fabbisogno invernale/estivo, scelta taglia impianto).
 *
 * Struttura dati per ciascuna voce:
 *   nome        : denominazione del comune
 *   zona        : zona climatica DPR 412/93 (A..F)
 *   alt         : altitudine sul livello del mare [m]
 *   teInv       : temperatura esterna di progetto invernale [°C]
 *   fonteInv    : "UNI5364" (valore diretto da tabella) | "derivata" (per
 *                  analogia da un capoluogo limitrofo, con correzione
 *                  UNI 10349)
 *   tbse        : temperatura a bulbo secco estiva di progetto [°C]
 *   escursione  : escursione termica giornaliera estiva di progetto [°C]
 *   fonteEst    : "UNI10339" (valore diretto da tabella) | "derivata"
 */

// ---------------------------------------------------------------------
// LIVELLO 1 — Capoluoghi di provincia (108 voci)
// Valori diretti da UNI 5364 / UNI 10339 dove disponibili; "derivata" per
// i capoluoghi non presenti nelle tabelle originarie (calcolati per
// analogia da un capoluogo vicino, con correzione UNI 10349).
// ---------------------------------------------------------------------
export const COMUNI = [
  { nome: "Agrigento", zona: "B", alt: 230, teInv: 3, fonteInv: "UNI5364", tbse: 32.5, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Alessandria", zona: "E", alt: 95, teInv: -8, fonteInv: "UNI5364", tbse: 30.5, escursione: 11.0, fonteEst: "UNI10339" },
  { nome: "Ancona", zona: "D", alt: 16, teInv: -2, fonteInv: "UNI5364", tbse: 31.0, escursione: 13.5, fonteEst: "UNI10339" },
  { nome: "Aosta", zona: "E", alt: 583, teInv: -10, fonteInv: "UNI5364", tbse: 29.0, escursione: 13.0, fonteEst: "UNI10339" },
  { nome: "Arezzo", zona: "E", alt: 246, teInv: 0, fonteInv: "UNI5364", tbse: 31.5, escursione: 12.0, fonteEst: "UNI10339" },
  { nome: "Ascoli Piceno", zona: "D", alt: 154, teInv: -2, fonteInv: "UNI5364", tbse: 33.0, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Asti", zona: "E", alt: 123, teInv: -8, fonteInv: "UNI5364", tbse: 32.0, escursione: 11.0, fonteEst: "UNI10339" },
  { nome: "Avellino", zona: "D", alt: 348, teInv: -2, fonteInv: "UNI5364", tbse: 30.0, escursione: 11.0, fonteEst: "UNI10339" },
  { nome: "Bari", zona: "C", alt: 5, teInv: 0, fonteInv: "UNI5364", tbse: 32.0, escursione: 8.0, fonteEst: "UNI10339" },
  { nome: "Barletta-Andria-Trani", zona: "C", alt: 15, teInv: 0, fonteInv: "derivata", tbse: 32.0, escursione: 8.0, fonteEst: "derivata" },
  { nome: "Belluno", zona: "E", alt: 383, teInv: -10, fonteInv: "UNI5364", tbse: 31.0, escursione: 13.0, fonteEst: "UNI10339" },
  { nome: "Benevento", zona: "C", alt: 135, teInv: -2, fonteInv: "UNI5364", tbse: 32.0, escursione: 11.0, fonteEst: "UNI10339" },
  { nome: "Bergamo", zona: "E", alt: 249, teInv: -5, fonteInv: "UNI5364", tbse: 31.0, escursione: 13.0, fonteEst: "UNI10339" },
  { nome: "Biella", zona: "E", alt: 424, teInv: -8, fonteInv: "derivata", tbse: 32.0, escursione: 11.0, fonteEst: "derivata" },
  { nome: "Bologna", zona: "E", alt: 54, teInv: -5, fonteInv: "UNI5364", tbse: 33.0, escursione: 12.0, fonteEst: "UNI10339" },
  { nome: "Bolzano", zona: "E", alt: 262, teInv: -15, fonteInv: "UNI5364", tbse: 31.5, escursione: 13.0, fonteEst: "UNI10339" },
  { nome: "Brescia", zona: "E", alt: 149, teInv: -7, fonteInv: "UNI5364", tbse: 32.0, escursione: 15.0, fonteEst: "UNI10339" },
  { nome: "Brindisi", zona: "C", alt: 15, teInv: 0, fonteInv: "UNI5364", tbse: 31.5, escursione: 8.0, fonteEst: "UNI10339" },
  { nome: "Cagliari", zona: "C", alt: 4, teInv: 3, fonteInv: "UNI5364", tbse: 32.0, escursione: 9.0, fonteEst: "UNI10339" },
  { nome: "Caltanissetta", zona: "D", alt: 568, teInv: 0, fonteInv: "UNI5364", tbse: 34.0, escursione: 9.0, fonteEst: "UNI10339" },
  { nome: "Campobasso", zona: "E", alt: 701, teInv: -4, fonteInv: "UNI5364", tbse: 29.0, escursione: 9.0, fonteEst: "UNI10339" },
  { nome: "Carbonia-Iglesias", zona: "C", alt: 111, teInv: 3, fonteInv: "derivata", tbse: 32.0, escursione: 9.0, fonteEst: "derivata" },
  { nome: "Caserta", zona: "C", alt: 68, teInv: 0, fonteInv: "UNI5364", tbse: 32.0, escursione: 11.0, fonteEst: "UNI10339" },
  { nome: "Catania", zona: "B", alt: 7, teInv: 5, fonteInv: "UNI5364", tbse: 33.5, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Catanzaro", zona: "C", alt: 320, teInv: -2, fonteInv: "UNI5364", tbse: 33.0, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Chieti", zona: "D", alt: 330, teInv: 0, fonteInv: "UNI5364", tbse: 31.5, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Como", zona: "E", alt: 201, teInv: -5, fonteInv: "UNI5364", tbse: 32.0, escursione: 8.0, fonteEst: "UNI10339" },
  { nome: "Cosenza", zona: "C", alt: 238, teInv: -3, fonteInv: "UNI5364", tbse: 33.5, escursione: 8.0, fonteEst: "UNI10339" },
  { nome: "Cremona", zona: "E", alt: 45, teInv: -5, fonteInv: "UNI5364", tbse: 33.0, escursione: 12.0, fonteEst: "UNI10339" },
  { nome: "Crotone", zona: "B", alt: 8, teInv: 3, fonteInv: "derivata", tbse: 33.5, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Cuneo", zona: "F", alt: 534, teInv: -10, fonteInv: "UNI5364", tbse: 29.0, escursione: 12.0, fonteEst: "UNI10339" },
  { nome: "Enna", zona: "E", alt: 931, teInv: -3, fonteInv: "UNI5364", tbse: 29.0, escursione: 7.0, fonteEst: "UNI10339" },
  { nome: "Fermo", zona: "D", alt: 319, teInv: -2, fonteInv: "derivata", tbse: 33.0, escursione: 10.0, fonteEst: "derivata" },
  { nome: "Ferrara", zona: "E", alt: 9, teInv: -5, fonteInv: "UNI5364", tbse: 32.0, escursione: 12.0, fonteEst: "UNI10339" },
  { nome: "Firenze", zona: "D", alt: 40, teInv: 0, fonteInv: "UNI5364", tbse: 33.5, escursione: 13.0, fonteEst: "UNI10339" },
  { nome: "Foggia", zona: "D", alt: 76, teInv: 0, fonteInv: "UNI5364", tbse: 34.0, escursione: 13.0, fonteEst: "UNI10339" },
  { nome: "Forlì-Cesena", zona: "D", alt: 34, teInv: -5, fonteInv: "UNI5364", tbse: 32.0, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Frosinone", zona: "E", alt: 291, teInv: 0, fonteInv: "UNI5364", tbse: 31.5, escursione: 12.0, fonteEst: "UNI10339" },
  { nome: "Genova", zona: "D", alt: 19, teInv: 0, fonteInv: "UNI5364", tbse: 30.0, escursione: 6.0, fonteEst: "UNI10339" },
  { nome: "Gorizia", zona: "E", alt: 84, teInv: -5, fonteInv: "UNI5364", tbse: 30.5, escursione: 11.0, fonteEst: "UNI10339" },
  { nome: "Grosseto", zona: "D", alt: 10, teInv: 0, fonteInv: "UNI5364", tbse: 33.0, escursione: 13.0, fonteEst: "UNI10339" },
  { nome: "Imperia", zona: "C", alt: 10, teInv: 0, fonteInv: "UNI5364", tbse: 29.0, escursione: 6.0, fonteEst: "UNI10339" },
  { nome: "Isernia", zona: "D", alt: 423, teInv: -3, fonteInv: "derivata", tbse: 29.0, escursione: 9.0, fonteEst: "derivata" },
  { nome: "L'Aquila", zona: "E", alt: 714, teInv: -5, fonteInv: "UNI5364", tbse: 29.0, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "La Spezia", zona: "D", alt: 3, teInv: 0, fonteInv: "UNI5364", tbse: 30.0, escursione: 6.0, fonteEst: "UNI10339" },
  { nome: "Latina", zona: "C", alt: 21, teInv: 2, fonteInv: "UNI5364", tbse: 33.0, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Lecce", zona: "C", alt: 49, teInv: 0, fonteInv: "UNI5364", tbse: 33.0, escursione: 12.5, fonteEst: "UNI10339" },
  { nome: "Lecco", zona: "E", alt: 214, teInv: -7, fonteInv: "derivata", tbse: 32.0, escursione: 8.0, fonteEst: "derivata" },
  { nome: "Livorno", zona: "D", alt: 3, teInv: 0, fonteInv: "UNI5364", tbse: 31.0, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Lodi", zona: "E", alt: 87, teInv: -5, fonteInv: "derivata", tbse: 32.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Lucca", zona: "D", alt: 19, teInv: 0, fonteInv: "UNI5364", tbse: 32.5, escursione: 12.0, fonteEst: "UNI10339" },
  { nome: "Macerata", zona: "D", alt: 315, teInv: -2, fonteInv: "UNI5364", tbse: 31.0, escursione: 12.0, fonteEst: "UNI10339" },
  { nome: "Mantova", zona: "E", alt: 19, teInv: -5, fonteInv: "UNI5364", tbse: 33.0, escursione: 12.0, fonteEst: "UNI10339" },
  { nome: "Massa-Carrara", zona: "D", alt: 65, teInv: 0, fonteInv: "UNI5364", tbse: 32.5, escursione: 11.0, fonteEst: "UNI10339" },
  { nome: "Matera", zona: "D", alt: 200, teInv: -2, fonteInv: "UNI5364", tbse: 33.0, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Messina", zona: "B", alt: 3, teInv: 5, fonteInv: "UNI5364", tbse: 32.0, escursione: 6.0, fonteEst: "UNI10339" },
  { nome: "Milano", zona: "E", alt: 122, teInv: -5, fonteInv: "UNI5364", tbse: 32.0, escursione: 12.0, fonteEst: "UNI10339" },
  { nome: "Modena", zona: "E", alt: 34, teInv: -5, fonteInv: "UNI5364", tbse: 32.0, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Monza e Brianza", zona: "E", alt: 162, teInv: -5, fonteInv: "derivata", tbse: 32.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Napoli", zona: "C", alt: 17, teInv: 2, fonteInv: "UNI5364", tbse: 32.0, escursione: 10.5, fonteEst: "UNI10339" },
  { nome: "Novara", zona: "E", alt: 159, teInv: -5, fonteInv: "UNI5364", tbse: 32.0, escursione: 11.0, fonteEst: "derivata" },
  { nome: "Nuoro", zona: "D", alt: 546, teInv: 0, fonteInv: "derivata", tbse: 31.0, escursione: 9.0, fonteEst: "UNI10339" },
  { nome: "Olbia-Tempio", zona: "C", alt: 15, teInv: 3, fonteInv: "derivata", tbse: 31.0, escursione: 8.0, fonteEst: "derivata" },
  { nome: "Oristano", zona: "C", alt: 9, teInv: 3, fonteInv: "derivata", tbse: 31.0, escursione: 8.5, fonteEst: "derivata" },
  { nome: "Padova", zona: "E", alt: 12, teInv: -5, fonteInv: "UNI5364", tbse: 32.5, escursione: 13.0, fonteEst: "UNI10339" },
  { nome: "Palermo", zona: "B", alt: 14, teInv: 5, fonteInv: "UNI5364", tbse: 32.0, escursione: 6.5, fonteEst: "UNI10339" },
  { nome: "Parma", zona: "E", alt: 57, teInv: -5, fonteInv: "UNI5364", tbse: 31.0, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Pavia", zona: "E", alt: 77, teInv: -5, fonteInv: "UNI5364", tbse: 32.0, escursione: 12.0, fonteEst: "UNI10339" },
  { nome: "Perugia", zona: "E", alt: 493, teInv: -2, fonteInv: "UNI5364", tbse: 30.5, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Pesaro-Urbino", zona: "D", alt: 11, teInv: -2, fonteInv: "UNI5364", tbse: 30.5, escursione: 9.0, fonteEst: "UNI10339" },
  { nome: "Pescara", zona: "D", alt: 4, teInv: 2, fonteInv: "UNI5364", tbse: 31.5, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Piacenza", zona: "E", alt: 61, teInv: -5, fonteInv: "UNI5364", tbse: 31.5, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Pisa", zona: "D", alt: 4, teInv: 0, fonteInv: "UNI5364", tbse: 31.5, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Pistoia", zona: "D", alt: 67, teInv: 0, fonteInv: "derivata", tbse: 31.5, escursione: 12.0, fonteEst: "UNI10339" },
  { nome: "Pordenone", zona: "E", alt: 24, teInv: -5, fonteInv: "UNI5364", tbse: 33.0, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Potenza", zona: "E", alt: 819, teInv: -3, fonteInv: "UNI5364", tbse: 28.5, escursione: 9.5, fonteEst: "UNI10339" },
  { nome: "Prato", zona: "D", alt: 61, teInv: 0, fonteInv: "derivata", tbse: 33.5, escursione: 13.0, fonteEst: "derivata" },
  { nome: "Ragusa", zona: "C", alt: 502, teInv: 0, fonteInv: "UNI5364", tbse: 34.0, escursione: 8.0, fonteEst: "UNI10339" },
  { nome: "Ravenna", zona: "E", alt: 4, teInv: -5, fonteInv: "derivata", tbse: 31.0, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Reggio Calabria", zona: "B", alt: 15, teInv: 3, fonteInv: "UNI5364", tbse: 34.0, escursione: 9.0, fonteEst: "UNI10339" },
  { nome: "Reggio Emilia", zona: "E", alt: 58, teInv: -5, fonteInv: "UNI5364", tbse: 31.5, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Rieti", zona: "E", alt: 405, teInv: -3, fonteInv: "UNI5364", tbse: 29.5, escursione: 12.0, fonteEst: "UNI10339" },
  { nome: "Rimini", zona: "E", alt: 5, teInv: -5, fonteInv: "derivata", tbse: 30.0, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Roma", zona: "D", alt: 20, teInv: 0, fonteInv: "UNI5364", tbse: 33.0, escursione: 11.5, fonteEst: "UNI10339" },
  { nome: "Rovigo", zona: "E", alt: 7, teInv: -5, fonteInv: "UNI5364", tbse: 31.5, escursione: 11.0, fonteEst: "UNI10339" },
  { nome: "Salerno", zona: "C", alt: 4, teInv: 2, fonteInv: "UNI5364", tbse: 32.0, escursione: 11.0, fonteEst: "derivata" },
  { nome: "Sassari", zona: "C", alt: 225, teInv: 2, fonteInv: "derivata", tbse: 30.5, escursione: 8.0, fonteEst: "UNI10339" },
  { nome: "Savona", zona: "D", alt: 4, teInv: 0, fonteInv: "UNI5364", tbse: 29.0, escursione: 6.0, fonteEst: "UNI10339" },
  { nome: "Siena", zona: "D", alt: 322, teInv: -2, fonteInv: "UNI5364", tbse: 31.0, escursione: 13.0, fonteEst: "UNI10339" },
  { nome: "Siracusa", zona: "B", alt: 17, teInv: 5, fonteInv: "UNI5364", tbse: 33.0, escursione: 7.0, fonteEst: "UNI10339" },
  { nome: "Sondrio", zona: "E", alt: 307, teInv: -10, fonteInv: "UNI5364", tbse: 30.0, escursione: 14.0, fonteEst: "UNI10339" },
  { nome: "Sud Sardegna", zona: "C", alt: 111, teInv: 3, fonteInv: "derivata", tbse: 32.0, escursione: 9.0, fonteEst: "derivata" },
  { nome: "Taranto", zona: "C", alt: 15, teInv: 0, fonteInv: "UNI5364", tbse: 33.0, escursione: 8.5, fonteEst: "UNI10339" },
  { nome: "Teramo", zona: "D", alt: 265, teInv: 0, fonteInv: "UNI5364", tbse: 32.0, escursione: 8.0, fonteEst: "UNI10339" },
  { nome: "Terni", zona: "D", alt: 130, teInv: -2, fonteInv: "UNI5364", tbse: 32.5, escursione: 9.0, fonteEst: "UNI10339" },
  { nome: "Torino", zona: "E", alt: 239, teInv: -8, fonteInv: "UNI5364", tbse: 30.5, escursione: 11.0, fonteEst: "UNI10339" },
  { nome: "Trapani", zona: "B", alt: 3, teInv: 5, fonteInv: "UNI5364", tbse: 31.5, escursione: 7.5, fonteEst: "UNI10339" },
  { nome: "Trento", zona: "E", alt: 194, teInv: -12, fonteInv: "UNI5364", tbse: 31.0, escursione: 12.0, fonteEst: "UNI10339" },
  { nome: "Treviso", zona: "E", alt: 15, teInv: -5, fonteInv: "UNI5364", tbse: 32.0, escursione: 13.0, fonteEst: "UNI10339" },
  { nome: "Trieste", zona: "D", alt: 2, teInv: -5, fonteInv: "UNI5364", tbse: 31.0, escursione: 8.0, fonteEst: "UNI10339" },
  { nome: "Udine", zona: "E", alt: 113, teInv: -5, fonteInv: "UNI5364", tbse: 31.5, escursione: 11.0, fonteEst: "UNI10339" },
  { nome: "Varese", zona: "E", alt: 382, teInv: -5, fonteInv: "UNI5364", tbse: 29.0, escursione: 10.0, fonteEst: "UNI10339" },
  { nome: "Verbano-Cusio-Ossola", zona: "E", alt: 197, teInv: -5, fonteInv: "derivata", tbse: 29.0, escursione: 10.0, fonteEst: "derivata" },
  { nome: "Vercelli", zona: "E", alt: 130, teInv: -7, fonteInv: "UNI5364", tbse: 32.0, escursione: 11.0, fonteEst: "UNI10339" },
  { nome: "Verona", zona: "D", alt: 59, teInv: -5, fonteInv: "UNI5364", tbse: 31.5, escursione: 11.0, fonteEst: "UNI10339" },
  { nome: "Vibo Valentia", zona: "C", alt: 476, teInv: -2, fonteInv: "derivata", tbse: 33.0, escursione: 9.0, fonteEst: "derivata" },
  { nome: "Vicenza", zona: "E", alt: 39, teInv: -5, fonteInv: "UNI5364", tbse: 32.5, escursione: 12.0, fonteEst: "UNI10339" },
  { nome: "Viterbo", zona: "D", alt: 326, teInv: -2, fonteInv: "UNI5364", tbse: 31.0, escursione: 12.0, fonteEst: "UNI10339" },
];

// ---------------------------------------------------------------------
// LIVELLO 2 — Comuni non capoluogo (126 voci)
// Tutti i valori sono "derivata" per analogia dal capoluogo di
// riferimento più vicino, con correzione altimetrica UNI 10349.
// Priorità Umbria: 15 comuni umbri oltre a Perugia e Terni (già
// capoluoghi in COMUNI), dato l'uso prevalente dell'app in quella regione.
// ---------------------------------------------------------------------
export const COMUNI_ESTESI = [
  // --- UMBRIA (priorità d'uso dell'app) ---
  { nome: "Foligno", zona: "D", alt: 234, teInv: -1, fonteInv: "derivata", tbse: 32.5, escursione: 9.0, fonteEst: "derivata", regione: "Umbria" },
  { nome: "Città di Castello", zona: "D", alt: 288, teInv: -1, fonteInv: "derivata", tbse: 30.5, escursione: 10.0, fonteEst: "derivata", regione: "Umbria" },
  { nome: "Spoleto", zona: "D", alt: 396, teInv: -2, fonteInv: "derivata", tbse: 32.5, escursione: 9.0, fonteEst: "derivata", regione: "Umbria" },
  { nome: "Gubbio", zona: "E", alt: 522, teInv: -3, fonteInv: "derivata", tbse: 30.0, escursione: 11.0, fonteEst: "derivata", regione: "Umbria" },
  { nome: "Assisi", zona: "D", alt: 424, teInv: -2, fonteInv: "derivata", tbse: 30.5, escursione: 10.0, fonteEst: "derivata", regione: "Umbria" },
  { nome: "Bastia Umbra", zona: "D", alt: 201, teInv: -1, fonteInv: "derivata", tbse: 30.5, escursione: 10.0, fonteEst: "derivata", regione: "Umbria" },
  { nome: "Orvieto", zona: "D", alt: 325, teInv: -2, fonteInv: "derivata", tbse: 32.0, escursione: 9.0, fonteEst: "derivata", regione: "Umbria" },
  { nome: "Todi", zona: "D", alt: 411, teInv: -2, fonteInv: "derivata", tbse: 31.0, escursione: 10.0, fonteEst: "derivata", regione: "Umbria" },
  { nome: "Umbertide", zona: "D", alt: 247, teInv: -1, fonteInv: "derivata", tbse: 30.5, escursione: 10.0, fonteEst: "derivata", regione: "Umbria" },
  { nome: "Marsciano", zona: "D", alt: 186, teInv: -1, fonteInv: "derivata", tbse: 31.0, escursione: 10.0, fonteEst: "derivata", regione: "Umbria" },
  { nome: "Gualdo Tadino", zona: "E", alt: 536, teInv: -3, fonteInv: "derivata", tbse: 30.0, escursione: 11.0, fonteEst: "derivata", regione: "Umbria" },
  { nome: "Narni", zona: "D", alt: 240, teInv: -2, fonteInv: "derivata", tbse: 32.0, escursione: 9.0, fonteEst: "derivata", regione: "Umbria" },
  { nome: "Amelia", zona: "D", alt: 406, teInv: -3, fonteInv: "derivata", tbse: 31.5, escursione: 9.0, fonteEst: "derivata", regione: "Umbria" },
  { nome: "Spello", zona: "D", alt: 280, teInv: -1, fonteInv: "derivata", tbse: 30.5, escursione: 10.0, fonteEst: "derivata", regione: "Umbria" },
  { nome: "Castiglione del Lago", zona: "D", alt: 304, teInv: -2, fonteInv: "derivata", tbse: 31.0, escursione: 10.0, fonteEst: "derivata", regione: "Umbria" },
  // --- resto d'Italia ---
  { nome: "Giugliano in Campania", zona: "C", alt: 34, teInv: 2, fonteInv: "derivata", tbse: 32.0, escursione: 10.5, fonteEst: "derivata" },
  { nome: "Torre del Greco", zona: "C", alt: 34, teInv: 2, fonteInv: "derivata", tbse: 32.0, escursione: 10.5, fonteEst: "derivata" },
  { nome: "Casoria", zona: "C", alt: 53, teInv: 2, fonteInv: "derivata", tbse: 32.0, escursione: 10.5, fonteEst: "derivata" },
  { nome: "Pozzuoli", zona: "C", alt: 32, teInv: 2, fonteInv: "derivata", tbse: 32.0, escursione: 10.5, fonteEst: "derivata" },
  { nome: "Portici", zona: "C", alt: 22, teInv: 2, fonteInv: "derivata", tbse: 32.0, escursione: 10.5, fonteEst: "derivata" },
  { nome: "Guidonia Montecelio", zona: "D", alt: 89, teInv: 0, fonteInv: "derivata", tbse: 33.0, escursione: 11.5, fonteEst: "derivata" },
  { nome: "Fiumicino", zona: "D", alt: 5, teInv: 0, fonteInv: "derivata", tbse: 33.0, escursione: 11.5, fonteEst: "derivata" },
  { nome: "Anzio", zona: "D", alt: 30, teInv: 0, fonteInv: "derivata", tbse: 33.0, escursione: 11.5, fonteEst: "derivata" },
  { nome: "Velletri", zona: "D", alt: 332, teInv: -1, fonteInv: "derivata", tbse: 33.0, escursione: 11.5, fonteEst: "derivata" },
  { nome: "Pomezia", zona: "D", alt: 108, teInv: 0, fonteInv: "derivata", tbse: 33.0, escursione: 11.5, fonteEst: "derivata" },
  { nome: "Tivoli", zona: "D", alt: 235, teInv: -1, fonteInv: "derivata", tbse: 33.0, escursione: 11.5, fonteEst: "derivata" },
  { nome: "Marino", zona: "D", alt: 355, teInv: -1, fonteInv: "derivata", tbse: 33.0, escursione: 11.5, fonteEst: "derivata" },
  { nome: "Civitavecchia", zona: "D", alt: 15, teInv: 0, fonteInv: "derivata", tbse: 33.0, escursione: 11.5, fonteEst: "derivata" },
  { nome: "Battipaglia", zona: "C", alt: 72, teInv: 2, fonteInv: "derivata", tbse: 32.0, escursione: 11.0, fonteEst: "derivata" },
  { nome: "Nocera Inferiore", zona: "C", alt: 30, teInv: 2, fonteInv: "derivata", tbse: 32.0, escursione: 11.0, fonteEst: "derivata" },
  { nome: "Cava de' Tirreni", zona: "C", alt: 196, teInv: 2, fonteInv: "derivata", tbse: 32.0, escursione: 11.0, fonteEst: "derivata" },
  { nome: "Cinisello Balsamo", zona: "E", alt: 154, teInv: -5, fonteInv: "derivata", tbse: 32.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Sesto San Giovanni", zona: "E", alt: 137, teInv: -5, fonteInv: "derivata", tbse: 32.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Legnano", zona: "E", alt: 199, teInv: -5, fonteInv: "derivata", tbse: 32.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Rho", zona: "E", alt: 158, teInv: -5, fonteInv: "derivata", tbse: 32.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Cologno Monzese", zona: "E", alt: 137, teInv: -5, fonteInv: "derivata", tbse: 32.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Melegnano", zona: "E", alt: 88, teInv: -5, fonteInv: "derivata", tbse: 32.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Abbiategrasso", zona: "E", alt: 120, teInv: -5, fonteInv: "derivata", tbse: 32.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Vigevano", zona: "E", alt: 116, teInv: -5, fonteInv: "derivata", tbse: 32.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Voghera", zona: "E", alt: 90, teInv: -5, fonteInv: "derivata", tbse: 32.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Busto Arsizio", zona: "E", alt: 224, teInv: -5, fonteInv: "derivata", tbse: 29.0, escursione: 10.0, fonteEst: "derivata" },
  { nome: "Gallarate", zona: "E", alt: 238, teInv: -5, fonteInv: "derivata", tbse: 29.0, escursione: 10.0, fonteEst: "derivata" },
  { nome: "Saronno", zona: "E", alt: 212, teInv: -5, fonteInv: "derivata", tbse: 29.0, escursione: 10.0, fonteEst: "derivata" },
  { nome: "Tradate", zona: "E", alt: 303, teInv: -5, fonteInv: "derivata", tbse: 29.0, escursione: 10.0, fonteEst: "derivata" },
  { nome: "Seregno", zona: "E", alt: 222, teInv: -5, fonteInv: "derivata", tbse: 32.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Desio", zona: "E", alt: 196, teInv: -5, fonteInv: "derivata", tbse: 32.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Codogno", zona: "E", alt: 58, teInv: -5, fonteInv: "derivata", tbse: 32.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Crema", zona: "E", alt: 79, teInv: -5, fonteInv: "derivata", tbse: 33.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Casalmaggiore", zona: "E", alt: 26, teInv: -5, fonteInv: "derivata", tbse: 33.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Dalmine", zona: "E", alt: 227, teInv: -5, fonteInv: "derivata", tbse: 31.0, escursione: 13.0, fonteEst: "derivata" },
  { nome: "Treviglio", zona: "E", alt: 125, teInv: -5, fonteInv: "derivata", tbse: 31.0, escursione: 13.0, fonteEst: "derivata" },
  { nome: "Seriate", zona: "E", alt: 247, teInv: -5, fonteInv: "derivata", tbse: 31.0, escursione: 13.0, fonteEst: "derivata" },
  { nome: "Desenzano del Garda", zona: "E", alt: 96, teInv: -7, fonteInv: "derivata", tbse: 32.0, escursione: 15.0, fonteEst: "derivata" },
  { nome: "Salò", zona: "E", alt: 75, teInv: -7, fonteInv: "derivata", tbse: 32.0, escursione: 15.0, fonteEst: "derivata" },
  { nome: "Chiari", zona: "E", alt: 148, teInv: -7, fonteInv: "derivata", tbse: 32.0, escursione: 15.0, fonteEst: "derivata" },
  { nome: "Manerbio", zona: "E", alt: 76, teInv: -7, fonteInv: "derivata", tbse: 32.0, escursione: 15.0, fonteEst: "derivata" },
  { nome: "Lonato del Garda", zona: "E", alt: 188, teInv: -7, fonteInv: "derivata", tbse: 32.0, escursione: 15.0, fonteEst: "derivata" },
  { nome: "Chioggia", zona: "E", alt: 2, teInv: -5, fonteInv: "derivata", tbse: 31.0, escursione: 9.0, fonteEst: "derivata" },
  { nome: "Bassano del Grappa", zona: "E", alt: 129, teInv: -5, fonteInv: "derivata", tbse: 32.5, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Montebelluna", zona: "E", alt: 109, teInv: -5, fonteInv: "derivata", tbse: 32.0, escursione: 13.0, fonteEst: "derivata" },
  { nome: "Conegliano", zona: "E", alt: 65, teInv: -5, fonteInv: "derivata", tbse: 32.0, escursione: 13.0, fonteEst: "derivata" },
  { nome: "Legnago", zona: "E", alt: 16, teInv: -5, fonteInv: "derivata", tbse: 31.5, escursione: 11.0, fonteEst: "derivata" },
  { nome: "Rovereto", zona: "E", alt: 212, teInv: -12, fonteInv: "derivata", tbse: 31.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Merano", zona: "E", alt: 325, teInv: -15, fonteInv: "derivata", tbse: 31.5, escursione: 13.0, fonteEst: "derivata" },
  { nome: "Bressanone", zona: "E", alt: 559, teInv: -16, fonteInv: "derivata", tbse: 31.5, escursione: 13.0, fonteEst: "derivata" },
  { nome: "Vipiteno", zona: "E", alt: 948, teInv: -18, fonteInv: "derivata", tbse: 30.0, escursione: 13.0, fonteEst: "derivata" },
  { nome: "Sassuolo", zona: "E", alt: 121, teInv: -5, fonteInv: "derivata", tbse: 32.0, escursione: 10.0, fonteEst: "derivata" },
  { nome: "Carpi", zona: "E", alt: 26, teInv: -5, fonteInv: "derivata", tbse: 32.0, escursione: 10.0, fonteEst: "derivata" },
  { nome: "Faenza", zona: "E", alt: 35, teInv: -5, fonteInv: "derivata", tbse: 31.0, escursione: 10.0, fonteEst: "derivata" },
  { nome: "Cesena", zona: "D", alt: 44, teInv: -5, fonteInv: "derivata", tbse: 32.0, escursione: 10.0, fonteEst: "derivata" },
  { nome: "Imola", zona: "E", alt: 47, teInv: -5, fonteInv: "derivata", tbse: 33.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Cento", zona: "E", alt: 15, teInv: -5, fonteInv: "derivata", tbse: 32.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Casalecchio di Reno", zona: "E", alt: 61, teInv: -5, fonteInv: "derivata", tbse: 33.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Civitanova Marche", zona: "D", alt: 6, teInv: -1, fonteInv: "derivata", tbse: 31.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "San Benedetto del Tronto", zona: "D", alt: 5, teInv: -2, fonteInv: "derivata", tbse: 33.0, escursione: 10.0, fonteEst: "derivata" },
  { nome: "Jesi", zona: "D", alt: 96, teInv: -2, fonteInv: "derivata", tbse: 31.0, escursione: 13.5, fonteEst: "derivata" },
  { nome: "Fano", zona: "D", alt: 7, teInv: -2, fonteInv: "derivata", tbse: 30.5, escursione: 9.0, fonteEst: "derivata" },
  { nome: "Senigallia", zona: "D", alt: 8, teInv: -2, fonteInv: "derivata", tbse: 31.0, escursione: 13.5, fonteEst: "derivata" },
  { nome: "Empoli", zona: "D", alt: 27, teInv: 0, fonteInv: "derivata", tbse: 33.5, escursione: 13.0, fonteEst: "derivata" },
  { nome: "Sesto Fiorentino", zona: "D", alt: 55, teInv: 0, fonteInv: "derivata", tbse: 33.5, escursione: 13.0, fonteEst: "derivata" },
  { nome: "Scandicci", zona: "D", alt: 49, teInv: 0, fonteInv: "derivata", tbse: 33.5, escursione: 13.0, fonteEst: "derivata" },
  { nome: "Viareggio", zona: "D", alt: 2, teInv: 0, fonteInv: "derivata", tbse: 32.5, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Piombino", zona: "D", alt: 9, teInv: 0, fonteInv: "derivata", tbse: 31.0, escursione: 10.0, fonteEst: "derivata" },
  { nome: "Cecina", zona: "D", alt: 15, teInv: 0, fonteInv: "derivata", tbse: 31.0, escursione: 10.0, fonteEst: "derivata" },
  { nome: "Pontedera", zona: "D", alt: 14, teInv: 0, fonteInv: "derivata", tbse: 31.5, escursione: 10.0, fonteEst: "derivata" },
  { nome: "Cascina", zona: "D", alt: 4, teInv: 0, fonteInv: "derivata", tbse: 31.5, escursione: 10.0, fonteEst: "derivata" },
  { nome: "Poggibonsi", zona: "D", alt: 116, teInv: -1, fonteInv: "derivata", tbse: 31.0, escursione: 13.0, fonteEst: "derivata" },
  { nome: "Chieri", zona: "E", alt: 315, teInv: -8, fonteInv: "derivata", tbse: 30.5, escursione: 11.0, fonteEst: "derivata" },
  { nome: "Moncalieri", zona: "E", alt: 219, teInv: -8, fonteInv: "derivata", tbse: 30.5, escursione: 11.0, fonteEst: "derivata" },
  { nome: "Rivoli", zona: "E", alt: 390, teInv: -8, fonteInv: "derivata", tbse: 30.5, escursione: 11.0, fonteEst: "derivata" },
  { nome: "Ivrea", zona: "E", alt: 253, teInv: -8, fonteInv: "derivata", tbse: 30.5, escursione: 11.0, fonteEst: "derivata" },
  { nome: "Nichelino", zona: "E", alt: 229, teInv: -8, fonteInv: "derivata", tbse: 30.5, escursione: 11.0, fonteEst: "derivata" },
  { nome: "Settimo Torinese", zona: "E", alt: 207, teInv: -8, fonteInv: "derivata", tbse: 30.5, escursione: 11.0, fonteEst: "derivata" },
  { nome: "Grugliasco", zona: "E", alt: 293, teInv: -8, fonteInv: "derivata", tbse: 30.5, escursione: 11.0, fonteEst: "derivata" },
  { nome: "Collegno", zona: "E", alt: 344, teInv: -8, fonteInv: "derivata", tbse: 30.5, escursione: 11.0, fonteEst: "derivata" },
  { nome: "Pinerolo", zona: "E", alt: 376, teInv: -8, fonteInv: "derivata", tbse: 30.5, escursione: 11.0, fonteEst: "derivata" },
  { nome: "Alba", zona: "E", alt: 172, teInv: -8, fonteInv: "derivata", tbse: 32.0, escursione: 11.0, fonteEst: "derivata" },
  { nome: "Bra", zona: "F", alt: 290, teInv: -9, fonteInv: "derivata", tbse: 29.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Savigliano", zona: "F", alt: 321, teInv: -11, fonteInv: "derivata", tbse: 29.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Fossano", zona: "F", alt: 375, teInv: -10, fonteInv: "derivata", tbse: 29.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Mondovì", zona: "F", alt: 559, teInv: -10, fonteInv: "derivata", tbse: 29.0, escursione: 12.0, fonteEst: "derivata" },
  { nome: "Casale Monferrato", zona: "E", alt: 116, teInv: -8, fonteInv: "derivata", tbse: 30.5, escursione: 11.0, fonteEst: "derivata" },
  { nome: "Tortona", zona: "E", alt: 122, teInv: -8, fonteInv: "derivata", tbse: 30.5, escursione: 11.0, fonteEst: "derivata" },
  { nome: "Domodossola", zona: "E", alt: 277, teInv: -5, fonteInv: "derivata", tbse: 29.0, escursione: 10.0, fonteEst: "derivata" },
  { nome: "Andria", zona: "C", alt: 151, teInv: 0, fonteInv: "derivata", tbse: 32.0, escursione: 8.0, fonteEst: "derivata" },
  { nome: "Trani", zona: "C", alt: 8, teInv: 0, fonteInv: "derivata", tbse: 32.0, escursione: 8.0, fonteEst: "derivata" },
  { nome: "Bitonto", zona: "C", alt: 118, teInv: 0, fonteInv: "derivata", tbse: 32.0, escursione: 8.0, fonteEst: "derivata" },
  { nome: "Altamura", zona: "C", alt: 467, teInv: -2, fonteInv: "derivata", tbse: 32.0, escursione: 8.0, fonteEst: "derivata" },
  { nome: "Molfetta", zona: "C", alt: 9, teInv: 0, fonteInv: "derivata", tbse: 32.0, escursione: 8.0, fonteEst: "derivata" },
  { nome: "Manfredonia", zona: "D", alt: 6, teInv: 0, fonteInv: "derivata", tbse: 34.0, escursione: 13.0, fonteEst: "derivata" },
  { nome: "Cerignola", zona: "D", alt: 124, teInv: 0, fonteInv: "derivata", tbse: 34.0, escursione: 13.0, fonteEst: "derivata" },
  { nome: "San Severo", zona: "D", alt: 89, teInv: 0, fonteInv: "derivata", tbse: 34.0, escursione: 13.0, fonteEst: "derivata" },
  { nome: "Marsala", zona: "B", alt: 3, teInv: 5, fonteInv: "derivata", tbse: 31.5, escursione: 7.5, fonteEst: "derivata" },
  { nome: "Mazara del Vallo", zona: "B", alt: 26, teInv: 5, fonteInv: "derivata", tbse: 31.5, escursione: 7.5, fonteEst: "derivata" },
  { nome: "Gela", zona: "D", alt: 46, teInv: 2, fonteInv: "derivata", tbse: 34.0, escursione: 9.0, fonteEst: "derivata" },
  { nome: "Vittoria", zona: "C", alt: 168, teInv: 1, fonteInv: "derivata", tbse: 34.0, escursione: 8.0, fonteEst: "derivata" },
  { nome: "Acireale", zona: "B", alt: 161, teInv: 5, fonteInv: "derivata", tbse: 33.5, escursione: 10.0, fonteEst: "derivata" },
  { nome: "Caltagirone", zona: "E", alt: 608, teInv: 2, fonteInv: "derivata", tbse: 33.5, escursione: 10.0, fonteEst: "derivata" },
  { nome: "Misterbianco", zona: "B", alt: 178, teInv: 5, fonteInv: "derivata", tbse: 33.5, escursione: 10.0, fonteEst: "derivata" },
  { nome: "Barcellona Pozzo di Gotto", zona: "B", alt: 26, teInv: 5, fonteInv: "derivata", tbse: 32.0, escursione: 6.0, fonteEst: "derivata" },
  { nome: "Milazzo", zona: "B", alt: 27, teInv: 5, fonteInv: "derivata", tbse: 32.0, escursione: 6.0, fonteEst: "derivata" },
  { nome: "Quartu Sant'Elena", zona: "C", alt: 8, teInv: 3, fonteInv: "derivata", tbse: 32.0, escursione: 9.0, fonteEst: "derivata" },
  { nome: "Alghero", zona: "C", alt: 7, teInv: 3, fonteInv: "derivata", tbse: 30.5, escursione: 8.0, fonteEst: "derivata" },
  { nome: "Rende", zona: "C", alt: 480, teInv: -4, fonteInv: "derivata", tbse: 33.5, escursione: 8.0, fonteEst: "derivata" },
  { nome: "Corigliano-Rossano", zona: "C", alt: 219, teInv: -3, fonteInv: "derivata", tbse: 33.5, escursione: 8.0, fonteEst: "derivata" },
  { nome: "Lamezia Terme", zona: "C", alt: 216, teInv: -2, fonteInv: "derivata", tbse: 33.0, escursione: 10.0, fonteEst: "derivata" },
];

// ---------------------------------------------------------------------
// Elenco unificato ricercabile: capoluoghi (Livello 1) + comuni estesi
// (Livello 2). I comuni umbri vengono contrassegnati con regione: "Umbria"
// per essere evidenziati/filtrati nell'interfaccia, dato l'uso prevalente
// dell'app in quella regione.
// ---------------------------------------------------------------------
const COMUNI_UMBRI_CAPOLUOGO = new Set(["Perugia", "Terni"]);

export const ELENCO_COMUNI = [
  ...COMUNI.map((c) => ({
    ...c,
    regione: COMUNI_UMBRI_CAPOLUOGO.has(c.nome) ? "Umbria" : c.regione,
    livello: 1,
  })),
  ...COMUNI_ESTESI.map((c) => ({ ...c, livello: 2 })),
].sort((a, b) => a.nome.localeCompare(b.nome, "it"));

/** Restituisce solo i comuni umbri, utile per il filtro rapido "Umbria". */
export function getComuniUmbria() {
  return ELENCO_COMUNI.filter((c) => c.regione === "Umbria");
}

/** Cerca un comune per nome esatto nell'elenco unificato. */
export function trovaComune(nome) {
  return ELENCO_COMUNI.find((c) => c.nome === nome) || null;
}

/**
 * Correzione altimetrica della temperatura esterna di progetto invernale
 * per un comune non presente in elenco (metodo UNI 10349).
 *
 * Si applica una correzione di 1°C ogni 200 m di dislivello rispetto al
 * comune di riferimento scelto dall'utente: più alto → più freddo (teInv
 * diminuisce), più basso → più mite (teInv aumenta). Sotto i 200 m di
 * dislivello non si applica alcuna correzione (variazione non
 * significativa ai fini del dimensionamento).
 *
 * @param {number} teRiferimento  Temperatura invernale del comune di riferimento [°C]
 * @param {number} altRiferimento Altitudine del comune di riferimento [m]
 * @param {number} altComune      Altitudine del comune non elencato [m]
 * @returns {number} Temperatura invernale di progetto corretta [°C]
 */
export function correggiTemperaturaPerAltitudine(teRiferimento, altRiferimento, altComune) {
  const dislivello = altComune - altRiferimento;
  if (Math.abs(dislivello) < 200) return teRiferimento; // nessuna correzione
  const passi = Math.floor(Math.abs(dislivello) / 200);
  const correzione = dislivello > 0 ? -passi : passi; // più alto = più freddo
  return teRiferimento + correzione;
}
