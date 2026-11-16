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
 * TRE MODI DI AVERE IL CARICO
 *   - dagli ambienti della tabella: il calcolo completo, stanza per
 *     stanza. È il dato preciso.
 *   - carico noto: il carico di progetto già calcolato da un tecnico,
 *     tipicamente nella relazione energetica (ex Legge 10) che ogni casa
 *     nuova o ristrutturata deve avere.
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
import { MARGINE_POTENZA, POTENZA_MINIMA_COMMERCIALE_KW } from "./biomassa.js";
import { calcolaSuperficieMuriEsterni } from "./stime.js";

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

/** Il piano più alto può stare sotto il tetto solo se l'edificio ha un tetto. */
export function haTetto(tipoEdificio) {
  return !(TIPI_EDIFICIO[tipoEdificio] ?? TIPI_EDIFICIO.casaDuePiani).nessunTetto;
}

/**
 * Costruisce gli ambienti dell'edificio equivalente.
 * Il volume si conserva esattamente: Σ superficie × altezza media = volume.
 *
 * Con `soffitto: "dueFalde"` l'ultimo piano sta sotto un tetto a due
 * falde: all'imposta è alto `altezzaImpostaM`, al colmo `altezzaColmoM`,
 * e il suo volume è la superficie per l'altezza media. A parità di volume
 * la pianta si restringe, il tetto inclinato è più esteso del pavimento e
 * metà dei muri esposti sono timpani: è il motore degli ambienti a farne
 * il conto, con la stessa geometria della tabella.
 */
export function edificioEquivalente({
  volumeM3,
  altezzaM = 2.7,
  tipoEdificio = "casaDuePiani",
  epocaCostruttiva = "1976-1990",
  soffitto = "piano",
  altezzaImpostaM = null,
  altezzaColmoM = null,
}) {
  const tipo = TIPI_EDIFICIO[tipoEdificio] ?? TIPI_EDIFICIO.casaDuePiani;
  const imposta = Number(altezzaImpostaM) > 0 ? Number(altezzaImpostaM) : altezzaM;
  const falde = soffitto === "dueFalde" && haTetto(tipoEdificio) && Number(altezzaColmoM) > imposta;
  const altezzaUltimo = falde ? imposta : altezzaM;
  const altezzaMediaUltimo = falde ? (imposta + Number(altezzaColmoM)) / 2 : altezzaM;
  const superficiePiano = volumeM3 / ((tipo.piani - 1) * altezzaM + altezzaMediaUltimo);
  const lato = Math.sqrt(superficiePiano);
  const lati = LATI_ESPOSTI[tipo.paretiEsterne] ?? 4;

  return Array.from({ length: tipo.piani }, (_, i) => {
    const primo = i === 0;
    const ultimo = i === tipo.piani - 1;
    const sottoFalde = ultimo && falde;
    const altezza = sottoFalde ? altezzaUltimo : altezzaM;
    const geometria = {
      lunghezzaM: lato,
      larghezzaM: lato,
      altezza,
      paretiEsterne: tipo.paretiEsterne,
      soffitto: sottoFalde ? "dueFalde" : "piano",
      altezzaColmo: sottoFalde ? Number(altezzaColmoM) : null,
    };
    return nuovoAmbiente({
      nome: tipo.piani > 1 ? `Piano ${i === 0 ? "terra" : i}` : "Abitazione",
      tipoLocale: IPOTESI_EDIFICIO_EQUIVALENTE.tipoLocale,
      esposizionePrevalente: IPOTESI_EDIFICIO_EQUIVALENTE.esposizione,
      epocaCostruttiva,
      ...geometria,
      // Superfici date esplicitamente, fuori dal ricalcolo automatico:
      // l'edificio equivalente è definito dalle sue ipotesi, non da stime.
      // Con il soffitto piano vale lati × lato × altezza; sotto le falde
      // metà dei lati esposti sono timpani, alti in media.
      superficieMuriEsterni: sottoFalde ? calcolaSuperficieMuriEsterni(geometria) : lati * lato * altezzaM,
      superficieFinestre: superficiePiano * IPOTESI_EDIFICIO_EQUIVALENTE.quotaVetrata,
      campiStimati: ["numeroOccupanti"],
      pianoTerra: primo && !tipo.nessunPavimento,
      ultimoPiano: ultimo && !tipo.nessunTetto,
    });
  });
}

