/**
 * gammaAux.js — Gamma AUX Air Conditioner, listino Italia 2026.
 *
 * FONTE: "Listino Prezzi AUX 2026" (TARIFA 2026), listino al pubblico
 * IVA ESCLUSA. I prezzi sono riportati per unità interna ed esterna
 * separatamente, come nel listino; il prezzo di sistema è la somma dei
 * due ed è calcolato qui, non riscritto a mano, perché un totale
 * trascritto a mano è un errore che aspetta di succedere.
 *
 * AGGIORNAMENTO: quando esce il listino nuovo si sostituiscono i numeri
 * di questo file e nient'altro. Le capacità, le classi e i codici
 * modello sono quelli dichiarati dal costruttore: non vanno "corretti"
 * per farli tornare con un calcolo.
 *
 * CAPACITÀ: il listino dichiara due valori, freddo e caldo. Per la
 * scelta della macchina si usa il MINORE dei due: l'unità deve coprire
 * sia il carico estivo sia quello invernale, quindi la capacità
 * realmente garantita in entrambe le stagioni è la più bassa. Per quasi
 * tutti i modelli AUX coincide con la resa in freddo.
 */

export const MARCHIO_AUX = "AUX";
export const LISTINO_AUX = "Listino Italia 2026, IVA esclusa";

/**
 * Livelli di gamma degli split, mono e multi. Sono tre alternative sullo
 * stesso fabbisogno: cambia l'efficienza e il prezzo, non la taglia.
 * Vanno presentate insieme, perché la scelta fra le tre è del cliente e
 * non del calcolo.
 */
export const LIVELLI_GAMMA = [
  { valore: "base", etichetta: "Base", serie: "Q", descrizione: "Serie Q: la soluzione più economica, classe A++." },
  { valore: "intermedio", etichetta: "Intermedia", serie: "CU-PRO", descrizione: "Serie CU-PRO: classe A+++ in raffrescamento, unità esterna compatta." },
  { valore: "top", etichetta: "Top", serie: "CA-PRO", descrizione: "Serie CA-PRO: il massimo di gamma, con la migliore resa in riscaldamento." },
];

/** Livelli di efficienza delle unità esterne multisplit. */
export const LIVELLI_ESTERNA_MULTI = [
  {
    valore: "standard",
    classe: "A++",
    etichetta: "Standard A++",
    descrizione: "Gamma completa da 14K a 42K, da 2 a 5 unità interne collegabili.",
  },
  {
    valore: "alta-efficienza",
    classe: "A+++",
    etichetta: "Alta efficienza A+++",
    descrizione: "Solo taglie 18K e 27K, con 2 o 4 unità interne collegabili: la scelta vincola il numero di ambienti serviti.",
  },
];

/** Livello di gamma a partire dalla serie del prodotto. */
export function livelloDiGamma(serie) {
  const nome = String(serie).replace(/^Multi /, "");
  return LIVELLI_GAMMA.find((l) => l.serie === nome)?.valore ?? null;
}

/**
 * Tipologie di terminale: è la prima scelta che il cliente deve fare,
 * prima ancora della taglia. Cambia l'installazione, l'estetica e il
 * prezzo, non il fabbisogno.
 */
export const TIPOLOGIE_TERMINALE = [
  {
    valore: "parete",
    etichetta: "Split a parete",
    descrizione: "L'unità più diffusa: si monta in alto sulla parete. Installazione semplice, costo più basso.",
  },
  {
    valore: "canalizzabile",
    etichetta: "Canalizzabile",
    descrizione: "Nascosto nel controsoffitto, manda l'aria in più ambienti con bocchette. Invisibile, richiede opere edili.",
  },
  {
    valore: "cassette",
    etichetta: "Cassette a soffitto",
    descrizione: "Incassato a soffitto, diffonde l'aria su quattro lati. Adatto a locali ampi e quadrati.",
  },
  {
    valore: "console",
    etichetta: "Console a pavimento",
    descrizione: "A pavimento come un radiatore. Utile dove non si può forare in alto o si sostituisce un termosifone.",
  },
];

