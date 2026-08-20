import React, { useState } from "react";
import DettaglioCalcolo from "./DettaglioCalcolo.jsx";
import ProdottiCards from "./ProdottiCards.jsx";
import RichiediPreventivo from "./RichiediPreventivo.jsx";
import DisclaimerBox, { FooterBranding } from "./DisclaimerBox.jsx";
import IntestazioneStampa from "./IntestazioneStampa.jsx";
import VRFDettaglio from "./VRFDettaglio.jsx";
import ChillerDettaglio from "./ChillerDettaglio.jsx";
import SolareTermicoDettaglio from "./SolareTermicoDettaglio.jsx";
import FotovoltaicoDettaglio from "./FotovoltaicoDettaglio.jsx";
import PompaCaloreAcsDettaglio from "./PompaCaloreAcsDettaglio.jsx";
import AddolcitoreDettaglio from "./AddolcitoreDettaglio.jsx";
import PompeIdraulicheDettaglio from "./PompeIdraulicheDettaglio.jsx";
import { calcolaBollitore, ZONE_CLIMATICHE } from "../data/calculations.js";
import {
  trovaBollitoriConsigliati,
  trovaProdottiConsigliati,
  trovaFotovoltaicoConsigliati,
  trovaPannelliSolariConsigliati,
  trovaAddolcitoriConsigliati,
  trovaPompeConsigliate,
} from "../data/catalogo.js";
import { calcolaDimensionamentoVRF } from "../utils/vrf.js";
import { calcolaDimensionamentoChiller } from "../utils/chiller.js";
import { formattaKw, formattaBtu } from "../utils/export.js";
import { calcolaAddolcitore } from "../utils/addolcitore.js";
import { calcolaAutoclave, calcolaSollevamento, calcolaCircolazione } from "../utils/pompeIdrauliche.js";

const EDIFICIO_VUOTO = {
  risultatiAmbienti: [],
  totaleInvernaleKw: 0,
  totaleEstivoKw: 0,
  totaleInvernaleBtu: 0,
  totaleEstivoBtu: 0,
  superficieTotale: 0,
};

/**
 * Output della modalità Venditore/Installatore: fabbisogno sintetico,
 * dettaglio calcolo collassato di default, card prodotto grandi e
 * visive con prezzo in vista, form di richiesta preventivo in primo
 * piano — pensato come documento da lasciare al cliente. Mostra solo i
 * blocchi (climatizzazione, ACS, trattamento acque, pompe idrauliche)
 * effettivamente richiesti.
 */
