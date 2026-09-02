/**
 * parametriCalcolo.js — Registro unico dei parametri del calcolo termico.
 *
 * Ogni coefficiente che entra nel carico di un ambiente è elencato qui
 * con il proprio valore di default, l'unità di misura e la fonte da cui
 * proviene. Tre conseguenze volute:
 *
 * 1. NIENTE COSTANTI NASCOSTE. Un numero che influenza il risultato e non
 *    è raggiungibile dall'utente è un'assunzione imposta. Qui ogni
 *    parametro è sovrascrivibile ambiente per ambiente: chi ha il dato
 *    reale lo inserisce e il calcolo smette di essere una convenzione.
 *
 * 2. DEFAULT SEMPRE SENSATI. Nessun campo parte vuoto: il valore
 *    normativo o di pratica corrente è già compilato, così il software
 *    produce un risultato verosimile senza che l'utente tocchi nulla.
 *
 * 3. TRACCIABILITÀ. Il campo `fonte` dice contro quale norma o prassi
 *    verificare ciascun valore. È l'elenco da cui partire per il
 *    riscontro sulle tabelle UNI, che nessun software può fare da sé.
 *
 * I default che dipendono dall'ambiente (ricambi d'aria per destinazione
 * d'uso, ponti termici per epoca, coefficienti per esposizione) sono
 * funzioni dell'ambiente stesso, non numeri fissi.
 *
 * NON entrano in questo registro le costanti fisiche — capacità termica
 * e calore latente dell'aria, calore specifico dell'acqua, fattori di
 * conversione fra unità. Non sono variabili di progetto: sono proprietà
 * della materia, e renderle modificabili vorrebbe dire consentire di
 * piegare la fisica finché il risultato non piace. Restano dichiarate
 * come costanti in data/calculations.js e visibili in relazione.
 */
import {
  TEMP_INTERNA_PROGETTO,
  TEMP_INTERNA_ESTIVA,
  FATTORE_ESPOSIZIONE,
  APPORTO_SOLARE,
  RICAMBI_ARIA_PER_TIPO_LOCALE,
  MAGGIORAZIONE_PONTI_TERMICI_PER_EPOCA,
  FATTORE_B_LOCALE_NON_RISCALDATO,
  INCREMENTO_SOLE_ARIA_PER_ESPOSIZIONE,
  DELTA_UMIDITA_SPECIFICA_G_KG,
  MAGGIORAZIONE_ULTIMO_PIANO,
  MAGGIORAZIONE_PIANO_INTERMEDIO,
  MAGGIORAZIONE_PIANO_TERRA,
} from "../data/calculations.js";

/** Apporto sensibile + latente di una persona in attività sedentaria [W]. */
export const APPORTO_PERSONA_W = 130;
/** Apporto interno convenzionale delle apparecchiature domestiche [W/m²]. */
export const APPORTO_APPARECCHI_W_M2 = 8;
/** Fattore di schermatura del vetro (tende, persiane, aggetti): quota di apporto solare che entra davvero. */
export const FATTORE_SCHERMATURA_SOLARE = 0.5;
/** Margine di sicurezza sul carico estivo di progetto. */
export const MARGINE_SICUREZZA_ESTIVO = 0.1;
/** Coefficiente di riduzione della dispersione del pavimento controterra. */
export const COEFF_PAVIMENTO_CONTROTERRA = 0.7;
/**
 * Capacità termica volumica dell'aria [Wh/(m³·K)]: densità per calore
 * specifico a condizioni ordinarie. È una proprietà fisica dell'aria,
 * non una scelta di progetto, e per questo NON compare fra i parametri
 * modificabili: renderla sovrascrivibile significherebbe permettere di
 * cambiare la fisica per far tornare un risultato.
 */
export const CAPACITA_TERMICA_ARIA = 0.34;

function fattorePianoDefault(ambiente) {
  if (ambiente.ultimoPiano) return MAGGIORAZIONE_ULTIMO_PIANO;
  if (ambiente.pianoTerra) return MAGGIORAZIONE_PIANO_TERRA;
  return MAGGIORAZIONE_PIANO_INTERMEDIO;
}