/**
 * MONOSPLIT — una unità interna, una esterna dedicata.
 * Serie CA-PRO e CU-PRO in classe A+++, serie Q in A++.
 */
export const MONOSPLIT_AUX = [
  // Serie CA-PRO — A+++ / SCOP A++ (medio) e A+++ (caldo)
  { serie: "CA-PRO", modello: "CA-PRO-09", taglia: 9, freddoKw: 2.7, caldoKw: 3.3, classeSeer: "A+++", classeScop: "A++/A+++", codiceInterna: "FTXM26CA-A", codiceEsterna: "RTX26MCA-T1A", prezzoInterna: 435, prezzoEsterna: 865 },
  { serie: "CA-PRO", modello: "CA-PRO-12", taglia: 12, freddoKw: 3.5, caldoKw: 4.2, classeSeer: "A+++", classeScop: "A++/A+++", codiceInterna: "FTXM35CA-A", codiceEsterna: "RTX35MCA-T1A", prezzoInterna: 460, prezzoEsterna: 910 },
  { serie: "CA-PRO", modello: "CA-PRO-18", taglia: 18, freddoKw: 5.4, caldoKw: 5.8, classeSeer: "A+++", classeScop: "A++/A+++", codiceInterna: "FTXM52CA-A", codiceEsterna: "RTX52MCA-T1A", prezzoInterna: 645, prezzoEsterna: 1180 },
  { serie: "CA-PRO", modello: "CA-PRO-24", taglia: 24, freddoKw: 7.3, caldoKw: 7.2, classeSeer: "A+++", classeScop: "A++/A+++", codiceInterna: "FTXM71CA-A", codiceEsterna: "RTX71MCA-T1A", prezzoInterna: 760, prezzoEsterna: 1570 },

  // Serie CU-PRO — stesse rese della CA-PRO, unità esterna più compatta
  { serie: "CU-PRO", modello: "CU-PRO-09", taglia: 9, freddoKw: 2.7, caldoKw: 3.3, classeSeer: "A+++", classeScop: "A++/A+++", codiceInterna: "FTXM26CU1-A", codiceEsterna: "RTX26MCU1-T1A", prezzoInterna: 415, prezzoEsterna: 740 },
  { serie: "CU-PRO", modello: "CU-PRO-12", taglia: 12, freddoKw: 3.5, caldoKw: 4.2, classeSeer: "A+++", classeScop: "A++/A+++", codiceInterna: "FTXM35CU1-A", codiceEsterna: "RTX35MCU1-T1A", prezzoInterna: 435, prezzoEsterna: 780 },
  { serie: "CU-PRO", modello: "CU-PRO-18", taglia: 18, freddoKw: 5.4, caldoKw: 5.8, classeSeer: "A+++", classeScop: "A++/A+++", codiceInterna: "FTXM52CU1-A", codiceEsterna: "RTX52MCU1-T1A", prezzoInterna: 600, prezzoEsterna: 1165 },
  { serie: "CU-PRO", modello: "CU-PRO-24", taglia: 24, freddoKw: 7.3, caldoKw: 7.2, classeSeer: "A+++", classeScop: "A++/A+++", codiceInterna: "FTXM71CU1-A", codiceEsterna: "RTX71MCU1-T1A", prezzoInterna: 715, prezzoEsterna: 1545 },

  // Serie Q — entrata di gamma, A++
  { serie: "Q", modello: "Q-09", taglia: 9, freddoKw: 2.7, caldoKw: 2.7, classeSeer: "A++", classeScop: "A++/A+", codiceInterna: "FTXM26QH-B", codiceEsterna: "RTX26MQH-T1B", prezzoInterna: 306, prezzoEsterna: 477 },
  { serie: "Q", modello: "Q-12", taglia: 12, freddoKw: 3.5, caldoKw: 3.8, classeSeer: "A++", classeScop: "A++/A+", codiceInterna: "FTXM35QH-B", codiceEsterna: "RTX35MQH-T1B", prezzoInterna: 347, prezzoEsterna: 471 },
  { serie: "Q", modello: "Q-18", taglia: 18, freddoKw: 5.1, caldoKw: 5.2, classeSeer: "A++", classeScop: "A++/A+", codiceInterna: "FTXM52QH-B", codiceEsterna: "RTX52MQH-T1B", prezzoInterna: 505, prezzoEsterna: 730 },
  { serie: "Q", modello: "Q-24", taglia: 24, freddoKw: 7.2, caldoKw: 7.2, classeSeer: "A++", classeScop: "A++/A+", codiceInterna: "FTXM71QH-B", codiceEsterna: "RTX71MQH-T1B", prezzoInterna: 645, prezzoEsterna: 1070 },
];