export default function PreventivoView({ scenario, comune, acs, branding, tipiImpianto, sistemaCentralizzato, solareTermico, fotovoltaico, trattamentoAcque, pompeIdrauliche, modalita }) {
  const [selezionati, setSelezionati] = useState([]);
  const mostraClima = tipiImpianto.climatizzazione;
  const mostraAcs = tipiImpianto.acs;
  const mostraTrattamentoAcque = tipiImpianto.trattamentoAcque;
  const mostraPompeIdrauliche = tipiImpianto.pompeIdrauliche;
  const edificio = mostraClima && scenario ? scenario.edificio : EDIFICIO_VUOTO;
  const oreFunzionamento = comune ? ZONE_CLIMATICHE[comune.zona].oreRiscaldamento * 120 : 0; // stima ore/anno su periodo convenzionale

  function toggleSelezione(p) {
    const chiave = `${p.marchio}|${p.modello}`;
    setSelezionati((prev) => (prev.includes(chiave) ? prev.filter((c) => c !== chiave) : [...prev, chiave]));
  }

  const bollitore = calcolaBollitore(acs.numeroPersone, acs.abitudine);
  const { consigliati: bollitoriConsigliati } = trovaBollitoriConsigliati(bollitore.litriConsigliati);

  // Il climatizzatore va dimensionato sul maggiore tra fabbisogno invernale ed estivo (serve entrambe le stagioni).
  const fabbisognoDimensionamento = Math.max(edificio.totaleInvernaleKw, edificio.totaleEstivoKw);

  const centralizzatoAttivo = mostraClima && sistemaCentralizzato?.tipo !== "nessuno" && edificio.risultatiAmbienti.length >= 2;
  const vrfDimensionamento =
    centralizzatoAttivo && sistemaCentralizzato.tipo === "vrf" ? calcolaDimensionamentoVRF(edificio.risultatiAmbienti, sistemaCentralizzato, comune?.teInv) : null;
  const chillerDimensionamento =
    centralizzatoAttivo && sistemaCentralizzato.tipo === "chiller" ? calcolaDimensionamentoChiller(edificio.risultatiAmbienti, sistemaCentralizzato, comune?.teInv) : null;

  const tipoProdottoClima = vrfDimensionamento ? "vrf" : chillerDimensionamento ? "chiller" : "climatizzatore_split";
  const fabbisognoProdottoClima = vrfDimensionamento
    ? vrfDimensionamento.potenzaNominaleRichiestaKw
    : chillerDimensionamento
    ? chillerDimensionamento.potenzaNominaleRichiestaKw
    : fabbisognoDimensionamento;

  const prodottiClimatizzazione = mostraClima
    ? trovaProdottiConsigliati(fabbisognoProdottoClima, tipoProdottoClima, vrfDimensionamento?.numeroUnitaInterne).consigliati
    : [];

  const addolcitore = mostraTrattamentoAcque ? calcolaAddolcitore(trattamentoAcque) : null;
  const addolcitoriConsigliati = addolcitore ? trovaAddolcitoriConsigliati(addolcitore.volumeResinaRichiestoLitri, addolcitore.portataPuntaMc).consigliati : [];

  const autoclaveDimensionamento = mostraPompeIdrauliche ? calcolaAutoclave(pompeIdrauliche.autoclave) : null;
  const autoclaviConsigliate = autoclaveDimensionamento
    ? trovaPompeConsigliate("autoclave", autoclaveDimensionamento.portataPuntaMc, autoclaveDimensionamento.prevalenzaM).consigliati
    : [];
  const sollevamentoConsigliate =
    mostraPompeIdrauliche && pompeIdrauliche.sollevamento?.attivo
      ? trovaPompeConsigliate("pompa_sollevamento", pompeIdrauliche.sollevamento.portataMc, calcolaSollevamento(pompeIdrauliche.sollevamento).prevalenzaM).consigliati
      : [];
  const circolazioneConsigliate =
    mostraPompeIdrauliche && pompeIdrauliche.circolazione?.attivo
      ? (() => {
          const c = calcolaCircolazione(pompeIdrauliche.circolazione);
          return trovaPompeConsigliate("pompa_circolazione", c.portataRicircoloMc, c.prevalenzaM).consigliati;
        })()
      : [];

  const tuttiProdottiSelezionabili = [
    ...prodottiClimatizzazione,
    ...(mostraClima && fotovoltaico?.attivo ? trovaFotovoltaicoConsigliati(fotovoltaico.kWp).consigliati : []),
    ...(mostraAcs ? bollitoriConsigliati : []),
    ...(mostraAcs && solareTermico?.attivo ? trovaPannelliSolariConsigliati(bollitore.litriConsigliati).consigliati : []),
    ...addolcitoriConsigliati,
    ...autoclaviConsigliate,
    ...sollevamentoConsigliate,
    ...circolazioneConsigliate,
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <p className="text-xs text-slate-400">
          Stampa o esporta in PDF il riepilogo da lasciare al cliente
          {[mostraClima && "fabbisogno e prodotti consigliati", mostraAcs && "ACS", mostraTrattamentoAcque && "trattamento acque", mostraPompeIdrauliche && "pompe idrauliche"]
            .filter(Boolean)
            .reduce((acc, cat, i, arr) => acc + (i === 0 ? ` (${cat}` : i === arr.length - 1 ? ` e ${cat})` : `, ${cat}`), "")}
          .
        </p>
        <button
          onClick={() => window.print()}
          className="shrink-0 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          🖨️ Stampa / Esporta per il cliente (PDF)
        </button>
      </div>

      <IntestazioneStampa branding={branding} comune={comune} titolo="Riepilogo dimensionamento" sottotitolo="Proposta di climatizzazione residenziale" />

      {mostraClima && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="text-sm text-slate-400">Fabbisogno stimato — {comune.nome}</div>
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 mt-1">
            <div className="border-l-4 border-sky-500 pl-3">
              <span className="text-3xl font-extrabold text-brand-700 tabular-nums">{formattaKw(edificio.totaleInvernaleKw)}</span>
              {!centralizzatoAttivo && <span className="text-slate-400 text-sm ml-2">({formattaBtu(edificio.totaleInvernaleBtu)})</span>}
              <span className="text-slate-400 text-sm ml-2">— riscaldamento</span>
            </div>
            <div className="border-l-4 border-amber-500 pl-3">
              <span className="text-3xl font-extrabold text-brand-700 tabular-nums">{formattaKw(edificio.totaleEstivoKw)}</span>
              {!centralizzatoAttivo && <span className="text-slate-400 text-sm ml-2">({formattaBtu(edificio.totaleEstivoBtu)})</span>}
              <span className="text-slate-400 text-sm ml-2">— raffrescamento</span>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {edificio.risultatiAmbienti.map((r) => (
              <DettaglioCalcolo key={r.ambiente.id} risultato={r} comune={comune} defaultOpen={false} mostraBtu={!centralizzatoAttivo} />
            ))}
          </div>
        </div>
      )}

      {mostraClima && (
        <div>
          <h3 className="font-bold text-slate-800 mb-3">
            Prodotti consigliati — {tipoProdottoClima === "vrf" ? "sistema VRF" : tipoProdottoClima === "chiller" ? "chiller" : "climatizzazione"}
          </h3>
          <ProdottiCards
            fabbisognoKw={fabbisognoProdottoClima}
            oreFunzionamento={oreFunzionamento}
            tipo={tipoProdottoClima}
            numeroUnitaRichieste={vrfDimensionamento?.numeroUnitaInterne}
            selezionati={selezionati}
            onToggleSelezione={toggleSelezione}
          />
        </div>
      )}

      {mostraClima && scenario && <VRFDettaglio risultatiAmbienti={edificio.risultatiAmbienti} sistemaCentralizzato={sistemaCentralizzato} comune={comune} mostraCatalogo={false} compatto />}
      {mostraClima && scenario && <ChillerDettaglio risultatiAmbienti={edificio.risultatiAmbienti} sistemaCentralizzato={sistemaCentralizzato} comune={comune} mostraCatalogo={false} compatto />}
      {mostraClima && scenario && <FotovoltaicoDettaglio edificio={edificio} comune={comune} fotovoltaico={fotovoltaico} />}

      {mostraAcs && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-bold text-slate-800 mb-2">Acqua calda sanitaria</h3>
          <p className="text-sm text-slate-600">
            Fabbisogno stimato: <strong>{bollitore.litriGiorno.toFixed(0)} l/giorno</strong> → bollitore consigliato{" "}
            <strong>{bollitore.taglia ? `${bollitore.taglia} L` : bollitore.messaggio}</strong>
          </p>
        </div>
      )}

      {mostraAcs && <PompaCaloreAcsDettaglio acs={acs} comune={comune} />}

      {mostraAcs && <SolareTermicoDettaglio acs={acs} solareTermico={solareTermico} />}

      {mostraTrattamentoAcque && <AddolcitoreDettaglio trattamentoAcque={trattamentoAcque} modalita={modalita} />}

      {mostraPompeIdrauliche && <PompeIdraulicheDettaglio pompeIdrauliche={pompeIdrauliche} modalita={modalita} />}

      <div className="no-print">
        <RichiediPreventivo
          prodottiConsigliati={tuttiProdottiSelezionabili}
          edificio={edificio}
          comune={comune}
          branding={branding}
          modalita="venditore"
          evidenziato={true}
        />
      </div>

      <DisclaimerBox />
      <FooterBranding nomeAzienda={branding.nomeAzienda} />
    </div>
  );
}