/** Carico invernale dell'edificio equivalente. */
export function caricoDaVolume({ volumeM3, altezzaM, tipoEdificio, epocaCostruttiva, soffitto, altezzaImpostaM, altezzaColmoM, comune }) {
  const ambienti = edificioEquivalente({ volumeM3, altezzaM, tipoEdificio, epocaCostruttiva, soffitto, altezzaImpostaM, altezzaColmoM });
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
    idro: true,
    nota: "Una parte della potenza nominale scalda il locale in cui è installato, il resto l'acqua dei termosifoni: controlla sulla scheda la potenza resa all'acqua.",
  },
  biomassa_idro_legna: {
    etichetta: "Termostufa o termocamino idro a legna",
    margine: MARGINE_POTENZA.legna,
    derating: false,
    idro: true,
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
 * @param {number|null} p.potenzaAcquaKw  per le macchine idro, la potenza
 *                                   resa all'acqua dichiarata in scheda: è
 *                                   quella che arriva ai termosifoni, e se
 *                                   c'è si verifica quella. Il resto scalda
 *                                   solo il locale di installazione.
 * @param {number} p.caricoKw        carico invernale da coprire
 * @param {string} p.tipoGeneratore  chiave di TIPI_GENERATORE
 * @param {object} p.comune
 * @param {number|null} p.volumeM3   se noto, per ricavare il volume servibile
 */
export function verificaPotenza({ potenzaKw, potenzaAcquaKw = null, caricoKw, tipoGeneratore, comune, volumeM3 = null }) {
  const tipo = TIPI_GENERATORE[tipoGeneratore] ?? TIPI_GENERATORE.biomassa_idro_pellet;
  const fattoreDerating = tipo.derating ? calcolaFattoreDeratingBassaTemperatura(comune.teInv) : 1;
  // Resa all'acqua oltre la nominale non è possibile: in quel caso è un
  // errore di inserimento e si resta sulla nominale.
  const acqua = tipo.idro && Number(potenzaAcquaKw) > 0 && Number(potenzaAcquaKw) <= potenzaKw ? Number(potenzaAcquaKw) : null;
  const potenzaEffettivaKw = acqua ?? potenzaKw * fattoreDerating;
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
    potenzaAcquaKw: acqua,
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
    // Resa all'acqua dalla scheda tecnica; vuota = si usa la nominale.
    potenzaAcquaKw: null,
    tipoGeneratore: "biomassa_idro_pellet",
    // "volume": stima da volume, tipo di edificio ed epoca;
    // "ambienti": carico completo dagli ambienti della tabella;
    // "carico": carico di progetto noto (relazione ex Legge 10).
    modalita: "volume",
    caricoNotoKw: null,
    volumeM3: 500,
    altezzaM: 2.7,
    tipoEdificio: "casaDuePiani",
    epocaCostruttiva: "1976-1990",
    // Ultimo piano sotto un tetto a due falde.
    soffitto: "piano",
    altezzaImpostaM: null,
    altezzaColmoM: null,
    ...overrides,
  };
}

/**
 * Esegue la verifica con la configurazione data. Restituisce null se
 * mancano i dati per farla (comune, o ambienti in modalità "ambienti").
 */
