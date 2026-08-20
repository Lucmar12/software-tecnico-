/**
 * riepilogoProdotti.js — Costruisce, a partire dal dimensionamento già
 * calcolato di ogni categoria attivata, l'elenco strutturato delle
 * proposte prodotto usato sia dal riepilogo "Prodotto consigliato" (una
 * card per categoria, un solo prodotto in cima) sia dal form "Richiedi
 * preventivo" (elenco cumulativo selezionabile, prodotto in cima +
 * alternative). Punto di ingresso unico per non duplicare — e non far
 * divergere — la logica di abbinamento prodotto tra le due modalità
 * d'uso e tra relazione tecnica e riepilogo commerciale.
 */
import { calcolaBollitore } from "../data/calculations.js";
import {
  trovaProdottiConsigliati,
  trovaBollitoriConsigliati,
  trovaFotovoltaicoConsigliati,
  trovaPannelliSolariConsigliati,
  trovaAddolcitoriConsigliati,
  trovaPompeConsigliate,
  trovaScaldacquaPdCConsigliati,
} from "../data/catalogo.js";
import { calcolaDimensionamentoVRF } from "./vrf.js";
import { calcolaDimensionamentoChiller } from "./chiller.js";
import { calcolaAddolcitore } from "./addolcitore.js";
import { calcolaAutoclave, calcolaSollevamento, calcolaCircolazione } from "./pompeIdrauliche.js";
import { calcolaPotenzaPompaCaloreAcs } from "./pompaDiCaloreAcs.js";
import { calcolaPotenzaNominaleRichiesta } from "./deratingPompaDiCalore.js";
import {
  specificaClimatizzatore,
  specificaBollitore,
  specificaScaldacquaPdC,
  specificaFotovoltaico,
  specificaSolareTermico,
  specificaAddolcitore,
  specificaPompa,
} from "./specificheProdotto.js";

function voceDaRisultato(chiave, icona, titolo, { consigliati, messaggio }, specificaFn) {
  const prodotto = consigliati[0] || null;
  return {
    chiave,
    icona,
    titolo,
    prodotto,
    alternative: consigliati.slice(1),
    specifica: prodotto ? specificaFn(prodotto) : null,
    messaggio,
  };
}

/**
 * Calcola l'elenco delle voci di riepilogo prodotto, una per ciascun
 * "acquisto" distinto richiesto dal progetto (es. pompe idrauliche può
 * generare più voci: autoclave, sollevamento, circolazione, ciascuna un
 * prodotto fisico separato da scegliere).
 *
 * @param {object} scenario  Scenario con `edificio` già calcolato (il
 *   primo/unico rilevante per il riepilogo prodotto — con più scenari a
 *   confronto la proposta commerciale si basa su quello attivo).
 */
