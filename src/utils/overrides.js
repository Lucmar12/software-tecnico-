/**
 * overrides.js — Motore di calcolo live dell'applicazione (UNI EN 12831
 * invernale, metodo Carrier estivo), con supporto a coefficienti
 * normativi sovrascritti dal tecnico (trasmittanze reali da diagnosi
 * energetica, temperature di progetto personalizzate) e ai seguenti
 * raffinamenti rispetto al metodo semplificato di base:
 *
 * - maggiorazione per ponti termici lineari, per epoca costruttiva
 * - riduzione "fattore b" per pareti verso locali non riscaldati
 * - ricambi d'aria differenziati per destinazione d'uso del locale
 * - temperatura sole-aria per le superfici opache in regime estivo
 *
 * Riutilizza le costanti di data/calculations.js (che resta la fonte dei
 * dati tabellari normativi, non modificata nei valori) applicando le
 * stesse formule di base UNI EN 12831 / metodo Carrier, con i
 * raffinamenti sopra sempre attivi (non solo in presenza di override
 * espliciti dell'utente). Ogni ambiente calcolato con override di
 * trasmittanze/temperature viene marcato `nonStandard: true` e segnalato
 * in interfaccia; i raffinamenti sopra restano invece parte del calcolo
 * standard dell'applicazione, non del calcolo "non standard".
 */
import { TRASMITTANZE_PER_EPOCA, COEFF_CALORE_LATENTE_W_PER_MCH_G, kwToBtu, scegliTagliaCommerciale } from "../data/calculations.js";
import { parametro, parametriSovrascritti, CAPACITA_TERMICA_ARIA } from "./parametriCalcolo.js";
import { normalizzaGeometria } from "./stime.js";

/** Trasmittanze effettivamente in uso per l'ambiente: override manuale se presente, altrimenti valore da epoca costruttiva. */
export function getTrasmittanzeEffettive(ambiente) {
  return ambiente.trasmittanzeOverride || TRASMITTANZE_PER_EPOCA[ambiente.epocaCostruttiva];
}

/** Temperature climatiche effettive: override di progetto se presente, altrimenti valore del comune selezionato. */
function getClimaEffettivo(ambiente, comune) {
  return {
    teInv: ambiente.teInvOverride ?? comune.teInv,
    tbse: ambiente.tbseOverride ?? comune.tbse,
  };
}

/** Frazione (0-1) della superficie di muro esterno che affaccia in realtà su un ambiente NON riscaldato anziché sull'esterno. */
function getFrazioneNonRiscaldata(ambiente) {
  if (!ambiente.pareteVersoNonRiscaldato) return 0;
  return Math.min(1, Math.max(0, (ambiente.frazioneSuperficieNonRiscaldata ?? 30) / 100));
}

export function isAmbienteNonStandard(ambiente) {
  return Boolean(
    ambiente.trasmittanzeOverride ||
      ambiente.teInvOverride != null ||
      ambiente.tbseOverride != null ||
      parametriSovrascritti(ambiente).length > 0
  );
}

/**
 * Calcolo completo dell'ambiente con eventuali coefficienti sovrascritti
 * e con i raffinamenti UNI EN 12831 (ponti termici, fattore b, ricambi
 * per tipo locale, sole-aria estivo) sempre applicati.
 */
