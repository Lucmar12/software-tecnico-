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

import { calcolaConsumoAnnuo, EFFICIENZA_PER_CLASSE, ZONE_CLIMATICHE, TEMP_INTERNA_PROGETTO } from "../data/calculations.js";

/**
 * Ore equivalenti di funzionamento a pieno carico in raffrescamento, per
 * zona climatica. Il raffrescamento non ha un equivalente dei gradi
 * giorno nel DPR 412/93: questi sono valori di pratica corrente, più alti
 * dove l'estate è lunga (zone A e B) e bassi in montagna (E, F).
 * Convenzionali e non certificati.
 */
const ORE_RAFFRESCAMENTO_PER_ZONA = { A: 600, B: 550, C: 450, D: 400, E: 300, F: 200 };

/**
 * Quota del fabbisogno di riscaldamento effettivamente coperta
 * dall'impianto: apporti interni (persone, elettrodomestici) e solari
 * gratuiti ne coprono una parte, che il metodo dei gradi giorno non
 * scorpora. Valore convenzionale di pratica corrente per il
 * residenziale, non certificato.
 */
const QUOTA_COPERTA_DALL_IMPIANTO = 0.75;

/**
 * Stima il consumo elettrico annuo complessivo dell'impianto di
 * climatizzazione dimensionato (riscaldamento + raffrescamento), usando
 * l'efficienza di una classe energetica rappresentativa come riferimento
 * — utile per stimare quanto un impianto fotovoltaico ne coprirebbe i
 * consumi, indipendentemente dal prodotto specifico che verrà scelto.
 */
export function stimaConsumoAnnuoClimatizzazione({ totaleInvernaleKw, totaleEstivoKw, comune, classeRappresentativa = "A++" }) {
  const efficienza = EFFICIENZA_PER_CLASSE[classeRappresentativa];
  const zona = ZONE_CLIMATICHE[comune.zona];

  /*
   * ORE EQUIVALENTI A PIENO CARICO, metodo dei gradi giorno.
   *
   * Il carico di progetto si verifica solo al giorno più freddo: usarlo
   * per tutte le ore di esercizio sovrastimerebbe il consumo. Il
   * fabbisogno annuo si ricava invece dal coefficiente di dispersione
   * dell'edificio H = P_progetto / ΔT_progetto moltiplicato per i gradi
   * giorno:
   *
   *   Q = H × GG × 24  →  ore equivalenti = GG × 24 / ΔT_progetto
   *
   * Così il consumo dipende davvero dal clima del comune scelto — dai
   * suoi gradi giorno e dalla sua temperatura di progetto — e non da un
   * numero fisso per zona.
   */
  const deltaTProgetto = Math.max(1, TEMP_INTERNA_PROGETTO - comune.teInv);
  const gradiGiorno = zona.gradiGiorno;
  const oreEquivalentiRiscaldamento = ((gradiGiorno * 24) / deltaTProgetto) * QUOTA_COPERTA_DALL_IMPIANTO;
  const oreEquivalentiRaffrescamento = ORE_RAFFRESCAMENTO_PER_ZONA[comune.zona] ?? 400;

  const consumoRiscaldamentoKwh = calcolaConsumoAnnuo(totaleInvernaleKw, oreEquivalentiRiscaldamento, efficienza, "riscaldamento");
  const consumoRaffrescamentoKwh = calcolaConsumoAnnuo(totaleEstivoKw, oreEquivalentiRaffrescamento, efficienza, "raffrescamento");

  return {
    consumoRiscaldamentoKwh,
    consumoRaffrescamentoKwh,
    consumoAnnuoKwh: consumoRiscaldamentoKwh + consumoRaffrescamentoKwh,
    classeRappresentativa,
    gradiGiorno,
    deltaTProgetto,
    oreEquivalentiRiscaldamento,
    oreEquivalentiRaffrescamento,
    quotaCopertaDallImpianto: QUOTA_COPERTA_DALL_IMPIANTO,
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
