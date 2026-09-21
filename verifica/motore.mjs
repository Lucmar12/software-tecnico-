/**
 * verifica/motore.mjs — Verifica di non regressione del motore di calcolo.
 *
 * Si esegue con `npm run verifica` (nessuna dipendenza esterna: solo Node).
 *
 * CRITERIO: i valori attesi di questo file NON sono fotografie di quello
 * che il codice produce oggi. Sono ricavati a mano dalle formule e dai
 * coefficienti normativi, passaggio per passaggio, e riportati nei
 * commenti sopra ogni verifica. Un test che si limita a registrare
 * l'output corrente conferma anche gli errori: se il calcolo sbaglia,
 * sbaglia insieme a lui. Qui invece un risultato che cambia significa che
 * il codice si è allontanato dal calcolo scritto a mano, e va spiegato.
 *
 * Quando un coefficiente normativo cambia per una ragione vera, si
 * aggiorna il valore atteso INSIEME alla derivazione nel commento.
 */

import { calcolaAmbienteConOverride, calcolaEdificioConOverride } from "../src/utils/overrides.js";
import { nuovoAmbiente } from "../src/utils/modelli.js";
import { calcolaDimensionamentoVRF } from "../src/utils/vrf.js";
import { calcolaDimensionamentoChiller } from "../src/utils/chiller.js";
import { calcolaAutoclave, calcolaCircolazione, kwToCv, KW_PER_CV } from "../src/utils/pompeIdrauliche.js";
import { calcolaAddolcitore } from "../src/utils/addolcitore.js";
import { calcolaPotenzaPompaCaloreAcs } from "../src/utils/pompaDiCaloreAcs.js";
import { calcolaFattoreDeratingBassaTemperatura } from "../src/utils/deratingPompaDiCalore.js";
import { calcolaBollitore, kwToBtu, btuToKw, TRASMITTANZE_PER_EPOCA, MAGGIORAZIONE_PONTI_TERMICI_PER_EPOCA, RICAMBI_ARIA_PER_TIPO_LOCALE, ZONE_CLIMATICHE, TAGLIE_COMMERCIALI_BTU, TAGLIE_BOLLITORE_STANDARD, EFFICIENZA_PER_CLASSE, FATTORE_ESPOSIZIONE } from "../src/data/calculations.js";
import { PARAMETRI_CALCOLO, parametro, parametroDefault } from "../src/utils/parametriCalcolo.js";
import { calcolaSuperficieMuriEsterni, sviluppoParetiEsterne, areaFinestra, normalizzaGeometria } from "../src/utils/stime.js";

let passati = 0;
const falliti = [];

/** Confronto con tolleranza: i calcoli in virgola mobile non danno uguaglianze esatte. */
function uguale(descrizione, ottenuto, atteso, tolleranza = 1e-3) {
  const ok = Math.abs(ottenuto - atteso) <= tolleranza;
  if (ok) passati++;
  else falliti.push({ descrizione, ottenuto, atteso, tolleranza });
}

function vero(descrizione, condizione, dettaglio = "") {
  if (condizione) passati++;
  else falliti.push({ descrizione, ottenuto: dettaglio || "falso", atteso: "vero", tolleranza: 0 });
}

// Comune di riferimento: zona D, teInv -2 °C, tbse 32 °C.
const COMUNE = { nome: "Riferimento", zona: "D", teInv: -2, tbse: 32 };

// Ambiente di riferimento: pianta 5,00 × 4,00 m (20 m²), h 2,70 m, una
// parete esterna sul lato lungo, soggiorno, epoca 1991-2005, esposizione
// sud, piano intermedio, una portafinestra a due ante.
function ambienteRiferimento(extra = {}) {
  return nuovoAmbiente({
    nome: "Soggiorno",
    lunghezzaM: 5,
    larghezzaM: 4,
    altezza: 2.7,
    paretiEsterne: "latoLungo",
    numeroFinestre: 1,
    tipoFinestra: "portafinestraDue",
    ...extra,
  });
}

