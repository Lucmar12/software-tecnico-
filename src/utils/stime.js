/**
 * stime.js — Stima dei dati di un ambiente che un utente non tecnico non
 * ha modo di misurare (superficie finestrata, numero di occupanti) e
 * calcolo esatto della superficie dei muri esterni dalle dimensioni in
 * pianta.
 *
 * GEOMETRIA: l'ambiente si descrive con lunghezza e larghezza, non con la
 * superficie. Non è un dettaglio di comodo. Ricavare la parete da √A
 * significa assumere una pianta quadrata: per una stanza 4×5 l'errore
 * sulla singola parete è dell'11%, tollerabile, ma per una 3×8 diventa
 * +63% se affaccia sul lato corto e −39% se affaccia sul lato lungo —
 * fino a circa ±15% sul carico dell'ambiente. Con lunghezza e larghezza
 * la parete è esatta e l'ipotesi sparisce. Ed è anche più facile da
 * rispondere: nessuno conosce i metri quadri di una stanza a memoria,
 * chiunque sa misurarne i lati.
 *
 * I campi così ricavati vengono elencati in `ambiente.campiStimati` e
 * mostrati nel form con il badge "stimato": restano modificabili a mano,
 * e nel momento in cui l'utente inserisce il valore reale il campo esce
 * dalla lista e non viene più ricalcolato.
 *
 * Le stime sono volutamente conservative e riconducibili a regole d'uso
 * corrente o normative; non sostituiscono il rilievo, e la relazione di
 * calcolo segnala sempre quali dati sono stimati.
 */

export const ETICHETTE_CAMPI = {
  altezza: "Altezza interna",
  superficieMuriEsterni: "Superficie muri esterni",
  superficieFinestre: "Superficie finestre",
  numeroOccupanti: "Numero occupanti",
};

/**
 * Campi che l'app ricava da sola. `superficieMuriEsterni` è incluso ma,
 * dalle dimensioni in pianta, è un calcolo esatto e non una stima: resta
 * in questo elenco perché condivide lo stesso meccanismo di ricalcolo
 * automatico e di sovrascrittura manuale.
 */
export const CAMPI_STIMABILI = ["superficieMuriEsterni", "superficieFinestre", "numeroOccupanti"];

/**
 * Campi che restano convenzioni di progetto e non misure: solo
 * l'affollamento. Muri e finestre sono ora calcolati da dati dichiarati
 * dall'utente (dimensioni in pianta, numero e tipo di serramenti).
 */
export const CAMPI_CONVENZIONALI = ["numeroOccupanti"];

/**
 * Configurazioni di esposizione delle pareti, con lo sviluppo lineare
 * corrispondente in funzione del lato lungo (L) e del lato corto (W).
 * Sono formulazioni esatte, non stime: nota la pianta, il perimetro
 * esposto è determinato.
 */
export const OPZIONI_PARETI_ESTERNE = [
  { value: "latoCorto", label: "Un lato corto", sviluppo: (L, W) => W },
  { value: "latoLungo", label: "Un lato lungo", sviluppo: (L, W) => L },
  { value: "angolo", label: "Due lati — ambiente d'angolo", sviluppo: (L, W) => L + W },
  { value: "tre", label: "Tre lati — ambiente di testata", sviluppo: (L, W) => L + 2 * W },
  { value: "tutti", label: "Tutti e quattro i lati", sviluppo: (L, W) => 2 * (L + W) },
];

const SVILUPPO_PER_CONFIGURAZIONE = Object.fromEntries(OPZIONI_PARETI_ESTERNE.map((o) => [o.value, o.sviluppo]));

/**
 * Corrispondenza fra il vecchio campo numerico `paretiEsterne` (numero di
 * pareti esposte, quando la pianta era assunta quadrata) e le nuove
 * configurazioni. Serve ai progetti salvati prima dell'introduzione di
 * lunghezza e larghezza: con L = W = √A le due formulazioni coincidono,
 * quindi il carico di quei progetti non cambia riaprendoli.
 */
const CONFIGURAZIONE_DA_NUMERO = { 1: "latoLungo", 2: "angolo", 3: "tre", 4: "tutti" };

export const CONFIGURAZIONE_PARETI_DEFAULT = "latoLungo";

/**
 * Riporta un ambiente alla forma corrente: lunghezza e larghezza
 * esplicite, superficie derivata, configurazione delle pareti come
 * stringa. Gli ambienti salvati da versioni precedenti hanno solo la
 * superficie: si assume la pianta quadrata che quelle versioni già
 * usavano (L = W = √A), così il calcolo resta identico a quello con cui
 * erano stati prodotti finché l'utente non inserisce le misure reali.
 */
