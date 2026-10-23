/**
 * profiloProfessionista.js — Dati di chi firma la relazione: installatore,
 * rivenditore o tecnico che usa lo strumento con i propri clienti.
 *
 * PERCHÉ ESISTE. Lo strumento si distingue se fa fare bella figura a chi
 * lo usa: un installatore che consegna al cliente una relazione con il
 * proprio nome in testa, seria e documentata, ha un motivo per lavorare
 * con l'agenzia che gliela mette a disposizione. Il nome dell'agenzia
 * resta sempre visibile — vedi utils/brandingFisso.js — accanto a quello
 * del professionista, mai sostituito.
 *
 * DOVE VIVE. Sul dispositivo e non nel progetto: un installatore lo
 * compila una volta e vale per tutti i suoi lavori. Il privato che usa lo
 * strumento per casa propria non lo compila, e non vede nulla in più.
 */

const CHIAVE = "dimensionamento_professionista_v1";

/** Lato massimo del logo salvato [px]: basta per la stampa e sta nello spazio del browser. */
const LATO_MASSIMO_LOGO_PX = 400;

export function profiloVuoto() {
  return { nome: "", telefono: "", email: "", sito: "", logo: null };
}

/** Vero quando c'è almeno un nome: senza nome non c'è niente da firmare. */
export function profiloCompilato(profilo) {
  return Boolean(profilo?.nome?.trim());
}

export function caricaProfilo() {
  try {
    const raw = localStorage.getItem(CHIAVE);
    return raw ? { ...profiloVuoto(), ...JSON.parse(raw) } : profiloVuoto();
  } catch {
    return profiloVuoto();
  }
}

/** @returns {boolean} falso se lo spazio del browser non è disponibile (es. navigazione privata) */
export function salvaProfilo(profilo) {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(profilo));
    return true;
  } catch {
    return false;
  }
}

export function eliminaProfilo() {
  try {
    localStorage.removeItem(CHIAVE);
  } catch {
    // niente da fare: se lo spazio non è disponibile non c'era nulla da togliere
  }
}

/**
 * Riduce il logo caricato a un'immagine di dimensione contenuta.
 *
 * Un logo da una fotocamera o da uno studio grafico può pesare diversi
 * megabyte, e lo spazio del browser è di pochi: salvarlo così com'è
 * fallirebbe, oppure riempirebbe lo spazio dei progetti salvati. Lo si
 * ridisegna su un lato massimo di 400 px, che in stampa è più che
 * sufficiente. Il PNG conserva la trasparenza dei loghi.
 *
 * @param {File} file
 * @returns {Promise<string>} immagine come data URL
 */
export function riduciLogo(file) {
  return new Promise((risolvi, rifiuta) => {
    if (!file || !file.type?.startsWith("image/")) {
      rifiuta(new Error("Il file scelto non è un'immagine."));
      return;
    }
    const lettore = new FileReader();
    lettore.onerror = () => rifiuta(new Error("Impossibile leggere il file."));
    lettore.onload = () => {
      const immagine = new Image();
      immagine.onerror = () => rifiuta(new Error("Il formato dell'immagine non è supportato."));
      immagine.onload = () => {
        const scala = Math.min(1, LATO_MASSIMO_LOGO_PX / Math.max(immagine.width, immagine.height));
        const tela = document.createElement("canvas");
        tela.width = Math.max(1, Math.round(immagine.width * scala));
        tela.height = Math.max(1, Math.round(immagine.height * scala));
        tela.getContext("2d").drawImage(immagine, 0, 0, tela.width, tela.height);
        risolvi(tela.toDataURL("image/png"));
      };
      immagine.src = lettore.result;
    };
    lettore.readAsDataURL(file);
  });
}