// ---------------------------------------------------------------------
// STIME GEOMETRICHE
// ---------------------------------------------------------------------
{
  const a = ambienteRiferimento();
  // superficie = 5,00 × 4,00 = 20 m² (derivata dai lati, non inserita)
  uguale("superficie derivata dai lati", a.superficiePavimento, 20, 1e-9);
  // muri = lato lungo 5,00 m × h 2,70 = 13,50 m² — calcolo esatto, non stima
  uguale("superficie muri esterni dal lato esposto", a.superficieMuriEsterni, 13.5, 1e-9);
  // finestre = 1 portafinestra a due ante = 1,40 × 2,20 = 3,08 m²
  uguale("superficie finestrata dai serramenti dichiarati", a.superficieFinestre, 3.08, 1e-9);
  // occupanti soggiorno = min(5, max(2, round(20/10))) = 2
  uguale("occupanti di progetto, soggiorno", a.numeroOccupanti, 2);

  // La superficie finestrata non può eccedere quella dei muri esterni.
  const piccolo = nuovoAmbiente({ lunghezzaM: 1.7, larghezzaM: 1.7, altezza: 2.4, paretiEsterne: "tutti", tipoLocale: "altro" });
  vero("finestre mai maggiori dei muri esterni", piccolo.superficieFinestre <= piccolo.superficieMuriEsterni);
}

// ---------------------------------------------------------------------
// GEOMETRIA ESATTA — è il motivo per cui si chiedono i lati e non l'area
// ---------------------------------------------------------------------
{
  // Stanza allungata 3 × 8 m (24 m²). Con l'ipotesi di pianta quadrata la
  // parete varrebbe √24 = 4,90 m in entrambi i casi: +63% se l'ambiente
  // affaccia sul lato corto, −39% se affaccia sul lato lungo. Con i lati
  // dichiarati il valore è quello vero.
  uguale("parete sul lato corto [m]", sviluppoParetiEsterne({ lunghezzaM: 8, larghezzaM: 3, paretiEsterne: "latoCorto" }), 3, 1e-9);
  uguale("parete sul lato lungo [m]", sviluppoParetiEsterne({ lunghezzaM: 8, larghezzaM: 3, paretiEsterne: "latoLungo" }), 8, 1e-9);
  uguale("perimetro d'angolo [m]", sviluppoParetiEsterne({ lunghezzaM: 8, larghezzaM: 3, paretiEsterne: "angolo" }), 11, 1e-9);
  uguale("perimetro di testata [m]", sviluppoParetiEsterne({ lunghezzaM: 8, larghezzaM: 3, paretiEsterne: "tre" }), 14, 1e-9);
  uguale("perimetro completo [m]", sviluppoParetiEsterne({ lunghezzaM: 8, larghezzaM: 3, paretiEsterne: "tutti" }), 22, 1e-9);
  // L'orientamento dei lati non conta: 3×8 e 8×3 sono la stessa stanza.
  uguale(
    "lunghezza e larghezza sono intercambiabili",
    sviluppoParetiEsterne({ lunghezzaM: 3, larghezzaM: 8, paretiEsterne: "latoCorto" }),
    sviluppoParetiEsterne({ lunghezzaM: 8, larghezzaM: 3, paretiEsterne: "latoCorto" }),
    1e-9
  );
  // muri = 3,00 m × 2,70 = 8,10 m²
  uguale("muri esterni della stanza allungata [m²]", calcolaSuperficieMuriEsterni({ lunghezzaM: 8, larghezzaM: 3, altezza: 2.7, paretiEsterne: "latoCorto" }), 8.1, 1e-9);

  // Serramenti: misure nominali di produzione corrente.
  uguale("portafinestra a due ante [m²]", areaFinestra("portafinestraDue"), 1.4 * 2.2, 0.005);
  uguale("finestra a due ante [m²]", areaFinestra("dueAnte"), 1.2 * 1.4, 0.005);

  // Compatibilità: un ambiente salvato prima dei lati (solo superficie)
  // viene ricondotto alla pianta quadrata che quelle versioni assumevano,
  // così il suo carico non cambia riaprendo il progetto.
  const vecchio = normalizzaGeometria({ superficiePavimento: 16, altezza: 2.7, paretiEsterne: 1, tipoLocale: "camera", numeroFinestre: 1, tipoFinestra: "dueAnte" });
  uguale("progetto storico: lato dedotto √16 = 4,00 m", vecchio.lunghezzaM, 4, 0.01);
  vero("progetto storico segnalato come dedotto", vecchio.dimensioniDedotte === true);
  vero("configurazione pareti convertita da numero a testo", vecchio.paretiEsterne === "latoLungo");

  // Svuotare un lato per riscriverlo NON deve far scattare la deduzione da
  // superficie: 5 × 4 con la lunghezza azzerata resta 0 × 4, non 4,47 × 4,47.
  const inModifica = normalizzaGeometria({ ...ambienteRiferimento(), lunghezzaM: 0 });
  uguale("lato azzerato durante la digitazione resta a zero", inModifica.lunghezzaM, 0, 1e-9);
  uguale("l'altro lato non viene toccato", inModifica.larghezzaM, 4, 1e-9);
  vero("un lato a zero non passa la validazione", inModifica.superficiePavimento === 0);
}

