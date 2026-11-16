/**
 * verificaPotenza.js — Il calcolo inverso: data una macchina di potenza
 * nota, basta per questa casa? E fino a quanti metri cubi basterebbe?
 *
 * È la domanda che si fa davanti a un'offerta o a un generatore già
 * installato — "una 26 kW scalda 500 m³?" — e la risposta onesta non è
 * sì o no ma "dipende dalla casa": un appartamento recente e una villa
 * degli anni '60 dello stesso volume chiedono potenze diverse di tre o
 * quattro volte. Per questo il volume da solo non basta e si chiedono
 * anche il tipo di edificio e l'epoca di costruzione.
 *
 * DUE MODI DI AVERE IL CARICO
 *   - dagli ambienti della tabella: il calcolo completo, stanza per
 *     stanza. È il dato preciso.
 *   - da volume: un "edificio equivalente" costruito con lo stesso motore,
 *     a partire da volume, tipo di edificio ed epoca. È una stima, utile
 *     quando la casa non è stata descritta: le ipotesi sono scritte qui
 *     sotto e mostrate in relazione.
 *
 * TRE ESITI, NON DUE
 *   insufficiente       la macchina non copre il giorno più freddo;
 *   adeguata            copre, entro il margine accettato per quel tipo;
 *   sovradimensionata   copre largamente — e per stufe, camini e pompe
 *                       di calore non è un pregio: lavorano quasi sempre
 *                       al minimo, con resa peggiore.
 */
import { nuovoAmbiente } from "./modelli.js";
import { calcolaEdificioConOverride } from "./overrides.js";
import { calcolaFattoreDeratingBassaTemperatura } from "./deratingPompaDiCalore.js";
import { MARGINE_POTENZA } from "./biomassa.js";

/**
 * Edifici tipo per la stima da volume. Ogni piano è un ambiente
 * equivalente a pianta quadrata; cambiano i lati esposti e la presenza di
 * tetto e pavimento verso terra, che sono ciò che separa davvero una casa
 * indipendente da un appartamento a parità di volume.
 */
export const TIPI_EDIFICIO = {
  casaDuePiani: {
    etichetta: "Casa indipendente su due piani",
    piani: 2,
    paretiEsterne: "tutti",
  },
  casaUnPiano: {
    etichetta: "Casa indipendente su un piano",
    piani: 1,
    paretiEsterne: "tutti",
  },
  appartamentoIntermedio: {
    etichetta: "Appartamento a piano intermedio",
    piani: 1,
    paretiEsterne: "angolo",
    nessunTetto: true,
    nessunPavimento: true,
  },
  appartamentoUltimo: {
    etichetta: "Appartamento all'ultimo piano",
    piani: 1,
    paretiEsterne: "angolo",
    nessunPavimento: true,
  },
  appartamentoTerra: {
    etichetta: "Appartamento al piano terra",
    piani: 1,
    paretiEsterne: "angolo",
    nessunTetto: true,
  },
};

/**
 * Ipotesi dell'edificio equivalente, dichiarate e mostrate in relazione.
 * Vetrate al 15% della superficie di pavimento: valore tipico per il
 * residenziale, sopra il minimo di legge di 1/8 (12,5%) che sottostima le
 * finestre reali. Esposizione est, il cui fattore correttivo è 1,00:
 * una casa intera ha pareti su più lati e non va avvantaggiata né
 * penalizzata. Ricambi d'aria della destinazione "altro", 0,5 vol/h.
 */
export const IPOTESI_EDIFICIO_EQUIVALENTE = {
  quotaVetrata: 0.15,
  esposizione: "est",
  tipoLocale: "altro",
};

/** Lati del perimetro esposti per configurazione, su una pianta quadrata. */
const LATI_ESPOSTI = { tutti: 4, tre: 3, angolo: 2, latoLungo: 1, latoCorto: 1 };

/**
 * Costruisce gli ambienti dell'edificio equivalente.
 * Il volume si conserva esattamente: Σ superficie × altezza = volume.
 */
export function edificioEquivalente({ volumeM3, altezzaM = 2.7, tipoEdificio = "casaDuePiani", epocaCostruttiva = "1976-1990" }) {
  const tipo = TIPI_EDIFICIO[tipoEdificio] ?? TIPI_EDIFICIO.casaDuePiani;
  const superficieTotale = volumeM3 / altezzaM;
  const superficiePiano = superficieTotale / tipo.piani;
  const lato = Math.sqrt(superficiePiano);
  const lati = LATI_ESPOSTI[tipo.paretiEsterne] ?? 4;

  return Array.from({ length: tipo.piani }, (_, i) => {
    const primo = i === 0;
    const ultimo = i === tipo.piani - 1;
    return nuovoAmbiente({
      nome: tipo.piani > 1 ? `Piano ${i === 0 ? "terra" : i}` : "Abitazione",
      tipoLocale: IPOTESI_EDIFICIO_EQUIVALENTE.tipoLocale,
      esposizionePrevalente: IPOTESI_EDIFICIO_EQUIVALENTE.esposizione,
      epocaCostruttiva,
      altezza: altezzaM,
      lunghezzaM: lato,
      larghezzaM: lato,
      paretiEsterne: tipo.paretiEsterne,
      // Superfici date esplicitamente, fuori dal ricalcolo automatico:
      // l'edificio equivalente è definito dalle sue ipotesi, non da stime.
      superficieMuriEsterni: lati * lato * altezzaM,
      superficieFinestre: superficiePiano * IPOTESI_EDIFICIO_EQUIVALENTE.quotaVetrata,
      campiStimati: ["numeroOccupanti"],
      pianoTerra: primo && !tipo.nessunPavimento,
      ultimoPiano: ultimo && !tipo.nessunTetto,
    });
  });
}