/**
 * LIGHT COMMERCIAL — canalizzabili, cassette e console, ciascuno con la
 * propria unità esterna dedicata. Le taglie 48 e 60 sono trifase.
 */
export const LIGHT_COMMERCIAL_AUX = [
  { serie: "Canalizzabile", tipologia: "canalizzabile", modello: "CANALIZZABILE-12", taglia: 12, freddoKw: 3.52, caldoKw: 3.81, classeSeer: "A++", classeScop: "A+/A+++", codiceInterna: "FDMD35M-B", codiceEsterna: "RXYL35M-T1B", prezzoInterna: 890, prezzoEsterna: 685 },
  { serie: "Canalizzabile", tipologia: "canalizzabile", modello: "CANALIZZABILE-18", taglia: 18, freddoKw: 5.28, caldoKw: 5.6, classeSeer: "A++", classeScop: "A+/A+++", codiceInterna: "FDMD52M-B", codiceEsterna: "RXYL52M-T1B", prezzoInterna: 960, prezzoEsterna: 1005 },
  { serie: "Canalizzabile", tipologia: "canalizzabile", modello: "CANALIZZABILE-24", taglia: 24, freddoKw: 7.0, caldoKw: 7.91, classeSeer: "A++", classeScop: "A+/A+++", codiceInterna: "FDMD71M-B", codiceEsterna: "RXYL71M-T1B", prezzoInterna: 1170, prezzoEsterna: 1390 },
  { serie: "Canalizzabile", tipologia: "canalizzabile", modello: "CANALIZZABILE-30", taglia: 30, freddoKw: 8.79, caldoKw: 9.39, classeSeer: "A++", classeScop: "A+/A+++", codiceInterna: "FDMD90M-B", codiceEsterna: "RXYL90M-T1B", prezzoInterna: 1242, prezzoEsterna: 1863 },
  { serie: "Canalizzabile", tipologia: "canalizzabile", modello: "CANALIZZABILE-36", taglia: 36, freddoKw: 10.55, caldoKw: 11.43, classeSeer: "A++", classeScop: "A+/A+++", codiceInterna: "FDMD105M-B", codiceEsterna: "RXYL105M-T1B", prezzoInterna: 1644, prezzoEsterna: 2466 },
  { serie: "Canalizzabile", tipologia: "canalizzabile", modello: "CANALIZZABILE-42", taglia: 42, freddoKw: 12.3, caldoKw: 13.5, classeSeer: "A+", classeScop: "A+/A+++", codiceInterna: "FDMD125M-B", codiceEsterna: "RXYL125M-T1B", prezzoInterna: 1772, prezzoEsterna: 2658 },
  { serie: "Canalizzabile", tipologia: "canalizzabile", modello: "CANALIZZABILE-48 3Ph", taglia: 48, trifase: true, freddoKw: 14.07, caldoKw: 16.12, classeSeer: "A", classeScop: "A/A++", codiceInterna: "FDMD140M-B", codiceEsterna: "RXYL140M-T1B", prezzoInterna: 2100, prezzoEsterna: 3150 },
  { serie: "Canalizzabile", tipologia: "canalizzabile", modello: "CANALIZZABILE-60 3Ph", taglia: 60, trifase: true, freddoKw: 16.0, caldoKw: 17.6, classeSeer: "A", classeScop: "A/A++", codiceInterna: "FDMD175M-B", codiceEsterna: "RXYL175M-T1B", prezzoInterna: 2374, prezzoEsterna: 3561 },

  { serie: "Cassette compatto", tipologia: "cassette", modello: "CASSETTE COMPATTO-12", taglia: 12, freddoKw: 3.52, caldoKw: 3.81, classeSeer: "A++", classeScop: "A+/A+++", codiceInterna: "FDCA35YB-B", codiceEsterna: "RXYL35M-T1B", prezzoInterna: 870, prezzoEsterna: 705 },
  { serie: "Cassette compatto", tipologia: "cassette", modello: "CASSETTE COMPATTO-18", taglia: 18, freddoKw: 5.28, caldoKw: 5.6, classeSeer: "A++", classeScop: "A+/A+++", codiceInterna: "FDCA52YB-B", codiceEsterna: "RXYL52M-T1B", prezzoInterna: 940, prezzoEsterna: 1025 },
  { serie: "Cassette", tipologia: "cassette", modello: "CASSETTE-24", taglia: 24, freddoKw: 7.0, caldoKw: 7.91, classeSeer: "A++", classeScop: "A+/A+++", codiceInterna: "FDCA71Q-B", codiceEsterna: "RXYL71M-T1B", prezzoInterna: 1150, prezzoEsterna: 1410 },
  { serie: "Cassette", tipologia: "cassette", modello: "CASSETTE-36", taglia: 36, freddoKw: 10.55, caldoKw: 11.43, classeSeer: "A++", classeScop: "A+/A+++", codiceInterna: "FDCA105Q-B", codiceEsterna: "RXYL105M-T1B", prezzoInterna: 1662, prezzoEsterna: 2493 },
  { serie: "Cassette", tipologia: "cassette", modello: "CASSETTE-42", taglia: 42, freddoKw: 12.3, caldoKw: 13.5, classeSeer: "A++", classeScop: "A+/A+++", codiceInterna: "FDCA125Q-B", codiceEsterna: "RXYL125M-T1B", prezzoInterna: 1828, prezzoEsterna: 2742 },
  { serie: "Cassette", tipologia: "cassette", modello: "CASSETTE-48 3Ph", taglia: 48, trifase: true, freddoKw: 14.07, caldoKw: 16.12, classeSeer: "A+", classeScop: "A/A++", codiceInterna: "FDCA140Q-B", codiceEsterna: "RXYL140M-T1B", prezzoInterna: 2100, prezzoEsterna: 3150 },
  { serie: "Cassette", tipologia: "cassette", modello: "CASSETTE-60 3Ph", taglia: 60, trifase: true, freddoKw: 16.0, caldoKw: 17.6, classeSeer: "A+", classeScop: "A/A+++", codiceInterna: "FDCA175Q-B", codiceEsterna: "RXYL175M-T1B", prezzoInterna: 2374, prezzoEsterna: 3561 },

  { serie: "Console", tipologia: "console", modello: "CONSOLE-12", taglia: 12, freddoKw: 3.52, caldoKw: 3.81, classeSeer: "A++", classeScop: "A+/A+++", codiceInterna: "FDCO35-B", codiceEsterna: "RXYL35M-T1B", prezzoInterna: 1090, prezzoEsterna: 965 },
  { serie: "Console", tipologia: "console", modello: "CONSOLE-18", taglia: 18, freddoKw: 4.7, caldoKw: 5.0, classeSeer: "A++", classeScop: "A+/A+++", codiceInterna: "FDCO52-B", codiceEsterna: "RXYL52M-T1B", prezzoInterna: 1130, prezzoEsterna: 1160 },
];