export function calcolaVociRiepilogoProdotti({ tipiImpianto, scenario, comune, acs, sistemaCentralizzato, solareTermico, fotovoltaico, trattamentoAcque, pompeIdrauliche }) {
  const voci = [];

  if (tipiImpianto.climatizzazione && scenario) {
    const edificio = scenario.edificio;
    const fabbisognoDimensionamento = Math.max(edificio.totaleInvernaleKw, edificio.totaleEstivoKw);
    const centralizzatoAttivo = sistemaCentralizzato?.tipo !== "nessuno" && edificio.risultatiAmbienti.length >= 2;

    let risultatoClima;
    if (centralizzatoAttivo && sistemaCentralizzato.tipo === "vrf") {
      const d = calcolaDimensionamentoVRF(edificio.risultatiAmbienti, sistemaCentralizzato, comune?.teInv);
      risultatoClima = trovaProdottiConsigliati(d.potenzaNominaleRichiestaKw, "vrf", d.numeroUnitaInterne);
    } else if (centralizzatoAttivo && sistemaCentralizzato.tipo === "chiller") {
      const d = calcolaDimensionamentoChiller(edificio.risultatiAmbienti, sistemaCentralizzato, comune?.teInv);
      risultatoClima = trovaProdottiConsigliati(d.potenzaNominaleRichiestaKw, "chiller");
    } else {
      risultatoClima = trovaProdottiConsigliati(fabbisognoDimensionamento, "climatizzatore_split");
    }
    voci.push(voceDaRisultato("climatizzazione", "❄️", "Climatizzazione", risultatoClima, specificaClimatizzatore));

    if (fotovoltaico?.attivo) {
      voci.push(voceDaRisultato("fotovoltaico", "☀️", "Fotovoltaico", trovaFotovoltaicoConsigliati(fotovoltaico.kWp), specificaFotovoltaico));
    }
  }

  if (tipiImpianto.acs) {
    const bollitore = calcolaBollitore(acs.numeroPersone, acs.abitudine);
    const generatore = acs.generatore || "elettrico";

    if (generatore === "elettrico") {
      voci.push(voceDaRisultato("acs", "🚿", "Acqua calda sanitaria", trovaBollitoriConsigliati(bollitore.litriConsigliati), specificaBollitore));
    } else if (generatore === "pompa_di_calore_integrata") {
      const potenza = calcolaPotenzaPompaCaloreAcs({ capacitaLitri: bollitore.litriConsigliati, tempoRicaricaOre: acs.tempoRicaricaOre, cop: acs.cop });
      voci.push(
        voceDaRisultato(
          "acs",
          "🚿",
          "Acqua calda sanitaria",
          trovaScaldacquaPdCConsigliati(bollitore.litriConsigliati, potenza.potenzaTermicaRichiestaKw),
          specificaScaldacquaPdC
        )
      );
    } else {
      // pompa_di_calore_dedicata: unità esterna aria-acqua, con derating per temperatura di progetto, da abbinare a un accumulo puro.
      const potenza = calcolaPotenzaPompaCaloreAcs({ capacitaLitri: bollitore.litriConsigliati, tempoRicaricaOre: acs.tempoRicaricaOre, cop: acs.cop });
      const derating = comune?.teInv != null ? calcolaPotenzaNominaleRichiesta(potenza.potenzaTermicaRichiestaKw, comune.teInv) : null;
      const potenzaRicerca = derating ? derating.potenzaNominaleRichiestaKw : potenza.potenzaTermicaRichiestaKw;
      voci.push(
        voceDaRisultato("acs", "🚿", "Acqua calda sanitaria — pompa di calore", trovaProdottiConsigliati(potenzaRicerca, "pompa_di_calore_aria_acqua"), specificaClimatizzatore)
      );
      voci.push(voceDaRisultato("acs-accumulo", "🚿", "Acqua calda sanitaria — accumulo dedicato", trovaBollitoriConsigliati(bollitore.litriConsigliati), specificaBollitore));
    }

    if (solareTermico?.attivo) {
      voci.push(voceDaRisultato("solare-termico", "🌤️", "Solare termico", trovaPannelliSolariConsigliati(bollitore.litriConsigliati), specificaSolareTermico));
    }
  }

  if (tipiImpianto.trattamentoAcque && trattamentoAcque) {
    const addolcitore = calcolaAddolcitore(trattamentoAcque);
    voci.push(
      voceDaRisultato("trattamento-acque", "💧", "Trattamento acque", trovaAddolcitoriConsigliati(addolcitore.volumeResinaRichiestoLitri, addolcitore.portataPuntaMc), specificaAddolcitore)
    );
  }

  if (tipiImpianto.pompeIdrauliche && pompeIdrauliche) {
    const autoclave = calcolaAutoclave(pompeIdrauliche.autoclave);
    voci.push(voceDaRisultato("autoclave", "🔧", "Autoclave", trovaPompeConsigliate("autoclave", autoclave.portataPuntaMc, autoclave.prevalenzaM), specificaPompa));

    if (pompeIdrauliche.sollevamento?.attivo) {
      const sollevamento = calcolaSollevamento(pompeIdrauliche.sollevamento);
      voci.push(
        voceDaRisultato("sollevamento", "🔧", "Pompa di sollevamento", trovaPompeConsigliate("pompa_sollevamento", pompeIdrauliche.sollevamento.portataMc, sollevamento.prevalenzaM), specificaPompa)
      );
    }
    if (pompeIdrauliche.circolazione?.attivo) {
      const circolazione = calcolaCircolazione(pompeIdrauliche.circolazione);
      voci.push(
        voceDaRisultato("circolazione", "🔧", "Pompa di circolazione", trovaPompeConsigliate("pompa_circolazione", circolazione.portataRicircoloMc, circolazione.prevalenzaM), specificaPompa)
      );
    }
  }

  return voci;
}

/** Appiattisce le voci di riepilogo nell'elenco di prodotti selezionabili per "Richiedi preventivo" (prodotto in cima + alternative). */
export function prodottiSelezionabiliDaVoci(voci) {
  return voci.flatMap((v) => (v.prodotto ? [v.prodotto, ...v.alternative] : []));
}