/** Carico invernale dell'edificio equivalente. */
export function caricoDaVolume({ volumeM3, altezzaM, tipoEdificio, epocaCostruttiva, comune }) {
  const ambienti = edificioEquivalente({ volumeM3, altezzaM, tipoEdificio, epocaCostruttiva });
  const edificio = calcolaEdificioConOverride(ambienti, comune);
  return { caricoKw: edificio.totaleInvernaleKw, edificio, ambienti };
}

/**
 * Tipi di generatore. Cambiano due cose: se la potenza dichiarata cala al
 * freddo (le macchine aria-acqua sì, perché prendono calore dall'aria
 * esterna) e quanto sovradimensionamento si tollera.
 */
export const TIPI_GENERATORE = {
  biomassa_idro_pellet: {
    etichetta: "Termostufa o termocamino idro a pellet",
    margine: MARGINE_POTENZA.pellet,
    derating: false,
    nota: "Una parte della potenza nominale scalda il locale in cui è installato, il resto l'acqua dei termosifoni: controlla sulla scheda la potenza resa all'acqua.",
  },
  biomassa_idro_legna: {
    etichetta: "Termostufa o termocamino idro a legna",
    margine: MARGINE_POTENZA.legna,
    derating: false,
    nota: "Una parte della potenza nominale scalda il locale in cui è installato, il resto l'acqua dei termosifoni: controlla sulla scheda la potenza resa all'acqua. La legna non modula: sovradimensionata lavora a fiamma bassa, con combustione peggiore.",
  },
  pompa_di_calore: {
    etichetta: "Pompa di calore aria-acqua",
    margine: 1.25,
    derating: true,
    nota: "La potenza di catalogo è riferita a +7 °C esterni: al giorno più freddo la macchina rende meno, e il calcolo ne tiene conto.",
  },
  caldaia: {
    etichetta: "Caldaia a condensazione",
    margine: null,
    derating: false,
    nota: "Le caldaie a condensazione modulano molto: qui si verifica solo che la potenza basti, non il sovradimensionamento.",
  },
};

/**
 * Verifica di una potenza rispetto a un carico.
 *
 * @param {object} p
 * @param {number} p.potenzaKw       potenza nominale dichiarata
 * @param {number} p.caricoKw        carico invernale da coprire
 * @param {string} p.tipoGeneratore  chiave di TIPI_GENERATORE
 * @param {object} p.comune
 * @param {number|null} p.volumeM3   se noto, per ricavare il volume servibile
 */
export function verificaPotenza({ potenzaKw, caricoKw, tipoGeneratore, comune, volumeM3 = null }) {
  const tipo = TIPI_GENERATORE[tipoGeneratore] ?? TIPI_GENERATORE.biomassa_idro_pellet;
  const fattoreDerating = tipo.derating ? calcolaFattoreDeratingBassaTemperatura(comune.teInv) : 1;
  const potenzaEffettivaKw = potenzaKw * fattoreDerating;
  const copertura = caricoKw > 0 ? potenzaEffettivaKw / caricoKw : Infinity;

  let esito;
  if (copertura < 1) esito = "insufficiente";
  else if (tipo.margine != null && copertura > tipo.margine) esito = "sovradimensionata";
  else esito = "adeguata";

  // Il carico per metro cubo di QUESTA casa permette di girare la domanda:
  // fino a quanti metri cubi basta la macchina, e per quali è giusta.
  const caricoPerM3 = volumeM3 > 0 ? caricoKw / volumeM3 : null;
  const volumeMassimoM3 = caricoPerM3 ? potenzaEffettivaKw / caricoPerM3 : null;
  const volumeIdealeMinimoM3 = caricoPerM3 && tipo.margine ? potenzaEffettivaKw / tipo.margine / caricoPerM3 : null;

  return {
    tipo,
    potenzaKw,
    fattoreDerating,
    potenzaEffettivaKw,
    caricoKw,
    copertura,
    esito,
    caricoPerM3,
    volumeMassimoM3,
    volumeIdealeMinimoM3,
  };
}

/** Configurazione di partenza della verifica. */
export function nuovaVerificaPotenza(overrides = {}) {
  return {
    potenzaKw: 26,
    tipoGeneratore: "biomassa_idro_pellet",
    // "volume": stima da volume, tipo di edificio ed epoca;
    // "ambienti": carico completo dagli ambienti della tabella.
    modalita: "volume",
    volumeM3: 500,
    altezzaM: 2.7,
    tipoEdificio: "casaDuePiani",
    epocaCostruttiva: "1976-1990",
    ...overrides,
  };
}

/**
 * Esegue la verifica con la configurazione data. Restituisce null se
 * mancano i dati per farla (comune, o ambienti in modalità "ambienti").
 */
export function eseguiVerifica({ verifica, comune, edificio }) {
  if (!comune || !(verifica.potenzaKw > 0)) return null;
  const daAmbienti = verifica.modalita === "ambienti" && edificio;
  if (verifica.modalita === "ambienti" && !edificio) return null;
  if (!daAmbienti && !(verifica.volumeM3 > 0 && verifica.altezzaM > 0)) return null;

  const caricoKw = daAmbienti ? edificio.totaleInvernaleKw : caricoDaVolume({ ...verifica, comune }).caricoKw;
  const volumeM3 = daAmbienti
    ? edificio.risultatiAmbienti.reduce((s, r) => s + r.ambiente.superficiePavimento * r.ambiente.altezza, 0)
    : verifica.volumeM3;
  return { ...verificaPotenza({ potenzaKw: verifica.potenzaKw, caricoKw, tipoGeneratore: verifica.tipoGeneratore, comune, volumeM3 }), volumeM3, daAmbienti };
}
