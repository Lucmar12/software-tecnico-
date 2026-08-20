/**
 * stime.js — Euristiche di stima automatica per la modalità Venditore.
 *
 * In modalità Venditore l'input è volutamente semplificato per un
 * rilievo rapido da sopralluogo: alcuni dati di dettaglio costruttivo
 * (superficie muri esterni, superficie finestre) NON vengono richiesti
 * esplicitamente ma stimati con criteri convenzionali di larga massima.
 *
 * Questi valori sono dichiarati come STIMA, non come rilevazione, e
 * vengono segnalati come "da verificare" se il progetto viene in seguito
 * aperto in modalità Ingegnere, dove ogni coefficiente deve poter essere
 * verificato o sostituito con un dato di rilievo puntuale.
 */

/** Altezza interna convenzionale di default per ambienti residenziali [m]. */
export const ALTEZZA_DEFAULT = 2.7;

/** Incidenza convenzionale della superficie vetrata sulla superficie di pavimento [%]. */
const RAPPORTO_FINESTRE_PAVIMENTO = 0.15;

/**
 * Stima la superficie di muro esterno disperdente a partire dalla sola
 * superficie di pavimento, assumendo un ambiente di forma regolare con
 * mediamente 2 lati affacciati verso l'esterno (ipotesi cautelativa di
 * larga massima, tipica di un appartamento in linea).
 */
export function stimaSuperficieMuriEsterni(superficiePavimento, altezza = ALTEZZA_DEFAULT) {
  const latoStimato = Math.sqrt(superficiePavimento);
  const periodoEsternoStimato = latoStimato * 2; // 2 lati su 4 affacciati verso l'esterno
  return Math.round(periodoEsternoStimato * altezza * 10) / 10;
}

/** Stima la superficie vetrata a partire dalla superficie di pavimento, con rapporto convenzionale finestre/pavimento. */
export function stimaSuperficieFinestre(superficiePavimento) {
  return Math.round(superficiePavimento * RAPPORTO_FINESTRE_PAVIMENTO * 10) / 10;
}

/**
 * Completa un ambiente semplificato (modalità Venditore) con le stime di
 * default necessarie al motore di calcolo, tracciando quali campi sono
 * stati stimati automaticamente (array `campiStimati`) anziché rilevati.
 */
export function completaAmbienteConStime(ambienteSemplificato) {
  const campiStimati = [];
  const altezza = ambienteSemplificato.altezza ?? ALTEZZA_DEFAULT;
  if (ambienteSemplificato.altezza == null) campiStimati.push("altezza");

  let superficieMuriEsterni = ambienteSemplificato.superficieMuriEsterni;
  if (superficieMuriEsterni == null) {
    superficieMuriEsterni = stimaSuperficieMuriEsterni(ambienteSemplificato.superficiePavimento, altezza);
    campiStimati.push("superficieMuriEsterni");
  }

  let superficieFinestre = ambienteSemplificato.superficieFinestre;
  if (superficieFinestre == null) {
    superficieFinestre = stimaSuperficieFinestre(ambienteSemplificato.superficiePavimento);
    campiStimati.push("superficieFinestre");
  }

  let numeroOccupanti = ambienteSemplificato.numeroOccupanti;
  if (numeroOccupanti == null) {
    numeroOccupanti = 1;
    campiStimati.push("numeroOccupanti");
  }

  return {
    ...ambienteSemplificato,
    altezza,
    superficieMuriEsterni,
    superficieFinestre,
    numeroOccupanti,
    campiStimati,
  };
}

export const ETICHETTE_CAMPI = {
  altezza: "Altezza interna",
  superficieMuriEsterni: "Superficie muri esterni",
  superficieFinestre: "Superficie finestre",
  numeroOccupanti: "Numero occupanti",
};