// ---------------------------------------------------------------------
// CARICO INVERNALE — UNI EN 12831
// ---------------------------------------------------------------------
{
  const r = calcolaAmbienteConOverride(ambienteRiferimento(), COMUNE);
  // ΔT = 20 − (−2) = 22 K.  U(1991-2005): muro 0,7 · vetro 3,0 W/m²K
  // muro netto = 13,50 − 3,08 = 10,42 m²
  // Q_muri  = 0,7 × 10,42 × 22 = 160,468 W
  // Q_vetri = 3,0 × 3,08 × 22 = 203,280 W
  // tetto e pavimento nulli (piano intermedio)
  // somma = 363,748 W · esposizione sud ×0,92 · piano intermedio ×1,00 = 334,648 W
  // ponti termici 1991-2005 +10%  →  368,113 W
  uguale("dispersione per trasmissione [kW]", r.scomposizioneInvernale.trasmissioneKw, 0.368113, 0.001);
  // ventilazione = 0,34 × 0,5 vol/h × (20 × 2,70) m³ × 22 K = 201,96 W
  uguale("dispersione per ventilazione [kW]", r.scomposizioneInvernale.ventilazioneKw, 0.20196, 0.001);
  // totale = 368,113 + 201,960 = 570,073 W
  uguale("carico invernale totale [kW]", r.invernaleKw, 0.570073, 0.001);

  // Le quote percentuali delle due voci devono chiudere a 100.
  uguale(
    "quote trasmissione + ventilazione = 100%",
    r.scomposizioneInvernale.quotaTrasmissionePct + r.scomposizioneInvernale.quotaVentilazionePct,
    100,
    0.01
  );

  // Le componenti d'involucro sono percentuali sul totale delle componenti.
  const c = r.componentiInvolucro;
  uguale("componenti involucro = 100%", c.muri.pct + c.vetri.pct + c.tetto.pct + c.pavimento.pct, 100, 0.01);
}

// ---------------------------------------------------------------------
// CARICO ESTIVO — metodo Carrier, con quota latente
// ---------------------------------------------------------------------
{
  const r = calcolaAmbienteConOverride(ambienteRiferimento(), COMUNE);
  const e = r.scomposizioneEstiva;
  // ΔT estivo = 32 − 26 = 6 K; incremento sole-aria sud = +8 K
  // Q_trasm = 0,7 × 10,42 × (6+8) + 3,0 × 3,08 × 6 = 102,116 + 55,440 = 157,556 W
  uguale("apporto per trasmissione estivo [kW]", e.trasmissioneKw, 0.157556, 0.001);
  // Q_solare = 3,08 m² × 300 W/m² (sud) × 0,5 (schermatura) = 462 W
  uguale("apporto solare [kW]", e.solareKw, 0.462, 0.001);
  // Q_persone = 2 × 130 = 260 W;  Q_apparecchi = 20 × 8 = 160 W
  uguale("apporto persone [kW]", e.personeKw, 0.26, 0.001);
  uguale("apporto apparecchiature [kW]", e.apparecchiKw, 0.16, 0.001);
  // portata di rinnovo = 0,5 vol/h × 54 m³ = 27 m³/h
  // sensibile = 0,34 × 27 × 6 = 55,08 W
  // latente   = 0,83 × 27 × 4,5 g/kg = 100,85 W
  uguale("rinnovo aria, quota sensibile [kW]", e.ventilazioneSensibileKw, 0.05508, 0.001);
  uguale("rinnovo aria, quota latente [kW]", e.ventilazioneLatenteKw, 0.100845, 0.001);
  // La quota latente non può essere dimenticata: su questo ambiente supera la sensibile.
  vero("quota latente maggiore della sensibile sul rinnovo", e.ventilazioneLatenteKw > e.ventilazioneSensibileKw);
  // totale = (157,556+462+260+160+55,08+100,845) × 1,10 (margine) = 1.315,03 W
  uguale("carico estivo totale [kW]", r.estivoKw, 1.315029, 0.001);
}