export function eseguiVerifica({ verifica, comune, edificio }) {
  if (!comune || !(verifica.potenzaKw > 0)) return null;
  const modalita = verifica.modalita ?? "volume";
  if (modalita === "ambienti" && !edificio) return null;
  if (modalita === "carico" && !(verifica.caricoNotoKw > 0)) return null;
  if (modalita === "volume" && !(verifica.volumeM3 > 0 && verifica.altezzaM > 0)) return null;

  const daAmbienti = modalita === "ambienti";
  const caricoKw =
    modalita === "ambienti"
      ? edificio.totaleInvernaleKw
      : modalita === "carico"
      ? Number(verifica.caricoNotoKw)
      : caricoDaVolume({ ...verifica, comune }).caricoKw;
  // Col carico noto il volume è facoltativo: serve solo a dire fino a
  // quanti metri cubi basterebbe la macchina.
  const volumeM3 = daAmbienti
    ? edificio.risultatiAmbienti.reduce((s, r) => s + r.volumeAmbiente, 0)
    : verifica.volumeM3 > 0
    ? verifica.volumeM3
    : null;
  const risultato = verificaPotenza({
    potenzaKw: verifica.potenzaKw,
    potenzaAcquaKw: verifica.potenzaAcquaKw,
    caricoKw,
    tipoGeneratore: verifica.tipoGeneratore,
    comune,
    volumeM3,
  });
  return {
    ...risultato,
    volumeM3,
    daAmbienti,
    modalita,
    consigli: consigliVerifica(risultato, { modalita, epocaCostruttiva: verifica.epocaCostruttiva }),
  };
}

/**
 * La modalità che si può davvero usare: "dagli ambienti" senza ambienti
 * descritti ricade sulla stima da volume.
 */
export function modalitaEffettiva(verifica, ambientiDisponibili) {
  const m = verifica.modalita ?? "volume";
  return m === "ambienti" && !ambientiDisponibili ? "volume" : m;
}

/** La verifica ha i dati che le servono (comune a parte)? */
export function verificaCompilata(verifica, ambientiDisponibili) {
  if (!(verifica.potenzaKw > 0)) return false;
  const m = modalitaEffettiva(verifica, ambientiDisponibili);
  if (m === "ambienti") return true;
  if (m === "carico") return verifica.caricoNotoKw > 0;
  return verifica.volumeM3 > 0 && verifica.altezzaM > 0;
}

/**
 * Potenza giusta per questo carico, nella stessa unità della potenza
 * inserita: all'acqua per le idro, di catalogo per le pompe di calore
 * (cioè divisa per il calo al freddo). Il massimo è null dove non si
 * pone un limite al sovradimensionamento (caldaia).
 */
export function potenzaGiusta(r) {
  const daCatalogo = r.potenzaAcquaKw ? 1 : r.fattoreDerating;
  const minimoKw = r.caricoKw / daCatalogo;
  const massimoKw = r.tipo.margine ? (r.caricoKw * r.tipo.margine) / daCatalogo : null;
  return { minimoKw, massimoKw };
}

/** Epoche dalle quali una casa si considera recente (relazione ex Legge 10 disponibile). */
const EPOCHE_RECENTI = ["2006-2015", "post-2015"];

/**
 * Consigli che accompagnano l'esito: cosa comporta e cosa proporre al
 * posto della macchina verificata. Sono gli stessi ragionamenti che fa un
 * tecnico al banco, scritti una volta per tutti. Ogni consiglio è
 * { titolo, testo }.
 */
