/**
 * catalogo.js — Catalogo prodotti (climatizzatori, pompe di calore
 * aria-acqua, bollitori/scaldacqua) e logica di abbinamento al
 * fabbisogno calcolato.
 *
 * CLIMATIZZAZIONE: dati REALI, gamma AUX listino Italia 2026 — vedi
 * data/gammaAux.js per la fonte e data/catalogoClimatizzazione.js per la
 * conversione nello schema di questo catalogo.
 *
 * LE ALTRE CATEGORIE NON HANNO ANCORA UN LISTINO — pompe di calore
 * aria-acqua, chiller, bollitori, scaldacqua, solare, fotovoltaico,
 * addolcitori, autoclavi e pompe. Il loro dimensionamento funziona, ma
 * nessun prodotto viene proposto: la ricerca risponde "su richiesta" e
 * rimanda alla quotazione.
 *
 * Qui non devono MAI tornare prodotti inventati, nemmeno "per far
 * vedere com'è": lo strumento va in mano ai clienti, e un marchio finto
 * accanto a uno vero fa dubitare anche di quello vero. Un controllo in
 * verifica/motore.mjs lo impedisce. Quando arriva un listino si aggiunge
 * come la gamma AUX: un file con i dati del costruttore e la conversione
 * nello schema qui sotto.
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
 *   prezzoIndicativoMin    : number       — € IVA esclusa, prezzo di listino
 *   prezzoIndicativoMax    : number
 *   schedaTecnicaUrl       : string       — link alla scheda tecnica del produttore (se disponibile)
 *   note                   : string
 */

import { PRODOTTI_CLIMATIZZAZIONE_AUX } from "./catalogoClimatizzazione.js";
import { LIVELLI_GAMMA } from "./gammaAux.js";

/**
 * Risposta per le categorie che il catalogo non copre ancora. Non è un
 * "nessun modello": il fabbisogno è calcolato e il prodotto esiste, solo
 * che non è a listino qui. Per chi usa lo strumento diventa un invito a
 * chiedere la quotazione invece di un vicolo cieco.
 */
export const MESSAGGIO_SU_RICHIESTA =
  "Prodotto su richiesta: con il fabbisogno calcolato qui sopra ti indichiamo noi il modello adatto e il prezzo.";

/** Vero se per questo tipo di prodotto esiste almeno una voce a listino. */
export function categoriaACatalogo(tipo) {
  return CATALOGO_PRODOTTI.some((p) => p.tipo === tipo);
}

/**
 * Da chiamare in apertura di ogni ricerca: se la categoria non ha listino
 * restituisce la risposta "su richiesta", altrimenti null e la ricerca
 * prosegue. `suRichiesta: true` permette all'interfaccia di mostrare il
 * rimando alla quotazione invece di un messaggio d'errore.
 */
function risultatoSuRichiesta(tipo, chiave = "consigliati") {
  if (categoriaACatalogo(tipo)) return null;
  return { [chiave]: [], messaggio: MESSAGGIO_SU_RICHIESTA, suRichiesta: true };
}

export const CATALOGO_PRODOTTI = [
  // ------------------------------------------------------------------
  // CLIMATIZZAZIONE — gamma AUX, listino Italia 2026 (dati reali)
  // Generata da data/gammaAux.js: i prezzi di sistema non sono
  // trascritti a mano ma sommati da unità interna ed esterna.
  // ------------------------------------------------------------------
  ...PRODOTTI_CLIMATIZZAZIONE_AUX,

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
  const suRichiesta = risultatoSuRichiesta("climatizzatore_split", "alternative");
  if (suRichiesta) return suRichiesta;
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
  const suRichiesta = risultatoSuRichiesta(tipo);
  if (suRichiesta) return suRichiesta;
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
  const suRichiesta = risultatoSuRichiesta("solare_termico");
  if (suRichiesta) return suRichiesta;
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
  const suRichiesta = risultatoSuRichiesta("bollitore");
  if (suRichiesta) return suRichiesta;
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
  const suRichiesta = risultatoSuRichiesta("scaldacqua_pompa_di_calore");
  if (suRichiesta) return suRichiesta;
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
  const suRichiesta = risultatoSuRichiesta("addolcitore");
  if (suRichiesta) return suRichiesta;
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
  const suRichiesta = risultatoSuRichiesta(tipo);
  if (suRichiesta) return suRichiesta;
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
  const suRichiesta = risultatoSuRichiesta("fotovoltaico");
  if (suRichiesta) return suRichiesta;
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