/**
 * MULTI SPLIT — unità interne collegabili a un'unica unità esterna.
 * Il listino non dichiara classe energetica per la singola interna:
 * l'efficienza del sistema dipende dall'unità esterna scelta.
 */
export const UNITA_INTERNE_MULTI_AUX = [
  { serie: "Multi CA-PRO", tipologia: "parete", modello: "ML CA-PRO-09", taglia: 9, freddoKw: 2.7, caldoKw: 3.3, codiceInterna: "FTXM26CA-A", prezzo: 435 },
  { serie: "Multi CA-PRO", tipologia: "parete", modello: "ML CA-PRO-12", taglia: 12, freddoKw: 3.5, caldoKw: 4.2, codiceInterna: "FTXM35CA-A", prezzo: 460 },
  { serie: "Multi CA-PRO", tipologia: "parete", modello: "ML CA-PRO-18", taglia: 18, freddoKw: 5.4, caldoKw: 5.8, codiceInterna: "FTXM52CA-A", prezzo: 645 },
  { serie: "Multi CA-PRO", tipologia: "parete", modello: "ML CA-PRO-24", taglia: 24, freddoKw: 7.3, caldoKw: 7.2, codiceInterna: "FTXM71CA-A", prezzo: 760 },

  { serie: "Multi CU-PRO", tipologia: "parete", modello: "ML CU-PRO-09", taglia: 9, freddoKw: 2.7, caldoKw: 3.3, codiceInterna: "FTXM21CU1-A", prezzo: 415 },
  { serie: "Multi CU-PRO", tipologia: "parete", modello: "ML CU-PRO-12", taglia: 12, freddoKw: 3.5, caldoKw: 4.2, codiceInterna: "FTXM35CU1-A", prezzo: 435 },
  { serie: "Multi CU-PRO", tipologia: "parete", modello: "ML CU-PRO-18", taglia: 18, freddoKw: 5.4, caldoKw: 5.8, codiceInterna: "FTXM52CU1-A", prezzo: 600 },
  { serie: "Multi CU-PRO", tipologia: "parete", modello: "ML CU-PRO-24", taglia: 24, freddoKw: 7.3, caldoKw: 7.2, codiceInterna: "FTXM71CU1-A", prezzo: 715 },

  { serie: "Multi Q", tipologia: "parete", modello: "ML Q-09", taglia: 9, freddoKw: 2.7, caldoKw: 2.7, codiceInterna: "FTXM26QH-B", prezzo: 306 },
  { serie: "Multi Q", tipologia: "parete", modello: "ML Q-12", taglia: 12, freddoKw: 3.5, caldoKw: 3.8, codiceInterna: "FTXM35QH-B", prezzo: 347 },
  { serie: "Multi Q", tipologia: "parete", modello: "ML Q-18", taglia: 18, freddoKw: 5.1, caldoKw: 5.2, codiceInterna: "FTXM52QH-B", prezzo: 505 },
  { serie: "Multi Q", tipologia: "parete", modello: "ML Q-24", taglia: 24, freddoKw: 7.2, caldoKw: 7.2, codiceInterna: "FTXM71QH-B", prezzo: 645 },

  { serie: "Multi canalizzabile", tipologia: "canalizzabile", modello: "ML CANALIZZABILE-09", taglia: 9, freddoKw: 2.6, caldoKw: 2.9, codiceInterna: "FDMD26Y-B", prezzo: 875 },
  { serie: "Multi canalizzabile", tipologia: "canalizzabile", modello: "ML CANALIZZABILE-12", taglia: 12, freddoKw: 3.5, caldoKw: 3.8, codiceInterna: "FDMD35M-B", prezzo: 890 },
  { serie: "Multi canalizzabile", tipologia: "canalizzabile", modello: "ML CANALIZZABILE-18", taglia: 18, freddoKw: 5.3, caldoKw: 5.6, codiceInterna: "FDMD52M-B", prezzo: 960 },
  { serie: "Multi canalizzabile", tipologia: "canalizzabile", modello: "ML CANALIZZABILE-24", taglia: 24, freddoKw: 7.0, caldoKw: 7.9, codiceInterna: "FDMD71M-B", prezzo: 1170 },

  { serie: "Multi cassette", tipologia: "cassette", modello: "ML CASSETTE COMPATTO-09", taglia: 9, freddoKw: 2.8, caldoKw: 3.0, codiceInterna: "FDCA26YB-B", prezzo: 850 },
  { serie: "Multi cassette", tipologia: "cassette", modello: "ML CASSETTE COMPATTO-12", taglia: 12, freddoKw: 3.5, caldoKw: 3.8, codiceInterna: "FDCA35YB-B", prezzo: 870 },
  { serie: "Multi cassette", tipologia: "cassette", modello: "ML CASSETTE COMPATTO-18", taglia: 18, freddoKw: 5.3, caldoKw: 5.6, codiceInterna: "FDCA52YB-B", prezzo: 940 },
  { serie: "Multi cassette", tipologia: "cassette", modello: "ML CASSETTE-24", taglia: 24, freddoKw: 7.0, caldoKw: 7.9, codiceInterna: "FDCA71Q-B", prezzo: 1150 },

  { serie: "Multi console", tipologia: "console", modello: "ML CONSOLE-09", taglia: 9, freddoKw: 2.6, caldoKw: 2.8, codiceInterna: "FDCO26-B", prezzo: 1050 },
  { serie: "Multi console", tipologia: "console", modello: "ML CONSOLE-12", taglia: 12, freddoKw: 3.5, caldoKw: 3.5, codiceInterna: "FDCO35-B", prezzo: 1090 },
  { serie: "Multi console", tipologia: "console", modello: "ML CONSOLE-18", taglia: 18, freddoKw: 4.7, caldoKw: 5.0, codiceInterna: "FDCO52-B", prezzo: 1130 },
];

