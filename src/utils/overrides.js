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
import {
  TRASMITTANZE_PER_EPOCA,
  FATTORE_ESPOSIZIONE,
  MAGGIORAZIONE_ULTIMO_PIANO,
  MAGGIORAZIONE_PIANO_INTERMEDIO,
  MAGGIORAZIONE_PIANO_TERRA,
  TEMP_INTERNA_PROGETTO,
  TEMP_INTERNA_ESTIVA,
  APPORTO_SOLARE,
  RICAMBI_ARIA_PER_TIPO_LOCALE,
  MAGGIORAZIONE_PONTI_TERMICI_PER_EPOCA,
  FATTORE_B_LOCALE_NON_RISCALDATO,
  INCREMENTO_SOLE_ARIA_PER_ESPOSIZIONE,
  kwToBtu,
  scegliTagliaCommerciale,
} from "../data/calculations.js";

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

/** Ricambi d'aria orari effettivi: per tipo di locale se dichiarato, altrimenti "altro" (0,5 vol/h, compatibile con ambienti creati prima di questo campo). */
function getRicambiAriaEffettivi(ambiente) {
  return RICAMBI_ARIA_PER_TIPO_LOCALE[ambiente.tipoLocale] ?? RICAMBI_ARIA_PER_TIPO_LOCALE.altro;
}

/** Frazione (0-1) della superficie di muro esterno che affaccia in realtà su un ambiente NON riscaldato anziché sull'esterno. */
function getFrazioneNonRiscaldata(ambiente) {
  if (!ambiente.pareteVersoNonRiscaldato) return 0;
  return Math.min(1, Math.max(0, (ambiente.frazioneSuperficieNonRiscaldata ?? 30) / 100));
}

export function isAmbienteNonStandard(ambiente) {
  return Boolean(ambiente.trasmittanzeOverride || ambiente.teInvOverride != null || ambiente.tbseOverride != null);
}

/**
 * Calcolo completo dell'ambiente con eventuali coefficienti sovrascritti
 * e con i raffinamenti UNI EN 12831 (ponti termici, fattore b, ricambi
 * per tipo locale, sole-aria estivo) sempre applicati.
 */
export function calcolaAmbienteConOverride(ambiente, comune) {
  const U = getTrasmittanzeEffettive(ambiente);
  const { teInv, tbse } = getClimaEffettivo(ambiente, comune);
  const nonStandard = isAmbienteNonStandard(ambiente);
  const frazioneNonRiscaldata = getFrazioneNonRiscaldata(ambiente);
  const ricambiAriaOra = getRicambiAriaEffettivi(ambiente);
  const maggiorazionePontiTermici = MAGGIORAZIONE_PONTI_TERMICI_PER_EPOCA[ambiente.epocaCostruttiva] ?? 0;
  const superficieMuroNetta = Math.max(0, ambiente.superficieMuriEsterni - ambiente.superficieFinestre);

  // --- Invernale (UNI EN 12831) ---
  const deltaTInv = TEMP_INTERNA_PROGETTO - teInv;
  // Fattore b: la quota di muro verso locale non riscaldato "vede" un ΔT ridotto rispetto all'esterno.
  const deltaTInvMuroEffettivo = deltaTInv * (1 - frazioneNonRiscaldata * (1 - FATTORE_B_LOCALE_NON_RISCALDATO));
  const Q_muri = U.muro * superficieMuroNetta * deltaTInvMuroEffettivo;
  const Q_vetri = U.vetro * ambiente.superficieFinestre * deltaTInv;
  const Q_tetto = ambiente.ultimoPiano ? U.tetto * ambiente.superficiePavimento * deltaTInv : 0;
  const Q_pavimento = ambiente.pianoTerra ? U.pavimento * ambiente.superficiePavimento * deltaTInv * 0.7 : 0;
  const fattoreEsp = FATTORE_ESPOSIZIONE[ambiente.esposizionePrevalente];
  const fattorePiano = ambiente.ultimoPiano
    ? MAGGIORAZIONE_ULTIMO_PIANO
    : ambiente.pianoTerra
    ? MAGGIORAZIONE_PIANO_TERRA
    : MAGGIORAZIONE_PIANO_INTERMEDIO;
  const trasmissioneBaseW = (Q_muri + Q_vetri + Q_tetto + Q_pavimento) * fattoreEsp * fattorePiano;
  // Maggiorazione per ponti termici lineari, applicata sul totale della dispersione per trasmissione.
  const trasmissioneW = trasmissioneBaseW * (1 + maggiorazionePontiTermici);

  const volumeAmbiente = ambiente.superficiePavimento * ambiente.altezza;
  const ventilazioneW = 0.34 * ricambiAriaOra * volumeAmbiente * deltaTInv;
  const invernaleKw = (trasmissioneW + ventilazioneW) / 1000;

  // --- Estivo (metodo Carrier) ---
  const deltaTEst = tbse - TEMP_INTERNA_ESTIVA;
  const incrementoSoleAria = INCREMENTO_SOLE_ARIA_PER_ESPOSIZIONE[ambiente.esposizionePrevalente] ?? 0;
  // Temperatura sole-aria sulla quota di muro realmente esposta all'irraggiamento (esclusa la quota verso locale non riscaldato); fattore b sulla quota interna.
  const deltaTEstMuroEffettivo =
    (1 - frazioneNonRiscaldata) * (deltaTEst + incrementoSoleAria) + frazioneNonRiscaldata * (deltaTEst * FATTORE_B_LOCALE_NON_RISCALDATO);
  const Q_trasmEst = U.muro * superficieMuroNetta * deltaTEstMuroEffettivo + U.vetro * ambiente.superficieFinestre * deltaTEst;
  const Q_solare = ambiente.superficieFinestre * APPORTO_SOLARE[ambiente.esposizionePrevalente] * 0.5;
  const Q_persone = ambiente.numeroOccupanti * 130;
  const Q_apparecchi = ambiente.superficiePavimento * 8;
  const Q_ventEst = 0.34 * ricambiAriaOra * volumeAmbiente * deltaTEst;
  const estivoKw = ((Q_trasmEst + Q_solare + Q_persone + Q_apparecchi + Q_ventEst) * 1.1) / 1000;

  const fabbisognoDimensionamento = Math.max(invernaleKw, estivoKw);
  const totaleW = trasmissioneW + ventilazioneW || 1;

  return {
    ambiente,
    nonStandard,
    U,
    teInv,
    tbse,
    ricambiAriaOra,
    maggiorazionePontiTermici,
    frazioneNonRiscaldata,
    incrementoSoleAria,
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
      muri: { kw: Q_muri / 1000, pct: (Q_muri / totaleW) * 100 },
      vetri: { kw: Q_vetri / 1000, pct: (Q_vetri / totaleW) * 100 },
      tetto: { kw: Q_tetto / 1000, pct: (Q_tetto / totaleW) * 100 },
      pavimento: { kw: Q_pavimento / 1000, pct: (Q_pavimento / totaleW) * 100 },
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