/**
 * Definizione di ogni parametro sovrascrivibile.
 * `gruppo` serve solo all'interfaccia per raggrupparli in modo leggibile.
 */
export const PARAMETRI_CALCOLO = [
  {
    chiave: "tempInternaInvernale",
    etichetta: "Temperatura interna di progetto, invernale",
    unita: "°C",
    gruppo: "Temperature di progetto",
    passo: 0.5,
    min: 14,
    max: 26,
    fonte: "DPR 412/93, uso residenziale",
    default: () => TEMP_INTERNA_PROGETTO,
  },
  {
    chiave: "tempInternaEstiva",
    etichetta: "Temperatura interna di progetto, estiva",
    unita: "°C",
    gruppo: "Temperature di progetto",
    passo: 0.5,
    min: 20,
    max: 30,
    fonte: "valore convenzionale di benessere estivo",
    default: () => TEMP_INTERNA_ESTIVA,
  },
  {
    chiave: "ricambiAriaOra",
    etichetta: "Ricambi d'aria",
    unita: "vol/h",
    gruppo: "Ventilazione",
    passo: 0.1,
    min: 0,
    max: 10,
    fonte: "UNI 10339, per destinazione d'uso del locale",
    default: (a) => RICAMBI_ARIA_PER_TIPO_LOCALE[a.tipoLocale] ?? RICAMBI_ARIA_PER_TIPO_LOCALE.altro,
  },
  {
    chiave: "deltaUmiditaSpecifica",
    etichetta: "Differenza di umidità specifica esterna-interna",
    unita: "g/kg",
    gruppo: "Ventilazione",
    passo: 0.1,
    min: 0,
    max: 15,
    fonte: "differenza convenzionale di progetto estiva; con il bulbo umido del comune va ricalcolata",
    default: () => DELTA_UMIDITA_SPECIFICA_G_KG,
  },
  {
    chiave: "maggiorazionePontiTermici",
    etichetta: "Maggiorazione per ponti termici",
    unita: "frazione",
    gruppo: "Involucro",
    passo: 0.01,
    min: 0,
    max: 0.5,
    fonte: "UNI EN 12831, metodo semplificato, per epoca costruttiva",
    default: (a) => MAGGIORAZIONE_PONTI_TERMICI_PER_EPOCA[a.epocaCostruttiva] ?? 0,
  },
  {
    chiave: "fattoreBLocaleNonRiscaldato",
    etichetta: "Fattore b verso locale non riscaldato",
    unita: "—",
    gruppo: "Involucro",
    passo: 0.05,
    min: 0,
    max: 1,
    fonte: "UNI EN 12831, dispersione verso ambienti a temperatura intermedia",
    default: () => FATTORE_B_LOCALE_NON_RISCALDATO,
  },
  {
    chiave: "coeffPavimentoControterra",
    etichetta: "Coefficiente di riduzione del pavimento controterra",
    unita: "—",
    gruppo: "Involucro",
    passo: 0.05,
    min: 0,
    max: 1,
    fonte: "attenuazione convenzionale della dispersione verso terreno",
    default: () => COEFF_PAVIMENTO_CONTROTERRA,
  },
  {
    chiave: "fattoreEsposizione",
    etichetta: "Fattore correttivo per esposizione",
    unita: "—",
    gruppo: "Involucro",
    passo: 0.01,
    min: 0.5,
    max: 1.5,
    fonte: "maggiorazione convenzionale per orientamento prevalente",
    default: (a) => FATTORE_ESPOSIZIONE[a.esposizionePrevalente] ?? 1,
  },
  {
    chiave: "fattorePiano",
    etichetta: "Fattore correttivo per posizione in edificio",
    unita: "—",
    gruppo: "Involucro",
    passo: 0.01,
    min: 0.5,
    max: 1.5,
    fonte: "maggiorazione convenzionale per piano terra / ultimo piano",
    default: fattorePianoDefault,
  },
  {
    chiave: "apportoSolareWm2",
    etichetta: "Apporto solare sul vetro",
    unita: "W/m²",
    gruppo: "Carichi estivi",
    passo: 10,
    min: 0,
    max: 900,
    fonte: "metodo Carrier, irraggiamento di picco per esposizione",
    default: (a) => APPORTO_SOLARE[a.esposizionePrevalente] ?? 0,
  },
  {
    chiave: "fattoreSchermaturaSolare",
    etichetta: "Fattore di schermatura del vetro",
    unita: "—",
    gruppo: "Carichi estivi",
    passo: 0.05,
    min: 0.05,
    max: 1,
    fonte: "tende, persiane e aggetti: quota di apporto solare che entra davvero",
    default: () => FATTORE_SCHERMATURA_SOLARE,
  },
  {
    chiave: "incrementoSoleAria",
    etichetta: "Incremento sole-aria sulle superfici opache",
    unita: "K",
    gruppo: "Carichi estivi",
    passo: 1,
    min: 0,
    max: 25,
    fonte: "metodo Carrier, temperatura sole-aria per esposizione (pareti chiare)",
    default: (a) => INCREMENTO_SOLE_ARIA_PER_ESPOSIZIONE[a.esposizionePrevalente] ?? 0,
  },
  {
    chiave: "apportoPersonaW",
    etichetta: "Apporto termico per persona",
    unita: "W",
    gruppo: "Carichi estivi",
    passo: 5,
    min: 0,
    max: 400,
    fonte: "sensibile + latente, attività sedentaria",
    default: () => APPORTO_PERSONA_W,
  },
  {
    chiave: "apportoApparecchiWm2",
    etichetta: "Apporto termico delle apparecchiature",
    unita: "W/m²",
    gruppo: "Carichi estivi",
    passo: 1,
    min: 0,
    max: 60,
    fonte: "carico interno convenzionale per uso residenziale",
    default: () => APPORTO_APPARECCHI_W_M2,
  },
  {
    chiave: "margineSicurezzaEstivo",
    etichetta: "Margine di sicurezza sul carico estivo",
    unita: "frazione",
    gruppo: "Carichi estivi",
    passo: 0.05,
    min: 0,
    max: 0.5,
    fonte: "margine di pratica corrente sul metodo Carrier semplificato",
    default: () => MARGINE_SICUREZZA_ESTIVO,
  },
];

