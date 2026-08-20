/**
 * calculations.js — Motore di calcolo del fabbisogno termico per il
 * dimensionamento di impianti di climatizzazione residenziale.
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
// CARICO TERMICO INVERNALE — UNI EN 12831
// ---------------------------------------------------------------------

/**
 * Dispersione termica per trasmissione dell'ambiente (UNI EN 12831),
 * comprensiva di maggiorazioni per esposizione e posizione in edificio.
 * @returns {number} Potenza dispersa per trasmissione [W]
 */
export function calcolaQTrasmissione(ambiente, epoca, comune) {
  const U = TRASMITTANZE_PER_EPOCA[epoca];
  const deltaT = TEMP_INTERNA_PROGETTO - comune.teInv;
  const superficieMuroNetta = Math.max(0, ambiente.superficieMuriEsterni - ambiente.superficieFinestre);
  const Q_muri = U.muro * superficieMuroNetta * deltaT;
  const Q_vetri = U.vetro * ambiente.superficieFinestre * deltaT;
  const Q_tetto = ambiente.ultimoPiano ? U.tetto * ambiente.superficiePavimento * deltaT : 0;
  const Q_pavimento = ambiente.pianoTerra ? U.pavimento * ambiente.superficiePavimento * deltaT * 0.7 : 0;
  const fattoreEsp = FATTORE_ESPOSIZIONE[ambiente.esposizionePrevalente];
  const fattorePiano = ambiente.ultimoPiano
    ? MAGGIORAZIONE_ULTIMO_PIANO
    : ambiente.pianoTerra
    ? MAGGIORAZIONE_PIANO_TERRA
    : MAGGIORAZIONE_PIANO_INTERMEDIO;
  return (Q_muri + Q_vetri + Q_tetto + Q_pavimento) * fattoreEsp * fattorePiano; // Watt
}

/**
 * Dispersione termica per ventilazione dell'ambiente (UNI EN 12831),
 * con ricambio d'aria convenzionale residenziale (UNI 10339).
 * @returns {number} Potenza dispersa per ventilazione [W]
 */
export function calcolaQVentilazione(ambiente, comune) {
  const volumeAmbiente = ambiente.superficiePavimento * ambiente.altezza;
  const deltaT = TEMP_INTERNA_PROGETTO - comune.teInv;
  return 0.34 * RICAMBI_ARIA_ORA * volumeAmbiente * deltaT; // Watt
}

/**
 * Carico termico invernale di progetto dell'ambiente (UNI EN 12831).
 * @returns {number} Fabbisogno invernale [kW]
 */
export function calcolaCaricoTermicoInvernale(ambiente, epoca, comune) {
  return (calcolaQTrasmissione(ambiente, epoca, comune) + calcolaQVentilazione(ambiente, comune)) / 1000;
}

// ---------------------------------------------------------------------
// CARICO TERMICO ESTIVO — Metodo Carrier, dati UNI 10339
// ---------------------------------------------------------------------

/**
 * Carico termico estivo di progetto dell'ambiente (metodo Carrier
 * semplificato), con margine di sicurezza del 10%.
 * @returns {number} Fabbisogno estivo [kW]
 */
export function calcolaCaricoEstivo(ambiente, epoca, comune) {
  const U = TRASMITTANZE_PER_EPOCA[epoca];
  const deltaT = comune.tbse - TEMP_INTERNA_ESTIVA;
  const Q_trasm =
    (U.muro * Math.max(0, ambiente.superficieMuriEsterni - ambiente.superficieFinestre) +
      U.vetro * ambiente.superficieFinestre) *
    deltaT;
  const Q_solare = ambiente.superficieFinestre * APPORTO_SOLARE[ambiente.esposizionePrevalente] * 0.5;
  const Q_persone = ambiente.numeroOccupanti * 130; // W/persona
  const Q_apparecchi = ambiente.superficiePavimento * 8; // W/m²
  const volumeAmbiente = ambiente.superficiePavimento * ambiente.altezza;
  const Q_vent = 0.34 * RICAMBI_ARIA_ORA * volumeAmbiente * deltaT;
  const totale = Q_trasm + Q_solare + Q_persone + Q_apparecchi + Q_vent;
  return (totale * 1.1) / 1000; // +10% margine di sicurezza, kW
}

/** Scomposizione del carico invernale in trasmissione/ventilazione, per l'analisi critica del fabbisogno. */
export function scomponiCaricoInvernale(ambiente, epoca, comune) {
  const trasmissioneW = calcolaQTrasmissione(ambiente, epoca, comune);
  const ventilazioneW = calcolaQVentilazione(ambiente, comune);
  const totaleW = trasmissioneW + ventilazioneW;
  return {
    trasmissioneKw: trasmissioneW / 1000,
    ventilazioneKw: ventilazioneW / 1000,
    totaleKw: totaleW / 1000,
    quotaTrasmissionePct: totaleW > 0 ? (trasmissioneW / totaleW) * 100 : 0,
    quotaVentilazionePct: totaleW > 0 ? (ventilazioneW / totaleW) * 100 : 0,
  };
}