// ---------------------------------------------------------------------
// FATTORE b — pareti verso locale non riscaldato
// ---------------------------------------------------------------------
{
  const senza = calcolaAmbienteConOverride(ambienteRiferimento(), COMUNE);
  const con = calcolaAmbienteConOverride(
    ambienteRiferimento({ pareteVersoNonRiscaldato: true, frazioneSuperficieNonRiscaldata: 100 }),
    COMUNE
  );
  // Con il 100% del muro verso un locale non riscaldato (b = 0,5) la sola
  // quota muri si dimezza: 147,84 → 73,92 W. Vetri, ventilazione e
  // maggiorazioni restano invariati, quindi il totale cala ma non a metà.
  vero("il fattore b riduce il carico invernale", con.invernaleKw < senza.invernaleKw);
  uguale("quota muri dimezzata dal fattore b", con.componentiInvolucro.muri.kw, senza.componentiInvolucro.muri.kw / 2, 0.001);
}

// ---------------------------------------------------------------------
// GENERATORE CENTRALIZZATO — max(Σinv, Σest), non Σmax per ambiente
// ---------------------------------------------------------------------
{
  // Due ambienti con esposizioni opposte: il nord governa d'inverno,
  // l'ovest d'estate. Sommare i massimi per ambiente costruirebbe una
  // condizione inesistente (una macchina sola non scalda e raffresca insieme).
  const stanze = [
    ambienteRiferimento({ esposizionePrevalente: "nord", ultimoPiano: true, paretiEsterne: 2 }),
    ambienteRiferimento({ esposizionePrevalente: "ovest", tipoLocale: "cucina", paretiEsterne: 2 }),
  ];
  const ed = calcolaEdificioConOverride(stanze, COMUNE);
  const atteso = Math.max(ed.totaleInvernaleKw, ed.totaleEstivoKw);
  const sommaMassimi = ed.risultatiAmbienti.reduce((s, r) => s + r.fabbisognoDimensionamento, 0);

  const vrf = calcolaDimensionamentoVRF(ed.risultatiAmbienti, { fattoreContemporaneita: 0.8, lunghezzaEquivalenteM: 15, dislivelloM: 5 }, COMUNE.teInv);
  const chiller = calcolaDimensionamentoChiller(ed.risultatiAmbienti, {}, COMUNE.teInv);
  uguale("VRF dimensionato su max(Σinv, Σest)", vrf.sommaFabbisogniKw, atteso, 1e-9);
  uguale("chiller dimensionato su max(Σinv, Σest)", chiller.sommaFabbisogniKw, atteso, 1e-9);
  vero("il vecchio metodo Σmax sovradimensionava", sommaMassimi > atteso, `Σmax ${sommaMassimi.toFixed(3)} vs ${atteso.toFixed(3)}`);

  // Nessun derating tubazioni entro le soglie (30 m / 10 m).
  uguale("nessun derating entro le soglie di riferimento", vrf.fattoreDeratingTubazioni, 1, 1e-9);
  // Contemporaneità applicata prima del derating.
  uguale("potenza con contemporaneità", vrf.potenzaConContemporaneitaKw, atteso * 0.8, 1e-9);
}

