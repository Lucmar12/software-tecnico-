/**
 * stime.js — Etichette per i campi che, in progetti salvati da versioni
 * precedenti dell'app (quando esisteva ancora una modalità di input
 * semplificata con stime automatiche), possono essere marcati come "da
 * verificare" tramite `ambiente.campiStimati`. L'app oggi chiede sempre
 * l'input completo: queste etichette restano solo per la compatibilità
 * con bozze/progetti già salvati sul dispositivo dell'utente.
 */
export const ETICHETTE_CAMPI = {
  altezza: "Altezza interna",
  superficieMuriEsterni: "Superficie muri esterni",
  superficieFinestre: "Superficie finestre",
  numeroOccupanti: "Numero occupanti",
};