/**
 * Scomposizione della dispersione per trasmissione nelle singole componenti
 * (muri, vetri, tetto, pavimento) prima dell'applicazione dei fattori di
 * esposizione/piano — utile per individuare il "collo di bottiglia"
 * dell'involucro (es. incidenza dei serramenti sul totale).
 */
export function scomponiComponentiInvolucro(ambiente, epoca, comune) {
  const U = TRASMITTANZE_PER_EPOCA[epoca];
  const deltaT = TEMP_INTERNA_PROGETTO - comune.teInv;
  const superficieMuroNetta = Math.max(0, ambiente.superficieMuriEsterni - ambiente.superficieFinestre);
  const muriW = U.muro * superficieMuroNetta * deltaT;
  const vetriW = U.vetro * ambiente.superficieFinestre * deltaT;
  const tettoW = ambiente.ultimoPiano ? U.tetto * ambiente.superficiePavimento * deltaT : 0;
  const pavimentoW = ambiente.pianoTerra ? U.pavimento * ambiente.superficiePavimento * deltaT * 0.7 : 0;
  const totaleW = muriW + vetriW + tettoW + pavimentoW || 1; // evita divisione per zero
  return {
    muri: { kw: muriW / 1000, pct: (muriW / totaleW) * 100 },
    vetri: { kw: vetriW / 1000, pct: (vetriW / totaleW) * 100 },
    tetto: { kw: tettoW / 1000, pct: (tettoW / totaleW) * 100 },
    pavimento: { kw: pavimentoW / 1000, pct: (pavimentoW / totaleW) * 100 },
  };
}

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
  const kWhGiorno = (litriGiorno * 1.163 * 30) / 1000; // riscaldamento da 10°C a 45°C circa, deltaT convenzionale 30K
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

// ---------------------------------------------------------------------
// AGGREGAZIONE A LIVELLO DI EDIFICIO / SCENARIO
// ---------------------------------------------------------------------

/**
 * Calcola il riepilogo tecnico completo di un ambiente: carico invernale,
 * carico estivo, scomposizione delle dispersioni e taglia commerciale
 * suggerita. Punto di ingresso unico usato sia dalla modalità Ingegnere
 * che dalla modalità Venditore (stesso motore di calcolo).
 */
export function calcolaAmbiente(ambiente, comune) {
  const epoca = ambiente.epocaCostruttiva;
  const invernaleKw = calcolaCaricoTermicoInvernale(ambiente, epoca, comune);
  const estivoKw = calcolaCaricoEstivo(ambiente, epoca, comune);
  const scomposizioneInvernale = scomponiCaricoInvernale(ambiente, epoca, comune);
  const componentiInvolucro = scomponiComponentiInvolucro(ambiente, epoca, comune);
  const fabbisognoDimensionamento = Math.max(invernaleKw, estivoKw);
  return {
    ambiente,
    invernaleKw,
    estivoKw,
    invernaleBtu: kwToBtu(invernaleKw),
    estivoBtu: kwToBtu(estivoKw),
    fabbisognoDimensionamento,
    tagliaCommerciale: scegliTagliaCommerciale(fabbisognoDimensionamento),
    scomposizioneInvernale,
    componentiInvolucro,
  };
}

/** Aggrega i risultati di più ambienti nel totale di edificio/scenario. */
export function calcolaEdificio(ambienti, comune) {
  const risultatiAmbienti = ambienti.map((a) => calcolaAmbiente(a, comune));
  const totaleInvernaleKw = risultatiAmbienti.reduce((s, r) => s + r.invernaleKw, 0);
  const totaleEstivoKw = risultatiAmbienti.reduce((s, r) => s + r.estivoKw, 0);
  const superficieTotale = ambienti.reduce((s, a) => s + a.superficiePavimento, 0);
  return {
    risultatiAmbienti,
    totaleInvernaleKw,
    totaleEstivoKw,
    totaleInvernaleBtu: kwToBtu(totaleInvernaleKw),
    totaleEstivoBtu: kwToBtu(totaleEstivoKw),
    superficieTotale,
    // Ambiente con la maggiore incidenza di fabbisogno per m² — utile per
    // l'analisi critica ("quali ambienti hanno le dispersioni più critiche").
    ambientePiuCritico: risultatiAmbienti.reduce((peggiore, r) => {
      const intensita = r.invernaleKw / (r.ambiente.superficiePavimento || 1);
      const intensitaPeggiore = peggiore
        ? peggiore.invernaleKw / (peggiore.ambiente.superficiePavimento || 1)
        : -Infinity;
      return intensita > intensitaPeggiore ? r : peggiore;
    }, null),
  };
}