/**
 * Unità esterne multisplit. `attacchi` è il numero massimo di unità
 * interne collegabili, ricavato dagli attacchi frigoriferi dichiarati a
 * listino (2 x 1/4'' = due unità interne).
 */
export const UNITA_ESTERNE_MULTI_AUX = [
  { modello: "UE Multisplit 14K", classe: "A++", freddoKw: 4.1, caldoKw: 4.5, attacchi: 2, codice: "RXYM42M(2)-T1B", prezzo: 1325 },
  { modello: "UE Multisplit 18K", classe: "A++", freddoKw: 5.3, caldoKw: 5.6, attacchi: 2, codice: "RXYM52M(2)-T1B", prezzo: 1440 },
  { modello: "UE Multisplit 21K", classe: "A++", freddoKw: 6.2, caldoKw: 6.6, attacchi: 3, codice: "RXYM62M(3)-T1B", prezzo: 1690 },
  { modello: "UE Multisplit 27K", classe: "A++", freddoKw: 7.9, caldoKw: 8.2, attacchi: 3, codice: "RXYM80M(3)-T1B", prezzo: 2055 },
  { modello: "UE Multisplit 28K", classe: "A++", freddoKw: 8.0, caldoKw: 9.4, attacchi: 4, codice: "RXYM82M(4)-T1B", prezzo: 3200 },
  { modello: "UE Multisplit 36K", classe: "A++", freddoKw: 10.6, caldoKw: 11.0, attacchi: 4, codice: "RXYM105M(4)-T1B", prezzo: 3885 },
  { modello: "UE Multisplit 42K", classe: "A++", freddoKw: 12.0, caldoKw: 13.0, attacchi: 5, codice: "RXYM125M(5)-T1B", prezzo: 4115 },
  { modello: "UE Multisplit 18K", classe: "A+++", freddoKw: 5.2, caldoKw: 6.0, attacchi: 2, codice: "RXYM52M(2)-T1A", prezzo: 1710 },
  { modello: "UE Multisplit 27K", classe: "A+++", freddoKw: 8.0, caldoKw: 9.4, attacchi: 4, codice: "RXYM80M(4)-T1A", prezzo: 2680 },
];

/**
 * Capacità garantita in entrambe le stagioni [kW]: la minore fra resa in
 * freddo e resa in caldo. È il numero con cui confrontare il fabbisogno
 * di dimensionamento, che è a sua volta il maggiore fra carico estivo e
 * invernale.
 */
export function capacitaGarantita(unita) {
  return Math.min(unita.freddoKw, unita.caldoKw);
}

/** Prezzo di sistema di un monosplit o di una macchina light commercial [€, IVA esclusa]. */
export function prezzoSistema(unita) {
  return unita.prezzoInterna + unita.prezzoEsterna;
}
