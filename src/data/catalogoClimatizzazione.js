/**
 * catalogoClimatizzazione.js — Converte la gamma AUX (data/gammaAux.js)
 * nello schema del catalogo prodotti.
 *
 * La conversione è codice e non una seconda trascrizione: capacità,
 * prezzi e codici restano scritti una sola volta, nel file che riporta il
 * listino. Aggiornare il listino significa toccare solo quello.
 *
 * Corrispondenza fra gamma e tipi del catalogo:
 *   monosplit e light commercial  → "climatizzatore_split" (una interna,
 *                                    una esterna dedicata)
 *   unità esterne multisplit      → "vrf" (un'esterna per più interne,
 *                                    con numero massimo di attacchi)
 *   unità interne multisplit      → "unita_interna_multi", usate per
 *                                    comporre il prezzo dell'impianto
 */
import {
  MARCHIO_AUX,
  LISTINO_AUX,
  MONOSPLIT_AUX,
  LIGHT_COMMERCIAL_AUX,
  UNITA_INTERNE_MULTI_AUX,
  UNITA_ESTERNE_MULTI_AUX,
  capacitaGarantita,
  prezzoSistema,
  livelloDiGamma,
  LIVELLI_ESTERNA_MULTI,
} from "./gammaAux.js";
import { kwToBtu } from "./calculations.js";

/**
 * Classe energetica di confronto: il listino dichiara SEER e SCOP con
 * scale separate (es. SCOP "A++/A+++" per clima medio e caldo). Per
 * ordinare i prodotti si usa la classe SEER, che è un valore unico.
 */
function classeDiConfronto(unita) {
  return unita.classeSeer;
}

/** Un monosplit o una macchina light commercial: unità interna + esterna dedicata. */
function daSistemaCompleto(unita, tipologiaTerminale) {
  const capacitaKw = capacitaGarantita(unita);
  const prezzo = prezzoSistema(unita);
  return {
    marchio: MARCHIO_AUX,
    modello: unita.modello,
    tipo: "climatizzatore_split",
    tipologiaTerminale,
    serie: unita.serie,
    livello: livelloDiGamma(unita.serie),
    // Taglia commerciale in migliaia di BTU/h, come la chiama il listino.
    tagliaCommerciale: unita.taglia,
    potenzaBtu: Math.round(kwToBtu(capacitaKw)),
    potenzaKw: capacitaKw,
    potenzaFreddoKw: unita.freddoKw,
    potenzaCaldoKw: unita.caldoKw,
    capacitaLitri: null,
    classeEnergetica: classeDiConfronto(unita),
    classeScop: unita.classeScop,
    seer: null,
    scop: null,
    codiceUnitaInterna: unita.codiceInterna,
    codiceUnitaEsterna: unita.codiceEsterna,
    prezzoUnitaInterna: unita.prezzoInterna,
    prezzoUnitaEsterna: unita.prezzoEsterna,
    prezzoIndicativoMin: prezzo,
    prezzoIndicativoMax: prezzo,
    alimentazioneTrifase: Boolean(unita.trifase),
    schedaTecnicaUrl: "",
    note: `${LISTINO_AUX}. Resa ${unita.freddoKw} kW in freddo e ${unita.caldoKw} kW in caldo; prezzo di sistema = unità interna ${unita.prezzoInterna} € + unità esterna ${unita.prezzoEsterna} €.${
      unita.trifase ? " Alimentazione trifase." : ""
    }`,
  };
}

/** Unità esterna multisplit: serve più unità interne, quindi entra come sistema centralizzato. */
function daUnitaEsternaMulti(unita) {
  const capacitaKw = capacitaGarantita(unita);
  return {
    marchio: MARCHIO_AUX,
    modello: `${unita.modello} ${unita.classe}`,
    tipo: "vrf",
    tipologiaTerminale: null,
    serie: "Multisplit",
    livello: LIVELLI_ESTERNA_MULTI.find((l) => l.classe === unita.classe)?.valore ?? null,
    tagliaCommerciale: null,
    potenzaBtu: null,
    potenzaKw: capacitaKw,
    potenzaFreddoKw: unita.freddoKw,
    potenzaCaldoKw: unita.caldoKw,
    capacitaLitri: null,
    maxUnitaInterne: unita.attacchi,
    classeEnergetica: unita.classe,
    classeScop: null,
    seer: null,
    scop: null,
    codiceUnitaEsterna: unita.codice,
    prezzoUnitaEsterna: unita.prezzo,
    prezzoIndicativoMin: unita.prezzo,
    prezzoIndicativoMax: unita.prezzo,
    schedaTecnicaUrl: "",
    note: `${LISTINO_AUX}. Fino a ${unita.attacchi} unità interne collegabili; resa ${unita.freddoKw} kW in freddo e ${unita.caldoKw} kW in caldo. Prezzo della sola unità esterna: le interne si sommano a parte.`,
  };
}

/** Unità interna di un multisplit: da sola non è un impianto, serve a comporre il prezzo. */
function daUnitaInternaMulti(unita) {
  const capacitaKw = capacitaGarantita(unita);
  return {
    marchio: MARCHIO_AUX,
    modello: unita.modello,
    tipo: "unita_interna_multi",
    tipologiaTerminale: unita.tipologia,
    serie: unita.serie,
    livello: livelloDiGamma(unita.serie),
    tagliaCommerciale: unita.taglia,
    potenzaBtu: Math.round(kwToBtu(capacitaKw)),
    potenzaKw: capacitaKw,
    potenzaFreddoKw: unita.freddoKw,
    potenzaCaldoKw: unita.caldoKw,
    capacitaLitri: null,
    // La classe energetica di una interna multisplit non è dichiarata a
    // listino: dipende dall'unità esterna a cui viene collegata.
    classeEnergetica: null,
    classeScop: null,
    seer: null,
    scop: null,
    codiceUnitaInterna: unita.codiceInterna,
    prezzoUnitaInterna: unita.prezzo,
    prezzoIndicativoMin: unita.prezzo,
    prezzoIndicativoMax: unita.prezzo,
    schedaTecnicaUrl: "",
    note: `${LISTINO_AUX}. Unità interna per sistema multisplit: va abbinata a un'unità esterna con attacchi sufficienti.`,
  };
}

export const PRODOTTI_CLIMATIZZAZIONE_AUX = [
  ...MONOSPLIT_AUX.map((u) => daSistemaCompleto(u, "parete")),
  ...LIGHT_COMMERCIAL_AUX.map((u) => daSistemaCompleto(u, u.tipologia)),
  ...UNITA_ESTERNE_MULTI_AUX.map(daUnitaEsternaMulti),
  ...UNITA_INTERNE_MULTI_AUX.map(daUnitaInternaMulti),
];
