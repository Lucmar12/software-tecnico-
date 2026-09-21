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
import { ORE_DI_CALCOLO, quotaIrraggiamento, temperaturaEsternaOraria, profiloEstivoEdificio } from "./profiliOrari.js";

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

  // --- Estivo (metodo Carrier, valutato a più ore del giorno) ---
  // Il carico estivo non è un numero unico: irraggiamento e temperatura
  // esterna cambiano ora per ora. Si calcola a ogni ora e si prende il
  // massimo, che per questo ambiente è la sua ora di punta.
  const portataRinnovoMch = ricambiAriaOra * volumeAmbiente; // [m³/h]
  const Q_persone = ambiente.numeroOccupanti * apportoPersonaW;
  const Q_apparecchi = ambiente.superficiePavimento * apportoApparecchiWm2;
  // Quota latente: deumidificazione dell'aria di rinnovo. Non dipende
  // dall'ora, perché l'umidità specifica esterna di progetto è un dato
  // giornaliero e non un andamento.
  const Q_ventEstLatente = COEFF_CALORE_LATENTE_W_PER_MCH_G * portataRinnovoMch * deltaUmiditaGKg;

  const profiloEstivo = ORE_DI_CALCOLO.map((ora) => {
    const quota = quotaIrraggiamento(ambiente.esposizionePrevalente, ora);
    const deltaTEst = temperaturaEsternaOraria(tbse, comune?.escursione, ora) - tempInternaEstiva;
    // L'incremento sole-aria è prodotto dallo stesso irraggiamento che
    // scalda il vetro: segue lo stesso andamento orario.
    const soleAriaOra = incrementoSoleAria * quota;
    const deltaTEstMuroEffettivo =
      (1 - frazioneNonRiscaldata) * (deltaTEst + soleAriaOra) + frazioneNonRiscaldata * (deltaTEst * fattoreB);
    const Q_trasmEst = U.muro * superficieMuroNetta * deltaTEstMuroEffettivo + U.vetro * ambiente.superficieFinestre * deltaTEst;
    const Q_solare = ambiente.superficieFinestre * apportoSolareWm2 * fattoreSchermatura * quota;
    const Q_ventEstSensibile = CAPACITA_TERMICA_ARIA * portataRinnovoMch * deltaTEst;
    const totaleW = Q_trasmEst + Q_solare + Q_persone + Q_apparecchi + Q_ventEstSensibile + Q_ventEstLatente;
    return {
      ora,
      kw: (totaleW * (1 + margineSicurezza)) / 1000,
      quotaIrraggiamento: quota,
      temperaturaEsterna: temperaturaEsternaOraria(tbse, comune?.escursione, ora),
      componenti: {
        trasmissioneKw: Q_trasmEst / 1000,
        solareKw: Q_solare / 1000,
        personeKw: Q_persone / 1000,
        apparecchiKw: Q_apparecchi / 1000,
        ventilazioneSensibileKw: Q_ventEstSensibile / 1000,
        ventilazioneLatenteKw: Q_ventEstLatente / 1000,
        incrementoSoleAria: soleAriaOra,
      },
    };
  });

  const puntaEstiva = profiloEstivo.reduce((migliore, voce) => (voce.kw > migliore.kw ? voce : migliore), profiloEstivo[0]);
  const estivoKw = puntaEstiva.kw;

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
    profiloEstivo,
    oraDiPunta: puntaEstiva.ora,
    scomposizioneEstiva: {
      ...puntaEstiva.componenti,
      ora: puntaEstiva.ora,
      temperaturaEsterna: puntaEstiva.temperaturaEsterna,
      quotaIrraggiamento: puntaEstiva.quotaIrraggiamento,
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
  // Il totale estivo è il massimo della SOMMA ora per ora, non la somma
  // dei massimi: una stanza a est e una a ovest non vanno in punta alla
  // stessa ora, e sommare i due picchi descriverebbe un istante che non
  // esiste.
  const estivoEdificio = profiloEstivoEdificio(risultatiAmbienti);
  const totaleEstivoKw = estivoEdificio.massimoKw;
  const superficieTotale = ambienti.reduce((s, a) => s + a.superficiePavimento, 0);
  return {
    risultatiAmbienti,
    totaleInvernaleKw,
    totaleEstivoKw,
    totaleInvernaleBtu: kwToBtu(totaleInvernaleKw),
    totaleEstivoBtu: kwToBtu(totaleEstivoKw),
    profiloEstivo: estivoEdificio.profilo,
    oraDiPuntaEstiva: estivoEdificio.oraDiPunta,
    sommaPicchiEstiviKw: estivoEdificio.sommaPicchiKw,
    riduzionePerContemporaneitaPct: estivoEdificio.riduzionePerContemporaneitaPct,
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
