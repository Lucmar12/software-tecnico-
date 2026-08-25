/**
 * calculations.js — Dati tabellari normativi e calcoli non geometrici
 * (ACS, consumi, taglie commerciali) per il dimensionamento di impianti
 * residenziali.
 *
 * Il calcolo del carico termico per ambiente NON vive qui: è in
 * utils/overrides.js, unico motore dell'applicazione, che applica le
 * formule UNI EN 12831 / Carrier ai valori tabellari di questo file
 * aggiungendo ponti termici, fattore b, ricambi per destinazione d'uso e
 * temperatura sole-aria. Questo file resta la sola fonte dei dati
 * normativi; duplicare qui le formule significherebbe avere due motori
 * che divergono in silenzio.
 *
 * Metodologia e riferimenti normativi:
 * - UNI EN 12831   : metodo di calcolo del carico termico invernale di
 *                     progetto (dispersioni per trasmissione e per
 *                     ventilazione)
 * - Metodo Carrier  : metodo semplificato per il carico termico estivo di
 *                     progetto, con dati climatici UNI 10339
 * - UNI 10339       : temperature di progetto, ricambi d'aria convenzionali
 *                      per destinazione d'uso residenziale
 * - UNI 9182        : criteri di calcolo del fabbisogno di acqua calda
 *                      sanitaria (ACS) per edifici residenziali
 * - DPR 412/93       : zone climatiche, gradi giorno, periodi convenzionali
 *                      di esercizio degli impianti termici
 * - UNI 10349        : dati climatici e correzione altimetrica
 *
 * ATTENZIONE: le costanti numeriche riportate in questo file (trasmittanze
 * di riferimento per epoca costruttiva, ricambi d'aria, apporti interni,
 * ecc.) sono valori tabellari o convenzionali di uso corrente nella pratica
 * termotecnica. NON alterarle senza verifica puntuale: un coefficiente
 * modificato invalida la conformità del calcolo alla metodologia dichiarata.
 */

// ---------------------------------------------------------------------
// COSTANTI DI RIFERIMENTO NORMATIVO
// ---------------------------------------------------------------------

/** Ore convenzionali di riscaldamento e periodo di esercizio per zona climatica (DPR 412/93). */
export const ZONE_CLIMATICHE = {
  A: { oreRiscaldamento: 6, periodo: "1 dic - 15 mar" },
  B: { oreRiscaldamento: 8, periodo: "1 dic - 31 mar" },
  C: { oreRiscaldamento: 10, periodo: "15 nov - 31 mar" },
  D: { oreRiscaldamento: 12, periodo: "1 nov - 15 apr" },
  E: { oreRiscaldamento: 14, periodo: "15 ott - 15 apr" },
  F: { oreRiscaldamento: 24, periodo: "tutto l'anno" },
};

/** Temperatura interna di progetto invernale, residenziale (DPR 412/93) [°C]. */
export const TEMP_INTERNA_PROGETTO = 20;
/** Temperatura interna di progetto estiva convenzionale [°C]. */
export const TEMP_INTERNA_ESTIVA = 26;

/**
 * Trasmittanze termiche di riferimento per epoca costruttiva [W/m²K].
 * Valori medi indicativi della pratica costruttiva italiana, da utilizzare
 * in assenza di dati puntuali (diagnosi energetica, attestato APE).
 */
export const TRASMITTANZE_PER_EPOCA = {
  "ante-1975": { muro: 1.4, tetto: 1.8, pavimento: 1.2, vetro: 5.0 },
  "1976-1990": { muro: 1.0, tetto: 1.2, pavimento: 0.9, vetro: 4.0 },
  "1991-2005": { muro: 0.7, tetto: 0.6, pavimento: 0.6, vetro: 3.0 },
  "2006-2015": { muro: 0.45, tetto: 0.4, pavimento: 0.4, vetro: 2.4 },
  "post-2015": { muro: 0.28, tetto: 0.25, pavimento: 0.28, vetro: 1.4 },
};