// ---------------------------------------------------------------------
// DERATING DELLE MACCHINE ARIA-ESTERNA
// ---------------------------------------------------------------------
{
  uguale("derating al punto di prova +7 °C", calcolaFattoreDeratingBassaTemperatura(7), 1.0);
  uguale("derating a +2 °C (punto di curva)", calcolaFattoreDeratingBassaTemperatura(2), 0.85);
  // Interpolazione lineare fra −5 °C (0,65) e +2 °C (0,85) alla temperatura −2 °C:
  // quota = (−2 − (−5)) / (2 − (−5)) = 3/7 = 0,4286  →  0,65 + 0,4286 × 0,20 = 0,7357
  uguale("derating interpolato a −2 °C", calcolaFattoreDeratingBassaTemperatura(-2), 0.735714, 1e-5);
  // Sotto −15 °C la stima non scende oltre il minimo dichiarato.
  uguale("derating minimo sotto −15 °C", calcolaFattoreDeratingBassaTemperatura(-30), 0.35);
  vero("il derating è monotono decrescente", calcolaFattoreDeratingBassaTemperatura(-10) < calcolaFattoreDeratingBassaTemperatura(0));
}

// ---------------------------------------------------------------------
// ACS — UNI 9182
// ---------------------------------------------------------------------
{
  const b = calcolaBollitore(3, "doccia_normale");
  // 3 persone × 50 l/giorno = 150 l/giorno
  uguale("consumo ACS giornaliero [l]", b.litriGiorno, 150);
  // +20% punte di prelievo → 180 l → prima taglia standard utile: 200 L
  uguale("capacità consigliata [l]", b.litriConsigliati, 180);
  uguale("taglia bollitore standard [l]", b.taglia, 200);
  // energia = 150 l × 1,163 Wh/(l·K) × 30 K / 1000 = 5,2335 kWh/giorno
  uguale("fabbisogno termico ACS [kWh/giorno]", b.kWhGiorno, 5.2335, 1e-4);
  uguale("fabbisogno termico ACS [kWh/anno]", b.kWhAnno, 5.2335 * 365, 0.01);

  // Ricarica di un accumulo da 200 L in 6 h con ΔT 30 K:
  // energia = 200 × 1,163 × 30 / 1000 = 6,978 kWh  →  6,978 / 6 = 1,163 kW termici
  // elettrici = 1,163 / 3,2 (COP) = 0,3634 kW
  const pdc = calcolaPotenzaPompaCaloreAcs({ capacitaLitri: 200, tempoRicaricaOre: 6, cop: 3.2 });
  uguale("energia di ricarica accumulo [kWh]", pdc.energiaTermicaRichiestaKwh, 6.978, 1e-3);
  uguale("potenza termica pompa di calore ACS [kW]", pdc.potenzaTermicaRichiestaKw, 1.163, 1e-3);
  uguale("potenza elettrica assorbita [kW]", pdc.potenzaElettricaAssorbitaKw, 1.163 / 3.2, 1e-4);
}

// ---------------------------------------------------------------------
// AUTOCLAVE — portata di punta UNI 9182
// ---------------------------------------------------------------------
{
  const a = calcolaAutoclave({ numeroPersone: 3, numeroPiani: 2, numeroBagni: 2, haLavatrice: true });
  // 2 bagni × (lavabo 0,10 + vaso 0,10 + bidet 0,10 + doccia 0,15) = 0,90 l/s
  // cucina (lavello 0,20 + lavastoviglie 0,10) = 0,30 l/s ; lavatrice 0,10 l/s
  // Σ = 1,30 l/s su n = 11 apparecchi
  uguale("apparecchi serviti", a.numeroApparecchi, 11);
  uguale("somma portate nominali [l/s]", a.sommaPortateLs, 1.3, 1e-9);
  // contemporaneità = 1/√(11−1) = 0,3162
  uguale("coefficiente di contemporaneità", a.contemporaneita, 1 / Math.sqrt(10), 1e-6);
  // portata = 1,30 × 0,3162 = 0,4111 l/s = 1,480 m³/h
  uguale("portata di punta [m³/h]", a.portataPuntaMc, 1.48, 0.005);
  // La portata di punta non può scendere sotto quella dell'apparecchio più
  // esigente: con un solo bagno e nient'altro deve restare alimentabile.
  const minimo = calcolaAutoclave({ numeroPersone: 1, numeroPiani: 1, numeroBagni: 1, haLavatrice: false });
  vero("portata mai inferiore al singolo apparecchio più esigente", minimo.portataPuntaLs >= 0.2 - 1e-9);
  // Il consumo giornaliero NON deve influenzare la portata di punta.
  const consumoDoppio = calcolaAutoclave({ numeroPersone: 6, numeroPiani: 2, numeroBagni: 2, haLavatrice: true });
  uguale("la portata non dipende dal consumo giornaliero", consumoDoppio.portataPuntaMc, a.portataPuntaMc, 1e-9);
  // prevalenza = 2 piani × 3 m × (1 + 20%) + 1,5 bar × 10,2 m/bar = 7,2 + 15,3 = 22,5 m
  uguale("prevalenza manometrica [m]", a.prevalenzaM, 22.5, 1e-6);
  uguale("pressione di esercizio [bar]", a.pressioneEsercizioBar, 22.5 / 10.2, 1e-6);
}