const PARAMETRI_PER_CHIAVE = Object.fromEntries(PARAMETRI_CALCOLO.map((p) => [p.chiave, p]));

/** Valore di default di un parametro per l'ambiente dato. */
export function parametroDefault(ambiente, chiave) {
  const definizione = PARAMETRI_PER_CHIAVE[chiave];
  if (!definizione) throw new Error(`Parametro di calcolo sconosciuto: ${chiave}`);
  return definizione.default(ambiente);
}

/**
 * Valore effettivo di un parametro: quello inserito dall'utente in
 * `ambiente.parametri`, se presente e numerico, altrimenti il default.
 */
export function parametro(ambiente, chiave) {
  const inserito = ambiente?.parametri?.[chiave];
  if (inserito != null && Number.isFinite(Number(inserito))) return Number(inserito);
  return parametroDefault(ambiente, chiave);
}

/** Elenco dei parametri sovrascritti a mano su questo ambiente. */
export function parametriSovrascritti(ambiente) {
  const inseriti = ambiente?.parametri || {};
  return PARAMETRI_CALCOLO.filter((p) => {
    const v = inseriti[p.chiave];
    return v != null && Number.isFinite(Number(v)) && Number(v) !== p.default(ambiente);
  });
}

/** Raggruppamento dei parametri per sezione dell'interfaccia, nell'ordine di definizione. */
export function parametriPerGruppo() {
  const gruppi = [];
  for (const p of PARAMETRI_CALCOLO) {
    let gruppo = gruppi.find((g) => g.nome === p.gruppo);
    if (!gruppo) {
      gruppo = { nome: p.gruppo, parametri: [] };
      gruppi.push(gruppo);
    }
    gruppo.parametri.push(p);
  }
  return gruppi;
}
