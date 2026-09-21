/**
 * catalogo.js — Catalogo prodotti (climatizzatori, pompe di calore
 * aria-acqua, bollitori/scaldacqua) e logica di abbinamento al
 * fabbisogno calcolato.
 *
 * CLIMATIZZAZIONE: dati REALI, gamma AUX listino Italia 2026 — vedi
 * data/gammaAux.js per la fonte e data/catalogoClimatizzazione.js per la
 * conversione nello schema di questo catalogo.
 *
 * ATTENZIONE — LE ALTRE CATEGORIE SONO ANCORA PLACEHOLDER: bollitori,
 * scaldacqua, solare, fotovoltaico, addolcitori e pompe elencati di
 * seguito sono ESEMPI FITTIZI inseriti per rendere l'applicazione
 * funzionante da subito. Il listino reale dei marchi
 * rappresentati dovrà sostituire questo array MANTENENDO ESATTAMENTE LA
 * STESSA STRUTTURA DATI (stessi campi, stessi nomi di chiave, stesse
 * unità di misura) per non richiedere modifiche al resto dell'applicazione.
 *
 * Schema di ciascun prodotto:
 *   marchio                : string
 *   modello                : string
 *   tipo                   : "climatizzatore_split" | "pompa_di_calore_aria_acqua" | "vrf" |
 *                             "chiller" | "bollitore" | "scaldacqua_pompa_di_calore" |
 *                             "solare_termico" | "fotovoltaico" | "addolcitore" | "autoclave" |
 *                             "pompa_sollevamento" | "pompa_circolazione"
 *   potenzaBtu             : number|null  — SOLO per climatizzatori split, valore SECONDARIO in UI
 *                             (tra parentesi dopo il kW — mai mostrato da solo, mai per pompe di
 *                             calore aria-acqua/VRF/chiller)
 *   potenzaKw              : number|null  — valore PRIMARIO mostrato ovunque in UI dove pertinente; per
 *                             gli split è la potenza convertita da potenzaBtu (1 BTU/h = 0.00029307107
 *                             kW), per pompe di calore aria-acqua, VRF, chiller, FV (kWp) e scaldacqua a
 *                             pompa di calore è la potenza termica resa dichiarata dal produttore; per
 *                             autoclavi/pompe di sollevamento/circolazione è la potenza ELETTRICA del
 *                             motore (dato secondario, il dimensionamento si basa su portata/prevalenza)
 *   capacitaLitri          : number|null  — per bollitori, accumuli solari, scaldacqua a pompa di calore
 *   volumeResinaLitri      : number|null  — SOLO per addolcitori: volume di resina a scambio ionico [L]
 *   portataNominaleMc      : number|null  — SOLO per addolcitori/autoclavi/pompe: portata nominale [m³/h]
 *   prevalenzaM            : number|null  — SOLO per autoclavi/pompe: prevalenza manometrica nominale [m]
 *   maxUnitaInterne        : number|null  — per VRF: numero massimo di unità interne collegabili
 *   classeEnergetica       : string       — es. "A+++"
 *   seer                   : number|null  — efficienza stagionale raffrescamento
 *   scop                   : number|null  — efficienza stagionale riscaldamento; per gli scaldacqua a
 *                             pompa di calore rappresenta il COP dichiarato in produzione ACS
 *   prezzoIndicativoMin    : number       — € solo unità, IVA esclusa — PLACEHOLDER
 *   prezzoIndicativoMax    : number
 *   schedaTecnicaUrl       : string       — link alla scheda tecnica del produttore (se disponibile)
 *   note                   : string
 */

import { PRODOTTI_CLIMATIZZAZIONE_AUX } from "./catalogoClimatizzazione.js";
import { LIVELLI_GAMMA } from "./gammaAux.js";