export function calcolaAmbienteConOverride(ambienteGrezzo, comune) {
  // Geometria sempre normalizzata: lunghezza e larghezza esplicite,
  // superficie derivata, configurazione delle pareti in forma corrente.
  const ambiente = normalizzaGeometria(ambienteGrezzo);

  const U = getTrasmittanzeEffettive(ambiente);
  const { teInv, tbse } = getClimaEffettivo(ambiente, comune);
  const nonStandard = isAmbienteNonStandard(ambiente);
  const frazioneNonRiscaldata = getFrazioneNonRiscaldata(ambiente);

  // Ogni coefficiente passa dal registro dei parametri: se l'utente ne ha
  // inserito uno proprio è quello a entrare nel calcolo, altrimenti il
  // default normativo. Nessun numero è cablato qui dentro.
  const tempInterna = parametro(ambiente, "tempInternaInvernale");
  const tempInternaEstiva = parametro(ambiente, "tempInternaEstiva");
  const ricambiAriaOra = parametro(ambiente, "ricambiAriaOra");
  const deltaUmiditaGKg = parametro(ambiente, "deltaUmiditaSpecifica");
  const maggiorazionePontiTermici = parametro(ambiente, "maggiorazionePontiTermici");
  const fattoreB = parametro(ambiente, "fattoreBLocaleNonRiscaldato");
  const coeffPavimento = parametro(ambiente, "coeffPavimentoControterra");
  const fattoreEsp = parametro(ambiente, "fattoreEsposizione");
  const fattorePiano = parametro(ambiente, "fattorePiano");
  const apportoSolareWm2 = parametro(ambiente, "apportoSolareWm2");
  const fattoreSchermatura = parametro(ambiente, "fattoreSchermaturaSolare");
  const incrementoSoleAria = parametro(ambiente, "incrementoSoleAria");
  const apportoPersonaW = parametro(ambiente, "apportoPersonaW");
  const apportoApparecchiWm2 = parametro(ambiente, "apportoApparecchiWm2");
  const margineSicurezza = parametro(ambiente, "margineSicurezzaEstivo");

  const superficieMuroNetta = Math.max(0, ambiente.superficieMuriEsterni - ambiente.superficieFinestre);

  // --- Invernale (UNI EN 12831) ---
  const deltaTInv = tempInterna - teInv;
  // Fattore b: la quota di muro verso locale non riscaldato "vede" un ΔT ridotto rispetto all'esterno.
  const deltaTInvMuroEffettivo = deltaTInv * (1 - frazioneNonRiscaldata * (1 - fattoreB));
  const Q_muri = U.muro * superficieMuroNetta * deltaTInvMuroEffettivo;
  const Q_vetri = U.vetro * ambiente.superficieFinestre * deltaTInv;
  const Q_tetto = ambiente.ultimoPiano ? U.tetto * ambiente.superficiePavimento * deltaTInv : 0;
  const Q_pavimento = ambiente.pianoTerra ? U.pavimento * ambiente.superficiePavimento * deltaTInv * coeffPavimento : 0;
  const trasmissioneBaseW = (Q_muri + Q_vetri + Q_tetto + Q_pavimento) * fattoreEsp * fattorePiano;
  // Maggiorazione per ponti termici lineari, applicata sul totale della dispersione per trasmissione.
  const trasmissioneW = trasmissioneBaseW * (1 + maggiorazionePontiTermici);

  const volumeAmbiente = ambiente.superficiePavimento * ambiente.altezza;
  const ventilazioneW = CAPACITA_TERMICA_ARIA * ricambiAriaOra * volumeAmbiente * deltaTInv;
  const invernaleKw = (trasmissioneW + ventilazioneW) / 1000;

  // --- Estivo (metodo Carrier) ---
  const deltaTEst = tbse - tempInternaEstiva;
  // Temperatura sole-aria sulla quota di muro realmente esposta all'irraggiamento (esclusa la quota verso locale non riscaldato); fattore b sulla quota interna.
  const deltaTEstMuroEffettivo =
    (1 - frazioneNonRiscaldata) * (deltaTEst + incrementoSoleAria) + frazioneNonRiscaldata * (deltaTEst * fattoreB);
  const Q_trasmEst = U.muro * superficieMuroNetta * deltaTEstMuroEffettivo + U.vetro * ambiente.superficieFinestre * deltaTEst;
  const Q_solare = ambiente.superficieFinestre * apportoSolareWm2 * fattoreSchermatura;
  const Q_persone = ambiente.numeroOccupanti * apportoPersonaW;
  const Q_apparecchi = ambiente.superficiePavimento * apportoApparecchiWm2;
  const portataRinnovoMch = ricambiAriaOra * volumeAmbiente; // [m³/h]
  const Q_ventEstSensibile = CAPACITA_TERMICA_ARIA * portataRinnovoMch * deltaTEst;
  // Quota latente: deumidificazione dell'aria di rinnovo. Omessa nel
  // calcolo sensibile puro, ma parte del carico totale a cui è dichiarata
  // la potenza frigorifera delle macchine.
  const Q_ventEstLatente = COEFF_CALORE_LATENTE_W_PER_MCH_G * portataRinnovoMch * deltaUmiditaGKg;
  const Q_ventEst = Q_ventEstSensibile + Q_ventEstLatente;
  const estivoKw = ((Q_trasmEst + Q_solare + Q_persone + Q_apparecchi + Q_ventEst) * (1 + margineSicurezza)) / 1000;

  const fabbisognoDimensionamento = Math.max(invernaleKw, estivoKw);
  const totaleW = trasmissioneW + ventilazioneW || 1;
  // Le percentuali delle componenti d'involucro vanno rapportate alla somma
  // delle componenti stesse, non al totale comprensivo di ventilazione e dei
  // fattori applicati a valle: diversamente non sommano a 100 e la
  // scomposizione diventa illeggibile.
  const totaleComponentiW = Q_muri + Q_vetri + Q_tetto + Q_pavimento || 1;

  return {
    ambiente,
    nonStandard,
    parametriSovrascritti: parametriSovrascritti(ambiente),
    U,
    teInv,
    tbse,
    tempInterna,
    tempInternaEstiva,
    ricambiAriaOra,
    maggiorazionePontiTermici,
    frazioneNonRiscaldata,
    incrementoSoleAria,
    portataRinnovoMch,
    scomposizioneEstiva: {
      trasmissioneKw: Q_trasmEst / 1000,
      solareKw: Q_solare / 1000,
      personeKw: Q_persone / 1000,
      apparecchiKw: Q_apparecchi / 1000,
      ventilazioneSensibileKw: Q_ventEstSensibile / 1000,
      ventilazioneLatenteKw: Q_ventEstLatente / 1000,
      deltaUmiditaGKg,
      margineSicurezza,
    },
    invernaleKw,
    estivoKw,
    invernaleBtu: kwToBtu(invernaleKw),
    estivoBtu: kwToBtu(estivoKw),
    fabbisognoDimensionamento,
    tagliaCommerciale: scegliTagliaCommerciale(fabbisognoDimensionamento),
    scomposizioneInvernale: {
      trasmissioneBaseKw: trasmissioneBaseW / 1000,
      pontiTermiciKw: (trasmissioneW - trasmissioneBaseW) / 1000,
      trasmissioneKw: trasmissioneW / 1000,
      ventilazioneKw: ventilazioneW / 1000,
      totaleKw: (trasmissioneW + ventilazioneW) / 1000,
      quotaTrasmissionePct: (trasmissioneW / totaleW) * 100,
      quotaVentilazionePct: (ventilazioneW / totaleW) * 100,
    },
    componentiInvolucro: {
      muri: { kw: Q_muri / 1000, pct: (Q_muri / totaleComponentiW) * 100 },
      vetri: { kw: Q_vetri / 1000, pct: (Q_vetri / totaleComponentiW) * 100 },
      tetto: { kw: Q_tetto / 1000, pct: (Q_tetto / totaleComponentiW) * 100 },
      pavimento: { kw: Q_pavimento / 1000, pct: (Q_pavimento / totaleComponentiW) * 100 },
    },
  };
}

/** Aggrega più ambienti (con eventuali override) nel totale di scenario/edificio. */
export function calcolaEdificioConOverride(ambienti, comune) {
  const risultatiAmbienti = ambienti.map((a) => calcolaAmbienteConOverride(a, comune));
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
    ambientePiuCritico: risultatiAmbienti.reduce((peggiore, r) => {
      const intensita = r.invernaleKw / (r.ambiente.superficiePavimento || 1);
      const intensitaPeggiore = peggiore
        ? peggiore.invernaleKw / (peggiore.ambiente.superficiePavimento || 1)
        : -Infinity;
      return intensita > intensitaPeggiore ? r : peggiore;
    }, null),
  };
}
