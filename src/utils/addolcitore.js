/**
 * addolcitore.js — Motore di calcolo per il dimensionamento di addolcitori
 * a scambio ionico per uso domestico.
 *
 * Riferimento normativo:
 * - UNI EN 14743  : requisiti di prestazione, sicurezza e prova per gli
 *                    addolcitori a scambio ionico ad uso domestico —
 *                    disciplina le prestazioni dichiarabili dal
 *                    costruttore (capacità di scambio, portata nominale)
 *                    ma non impone un metodo di calcolo unico per il
 *                    dimensionamento: la metodologia qui applicata è
 *                    prassi tecnica corrente del settore.
 *
 * ATTENZIONE: la capacità di scambio ciclica specifica della resina e il
 * dosaggio di sale in rigenerazione sono valori indicativi di pratica
 * tecnica corrente (resine cationiche forti, rigenerazione a controcorrente
 * con dosaggio medio di NaCl) — il costruttore dell'addolcitore selezionato
 * dichiara il proprio valore specifico, da usare in fase esecutiva.
 */

/** Capacità di scambio ciclica specifica della resina [°fH · litri di acqua trattata per litro di resina], dosaggio sale standard. */
export const CAPACITA_CICLICA_RESINA_GF_L = 4500;

/** Dosaggio di sale (NaCl) per rigenerazione, per litro di resina [kg/litro]. */
export const DOSAGGIO_SALE_KG_PER_LITRO_RESINA = 0.15;

/** Taglie commerciali standard di addolcitori residenziali, per volume di resina [litri]. */
export const TAGLIE_COMMERCIALI_RESINA_LITRI = [8, 10, 12, 16, 20, 25, 30];

/** Durezza residua obiettivo dopo addolcimento, di default [°fH] — valore convenzionale per uso domestico (acqua "dolce", non demineralizzata). */
export const DUREZZA_RESIDUA_DEFAULT_GF = 5;

/** Durezza dell'acqua in ingresso di default [°fH] — valore indicativo medio per le reti acquedottistiche umbre (acque da falda calcareo-dolomitica, mediamente dure). Da verificare sempre con analisi puntuale o dato del gestore idrico locale. */
export const DUREZZA_INGRESSO_DEFAULT_GF = 25;

/** Consumo idrico domestico medio pro capite di default [litri/persona/giorno] — consumo totale (non solo ACS). */
export const CONSUMO_LITRI_PERSONA_GIORNO_DEFAULT = 150;

/** Portata di punta istantanea di default per un'utenza residenziale [m³/h]. */
export const PORTATA_PUNTA_DEFAULT_MC = 1.5;

/** Autonomia target tra due rigenerazioni successive, di default [giorni]. */
export const AUTONOMIA_GIORNI_DEFAULT = 3;

/**
 * Dimensionamento dell'addolcitore: volume di resina necessario a coprire
 * il fabbisogno di acqua addolcita per l'autonomia target tra due
 * rigenerazioni, e stima del consumo di sale annuo per la gestione
 * dell'impianto.
 */
export function calcolaAddolcitore({
  durezzaIngressoGf = DUREZZA_INGRESSO_DEFAULT_GF,
  durezzaResiduaGf = DUREZZA_RESIDUA_DEFAULT_GF,
  numeroPersone,
  consumoLitriPersonaGiorno = CONSUMO_LITRI_PERSONA_GIORNO_DEFAULT,
  portataPuntaMc = PORTATA_PUNTA_DEFAULT_MC,
  autonomiaGiorniTarget = AUTONOMIA_GIORNI_DEFAULT,
}) {
  const consumoGiornalieroLitri = numeroPersone * consumoLitriPersonaGiorno;
  const durezzaDaAbbattereGf = Math.max(0, durezzaIngressoGf - durezzaResiduaGf);

  // Volume di resina che si esaurisce in un giorno di consumo, alla durezza da abbattere data.
  const volumeResinaGiornalieroLitri = (durezzaDaAbbattereGf * consumoGiornalieroLitri) / CAPACITA_CICLICA_RESINA_GF_L;
  const volumeResinaRichiestoLitri = volumeResinaGiornalieroLitri * autonomiaGiorniTarget;

  const tagliaResinaLitri = TAGLIE_COMMERCIALI_RESINA_LITRI.find((t) => t >= volumeResinaRichiestoLitri) || null;
  const taglioNonDisponibile = !tagliaResinaLitri;

  const numeroRigenerazioniAnno = 365 / autonomiaGiorniTarget;
  const consumoSaleKgAnno = (tagliaResinaLitri || volumeResinaRichiestoLitri) * DOSAGGIO_SALE_KG_PER_LITRO_RESINA * numeroRigenerazioniAnno;

  return {
    consumoGiornalieroLitri,
    durezzaDaAbbattereGf,
    volumeResinaRichiestoLitri,
    tagliaResinaLitri,
    taglioNonDisponibile,
    messaggio: taglioNonDisponibile ? "Necessario addolcitore >30 L di resina o configurazione doppia" : null,
    portataPuntaMc,
    autonomiaGiorniTarget,
    numeroRigenerazioniAnno,
    consumoSaleKgAnno,
  };
}