// ---------------------------------------------------------------------
// RICIRCOLO ACS
// ---------------------------------------------------------------------
{
  // 30 m × 15 W/m = 450 W da smaltire con ΔT 5 K
  // portata = 450 / (1,163 × 5) = 77,4 l/h
  const c = calcolaCircolazione({ lunghezzaTubazioniM: 30 });
  uguale("dispersione rete ricircolo [W]", c.dispersioneTotaleW, 450);
  uguale("portata di ricircolo [l/h]", c.portataRicircoloLh, 450 / (1.163 * 5), 0.01);
  vero("prevalenza minima di pratica rispettata", c.prevalenzaM >= 1);
}

// ---------------------------------------------------------------------
// ADDOLCITORE — UNI EN 14743
// ---------------------------------------------------------------------
{
  const a = calcolaAddolcitore({ numeroPersone: 3, durezzaIngressoGf: 25, durezzaResiduaGf: 5, autonomiaGiorniTarget: 3 });
  // consumo = 3 × 150 = 450 l/giorno ; durezza da abbattere = 25 − 5 = 20 °fH
  // resina/giorno = 20 × 450 / 4500 = 2,0 l  →  3 giorni di autonomia = 6,0 l
  uguale("durezza da abbattere [°fH]", a.durezzaDaAbbattereGf, 20);
  uguale("volume di resina richiesto [l]", a.volumeResinaRichiestoLitri, 6);
  uguale("taglia commerciale resina [l]", a.tagliaResinaLitri, 8);
  // rigenerazioni = 365 / 3 = 121,7 all'anno ; sale = 8 l × 0,15 kg/l × 121,7
  uguale("rigenerazioni all'anno", a.numeroRigenerazioniAnno, 365 / 3, 1e-6);
  uguale("consumo di sale [kg/anno]", a.consumoSaleKgAnno, 8 * 0.15 * (365 / 3), 0.01);
}

// ---------------------------------------------------------------------
// CONVERSIONI DI UNITÀ
// ---------------------------------------------------------------------
{
  uguale("1 kW in BTU/h", kwToBtu(1), 3412);
  uguale("conversione BTU→kW è l'inversa", btuToKw(kwToBtu(7.3)), 7.3, 1e-9);
  uguale("1 CV in kW", kwToCv(KW_PER_CV), 1, 1e-9);
  uguale("kW→CV di 1,5 kW", kwToCv(1.5), 1.5 / 0.7355, 1e-6);
}