export function consigliVerifica(r, { modalita = "volume", epocaCostruttiva = null } = {}) {
  const consigli = [];
  const { minimoKw, massimoKw } = potenzaGiusta(r);
  const unita = r.potenzaAcquaKw ? "kW all'acqua" : r.tipo.derating ? "kW di catalogo" : "kW";
  const kw = (x) => x.toLocaleString("it-IT", { maximumFractionDigits: 1 });
  const biomassa = r.tipo.idro;
  const legna = r.tipo === TIPI_GENERATORE.biomassa_idro_legna;

  if (r.esito === "insufficiente") {
    consigli.push({
      titolo: "Cosa serve",
      testo: `Per questa casa serve almeno ${kw(minimoKw)} ${unita}${massimoKw ? `, meglio entro ${kw(massimoKw)}` : ""}. In alternativa la macchina può restare, affiancata da una seconda fonte di calore che copra i giorni più freddi.`,
    });
  }

  if (r.esito === "sovradimensionata") {
    consigli.push({
      titolo: "Cosa comporta",
      testo: biomassa
        ? `Scalda la casa, ma lavora quasi sempre al minimo o si accende e spegne di continuo: consuma più ${legna ? "legna" : "pellet"} per ogni kW di calore, sporca di più scambiatore e canna fumaria e chiede più pulizie e assistenza.${legna ? " La legna non modula: a fiamma bassa brucia male e fa più fumo." : ""} E costa di più all'acquisto senza dare nulla in cambio.`
        : `Scalda la casa, ma lavora quasi sempre a carico ridotto o con continui avvii e arresti: rende meno, consuma di più e si usura prima. E costa di più all'acquisto senza dare nulla in cambio.`,
    });
    const minimaIdro = POTENZA_MINIMA_COMMERCIALE_KW.idro;
    if (biomassa && massimoKw < minimaIdro) {
      consigli.push({
        titolo: "Cosa proporre",
        testo: `Servirebbero tra ${kw(minimoKw)} e ${kw(massimoKw)} kW all'acqua, ma le termostufe e i termocamini idro partono da circa ${minimaIdro} kW. Due strade: la idro più piccola disponibile con un accumulo (puffer) che assorba il calore in eccesso, così lavora a cicli lunghi; oppure una pompa di calore aria-acqua, la soluzione più adatta a una casa che disperde poco e ha spesso impianti a bassa temperatura, tenendo eventualmente una piccola stufa ad aria per il soggiorno.`,
      });
    } else {
      consigli.push({
        titolo: "Cosa proporre",
        testo: `Una macchina tra ${kw(minimoKw)} e ${kw(massimoKw)} ${unita}: copre il giorno più freddo senza essere troppo grande.`,
      });
    }
  }

  if (r.esito === "adeguata" && biomassa) {
    const margine = Math.round((r.copertura - 1) * 100);
    consigli.push({
      titolo: "Cosa tenere presente",
      testo: `Resta un margine del ${margine}% oltre il carico. Se la stessa macchina produce anche l'acqua calda sanitaria, una parte della potenza va lì e il margine si riduce.`,
    });
  }

  if (modalita === "volume") {
    if (EPOCHE_RECENTI.includes(epocaCostruttiva)) {
      consigli.push({
        titolo: "Il dato esatto c'è già",
        testo: "Una casa recente ha la relazione energetica (ex Legge 10) con il carico di progetto calcolato dal progettista: chiedila e inseriscilo scegliendo \"carico noto\". Una casa in classe A può chiedere anche meno di questa stima.",
      });
    } else {
      consigli.push({
        titolo: "Quanto è affidabile",
        testo: "È una stima su una casa tipo, con vetrate al 15% del pavimento. Molte vetrate a vetro singolo o una posizione molto esposta al vento alzano il carico; cappotto, infissi nuovi o tetto coibentato lo abbassano, e la casa va trattata come più recente. Per il dato preciso descrivi gli ambienti nella tabella.",
      });
    }
  }

  return consigli;
}

/**
 * La stessa verifica ripetuta per ogni epoca costruttiva, a parità di
 * tutto il resto. Risponde alla domanda che segue sempre la prima:
 * "e nel caso peggiore?". Solo per la stima da volume.
 */
export function confrontoPerEpoca({ verifica, comune, epoche }) {
  return epoche.map((epocaCostruttiva) => {
    const r = eseguiVerifica({ verifica: { ...verifica, modalita: "volume", epocaCostruttiva }, comune, edificio: null });
    return r && { epocaCostruttiva, caricoKw: r.caricoKw, copertura: r.copertura, esito: r.esito };
  });
}
