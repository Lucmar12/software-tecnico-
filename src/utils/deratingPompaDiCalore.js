/**
 * deratingPompaDiCalore.js — Derating della capacità resa da una
 * macchina aria-esterna (pompa di calore aria-acqua, VRF, chiller
 * aria-refrigerato) in funzione della temperatura esterna di progetto.
 *
 * METODOLOGIA: la potenza dichiarata a catalogo per queste macchine è
 * riferita a un punto di prova convenzionale (tipicamente aria esterna
 * +7°C per il riscaldamento, EN 14511) — non alla temperatura esterna di
 * progetto realmente prevista, che nelle zone climatiche E/F (frequenti
 * in Umbria in quota) può scendere fino a -5/-15°C. Trattare la potenza
 * nominale come se fosse la potenza realmente resa a bassa temperatura
 * porta a un sottodimensionamento sistematico. La curva di derating qui
 * usata è un'approssimazione lineare a tratti, rappresentativa
 * dell'andamento tipico di una pompa di calore aria-acqua inverter: la
 * curva di resa reale del modello selezionato va sempre verificata sulla
 * scheda tecnica del produttore (dato EN 14511 a più punti di prova).
 */

/** Punti di riferimento [°C esterna, frazione di capacità resa rispetto al punto di prova standard +7°C]. */
const PUNTI_CURVA_DERATING = [
  { temperatura: 7, fattore: 1.0 },
  { temperatura: 2, fattore: 0.85 },
  { temperatura: -5, fattore: 0.65 },
  { temperatura: -10, fattore: 0.5 },
  { temperatura: -15, fattore: 0.4 },
];

const FATTORE_MINIMO = 0.35; // sotto -15°C il derating non scende ulteriormente in questa stima indicativa

/**
 * Fattore di derating (0-1) della capacità resa alla temperatura esterna
 * di progetto, rispetto alla potenza nominale dichiarata al punto di
 * prova standard (+7°C).
 */
export function calcolaFattoreDeratingBassaTemperatura(temperaturaEsternaProgetto) {
  if (temperaturaEsternaProgetto >= PUNTI_CURVA_DERATING[0].temperatura) return 1.0;
  if (temperaturaEsternaProgetto <= PUNTI_CURVA_DERATING[PUNTI_CURVA_DERATING.length - 1].temperatura) return FATTORE_MINIMO;

  for (let i = 0; i < PUNTI_CURVA_DERATING.length - 1; i++) {
    const a = PUNTI_CURVA_DERATING[i];
    const b = PUNTI_CURVA_DERATING[i + 1];
    if (temperaturaEsternaProgetto <= a.temperatura && temperaturaEsternaProgetto >= b.temperatura) {
      const quota = (temperaturaEsternaProgetto - b.temperatura) / (a.temperatura - b.temperatura);
      return b.fattore + quota * (a.fattore - b.fattore);
    }
  }
  return FATTORE_MINIMO;
}

/**
 * Potenza nominale (al punto di prova standard +7°C) che la macchina
 * deve avere in catalogo per garantire il fabbisogno reale alla
 * temperatura esterna di progetto, una volta scontato il derating.
 */
export function calcolaPotenzaNominaleRichiesta(fabbisognoKw, temperaturaEsternaProgetto) {
  const fattoreDerating = calcolaFattoreDeratingBassaTemperatura(temperaturaEsternaProgetto);
  return { fattoreDerating, potenzaNominaleRichiestaKw: fabbisognoKw / fattoreDerating };
}
