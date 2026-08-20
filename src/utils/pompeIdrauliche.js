/**
 * pompeIdrauliche.js — Motore di calcolo per il dimensionamento di
 * autoclavi, pompe di sollevamento e pompe di circolazione (ricircolo ACS)
 * per uso domestico.
 *
 * Riferimento normativo:
 * - UNI 9182  : criteri di progettazione, collaudo e gestione degli
 *                impianti di alimentazione e distribuzione d'acqua fredda
 *                e calda — pressione residua minima al punto di
 *                erogazione più sfavorito, criteri di calcolo delle
 *                portate di punta nella rete di distribuzione interna.
 *
 * ATTENZIONE: le perdite di carico e i coefficienti di punta applicati
 * sono valori forfettari indicativi di pratica tecnica corrente, in
 * assenza del calcolo puntuale della rete idraulica (diametri, tracciato,
 * numero di apparecchi effettivamente installati) che compete alla
 * progettazione idraulica esecutiva.
 */

/** Colonna d'acqua equivalente a 1 bar di pressione [m]. */
export const M_PER_BAR = 10.2;

/** Potenza equivalente a 1 CV (cavallo vapore, unità commerciale corrente per i motori delle elettropompe) [kW]. */
export const KW_PER_CV = 0.7355;

/** Converte la potenza del motore da kW (valore primario) a CV (valore secondario, taglia commerciale delle elettropompe). */
export function kwToCv(kw) {
  return kw / KW_PER_CV;
}

/** Pressione residua minima al punto di erogazione più sfavorito, di default (UNI 9182) [bar]. */
export const PRESSIONE_RESIDUA_MINIMA_BAR_DEFAULT = 1.5;

/** Perdite di carico distribuite e concentrate della rete di distribuzione, stima forfettaria di default [% dell'altezza geodetica]. */
export const PERDITE_CARICO_PCT_DEFAULT = 20;

/** Altezza convenzionale di un piano, per la stima dell'altezza geodetica dal numero di piani [m]. */
export const ALTEZZA_PIANO_M = 3;

/** Consumo idrico domestico medio pro capite di default [litri/persona/giorno] — coerente con il modulo trattamento acque. */
export const CONSUMO_LITRI_PERSONA_GIORNO_DEFAULT = 150;

/** Quota del consumo giornaliero convenzionalmente concentrata nell'ora di punta, di default. */
export const FATTORE_PUNTA_ORARIO_DEFAULT = 0.12;

/** Perdite di carico della tubazione di mandata della pompa di sollevamento, stima forfettaria di default [% del dislivello]. */
export const PERDITE_CARICO_SOLLEVAMENTO_PCT_DEFAULT = 10;

/** Dispersione termica lineare di una tubazione ACS coibentata, di default [W/m]. */
export const DISPERSIONE_TERMICA_TUBAZIONE_W_M_DEFAULT = 15;

/** Differenza di temperatura massima ammessa tra mandata e ritorno del circuito di ricircolo ACS, di default [K] — prassi tecnica corrente. */
export const DELTA_T_RICIRCOLO_K_DEFAULT = 5;

/** Perdita di carico convenzionale del circuito di ricircolo ACS, per metro di tubazione [m prevalenza / m tubazione] — stima forfettaria per basse portate. */
export const COEFF_PERDITA_CARICO_RICIRCOLO_M_PER_M = 0.02;

/**
 * Dimensionamento dell'autoclave (gruppo di pressurizzazione): portata di
 * punta della rete di distribuzione interna e prevalenza manometrica
 * necessaria a garantire la pressione residua minima al punto di
 * erogazione più sfavorito (UNI 9182).
 */
export function calcolaAutoclave({
  numeroPersone,
  consumoLitriPersonaGiorno = CONSUMO_LITRI_PERSONA_GIORNO_DEFAULT,
  fattorePuntaOrario = FATTORE_PUNTA_ORARIO_DEFAULT,
  numeroPiani,
  altezzaEdificioM = null,
  pressioneResiduaBar = PRESSIONE_RESIDUA_MINIMA_BAR_DEFAULT,
  perditeCaricoPct = PERDITE_CARICO_PCT_DEFAULT,
}) {
  const consumoGiornalieroLitri = numeroPersone * consumoLitriPersonaGiorno;
  const portataPuntaMc = (consumoGiornalieroLitri * fattorePuntaOrario) / 1000;

  const altezzaGeodeticaM = altezzaEdificioM ?? numeroPiani * ALTEZZA_PIANO_M;
  const prevalenzaM = altezzaGeodeticaM * (1 + perditeCaricoPct / 100) + pressioneResiduaBar * M_PER_BAR;

  return {
    consumoGiornalieroLitri,
    portataPuntaMc,
    altezzaGeodeticaM,
    prevalenzaM,
    pressioneEsercizioBar: prevalenzaM / M_PER_BAR,
  };
}

/**
 * Dimensionamento della pompa di sollevamento (es. da cisterna/pozzo o
 * locale interrato verso la rete di distribuzione): prevalenza dal
 * dislivello geodetico maggiorato delle perdite di carico di mandata.
 */
export function calcolaSollevamento({ dislivelloM, portataMc, perditeCaricoPct = PERDITE_CARICO_SOLLEVAMENTO_PCT_DEFAULT }) {
  const prevalenzaM = dislivelloM * (1 + perditeCaricoPct / 100);
  return { prevalenzaM, portataMc };
}

/**
 * Dimensionamento semplificato della pompa di circolazione per il
 * ricircolo ACS: la portata è quella necessaria a smaltire la dispersione
 * termica della rete di distribuzione mantenendo il salto termico massimo
 * ammesso tra mandata e ritorno.
 */
export function calcolaCircolazione({
  lunghezzaTubazioniM,
  dispersionePerMetroWM = DISPERSIONE_TERMICA_TUBAZIONE_W_M_DEFAULT,
  deltaTK = DELTA_T_RICIRCOLO_K_DEFAULT,
}) {
  const dispersioneTotaleW = lunghezzaTubazioniM * dispersionePerMetroWM;
  // Q [l/h] = P [W] / (1.163 [Wh/l·K] × ΔT [K])
  const portataRicircoloLh = dispersioneTotaleW / (1.163 * deltaTK);
  const prevalenzaM = lunghezzaTubazioniM * COEFF_PERDITA_CARICO_RICIRCOLO_M_PER_M;
  return {
    dispersioneTotaleW,
    portataRicircoloLh,
    portataRicircoloMc: portataRicircoloLh / 1000,
    prevalenzaM: Math.max(prevalenzaM, 1), // prevalenza minima di pratica per vincere le valvole di ritegno del circuito
  };
}
