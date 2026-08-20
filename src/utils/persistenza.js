/**
 * persistenza.js — Salvataggio locale dei progetti (localStorage del
 * browser). Non è una sincronizzazione multi-dispositivo/multi-utente:
 * i progetti restano sul dispositivo su cui sono stati salvati.
 */

const CHIAVE_PROGETTI = "dimensionamento_progetti_v1";
const CHIAVE_BOZZA = "dimensionamento_bozza_v1";

function generaId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `progetto-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function leggiElenco() {
  try {
    const raw = localStorage.getItem(CHIAVE_PROGETTI);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function scriviElenco(elenco) {
  try {
    localStorage.setItem(CHIAVE_PROGETTI, JSON.stringify(elenco));
    return true;
  } catch {
    return false; // storage pieno o non disponibile (es. modalità privata)
  }
}

/** Elenca i progetti salvati, più recenti prima. */
export function elencaProgetti() {
  return leggiElenco().sort((a, b) => b.salvatoIl - a.salvatoIl);
}

/** Salva (o aggiorna, se esiste già un id) un progetto con lo stato completo dell'app. */
export function salvaProgetto(nome, stato, idEsistente = null) {
  const elenco = leggiElenco();
  const id = idEsistente || generaId();
  const voce = { id, nome, salvatoIl: Date.now(), stato };
  const indice = elenco.findIndex((p) => p.id === id);
  if (indice >= 0) elenco[indice] = voce;
  else elenco.push(voce);
  return scriviElenco(elenco) ? id : null;
}

export function caricaProgetto(id) {
  return leggiElenco().find((p) => p.id === id) || null;
}

export function eliminaProgetto(id) {
  return scriviElenco(leggiElenco().filter((p) => p.id !== id));
}

/** Bozza corrente: salvata automaticamente ad ogni modifica, ripristinata all'apertura dell'app. */
export function salvaBozza(stato) {
  try {
    localStorage.setItem(CHIAVE_BOZZA, JSON.stringify({ stato, salvatoIl: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

export function caricaBozza() {
  try {
    const raw = localStorage.getItem(CHIAVE_BOZZA);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function eliminaBozza() {
  try {
    localStorage.removeItem(CHIAVE_BOZZA);
  } catch {
    /* noop */
  }
}

// ---------------------------------------------------------------------
// STORICO RICHIESTE — registro locale delle richieste di preventivo
// inviate da questo dispositivo/browser. NON è una dashboard lead
// multi-installatore/multi-dispositivo: per quella serve un backend con
// autenticazione condivisa (vedi nota nell'interfaccia).
// ---------------------------------------------------------------------
const CHIAVE_STORICO = "dimensionamento_storico_richieste_v1";

function leggiStorico() {
  try {
    const raw = localStorage.getItem(CHIAVE_STORICO);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function registraRichiestaStorico(voce) {
  const storico = leggiStorico();
  storico.push({ id: generaId(), inviatoIl: Date.now(), ...voce });
  try {
    localStorage.setItem(CHIAVE_STORICO, JSON.stringify(storico.slice(-200))); // mantiene le ultime 200
  } catch {
    /* noop */
  }
}

export function elencaStoricoRichieste() {
  return leggiStorico().sort((a, b) => b.inviatoIl - a.inviatoIl);
}