export const CATALOGO_PRODOTTI = [
  // ------------------------------------------------------------------
  // CLIMATIZZAZIONE — gamma AUX, listino Italia 2026 (dati reali)
  // Generata da data/gammaAux.js: i prezzi di sistema non sono
  // trascritti a mano ma sommati da unità interna ed esterna.
  // ------------------------------------------------------------------
  ...PRODOTTI_CLIMATIZZAZIONE_AUX,

  // ------------------------------------------------------------------
  // POMPE DI CALORE ARIA-ACQUA — PLACEHOLDER, marchio "AeroClima" (fittizio)
  // ------------------------------------------------------------------
  {
    marchio: "AeroClima [PLACEHOLDER]",
    modello: "HydroTherm 6",
    tipo: "pompa_di_calore_aria_acqua",
    potenzaBtu: null,
    potenzaKw: 6,
    capacitaLitri: null,
    classeEnergetica: "A+++",
    seer: 5.5,
    scop: 4.4,
    prezzoIndicativoMin: 4200,
    prezzoIndicativoMax: 5400,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },
  {
    marchio: "AeroClima [PLACEHOLDER]",
    modello: "HydroTherm 8",
    tipo: "pompa_di_calore_aria_acqua",
    potenzaBtu: null,
    potenzaKw: 8,
    capacitaLitri: null,
    classeEnergetica: "A+++",
    seer: 5.5,
    scop: 4.4,
    prezzoIndicativoMin: 4800,
    prezzoIndicativoMax: 6100,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },

  // ------------------------------------------------------------------
  // POMPE DI CALORE ARIA-ACQUA — PLACEHOLDER, marchio "NordikAir" (fittizio)
  // ------------------------------------------------------------------
  {
    marchio: "NordikAir [PLACEHOLDER]",
    modello: "GeoFlow 12",
    tipo: "pompa_di_calore_aria_acqua",
    potenzaBtu: null,
    potenzaKw: 12,
    capacitaLitri: null,
    classeEnergetica: "A++",
    seer: 4.9,
    scop: 4.0,
    prezzoIndicativoMin: 6300,
    prezzoIndicativoMax: 7900,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },
  {
    marchio: "NordikAir [PLACEHOLDER]",
    modello: "GeoFlow 16",
    tipo: "pompa_di_calore_aria_acqua",
    potenzaBtu: null,
    potenzaKw: 16,
    capacitaLitri: null,
    classeEnergetica: "A++",
    seer: 4.9,
    scop: 4.0,
    prezzoIndicativoMin: 7600,
    prezzoIndicativoMax: 9300,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },

  // ------------------------------------------------------------------
  // BOLLITORI / SCALDACQUA — PLACEHOLDER, marchio "TermoSicura" (fittizio)
  // ------------------------------------------------------------------
  {
    marchio: "TermoSicura [PLACEHOLDER]",
    modello: "AquaStore 80",
    tipo: "bollitore",
    potenzaBtu: null,
    potenzaKw: null,
    capacitaLitri: 80,
    classeEnergetica: "A+",
    seer: null,
    scop: null,
    prezzoIndicativoMin: 480,
    prezzoIndicativoMax: 620,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },
  {
    marchio: "TermoSicura [PLACEHOLDER]",
    modello: "AquaStore 100",
    tipo: "bollitore",
    potenzaBtu: null,
    potenzaKw: null,
    capacitaLitri: 100,
    classeEnergetica: "A+",
    seer: null,
    scop: null,
    prezzoIndicativoMin: 560,
    prezzoIndicativoMax: 710,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },
  {
    marchio: "TermoSicura [PLACEHOLDER]",
    modello: "AquaStore 150",
    tipo: "bollitore",
    potenzaBtu: null,
    potenzaKw: null,
    capacitaLitri: 150,
    classeEnergetica: "A++",
    seer: null,
    scop: null,
    prezzoIndicativoMin: 720,
    prezzoIndicativoMax: 890,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },
  {
    marchio: "TermoSicura [PLACEHOLDER]",
    modello: "AquaStore 200",
    tipo: "bollitore",
    potenzaBtu: null,
    potenzaKw: null,
    capacitaLitri: 200,
    classeEnergetica: "A++",
    seer: null,
    scop: null,
    prezzoIndicativoMin: 890,
    prezzoIndicativoMax: 1080,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },

  // ------------------------------------------------------------------
  // SCALDACQUA A POMPA DI CALORE (accumulo + pompa di calore integrati)
  // — PLACEHOLDER, marchio "TermoSicura" (fittizio). potenzaKw = potenza
  // termica resa; scop = COP dichiarato in produzione ACS.
  // ------------------------------------------------------------------
  {
    marchio: "TermoSicura [PLACEHOLDER]",
    modello: "AquaPump 80",
    tipo: "scaldacqua_pompa_di_calore",
    potenzaBtu: null,
    potenzaKw: 1.5,
    capacitaLitri: 80,
    classeEnergetica: "A+",
    seer: null,
    scop: 3.4,
    prezzoIndicativoMin: 980,
    prezzoIndicativoMax: 1250,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },
  {
    marchio: "TermoSicura [PLACEHOLDER]",
    modello: "AquaPump 100",
    tipo: "scaldacqua_pompa_di_calore",
    potenzaBtu: null,
    potenzaKw: 1.5,
    capacitaLitri: 100,
    classeEnergetica: "A+",
    seer: null,
    scop: 3.4,
    prezzoIndicativoMin: 1080,
    prezzoIndicativoMax: 1380,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },
  {
    marchio: "TermoSicura [PLACEHOLDER]",
    modello: "AquaPump 200",
    tipo: "scaldacqua_pompa_di_calore",
    potenzaBtu: null,
    potenzaKw: 2.0,
    capacitaLitri: 200,
    classeEnergetica: "A++",
    seer: null,
    scop: 3.2,
    prezzoIndicativoMin: 1650,
    prezzoIndicativoMax: 2050,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },
  {
    marchio: "TermoSicura [PLACEHOLDER]",
    modello: "AquaPump 300",
    tipo: "scaldacqua_pompa_di_calore",
    potenzaBtu: null,
    potenzaKw: 2.5,
    capacitaLitri: 300,
    classeEnergetica: "A++",
    seer: null,
    scop: 3.0,
    prezzoIndicativoMin: 2100,
    prezzoIndicativoMax: 2600,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },

  // ------------------------------------------------------------------
  // CHILLER — PLACEHOLDER, marchio "AeroClima" (fittizio)
  // Per ville/edifici plurifamiliari con distribuzione ad acqua
  // (ventilconvettori, pannelli radianti) e produzione centralizzata.
  // ------------------------------------------------------------------
  {
    marchio: "AeroClima [PLACEHOLDER]",
    modello: "ChillPro 15",
    tipo: "chiller",
    potenzaBtu: null,
    potenzaKw: 15,
    capacitaLitri: null,
    classeEnergetica: "A++",
    seer: 5.2,
    scop: 3.9,
    prezzoIndicativoMin: 9800,
    prezzoIndicativoMax: 12400,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },
  {
    marchio: "AeroClima [PLACEHOLDER]",
    modello: "ChillPro 25",
    tipo: "chiller",
    potenzaBtu: null,
    potenzaKw: 25,
    capacitaLitri: null,
    classeEnergetica: "A+",
    seer: 4.8,
    scop: 3.6,
    prezzoIndicativoMin: 14500,
    prezzoIndicativoMax: 18200,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },
  {
    marchio: "NordikAir [PLACEHOLDER]",
    modello: "GeoChill 35",
    tipo: "chiller",
    potenzaBtu: null,
    potenzaKw: 35,
    capacitaLitri: null,
    classeEnergetica: "A+",
    seer: 4.8,
    scop: 3.6,
    prezzoIndicativoMin: 19800,
    prezzoIndicativoMax: 24700,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },

  // ------------------------------------------------------------------
  // SOLARE TERMICO (integrazione ACS) — PLACEHOLDER, marchio "TermoSicura" (fittizio)
  // potenzaKw qui indica la potenza captata di picco del collettore.
  // ------------------------------------------------------------------
  {
    marchio: "TermoSicura [PLACEHOLDER]",
    modello: "SunFlow 2 pannelli + accumulo 200L",
    tipo: "solare_termico",
    potenzaBtu: null,
    potenzaKw: 2.8,
    capacitaLitri: 200,
    classeEnergetica: "A+",
    seer: null,
    scop: null,
    prezzoIndicativoMin: 2400,
    prezzoIndicativoMax: 3100,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },
  {
    marchio: "TermoSicura [PLACEHOLDER]",
    modello: "SunFlow 3 pannelli + accumulo 300L",
    tipo: "solare_termico",
    potenzaBtu: null,
    potenzaKw: 4.2,
    capacitaLitri: 300,
    classeEnergetica: "A+",
    seer: null,
    scop: null,
    prezzoIndicativoMin: 3200,
    prezzoIndicativoMax: 4100,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },

  // ------------------------------------------------------------------
  // FOTOVOLTAICO (integrazione elettrica pompa di calore/climatizzatore)
  // — PLACEHOLDER, marchio "SolarUmbra" (fittizio). potenzaKw = kWp.
  // ------------------------------------------------------------------
  {
    marchio: "SolarUmbra [PLACEHOLDER]",
    modello: "Kit FV 3 kWp",
    tipo: "fotovoltaico",
    potenzaBtu: null,
    potenzaKw: 3,
    capacitaLitri: null,
    classeEnergetica: "-",
    seer: null,
    scop: null,
    prezzoIndicativoMin: 5400,
    prezzoIndicativoMax: 6800,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },
  {
    marchio: "SolarUmbra [PLACEHOLDER]",
    modello: "Kit FV 6 kWp",
    tipo: "fotovoltaico",
    potenzaBtu: null,
    potenzaKw: 6,
    capacitaLitri: null,
    classeEnergetica: "-",
    seer: null,
    scop: null,
    prezzoIndicativoMin: 9200,
    prezzoIndicativoMax: 11500,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },

  // ------------------------------------------------------------------
  // ADDOLCITORI A SCAMBIO IONICO — PLACEHOLDER, marchio "AquaPura" (fittizio)
  // ------------------------------------------------------------------
  {
    marchio: "AquaPura [PLACEHOLDER]",
    modello: "SoftLine 10",
    tipo: "addolcitore",
    potenzaBtu: null,
    potenzaKw: null,
    capacitaLitri: null,
    volumeResinaLitri: 10,
    portataNominaleMc: 1.5,
    classeEnergetica: "-",
    seer: null,
    scop: null,
    prezzoIndicativoMin: 620,
    prezzoIndicativoMax: 820,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },
  {
    marchio: "AquaPura [PLACEHOLDER]",
    modello: "SoftLine 16",
    tipo: "addolcitore",
    potenzaBtu: null,
    potenzaKw: null,
    capacitaLitri: null,
    volumeResinaLitri: 16,
    portataNominaleMc: 2.0,
    classeEnergetica: "-",
    seer: null,
    scop: null,
    prezzoIndicativoMin: 780,
    prezzoIndicativoMax: 990,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },
  {
    marchio: "AquaPura [PLACEHOLDER]",
    modello: "SoftLine 25",
    tipo: "addolcitore",
    potenzaBtu: null,
    potenzaKw: null,
    capacitaLitri: null,
    volumeResinaLitri: 25,
    portataNominaleMc: 2.8,
    classeEnergetica: "-",
    seer: null,
    scop: null,
    prezzoIndicativoMin: 1050,
    prezzoIndicativoMax: 1350,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },

  // ------------------------------------------------------------------
  // AUTOCLAVI (gruppi di pressurizzazione) — PLACEHOLDER, marchio "IdroSpinta" (fittizio)
  // ------------------------------------------------------------------
  {
    marchio: "IdroSpinta [PLACEHOLDER]",
    modello: "PressBox 1.1",
    tipo: "autoclave",
    potenzaBtu: null,
    potenzaKw: 1.1,
    capacitaLitri: null,
    portataNominaleMc: 2.5,
    prevalenzaM: 35,
    classeEnergetica: "-",
    seer: null,
    scop: null,
    prezzoIndicativoMin: 780,
    prezzoIndicativoMax: 980,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },
  {
    marchio: "IdroSpinta [PLACEHOLDER]",
    modello: "PressBox 1.5",
    tipo: "autoclave",
    potenzaBtu: null,
    potenzaKw: 1.5,
    capacitaLitri: null,
    portataNominaleMc: 3.6,
    prevalenzaM: 48,
    classeEnergetica: "-",
    seer: null,
    scop: null,
    prezzoIndicativoMin: 980,
    prezzoIndicativoMax: 1250,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },
  {
    marchio: "IdroSpinta [PLACEHOLDER]",
    modello: "PressBox 2.2",
    tipo: "autoclave",
    potenzaBtu: null,
    potenzaKw: 2.2,
    capacitaLitri: null,
    portataNominaleMc: 5.0,
    prevalenzaM: 62,
    classeEnergetica: "-",
    seer: null,
    scop: null,
    prezzoIndicativoMin: 1350,
    prezzoIndicativoMax: 1700,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },

  // ------------------------------------------------------------------
  // POMPE DI SOLLEVAMENTO — PLACEHOLDER, marchio "IdroSpinta" (fittizio)
  // ------------------------------------------------------------------
  {
    marchio: "IdroSpinta [PLACEHOLDER]",
    modello: "LiftFlow 0.75",
    tipo: "pompa_sollevamento",
    potenzaBtu: null,
    potenzaKw: 0.75,
    capacitaLitri: null,
    portataNominaleMc: 3.0,
    prevalenzaM: 20,
    classeEnergetica: "-",
    seer: null,
    scop: null,
    prezzoIndicativoMin: 320,
    prezzoIndicativoMax: 450,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },
  {
    marchio: "IdroSpinta [PLACEHOLDER]",
    modello: "LiftFlow 1.5",
    tipo: "pompa_sollevamento",
    potenzaBtu: null,
    potenzaKw: 1.5,
    capacitaLitri: null,
    portataNominaleMc: 5.5,
    prevalenzaM: 38,
    classeEnergetica: "-",
    seer: null,
    scop: null,
    prezzoIndicativoMin: 480,
    prezzoIndicativoMax: 650,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },

  // ------------------------------------------------------------------
  // POMPE DI CIRCOLAZIONE (ricircolo ACS) — PLACEHOLDER, marchio "IdroSpinta" (fittizio)
  // ------------------------------------------------------------------
  {
    marchio: "IdroSpinta [PLACEHOLDER]",
    modello: "CircoFlow Mini",
    tipo: "pompa_circolazione",
    potenzaBtu: null,
    potenzaKw: 0.03,
    capacitaLitri: null,
    portataNominaleMc: 0.6,
    prevalenzaM: 2,
    classeEnergetica: "A",
    seer: null,
    scop: null,
    prezzoIndicativoMin: 110,
    prezzoIndicativoMax: 160,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },
  {
    marchio: "IdroSpinta [PLACEHOLDER]",
    modello: "CircoFlow Plus",
    tipo: "pompa_circolazione",
    potenzaBtu: null,
    potenzaKw: 0.06,
    capacitaLitri: null,
    portataNominaleMc: 1.5,
    prevalenzaM: 4,
    classeEnergetica: "A",
    seer: null,
    scop: null,
    prezzoIndicativoMin: 150,
    prezzoIndicativoMax: 210,
    schedaTecnicaUrl: "",
    note: "Dato di esempio — sostituire con listino reale del marchio rappresentato",
  },
];

