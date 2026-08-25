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

/**
 * Portate nominali di erogazione degli apparecchi sanitari [l/s] —
 * UNI 9182, prospetto delle portate nominali per apparecchio a uso
 * residenziale. Sono le portate che ciascun apparecchio richiede quando
 * è in erogazione, non un consumo medio.
 */
export const PORTATA_NOMINALE_APPARECCHI_LS = {
  lavabo: 0.10,
  vaso: 0.10,
  bidet: 0.10,
  doccia: 0.15,
  lavello: 0.20,
  lavastoviglie: 0.10,
  lavatrice: 0.10,
};

/** Composizione convenzionale di un bagno completo (lavabo, vaso, bidet, doccia). */
const APPARECCHI_PER_BAGNO = ["lavabo", "vaso", "bidet", "doccia"];
/** Composizione convenzionale della cucina (lavello + lavastoviglie). */
const APPARECCHI_CUCINA = ["lavello", "lavastoviglie"];

/** Numero di bagni di default dell'abitazione. */
export const NUMERO_BAGNI_DEFAULT = 2;

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
/**
 * Portata di punta della rete di distribuzione interna [l/s], con il
 * metodo UNI 9182: somma delle portate nominali degli apparecchi
 * installati, ridotta dal coefficiente di contemporaneità.
 *
 * La portata di punta NON si ricava dal consumo giornaliero: un'utenza
 * da 450 l/giorno non richiede 54 l/h alla rete, perché il fabbisogno si
 * concentra in erogazioni istantanee da centinaia di litri/ora ciascuna.
 * È il numero di apparecchi che possono aprirsi insieme a dimensionare
 * l'autoclave, non quanta acqua si consuma in una giornata.
 *
 * Coefficiente di contemporaneità 1/√(n−1), formulazione di uso corrente
 * per utenze residenziali con n apparecchi; la portata risultante non
 * scende mai sotto quella del singolo apparecchio più esigente, perché
 * quello deve poter essere alimentato da solo.
 */
export function calcolaPortataPunta({ numeroBagni = NUMERO_BAGNI_DEFAULT, haLavatrice = true }) {
  const apparecchi = [];
  for (let i = 0; i < Math.max(1, numeroBagni); i++) apparecchi.push(...APPARECCHI_PER_BAGNO);
  apparecchi.push(...APPARECCHI_CUCINA);
  if (haLavatrice) apparecchi.push("lavatrice");

  const portateLs = apparecchi.map((a) => PORTATA_NOMINALE_APPARECCHI_LS[a]);
  const sommaPortateLs = portateLs.reduce((s, q) => s + q, 0);
  const numeroApparecchi = apparecchi.length;
  const contemporaneita = numeroApparecchi > 1 ? 1 / Math.sqrt(numeroApparecchi - 1) : 1;
  const portataMinimaLs = Math.max(...portateLs);
  const portataPuntaLs = Math.max(sommaPortateLs * contemporaneita, portataMinimaLs);

  return {
    numeroApparecchi,
    sommaPortateLs,
    contemporaneita,
    portataPuntaLs,
    portataPuntaMc: (portataPuntaLs * 3600) / 1000,
    portataPuntaLmin: portataPuntaLs * 60,
  };
}

export function calcolaAutoclave({
  numeroPersone,
  consumoLitriPersonaGiorno = CONSUMO_LITRI_PERSONA_GIORNO_DEFAULT,
  numeroBagni = NUMERO_BAGNI_DEFAULT,
  haLavatrice = true,
  numeroPiani,
  altezzaEdificioM = null,
  pressioneResiduaBar = PRESSIONE_RESIDUA_MINIMA_BAR_DEFAULT,
  perditeCaricoPct = PERDITE_CARICO_PCT_DEFAULT,
}) {
  // Il consumo giornaliero non entra nella portata di punta: resta come
  // dato di esercizio dell'utenza (utile per accumulo e trattamento acque).
  const consumoGiornalieroLitri = numeroPersone * consumoLitriPersonaGiorno;
  const punta = calcolaPortataPunta({ numeroBagni, haLavatrice });

  const altezzaGeodeticaM = altezzaEdificioM ?? numeroPiani * ALTEZZA_PIANO_M;
  const prevalenzaM = altezzaGeodeticaM * (1 + perditeCaricoPct / 100) + pressioneResiduaBar * M_PER_BAR;

  return {
    consumoGiornalieroLitri,
    numeroBagni,
    haLavatrice,
    numeroApparecchi: punta.numeroApparecchi,
    sommaPortateLs: punta.sommaPortateLs,
    contemporaneita: punta.contemporaneita,
    portataPuntaLs: punta.portataPuntaLs,
    portataPuntaMc: punta.portataPuntaMc,
    portataPuntaLmin: punta.portataPuntaLmin,
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