export const ETICHETTE_EPOCA = {
  "ante-1975": "Ante 1975 (nessun obbligo di isolamento)",
  "1976-1990": "1976–1990 (L. 373/76)",
  "1991-2005": "1991–2005 (L. 10/91)",
  "2006-2015": "2006–2015 (DLgs 192/2005)",
  "post-2015": "Post 2015 (DLgs 192/2005 e s.m.i., NZEB)",
};

/** Maggiorazione/riduzione della dispersione per esposizione prevalente dell'ambiente. */
export const FATTORE_ESPOSIZIONE = { nord: 1.05, sud: 0.92, est: 1.0, ovest: 1.02 };

export const MAGGIORAZIONE_ULTIMO_PIANO = 1.15;
export const MAGGIORAZIONE_PIANO_INTERMEDIO = 1.0;
export const MAGGIORAZIONE_PIANO_TERRA = 1.1;

/** Apporti solari convenzionali per esposizione, metodo Carrier [W/m²]. */
export const APPORTO_SOLARE = { nord: 100, sud: 300, est: 350, ovest: 400 };

/** Ricambi d'aria orari convenzionali per uso residenziale (UNI 10339). */
export const RICAMBI_ARIA_ORA = 0.5;

/**
 * Ricambi d'aria orari convenzionali differenziati per destinazione
 * d'uso del locale (UNI 10339, valori indicativi per uso residenziale):
 * bagni e cucine richiedono ricambi più elevati di camere e soggiorni.
 * Il valore "altro" replica RICAMBI_ARIA_ORA per compatibilità con gli
 * ambienti creati prima dell'introduzione di questo campo.
 */
export const RICAMBI_ARIA_PER_TIPO_LOCALE = {
  soggiorno: 0.5,
  camera: 0.5,
  cucina: 1.5,
  bagno: 2.0,
  altro: RICAMBI_ARIA_ORA,
};

export const ETICHETTE_TIPO_LOCALE = {
  soggiorno: "Soggiorno / zona giorno",
  camera: "Camera da letto",
  cucina: "Cucina",
  bagno: "Bagno",
  altro: "Altro",
};

/**
 * Maggiorazione forfettaria per ponti termici lineari (giunti
 * parete-solaio, parete-serramento, spigoli), per epoca costruttiva —
 * UNI EN 12831, metodo semplificato. Gli edifici con isolamento
 * discontinuo (ante cappotto termico) hanno un'incidenza dei ponti
 * termici sulla dispersione per trasmissione più alta; gli edifici NZEB
 * con isolamento a cappotto continuo la riducono al minimo. Valori
 * indicativi di uso corrente: un calcolo puntuale dei ponti termici
 * (coefficienti ψ per ogni giunto) richiederebbe il dettaglio
 * geometrico e costruttivo dell'involucro, non disponibile in un
 * pre-dimensionamento speditivo.
 */
export const MAGGIORAZIONE_PONTI_TERMICI_PER_EPOCA = {
  "ante-1975": 0.15,
  "1976-1990": 0.12,
  "1991-2005": 0.1,
  "2006-2015": 0.08,
  "post-2015": 0.05,
};

/**
 * Fattore di riduzione "b" per pareti che affacciano su un ambiente NON
 * riscaldato (vano scala, garage, cantina) anziché direttamente
 * sull'esterno — UNI EN 12831, dispersione verso ambienti a temperatura
 * intermedia. Valore indicativo medio per ambienti non riscaldati
 * generici; nella pratica varia in funzione del grado di isolamento e
 * ventilazione del locale non riscaldato stesso.
 */
export const FATTORE_B_LOCALE_NON_RISCALDATO = 0.5;