const ORDINE_CLASSI_ENERGETICHE = ["A+++", "A++", "A+", "A"];

/**
 * Individua i prodotti a catalogo idonei a coprire un dato fabbisogno,
 * per la tipologia di impianto richiesta.
 *
 * Logica di abbinamento:
 * 1. Filtra i prodotti che coprono il fabbisogno calcolato (potenza ≥
 *    fabbisogno), con margine massimo del 25% per non sovradimensionare
 *    l'impianto (un impianto troppo sovradimensionato cicla in modo
 *    inefficiente, riducendo il comfort e la vita utile del compressore).
 * 2. Ordina per classe energetica decrescente, poi per prezzo indicativo
 *    minimo crescente.
 * 3. Restituisce al massimo 3 prodotti consigliati; il primo è il
 *    prodotto "Consigliato".
 *
 * Per i sistemi VRF, se `numeroUnitaRichieste` è indicato, i prodotti con
 * un numero massimo di unità interne collegabili insufficiente vengono
 * scartati anche se la potenza sarebbe sufficiente.
 *
 * @param {number} fabbisognoKw  Fabbisogno di dimensionamento richiesto [kW]
 * @param {"climatizzatore_split"|"pompa_di_calore_aria_acqua"|"vrf"|"chiller"} tipo
 * @param {number|null} numeroUnitaRichieste  Solo per tipo "vrf": numero di unità interne necessarie
 * @returns {{consigliati: Array, messaggio: string|null}}
 */
