/**
 * stime.js — Stima dei dati geometrici di un ambiente che un utente non
 * tecnico non ha modo di misurare (superficie dei muri esterni,
 * superficie finestrata, numero di occupanti), ricavandoli da dati che
 * chiunque conosce: superficie di pavimento, altezza, destinazione d'uso
 * e numero di pareti che affacciano sull'esterno.
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

/** Campi che l'app è in grado di stimare da sola. */
export const CAMPI_STIMABILI = ["superficieMuriEsterni", "superficieFinestre", "numeroOccupanti"];

export const OPZIONI_PARETI_ESTERNE = [
  { value: 1, label: "1 — ambiente interno alla pianta" },
  { value: 2, label: "2 — ambiente d'angolo" },
  { value: 3, label: "3 — ambiente di testata" },
  { value: 4, label: "4 — costruzione isolata su tutti i lati" },
];

/**
 * Rapporto aeroilluminante convenzionale: superficie finestrata minima
 * in frazione della superficie di pavimento. 1/8 per i locali abitabili
 * e 1/16 per i servizi sono i valori richiesti dai regolamenti edilizi
 * comunali sulla scorta del D.M. Sanità 5/7/1975; i locali di transito
 * non hanno requisito e si assumono ciechi.
 */
const RAPPORTO_AEROILLUMINANTE = {
  soggiorno: 1 / 8,
  camera: 1 / 8,
  cucina: 1 / 8,
  bagno: 1 / 16,
  altro: 1 / 10,
};

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
 * Superficie lorda dei muri che affacciano sull'esterno [m²].
 *
 * L'ambiente viene assimilato a una pianta quadrata di lato √A: è
 * l'ipotesi neutra in assenza del rilievo, e per le proporzioni tipiche
 * di un locale residenziale (fino a circa 1:2) l'errore sulla singola
 * parete resta contenuto. La superficie è quindi il lato per l'altezza
 * per il numero di pareti esposte.
 */
export function stimaSuperficieMuriEsterni({ superficiePavimento, altezza, paretiEsterne }) {
  const a = Number(superficiePavimento);
  const h = Number(altezza);
  const n = Number(paretiEsterne);
  if (!(a > 0) || !(h > 0) || !(n > 0)) return 0;
  return arrotonda(Math.sqrt(a) * h * n);
}

/**
 * Superficie finestrata [m²], dal rapporto aeroilluminante del tipo di
 * locale. Il risultato viene limitato al 60% della superficie di muro
 * esterno disponibile, per non produrre geometrie impossibili negli
 * ambienti piccoli con molte pareti esposte (la validazione rifiuterebbe
 * una superficie finestrata maggiore di quella dei muri esterni).
 */
export function stimaSuperficieFinestre({ superficiePavimento, tipoLocale, superficieMuriEsterni }) {
  const a = Number(superficiePavimento);
  if (!(a > 0)) return 0;
  const rapporto = RAPPORTO_AEROILLUMINANTE[tipoLocale] ?? RAPPORTO_AEROILLUMINANTE.altro;
  const stima = a * rapporto;
  const massimo = Number(superficieMuriEsterni) * 0.6;
  return arrotonda(massimo > 0 ? Math.min(stima, massimo) : stima);
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
  const stimati = new Set(ambiente.campiStimati || []);
  if (stimati.size === 0) return ambiente;

  const aggiornato = { ...ambiente };
  const paretiEsterne = ambiente.paretiEsterne ?? 1;

  if (stimati.has("superficieMuriEsterni")) {
    aggiornato.superficieMuriEsterni = stimaSuperficieMuriEsterni({
      superficiePavimento: ambiente.superficiePavimento,
      altezza: ambiente.altezza,
      paretiEsterne,
    });
  }

  if (stimati.has("superficieFinestre")) {
    aggiornato.superficieFinestre = stimaSuperficieFinestre({
      superficiePavimento: ambiente.superficiePavimento,
      tipoLocale: ambiente.tipoLocale,
      // Sempre sulla superficie di muro aggiornata, stimata o reale che sia.
      superficieMuriEsterni: aggiornato.superficieMuriEsterni,
    });
  }

  if (stimati.has("numeroOccupanti")) {
    aggiornato.numeroOccupanti = stimaNumeroOccupanti({
      tipoLocale: ambiente.tipoLocale,
      superficiePavimento: ambiente.superficiePavimento,
    });
  }

  return aggiornato;
}