// ---------------------------------------------------------------------
// PARAMETRI DI CALCOLO — ogni convenzione è compilabile dall'utente
// ---------------------------------------------------------------------
{
  const base = ambienteRiferimento();
  const r0 = calcolaAmbienteConOverride(base, COMUNE);

  // Ogni parametro dichiarato deve avere un default calcolabile e finito
  // sull'ambiente: nessun campo può presentarsi vuoto all'utente.
  for (const p of PARAMETRI_CALCOLO) {
    vero(`il parametro "${p.chiave}" ha un default utilizzabile`, Number.isFinite(parametroDefault(base, p.chiave)), String(parametroDefault(base, p.chiave)));
    vero(`il parametro "${p.chiave}" dichiara unità e fonte`, Boolean(p.unita && p.fonte));
    const d = parametroDefault(base, p.chiave);
    vero(`il default di "${p.chiave}" rientra nei limiti dichiarati`, d >= p.min && d <= p.max, `${d} fuori da [${p.min}, ${p.max}]`);
  }

  // Un parametro sovrascritto deve davvero entrare nel calcolo.
  // Ricambi d'aria raddoppiati (0,5 → 1,0 vol/h): la ventilazione invernale
  // passa da 201,96 a 403,92 W, cioè esattamente il doppio.
  const conRicambi = calcolaAmbienteConOverride({ ...base, parametri: { ricambiAriaOra: 1.0 } }, COMUNE);
  uguale("il ricambio d'aria inserito raddoppia la ventilazione", conRicambi.scomposizioneInvernale.ventilazioneKw, r0.scomposizioneInvernale.ventilazioneKw * 2, 1e-9);

  // Schermatura solare totale (1,0 anziché 0,5): l'apporto solare raddoppia.
  const conTende = calcolaAmbienteConOverride({ ...base, parametri: { fattoreSchermaturaSolare: 1 } }, COMUNE);
  uguale("il fattore di schermatura inserito raddoppia l'apporto solare", conTende.scomposizioneEstiva.solareKw, r0.scomposizioneEstiva.solareKw * 2, 1e-9);

  // Margine di sicurezza azzerato: il carico estivo cala esattamente di 1/1,10.
  const senzaMargine = calcolaAmbienteConOverride({ ...base, parametri: { margineSicurezzaEstivo: 0 } }, COMUNE);
  uguale("il margine di sicurezza inserito agisce sul totale estivo", senzaMargine.estivoKw, r0.estivoKw / 1.1, 1e-9);

  // Temperatura interna invernale 22 °C anziché 20: ΔT da 22 a 24 K, +9,09%.
  const piuCaldo = calcolaAmbienteConOverride({ ...base, parametri: { tempInternaInvernale: 22 } }, COMUNE);
  uguale("la temperatura interna inserita agisce sul ΔT", piuCaldo.invernaleKw, (r0.invernaleKw * 24) / 22, 1e-9);

  // Un ambiente con parametri propri va segnalato come calcolo non standard.
  vero("i parametri sovrascritti rendono il calcolo non standard", conRicambi.nonStandard === true);
  vero("senza sovrascritture il calcolo resta standard", r0.nonStandard === false);

  // Le costanti fisiche NON devono essere sovrascrivibili.
  const chiavi = PARAMETRI_CALCOLO.map((p) => p.chiave);
  for (const fisica of ["capacitaTermicaAria", "coeffCaloreLatente", "caloreSpecificoAcqua"]) {
    vero(`la costante fisica "${fisica}" non è fra i parametri modificabili`, !chiavi.includes(fisica));
  }
  // Una costante fisica "sovrascritta" per errore non deve avere effetto.
  const tentativo = calcolaAmbienteConOverride({ ...base, parametri: { capacitaTermicaAria: 99 } }, COMUNE);
  uguale("la fisica non si piega da un campo di input", tentativo.scomposizioneInvernale.ventilazioneKw, r0.scomposizioneInvernale.ventilazioneKw, 1e-9);
}