/**
 * Fra i prodotti idonei sceglie quelli della taglia giusta.
 *
 * Si preferiscono le macchine entro il margine del 25% sul fabbisogno: a
 * parità di resa, sovradimensionare costa di più e fa lavorare l'inverter
 * a carico parziale. Quando però nessuna macchina cade in quella finestra
 * si prende la taglia più piccola disponibile: il mercato non scende
 * sotto i 9.000 BTU, quindi per un ambiente che chiede meno quella è
 * semplicemente la macchina che si installa.
 */
/**
 * Posizione di una classe energetica nell'ordine di merito. Lo SCOP può
 * essere dichiarato per più zone climatiche ("A++/A+++"): si usa il primo
 * valore, che è quello di clima medio, cioè il riferimento italiano.
 */
function rangoClasse(classe) {
  if (!classe) return ORDINE_CLASSI_ENERGETICHE.length;
  const primaClasse = String(classe).split("/")[0].trim();
  const rango = ORDINE_CLASSI_ENERGETICHE.indexOf(primaClasse);
  return rango === -1 ? ORDINE_CLASSI_ENERGETICHE.length : rango;
}

/**
 * Ordine di proposta: prima la classe in raffrescamento, poi quella in
 * riscaldamento, poi il prezzo.
 *
 * Lo SCOP entra nel confronto perché è spesso l'unica differenza fra due
 * serie: CU-PRO e CA-PRO sono entrambe A+++ in freddo e si distinguono
 * solo in caldo. Ordinando sul solo SEER le due risultavano pari e vinceva
 * la più economica, cioè la macchina che rende meno in riscaldamento —
 * scegliendola per un motivo che non era stato valutato.
 */