export function normalizzaGeometria(ambiente) {
  const a = { ...ambiente };

  if (!a.tipoFinestra || a.numeroFinestre == null) {
    // Ambienti creati prima della dichiarazione dei serramenti: si assegna
    // la dotazione tipica del locale, che l'utente correggerà contandone
    // le finestre reali.
    Object.assign(a, dotazioneFinestreDefault(a.tipoLocale, a.superficiePavimento));
  }

  if (typeof a.paretiEsterne === "number") a.paretiEsterne = CONFIGURAZIONE_DA_NUMERO[a.paretiEsterne] || CONFIGURAZIONE_PARETI_DEFAULT;
  if (!SVILUPPO_PER_CONFIGURAZIONE[a.paretiEsterne]) a.paretiEsterne = CONFIGURAZIONE_PARETI_DEFAULT;

  const haDimensioni = Number(a.lunghezzaM) > 0 && Number(a.larghezzaM) > 0;
  if (!haDimensioni) {
    const superficie = Number(a.superficiePavimento);
    const lato = superficie > 0 ? Math.round(Math.sqrt(superficie) * 100) / 100 : 0;
    a.lunghezzaM = lato;
    a.larghezzaM = lato;
    // Segnala che le dimensioni non sono state misurate ma dedotte.
    a.dimensioniDedotte = superficie > 0;
  } else {
    a.dimensioniDedotte = false;
  }

  a.superficiePavimento = arrotonda(Number(a.lunghezzaM) * Number(a.larghezzaM), 2);
  return a;
}

/** Sviluppo lineare delle pareti che affacciano sull'esterno [m]. */
export function sviluppoParetiEsterne({ lunghezzaM, larghezzaM, paretiEsterne }) {
  const L = Math.max(Number(lunghezzaM) || 0, Number(larghezzaM) || 0);
  const W = Math.min(Number(lunghezzaM) || 0, Number(larghezzaM) || 0);
  if (!(L > 0) || !(W > 0)) return 0;
  const sviluppo = SVILUPPO_PER_CONFIGURAZIONE[paretiEsterne] || SVILUPPO_PER_CONFIGURAZIONE[CONFIGURAZIONE_PARETI_DEFAULT];
  return sviluppo(L, W);
}

/**
 * Serramenti di produzione corrente, con le misure nominali di
 * larghezza × altezza [m] e la superficie che ne deriva [m²].
 *
 * La superficie finestrata NON si stima dal rapporto aeroilluminante:
 * 1/8 della superficie di pavimento è il MINIMO che il regolamento
 * edilizio impone, non quanto vetro c'è davvero. Un soggiorno da 20 m²
 * col minimo di legge avrebbe 2,5 m² di finestre, mentre una
 * portafinestra a due ante da sola ne fa 3,08: l'errore è di oltre il
 * 50%, sempre per difetto, e cade proprio sull'apporto solare, che è la
 * voce più pesante del carico estivo. Contare le finestre e riconoscerne
 * il tipo è alla portata di chiunque e porta l'errore entro la
 * tolleranza di posa.
 */
export const TIPI_FINESTRA = [
  { value: "piccola", label: "Finestrino / bagno (60 × 80 cm)", larghezza: 0.6, altezza: 0.8 },
  { value: "unaAnta", label: "Finestra a una anta (80 × 140 cm)", larghezza: 0.8, altezza: 1.4 },
  { value: "dueAnte", label: "Finestra a due ante (120 × 140 cm)", larghezza: 1.2, altezza: 1.4 },
  { value: "portafinestra", label: "Portafinestra a una anta (80 × 220 cm)", larghezza: 0.8, altezza: 2.2 },
  { value: "portafinestraDue", label: "Portafinestra a due ante (140 × 220 cm)", larghezza: 1.4, altezza: 2.2 },
  { value: "vetrata", label: "Vetrata / scorrevole (240 × 220 cm)", larghezza: 2.4, altezza: 2.2 },
];

const AREA_PER_TIPO_FINESTRA = Object.fromEntries(
  TIPI_FINESTRA.map((t) => [t.value, Math.round(t.larghezza * t.altezza * 100) / 100])
);

/** Superficie nominale di un serramento del tipo indicato [m²]. */
export function areaFinestra(tipo) {
  return AREA_PER_TIPO_FINESTRA[tipo] ?? AREA_PER_TIPO_FINESTRA.dueAnte;
}

/**
 * Serramento e numero di default per destinazione d'uso, usati solo
 * finché l'utente non dichiara i propri: rappresentano la dotazione più
 * comune del locale, non un minimo di legge.
 */
function dotazioneFinestreDefault(tipoLocale, superficiePavimento) {
  const a = Number(superficiePavimento) || 0;
  switch (tipoLocale) {
    case "bagno":
      return { numeroFinestre: 1, tipoFinestra: "piccola" };
    case "cucina":
      return { numeroFinestre: 1, tipoFinestra: "dueAnte" };
    case "camera":
      return { numeroFinestre: a >= 16 ? 2 : 1, tipoFinestra: "dueAnte" };
    case "soggiorno":
      return a >= 25
        ? { numeroFinestre: 2, tipoFinestra: "portafinestraDue" }
        : { numeroFinestre: 1, tipoFinestra: "portafinestraDue" };
    default:
      return { numeroFinestre: 1, tipoFinestra: "unaAnta" };
  }
}