// ---------------------------------------------------------------------
// COERENZA INTERNA DELLE TABELLE NORMATIVE
//
// Non sostituiscono il riscontro sui prospetti UNI, che richiede le norme
// alla mano. Intercettano però l'errore più probabile e più insidioso —
// una cifra sbagliata durante una trascrizione — perché ogni tabella ha
// un andamento fisico obbligato: se si rompe, il dato è errato.
// ---------------------------------------------------------------------
{
  const epoche = ["ante-1975", "1976-1990", "1991-2005", "2006-2015", "post-2015"];

  // Le trasmittanze devono calare a ogni epoca costruttiva: ogni norma
  // sull'isolamento è stata più severa della precedente.
  for (const componente of ["muro", "tetto", "pavimento", "vetro"]) {
    let monotona = true;
    for (let i = 1; i < epoche.length; i++) {
      if (!(TRASMITTANZE_PER_EPOCA[epoche[i]][componente] < TRASMITTANZE_PER_EPOCA[epoche[i - 1]][componente])) monotona = false;
    }
    vero(`trasmittanze del ${componente} decrescenti per epoca`, monotona);
  }

  // Anche l'incidenza dei ponti termici cala con l'isolamento continuo.
  let pontiMonotoni = true;
  for (let i = 1; i < epoche.length; i++) {
    if (!(MAGGIORAZIONE_PONTI_TERMICI_PER_EPOCA[epoche[i]] < MAGGIORAZIONE_PONTI_TERMICI_PER_EPOCA[epoche[i - 1]])) pontiMonotoni = false;
  }
  vero("maggiorazione ponti termici decrescente per epoca", pontiMonotoni);

  // Bagni e cucine richiedono più ricambi di camere e soggiorni.
  vero("ricambi d'aria: bagno ≥ cucina ≥ soggiorno", RICAMBI_ARIA_PER_TIPO_LOCALE.bagno >= RICAMBI_ARIA_PER_TIPO_LOCALE.cucina && RICAMBI_ARIA_PER_TIPO_LOCALE.cucina >= RICAMBI_ARIA_PER_TIPO_LOCALE.soggiorno);

  // Le ore convenzionali di riscaldamento crescono da zona A a zona F.
  const zone = ["A", "B", "C", "D", "E", "F"];
  let zoneMonotone = true;
  for (let i = 1; i < zone.length; i++) {
    if (!(ZONE_CLIMATICHE[zone[i]].oreRiscaldamento > ZONE_CLIMATICHE[zone[i - 1]].oreRiscaldamento)) zoneMonotone = false;
  }
  vero("ore di riscaldamento crescenti da zona A a zona F", zoneMonotone);

  // D'inverno il nord disperde più del sud: il fattore correttivo lo riflette.
  vero("fattore esposizione: nord più sfavorevole del sud", FATTORE_ESPOSIZIONE.nord > FATTORE_ESPOSIZIONE.sud);

  // Le efficienze stagionali crescono con la classe energetica.
  const classi = ["A", "A+", "A++", "A+++"];
  let effMonotone = true;
  for (let i = 1; i < classi.length; i++) {
    if (!(EFFICIENZA_PER_CLASSE[classi[i]].seer > EFFICIENZA_PER_CLASSE[classi[i - 1]].seer)) effMonotone = false;
    if (!(EFFICIENZA_PER_CLASSE[classi[i]].scop > EFFICIENZA_PER_CLASSE[classi[i - 1]].scop)) effMonotone = false;
  }
  vero("SEER e SCOP crescenti con la classe energetica", effMonotone);

  // Gli elenchi di taglie commerciali devono essere ordinati e senza doppioni,
  // altrimenti la ricerca della prima taglia utile restituisce il valore sbagliato.
  for (const [nome, taglie] of [["climatizzatori", TAGLIE_COMMERCIALI_BTU], ["bollitori", TAGLIE_BOLLITORE_STANDARD]]) {
    const ordinate = taglie.every((t, i) => i === 0 || t > taglie[i - 1]);
    vero(`taglie ${nome} ordinate e senza duplicati`, ordinate, taglie.join(", "));
  }
}

// ---------------------------------------------------------------------
// ESITO
// ---------------------------------------------------------------------
console.log(`\nVerifica del motore di calcolo — ${passati} controlli superati, ${falliti.length} falliti\n`);

if (falliti.length > 0) {
  for (const f of falliti) {
    console.error(`  ✗ ${f.descrizione}`);
    console.error(`      atteso  ${f.atteso}${f.tolleranza ? ` (± ${f.tolleranza})` : ""}`);
    console.error(`      ottenuto ${f.ottenuto}\n`);
  }
  console.error("Un valore atteso che cambia significa che il calcolo si è allontanato");
  console.error("dalla derivazione scritta a mano nei commenti: va spiegato, non riallineato.\n");
  process.exit(1);
}

console.log("Tutti i controlli superati.\n");