function confrontaProdotti(a, b) {
  const freddo = rangoClasse(a.classeEnergetica) - rangoClasse(b.classeEnergetica);
  if (freddo !== 0) return freddo;
  const caldo = rangoClasse(a.classeScop) - rangoClasse(b.classeScop);
  if (caldo !== 0) return caldo;
  return a.prezzoIndicativoMin - b.prezzoIndicativoMin;
}

function selezionaPerCapacita(prodotti, richiestaBtu, potenzaDi, margineMax = 1.25) {
  const idonei = prodotti.filter((p) => potenzaDi(p) >= richiestaBtu);
  if (idonei.length === 0) return [];
  const entroMargine = idonei.filter((p) => potenzaDi(p) <= richiestaBtu * margineMax);
  if (entroMargine.length > 0) return entroMargine;
  const minima = Math.min(...idonei.map(potenzaDi));
  return idonei.filter((p) => potenzaDi(p) === minima);
}

/**
 * Le tre alternative di gamma sullo stesso fabbisogno: base (serie Q),
 * intermedia (CU-PRO) e top (CA-PRO).
 *
 * Non è un ordinamento per punteggio ma una scelta commerciale da
 * mettere davanti al cliente: ordinate per prezzo crescente si leggono
 * come quello che sono, tre offerte fra cui decidere. Le famiglie senza
 * livelli — canalizzabili, cassette, console — restituiscono l'elenco
 * normale.
 */