/**
 * Occupazione di progetto per destinazione d'uso, usata per gli apporti
 * interni sensibili del calcolo estivo. Non è un numero fisso per tipo:
 * l'affollamento residenziale di uso corrente (UNI 10339, civile
 * abitazione) cresce con la superficie del locale, e assumere un valore
 * unico sovradimensionerebbe i locali piccoli. Il risultato è comunque
 * limitato a valori di buon senso per un'abitazione.
 */
const OCCUPANTI_PER_TIPO_LOCALE = {
  // Il soggiorno è il locale di ritrovo: 2 persone in un locale piccolo,
  // fino a 5 in una zona giorno ampia.
  soggiorno: (a) => Math.min(5, Math.max(2, Math.round(a / 10))),
  // Camera singola sotto i 14 m², matrimoniale sopra.
  camera: (a) => (a >= 14 ? 2 : 1),
  cucina: () => 2,
  bagno: () => 1,
  altro: () => 1,
};

function arrotonda(valore, decimali = 1) {
  const f = 10 ** decimali;
  return Math.round(valore * f) / f;
}

/**
 * Superficie lorda dei muri che affacciano sull'esterno [m²]: sviluppo
 * lineare delle pareti esposte per l'altezza interna. Con le dimensioni
 * in pianta note è un calcolo esatto, non una stima.
 */
export function calcolaSuperficieMuriEsterni({ lunghezzaM, larghezzaM, altezza, paretiEsterne }) {
  const h = Number(altezza);
  const sviluppo = sviluppoParetiEsterne({ lunghezzaM, larghezzaM, paretiEsterne });
  if (!(h > 0) || !(sviluppo > 0)) return 0;
  return arrotonda(sviluppo * h);
}

/**
 * Superficie finestrata [m²]: numero di serramenti per la superficie
 * nominale del tipo dichiarato. Il risultato è limitato all'80% del muro
 * esterno disponibile, perché più vetro che muro non è una geometria
 * realizzabile e la validazione lo rifiuterebbe.
 */
export function calcolaSuperficieFinestre({ numeroFinestre, tipoFinestra, superficieMuriEsterni }) {
  const n = Math.max(0, Number(numeroFinestre) || 0);
  const superficie = n * areaFinestra(tipoFinestra);
  const massimo = Number(superficieMuriEsterni) * 0.8;
  return arrotonda(massimo > 0 ? Math.min(superficie, massimo) : superficie, 2);
}

/** Numero di occupanti di progetto, per destinazione d'uso e superficie. */
export function stimaNumeroOccupanti({ tipoLocale, superficiePavimento }) {
  const regola = OCCUPANTI_PER_TIPO_LOCALE[tipoLocale] ?? OCCUPANTI_PER_TIPO_LOCALE.altro;
  const a = Number(superficiePavimento);
  return regola(a > 0 ? a : 0);
}

/**
 * Ricalcola, su un ambiente, tutti e soli i campi ancora marcati come
 * stimati, lasciando intatto quanto l'utente ha inserito a mano.
 * Va richiamata a ogni modifica di un dato "sorgente" (superficie,
 * altezza, pareti esterne, tipo di locale).
 *
 * @param {object} ambiente
 * @returns {object} nuovo ambiente con i campi stimati aggiornati
 */
export function applicaStime(ambiente) {
  const base = normalizzaGeometria(ambiente);
  const stimati = new Set(base.campiStimati || []);
  if (stimati.size === 0) return base;

  const aggiornato = { ...base };

  if (stimati.has("superficieMuriEsterni")) {
    aggiornato.superficieMuriEsterni = calcolaSuperficieMuriEsterni({
      lunghezzaM: base.lunghezzaM,
      larghezzaM: base.larghezzaM,
      altezza: base.altezza,
      paretiEsterne: base.paretiEsterne,
    });
  }

  if (stimati.has("superficieFinestre")) {
    aggiornato.superficieFinestre = calcolaSuperficieFinestre({
      numeroFinestre: base.numeroFinestre,
      tipoFinestra: base.tipoFinestra,
      // Sempre sul muro esterno aggiornato, calcolato o inserito a mano.
      superficieMuriEsterni: aggiornato.superficieMuriEsterni,
    });
  }

  if (stimati.has("numeroOccupanti")) {
    aggiornato.numeroOccupanti = stimaNumeroOccupanti({
      tipoLocale: base.tipoLocale,
      superficiePavimento: base.superficiePavimento,
    });
  }

  return aggiornato;
}
