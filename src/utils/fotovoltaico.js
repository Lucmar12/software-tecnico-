/**
 * fotovoltaico.js — Stima di massima della copertura, tramite un impianto
 * fotovoltaico, dei consumi elettrici della pompa di calore/climatizzatore
 * dimensionato, e della quota di fabbisogno ACS coperta da un eventuale
 * solare termico.
 *
 * ATTENZIONE METODOLOGICA: la producibilità specifica reale di un impianto
 * fotovoltaico dipende da orientamento, inclinazione, ombreggiamenti e
 * dati di irraggiamento puntuali (tipicamente calcolati con PVGIS o
 * software dedicato secondo UNI/TS 11300-4 per la quota rinnovabile).
 * I valori usati qui sono medie indicative per macroarea geografica,
 * adatte a un pre-dimensionamento speditivo, non a un calcolo esecutivo
 * ai fini Ecobonus/Conto Termico.
 */

import { calcolaConsumoAnnuo, EFFICIENZA_PER_CLASSE, ZONE_CLIMATICHE } from "../data/calculations.js";

/** Ore equivalenti di funzionamento a pieno carico in raffrescamento, valore convenzionale indicativo (non normato). */
const ORE_RAFFRESCAMENTO_ANNO = 400;

/**
 * Stima il consumo elettrico annuo complessivo dell'impianto di
 * climatizzazione dimensionato (riscaldamento + raffrescamento), usando
 * l'efficienza di una classe energetica rappresentativa come riferimento
 * — utile per stimare quanto un impianto fotovoltaico ne coprirebbe i
 * consumi, indipendentemente dal prodotto specifico che verrà scelto.
 */
export function stimaConsumoAnnuoClimatizzazione({ totaleInvernaleKw, totaleEstivoKw, comune, classeRappresentativa = "A++" }) {
  const efficienza = EFFICIENZA_PER_CLASSE[classeRappresentativa];
  const oreRiscaldamentoAnno = ZONE_CLIMATICHE[comune.zona].oreRiscaldamento * 120; // stima convenzionale, coerente col resto dell'app
  const consumoRiscaldamentoKwh = calcolaConsumoAnnuo(totaleInvernaleKw, oreRiscaldamentoAnno, efficienza, "riscaldamento");
  const consumoRaffrescamentoKwh = calcolaConsumoAnnuo(totaleEstivoKw, ORE_RAFFRESCAMENTO_ANNO, efficienza, "raffrescamento");
  return {
    consumoRiscaldamentoKwh,
    consumoRaffrescamentoKwh,
    consumoAnnuoKwh: consumoRiscaldamentoKwh + consumoRaffrescamentoKwh,
    classeRappresentativa,
  };
}

/** Producibilità specifica media indicativa [kWh/kWp/anno] per macroarea geografica italiana. */
export const PRODUCIBILITA_SPECIFICA_PER_AREA = {
  nord: 1150,
  centro: 1300, // include l'Umbria, area di utilizzo prevalente dell'app
  sud_isole: 1450,
};

/** Quota di autoconsumo istantaneo convenzionale della produzione fotovoltaica, con/senza sistema di accumulo. */
const QUOTA_AUTOCONSUMO_SENZA_ACCUMULO = 0.3;
const QUOTA_AUTOCONSUMO_CON_ACCUMULO = 0.6;

/** Stima l'area geografica di riferimento per la producibilità FV a partire dalla zona climatica del comune (approssimazione). */
export function stimaAreaGeografica(comune) {
  if (!comune) return "centro";
  if (comune.regione === "Umbria") return "centro";
  if (["E", "F"].includes(comune.zona)) return "nord";
  if (["B"].includes(comune.zona) && comune.tbse >= 32) return "sud_isole";
  return "centro";
}

/**
 * Stima la copertura dei consumi elettrici annui (pompa di calore o
 * climatizzatore) offerta da un impianto fotovoltaico di taglia data.
 *
 * @param {number} kWp                 Taglia dell'impianto fotovoltaico [kWp]
 * @param {number} consumoAnnuoKwh     Consumo elettrico annuo dell'impianto di climatizzazione da coprire [kWh]
 * @param {"nord"|"centro"|"sud_isole"} areaGeografica
 * @param {boolean} conAccumulo        Presenza di batteria di accumulo
 */
export function calcolaCoperturaFotovoltaico({ kWp, consumoAnnuoKwh, areaGeografica = "centro", conAccumulo = false }) {
  const producibilitaSpecifica = PRODUCIBILITA_SPECIFICA_PER_AREA[areaGeografica];
  const producibilitaAnnuaKwh = kWp * producibilitaSpecifica;
  const quotaAutoconsumo = conAccumulo ? QUOTA_AUTOCONSUMO_CON_ACCUMULO : QUOTA_AUTOCONSUMO_SENZA_ACCUMULO;
  const energiaAutoconsumataKwh = Math.min(producibilitaAnnuaKwh * quotaAutoconsumo, consumoAnnuoKwh);
  const coperturaPct = consumoAnnuoKwh > 0 ? (energiaAutoconsumataKwh / consumoAnnuoKwh) * 100 : 0;
  return {
    producibilitaSpecifica,
    producibilitaAnnuaKwh,
    quotaAutoconsumo,
    energiaAutoconsumataKwh,
    coperturaPct: Math.min(100, coperturaPct),
  };
}

/** Suggerisce la taglia FV [kWp] indicativa per raggiungere una quota di copertura target dei consumi. */
export function suggerisciTagliaFotovoltaico({ consumoAnnuoKwh, areaGeografica = "centro", conAccumulo = false, coperturaTargetPct = 70 }) {
  const producibilitaSpecifica = PRODUCIBILITA_SPECIFICA_PER_AREA[areaGeografica];
  const quotaAutoconsumo = conAccumulo ? QUOTA_AUTOCONSUMO_CON_ACCUMULO : QUOTA_AUTOCONSUMO_SENZA_ACCUMULO;
  const energiaTargetKwh = consumoAnnuoKwh * (coperturaTargetPct / 100);
  return energiaTargetKwh / (producibilitaSpecifica * quotaAutoconsumo);
}

// ---------------------------------------------------------------------
// SOLARE TERMICO (integrazione ACS)
// ---------------------------------------------------------------------

/** Copertura convenzionale del fabbisogno ACS annuo offerta da un impianto solare termico correttamente dimensionato in area centro Italia/Umbria. */
const COPERTURA_SOLARE_TERMICO_ACS_DEFAULT = 0.55; // 55%, valore medio indicativo

/**
 * Stima la riduzione del fabbisogno energetico annuo del bollitore grazie
 * all'integrazione di un impianto solare termico.
 * @param {number} kWhAnnoBollitore  Fabbisogno energetico annuo del bollitore (da calcolaBollitore)
 * @param {number} coperturaPct      Quota di copertura solare attesa (0-100), default valore convenzionale
 */
export function calcolaRisparmioSolareTermico(kWhAnnoBollitore, coperturaPct = COPERTURA_SOLARE_TERMICO_ACS_DEFAULT * 100) {
  const kWhCopertiDaSolare = kWhAnnoBollitore * (coperturaPct / 100);
  const kWhResiduiDaImpianto = kWhAnnoBollitore - kWhCopertiDaSolare;
  return { kWhCopertiDaSolare, kWhResiduiDaImpianto, coperturaPct };
}