export function trovaAlternativeDiGamma(fabbisognoKw, tipologiaTerminale = "parete") {
  const richiestaBtu = fabbisognoKw * 3412;
  const potenzaDi = (p) => p.potenzaBtu;

  const perLivello = LIVELLI_GAMMA.map((livello) => {
    const dellaSerie = CATALOGO_PRODOTTI.filter(
      (p) => p.tipo === "climatizzatore_split" && p.livello === livello.valore && (!tipologiaTerminale || p.tipologiaTerminale === tipologiaTerminale)
    );
    const scelti = selezionaPerCapacita(dellaSerie, richiestaBtu, potenzaDi);
    // Dentro un livello la taglia giusta è una sola: a parità, la meno cara.
    scelti.sort((a, b) => a.prezzoIndicativoMin - b.prezzoIndicativoMin);
    return scelti[0] ? { ...livello, prodotto: scelti[0] } : null;
  }).filter(Boolean);

  if (perLivello.length === 0) {
    return { alternative: [], messaggio: "Nessun modello a catalogo copre questo fabbisogno — contattaci per una soluzione su misura" };
  }

  perLivello.sort((a, b) => a.prodotto.prezzoIndicativoMin - b.prodotto.prezzoIndicativoMin);
  return { alternative: perLivello, messaggio: null };
}