/**
 * Incremento della temperatura esterna equivalente (temperatura
 * sole-aria) per le superfici opache in regime estivo, per esposizione
 * prevalente — metodo Carrier. Le pareti opache esposte all'irraggiamento
 * solare diretto si scaldano oltre la temperatura dell'aria: il calcolo
 * standard del solo ΔT sull'aria sottostima la dispersione/apporto reale.
 * Valori indicativi per pareti di colore chiaro/medio; per pareti scure
 * l'incremento reale può essere superiore.
 */
export const INCREMENTO_SOLE_ARIA_PER_ESPOSIZIONE = { nord: 2, sud: 8, est: 6, ovest: 10 };

/**
 * CARICO LATENTE DELL'ARIA DI RINNOVO (regime estivo).
 *
 * L'aria esterna immessa in ambiente non va solo raffreddata: va anche
 * deumidificata. Trascurare questa quota sottostima il carico estivo
 * totale — e per un'utenza residenziale con ricambi elevati (bagni,
 * cucina) la quota latente può superare quella sensibile. La potenza
 * frigorifera di una macchina è dichiarata come potenza TOTALE, quindi è
 * al carico totale (sensibile + latente) che va confrontata.
 *
 * Q_latente [W] = 0,83 × portata [m³/h] × Δx [g/kg]
 * dove 0,83 = ρ_aria (1,2 kg/m³) × calore latente di vaporizzazione
 * (≈2501 kJ/kg) / 3600, con Δx in grammi per kg di aria secca.
 */
export const COEFF_CALORE_LATENTE_W_PER_MCH_G = 0.83;

/** Umidità specifica dell'aria interna alle condizioni di progetto estive (26 °C, 50% UR) [g/kg aria secca]. */
export const UMIDITA_SPECIFICA_INTERNA_G_KG = 10.5;

/**
 * Umidità specifica dell'aria esterna di progetto estiva [g/kg aria
 * secca], valore convenzionale per il clima dell'Italia centrale
 * (≈32 °C, 50% UR). Il dato puntuale per comune (bulbo umido di
 * progetto, UNI 10339) non è presente nel dataset climatico: in sua
 * assenza si assume questo valore, dichiarato in relazione.
 */
export const UMIDITA_SPECIFICA_ESTERNA_G_KG = 15.0;

/** Differenza di umidità specifica di progetto fra aria esterna e interna [g/kg]. */
export const DELTA_UMIDITA_SPECIFICA_G_KG = UMIDITA_SPECIFICA_ESTERNA_G_KG - UMIDITA_SPECIFICA_INTERNA_G_KG;

/** BTU/h per kW (fattore di conversione). */
const BTU_PER_KW = 3412;

/** Taglie commerciali standard dei climatizzatori split, in BTU/h. */
export const TAGLIE_COMMERCIALI_BTU = [7000, 9000, 12000, 18000, 21000, 24000];

/** Fabbisogno ACS convenzionale per persona secondo abitudine di consumo [litri/giorno] (UNI 9182). */
export const LITRI_ACS_PER_PERSONA = {
  doccia_rapida: 40,
  doccia_normale: 50,
  vasca_frequente: 70,
};

export const ETICHETTE_ABITUDINE_ACS = {
  doccia_rapida: "Doccia rapida (~40 l/persona/giorno)",
  doccia_normale: "Doccia normale (~50 l/persona/giorno)",
  vasca_frequente: "Uso frequente di vasca (~70 l/persona/giorno)",
};

/** Calore specifico dell'acqua [Wh/(litro·K)]. */
export const CALORE_SPECIFICO_ACQUA_WH_L_K = 1.163;

/** Salto termico convenzionale di riscaldamento dell'ACS, da rete a set-point di accumulo [K]. */
export const DELTA_T_ACS_K = 30;

/** Taglie commerciali standard dei bollitori/scaldacqua [litri]. */
export const TAGLIE_BOLLITORE_STANDARD = [50, 80, 100, 120, 150, 200, 300];