export function trovaProdottiConsigliati(fabbisognoKw, tipo = "climatizzatore_split", numeroUnitaRichieste = null, tipologiaTerminale = null) {
  const fabbisognoBtu = fabbisognoKw * 3412;
  const margineMax = 1.25;
  const basatoSuBtu = tipo === "climatizzatore_split";

  const idonei = CATALOGO_PRODOTTI.filter((p) => {
    if (p.tipo !== tipo) return false;
    if (tipo === "vrf" && numeroUnitaRichieste && p.maxUnitaInterne < numeroUnitaRichieste) return false;
    // La tipologia di terminale (parete, canalizzabile, cassette, console)
    // e una scelta dell'utente, non un esito del calcolo: senza filtro le
    // macchine a parete, piu economiche, coprirebbero sempre i primi posti
    // e le altre tipologie non comparirebbero mai.
    if (tipologiaTerminale && p.tipologiaTerminale && p.tipologiaTerminale !== tipologiaTerminale) return false;
    return true;
  });

  const potenzaDi = (p) => (basatoSuBtu ? p.potenzaBtu : p.potenzaKw * 3412);
  const richiestaBtu = basatoSuBtu ? fabbisognoBtu : fabbisognoKw * 3412;

  const candidati = selezionaPerCapacita(idonei, richiestaBtu, potenzaDi, margineMax);

  candidati.sort(confrontaProdotti);

  const consigliati = candidati.slice(0, 3);

  if (consigliati.length === 0) {
    return {
      consigliati: [],
      messaggio:
        "Nessun modello a catalogo copre questo fabbisogno — contattaci per una soluzione su misura",
    };
  }

  return { consigliati, messaggio: null };
}

/** Individua i pannelli solari termici a catalogo idonei a fornire una data capacità di accumulo integrativa [litri], stessa logica di margine +25% max. */
export function trovaPannelliSolariConsigliati(litriRichiesti) {
  const margineMax = 1.25;
  const candidati = CATALOGO_PRODOTTI.filter(
    (p) => p.tipo === "solare_termico" && p.capacitaLitri >= litriRichiesti && p.capacitaLitri <= litriRichiesti * margineMax
  );
  candidati.sort((a, b) => a.prezzoIndicativoMin - b.prezzoIndicativoMin);
  const consigliati = candidati.slice(0, 3);
  if (consigliati.length === 0) {
    return {
      consigliati: [],
      messaggio: "Nessun kit solare termico a catalogo copre questa capacità — contattaci per una soluzione su misura",
    };
  }
  return { consigliati, messaggio: null };
}

/** Individua i bollitori a catalogo idonei a coprire una data capacità richiesta, con la stessa logica di margine +25% max. */
export function trovaBollitoriConsigliati(litriRichiesti) {
  const margineMax = 1.25;
  const candidati = CATALOGO_PRODOTTI.filter(
    (p) => p.tipo === "bollitore" && p.capacitaLitri >= litriRichiesti && p.capacitaLitri <= litriRichiesti * margineMax
  );
  candidati.sort((a, b) => {
    const classeDiff = ORDINE_CLASSI_ENERGETICHE.indexOf(a.classeEnergetica) - ORDINE_CLASSI_ENERGETICHE.indexOf(b.classeEnergetica);
    if (classeDiff !== 0) return classeDiff;
    return a.prezzoIndicativoMin - b.prezzoIndicativoMin;
  });
  const consigliati = candidati.slice(0, 3);
  if (consigliati.length === 0) {
    return {
      consigliati: [],
      messaggio: "Nessun bollitore a catalogo copre questa capacità — contattaci per una soluzione su misura",
    };
  }
  return { consigliati, messaggio: null };
}

/**
 * Individua gli scaldacqua a pompa di calore a catalogo idonei a coprire
 * sia la capacità di accumulo richiesta sia la potenza termica necessaria
 * per il tempo di ricarica desiderato (vedi utils/pompaDiCaloreAcs.js).
 */
export function trovaScaldacquaPdCConsigliati(litriRichiesti, potenzaKwRichiesta) {
  const margineMax = 1.25;
  const candidati = CATALOGO_PRODOTTI.filter(
    (p) =>
      p.tipo === "scaldacqua_pompa_di_calore" &&
      p.capacitaLitri >= litriRichiesti &&
      p.capacitaLitri <= litriRichiesti * margineMax &&
      p.potenzaKw >= potenzaKwRichiesta
  );
  candidati.sort((a, b) => a.prezzoIndicativoMin - b.prezzoIndicativoMin);
  const consigliati = candidati.slice(0, 3);
  if (consigliati.length === 0) {
    return {
      consigliati: [],
      messaggio:
        "Nessuno scaldacqua a pompa di calore a catalogo copre questa combinazione di capacità e potenza — contattaci per una soluzione su misura",
    };
  }
  return { consigliati, messaggio: null };
}

/**
 * Individua gli addolcitori a catalogo idonei a coprire sia il volume di
 * resina richiesto sia la portata di punta della rete. A differenza dei
 * climatizzatori, qui non si applica un margine massimo sul volume di
 * resina: un addolcitore sovradimensionato non cicla in modo inefficiente
 * come un compressore, comporta solo un costo iniziale maggiore — meglio
 * proporre la taglia commerciale più piccola disponibile che copre il
 * fabbisogno (i risultati restano ordinati per prezzo crescente).
 */
export function trovaAddolcitoriConsigliati(volumeResinaRichiestoLitri, portataPuntaMc) {
  const candidati = CATALOGO_PRODOTTI.filter(
    (p) => p.tipo === "addolcitore" && p.volumeResinaLitri >= volumeResinaRichiestoLitri && p.portataNominaleMc >= portataPuntaMc
  );
  candidati.sort((a, b) => a.prezzoIndicativoMin - b.prezzoIndicativoMin);
  const consigliati = candidati.slice(0, 3);
  if (consigliati.length === 0) {
    return {
      consigliati: [],
      messaggio: "Nessun addolcitore a catalogo copre questa combinazione di resina e portata — contattaci per una soluzione su misura",
    };
  }
  return { consigliati, messaggio: null };
}

/**
 * Individua le pompe (autoclave, sollevamento, circolazione) a catalogo
 * idonee a coprire portata e prevalenza richieste: entrambe devono essere
 * uguali o superiori al fabbisogno. Nessun margine massimo sulla portata
 * (a differenza dei climatizzatori): le taglie commerciali di pompe sono
 * discrete e un surplus di portata non compromette il funzionamento come
 * un compressore sovradimensionato — i risultati restano ordinati per
 * prezzo crescente, quindi la prima proposta è la più piccola idonea.
 */
export function trovaPompeConsigliate(tipo, portataMcRichiesta, prevalenzaMRichiesta) {
  const candidati = CATALOGO_PRODOTTI.filter(
    (p) => p.tipo === tipo && p.portataNominaleMc >= portataMcRichiesta && p.prevalenzaM >= prevalenzaMRichiesta
  );
  candidati.sort((a, b) => a.prezzoIndicativoMin - b.prezzoIndicativoMin);
  const consigliati = candidati.slice(0, 3);
  if (consigliati.length === 0) {
    return {
      consigliati: [],
      messaggio: "Nessuna pompa a catalogo copre questa combinazione di portata e prevalenza — contattaci per una soluzione su misura",
    };
  }
  return { consigliati, messaggio: null };
}

/** Individua gli impianti fotovoltaici a catalogo idonei a coprire una data taglia richiesta [kWp], stessa logica di margine +25% max. */
export function trovaFotovoltaicoConsigliati(kWpRichiesti) {
  const margineMax = 1.25;
  const candidati = CATALOGO_PRODOTTI.filter(
    (p) => p.tipo === "fotovoltaico" && p.potenzaKw >= kWpRichiesti && p.potenzaKw <= kWpRichiesti * margineMax
  );
  candidati.sort((a, b) => a.prezzoIndicativoMin - b.prezzoIndicativoMin);
  const consigliati = candidati.slice(0, 3);
  if (consigliati.length === 0) {
    return {
      consigliati: [],
      messaggio: "Nessun kit fotovoltaico a catalogo copre questa taglia — contattaci per una soluzione su misura",
    };
  }
  return { consigliati, messaggio: null };
}