/** Efficienza stagionale di riferimento per classe energetica (SEER raffrescamento, SCOP riscaldamento). */
export const EFFICIENZA_PER_CLASSE = {
  "A+++": { seer: 8.5, scop: 4.6 },
  "A++": { seer: 6.1, scop: 4.0 },
  "A+": { seer: 5.6, scop: 3.8 },
  A: { seer: 5.1, scop: 3.4 },
};

// ---------------------------------------------------------------------
// CONVERSIONI E SCELTA TAGLIA COMMERCIALE
// ---------------------------------------------------------------------

export function kwToBtu(kw) {
  return kw * BTU_PER_KW;
}

export function btuToKw(btu) {
  return btu / BTU_PER_KW;
}

/**
 * Individua la prima taglia commerciale di climatizzatore split che copre
 * il fabbisogno calcolato. Se nessuna taglia standard è sufficiente,
 * segnala la necessità di un'unità multipla o di un sistema VRF.
 */
export function scegliTagliaCommerciale(kwRichiesti) {
  const btu = kwToBtu(kwRichiesti);
  const taglia = TAGLIE_COMMERCIALI_BTU.find((t) => t >= btu);
  if (taglia) return { btu: taglia, disponibile: true };
  return {
    btu: null,
    disponibile: false,
    messaggio: `Fabbisogno ${btu.toFixed(0)} BTU/h: necessaria unità multipla o sistema VRF`,
  };
}

// ---------------------------------------------------------------------
// FABBISOGNO ACS — UNI 9182
// ---------------------------------------------------------------------

/**
 * Dimensionamento del bollitore/scaldacqua per la produzione di acqua
 * calda sanitaria (UNI 9182), con maggiorazione del 20% sul consumo
 * giornaliero convenzionale a copertura delle punte di prelievo.
 */
export function calcolaBollitore(numeroPersone, abitudine) {
  const litriGiorno = numeroPersone * LITRI_ACS_PER_PERSONA[abitudine];
  const litriConsigliati = litriGiorno * 1.2;
  const taglia = TAGLIE_BOLLITORE_STANDARD.find((t) => t >= litriConsigliati);
  // Salto termico convenzionale da temperatura di rete (~10°C) a set-point
  // di accumulo (~40°C). Lo stesso ΔT è usato da utils/pompaDiCaloreAcs.js
  // per la potenza di ricarica: la stessa grandezza fisica non può avere
  // due valori diversi in due punti dell'app.
  const kWhGiorno = (litriGiorno * CALORE_SPECIFICO_ACQUA_WH_L_K * DELTA_T_ACS_K) / 1000;
  return {
    taglia: taglia || null,
    taglioNonDisponibile: !taglia,
    messaggio: !taglia ? "Necessario bollitore >300L o configurazione doppia" : null,
    litriGiorno,
    litriConsigliati,
    kWhGiorno,
    kWhAnno: kWhGiorno * 365,
  };
}

// ---------------------------------------------------------------------
// CONSUMI ENERGETICI STIMATI
// ---------------------------------------------------------------------

/**
 * Stima del consumo elettrico annuo per una data modalità di
 * funzionamento, sulla base del coefficiente di efficienza stagionale
 * (SEER per raffrescamento, SCOP per riscaldamento) della classe scelta.
 */
export function calcolaConsumoAnnuo(kwFabbisogno, oreFunzionamento, efficienza, modalita) {
  const coefficiente = modalita === "raffrescamento" ? efficienza.seer : efficienza.scop;
  return (kwFabbisogno * oreFunzionamento) / coefficiente; // kWh/anno
}

/** Confronto del consumo annuo stimato fra le classi energetiche disponibili, a parità di fabbisogno e ore di funzionamento. */
export function confrontaClassiEnergetiche(kwFabbisogno, oreFunzionamento, modalita) {
  return Object.entries(EFFICIENZA_PER_CLASSE).map(([classe, efficienza]) => ({
    classe,
    kWhAnno: calcolaConsumoAnnuo(kwFabbisogno, oreFunzionamento, efficienza, modalita),
  }));
}
