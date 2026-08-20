import React from "react";
import DettaglioCalcolo from "./DettaglioCalcolo.jsx";
import AnalisiCritica from "./AnalisiCritica.jsx";
import CatalogoTabella from "./CatalogoTabella.jsx";
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
import RiepilogoSceltaProdotti from "./RiepilogoSceltaProdotti.jsx";
import { calcolaBollitore, ZONE_CLIMATICHE } from "../data/calculations.js";
import { trovaBollitoriConsigliati } from "../data/catalogo.js";
import { stimaConsumoAnnuoClimatizzazione } from "../utils/fotovoltaico.js";
import { calcolaCO2Annua } from "../utils/co2.js";
import { formattaKw, formattaBtu } from "../utils/export.js";
import { calcolaVociRiepilogoProdotti, prodottiSelezionabiliDaVoci } from "../utils/riepilogoProdotti.js";

const EDIFICIO_VUOTO = {
  risultatiAmbienti: [],
  totaleInvernaleKw: 0,
  totaleEstivoKw: 0,
  totaleInvernaleBtu: 0,
  totaleEstivoBtu: 0,
  superficieTotale: 0,
};

/**
 * Output della modalità Ingegnere/Tecnico: "Relazione di calcolo"
 * esportabile/stampabile, con ogni passaggio, coefficiente e riferimento
 * normativo in primo piano. Il prodotto a catalogo compare come tabella
 * tecnica comparativa, non come proposta commerciale. Mostra solo i
 * blocchi (climatizzazione, ACS, trattamento acque, pompe idrauliche)
 * effettivamente richiesti.
 */
export default function RelazioneCalcolo({ scenari, comune, acs, branding, tipiImpianto, sistemaCentralizzato, solareTermico, fotovoltaico, trattamentoAcque, pompeIdrauliche, modalita }) {
  const mostraClima = tipiImpianto.climatizzazione;
  const mostraAcs = tipiImpianto.acs;
  const mostraTrattamentoAcque = tipiImpianto.trattamentoAcque;
  const mostraPompeIdrauliche = tipiImpianto.pompeIdrauliche;

  const vociRiepilogo = calcolaVociRiepilogoProdotti({
    tipiImpianto,
    scenario: scenari[0] || null,
    comune,
    acs,
    sistemaCentralizzato,
    solareTermico,
    fotovoltaico,
    trattamentoAcque,
    pompeIdrauliche,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <p className="text-xs text-slate-400">
          La relazione include il dettaglio di calcolo di ogni categoria attivata
          {[mostraClima && "climatizzazione", mostraAcs && "ACS", mostraTrattamentoAcque && "trattamento acque", mostraPompeIdrauliche && "pompe idrauliche"]
            .filter(Boolean)
            .reduce((acc, cat, i, arr) => acc + (i === 0 ? ` (${cat}` : i === arr.length - 1 ? ` e ${cat})` : `, ${cat}`), "")}
          , con i riferimenti normativi. Usa il pulsante per esportarla in PDF o stamparla.
        </p>
        <button
          onClick={() => window.print()}
          className="shrink-0 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          🖨️ Stampa / Esporta relazione (PDF)
        </button>
      </div>

      <IntestazioneStampa branding={branding} comune={comune} titolo="Relazione di calcolo" sottotitolo="Dimensionamento impianto — modalità Ingegnere/Tecnico" />

      <RiepilogoSceltaProdotti voci={vociRiepilogo} />

      {mostraClima &&
        scenari.map((scenario) => {
          const mostraSplit = sistemaCentralizzato.tipo === "nessuno" || scenario.edificio.risultatiAmbienti.length < 2;
          return (
          <section key={scenario.id} className="space-y-4 print-break">
            <h2 className="text-xl font-bold text-slate-800">Scenario: {scenario.nome}</h2>

            <div className="grid sm:grid-cols-4 gap-3">
              <RiepilogoCard accento="invernale" label="Fabbisogno invernale totale" value={formattaKw(scenario.edificio.totaleInvernaleKw)} sotto={mostraSplit ? formattaBtu(scenario.edificio.totaleInvernaleBtu) : null} />
              <RiepilogoCard accento="estivo" label="Fabbisogno estivo totale" value={formattaKw(scenario.edificio.totaleEstivoKw)} sotto={mostraSplit ? formattaBtu(scenario.edificio.totaleEstivoBtu) : null} />
              <RiepilogoCard accento="superficie" label="Superficie totale" value={`${scenario.edificio.superficieTotale.toFixed(1)} m²`} sotto={`Zona ${comune.zona} — ${ZONE_CLIMATICHE[comune.zona].oreRiscaldamento} h/giorno, ${ZONE_CLIMATICHE[comune.zona].periodo}`} />
              <RiepilogoCard accento="co2" label="CO2 stimata" value={`${Math.round(calcolaCO2Annua(stimaConsumoAnnuoClimatizzazione({ totaleInvernaleKw: scenario.edificio.totaleInvernaleKw, totaleEstivoKw: scenario.edificio.totaleEstivoKw, comune }).consumoAnnuoKwh, "elettrico")).toLocaleString("it-IT")} kg/anno`} sotto="Classe rappresentativa A++, mix elettrico medio IT" />
            </div>

            <AnalisiCritica edificio={scenario.edificio} />

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">Dettaglio calcolo tecnico per ambiente</h3>
              {scenario.edificio.risultatiAmbienti.map((r) => (
                <DettaglioCalcolo key={r.ambiente.id} risultato={r} comune={comune} defaultOpen={true} mostraBtu={mostraSplit} />
              ))}
            </div>

            {mostraSplit && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-slate-800">Catalogo tecnico comparativo — climatizzazione</h3>
                <p className="text-xs text-slate-400">
                  Selezione basata sul fabbisogno di dimensionamento (massimo tra carico invernale ed estivo):{" "}
                  {formattaKw(Math.max(scenario.edificio.totaleInvernaleKw, scenario.edificio.totaleEstivoKw))}.
                </p>
                <CatalogoTabella
                  fabbisognoKw={Math.max(scenario.edificio.totaleInvernaleKw, scenario.edificio.totaleEstivoKw)}
                  tipo="climatizzatore_split"
                />
              </div>
            )}

            <VRFDettaglio risultatiAmbienti={scenario.edificio.risultatiAmbienti} sistemaCentralizzato={sistemaCentralizzato} comune={comune} />
            <ChillerDettaglio risultatiAmbienti={scenario.edificio.risultatiAmbienti} sistemaCentralizzato={sistemaCentralizzato} comune={comune} />
            <FotovoltaicoDettaglio edificio={scenario.edificio} comune={comune} fotovoltaico={fotovoltaico} />
          </section>
          );
        })}

      {mostraAcs && (
        <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-slate-800">Fabbisogno ACS (UNI 9182)</h3>
          <BollitoreDettaglio acs={acs} />
        </section>
      )}

      {mostraAcs && <PompaCaloreAcsDettaglio acs={acs} comune={comune} />}

      {mostraAcs && <SolareTermicoDettaglio acs={acs} solareTermico={solareTermico} />}

      {mostraTrattamentoAcque && (
        <section className="print-break">
          <AddolcitoreDettaglio trattamentoAcque={trattamentoAcque} modalita={modalita} />
        </section>
      )}

      {mostraPompeIdrauliche && (
        <section className="print-break">
          <PompeIdraulicheDettaglio pompeIdrauliche={pompeIdrauliche} modalita={modalita} />
        </section>
      )}

      <DisclaimerBox />

      <div className="no-print">
        <RichiediPreventivo
          prodottiConsigliati={prodottiSelezionabiliDaVoci(vociRiepilogo)}
          edificio={mostraClima && scenari[0] ? scenari[0].edificio : EDIFICIO_VUOTO}
          comune={comune}
          branding={branding}
          modalita="ingegnere"
          evidenziato={false}
        />
      </div>

      <FooterBranding nomeAzienda={branding.nomeAzienda} />
    </div>
  );
}

const ACCENTO_KPI = {
  invernale: "border-t-sky-500",
  estivo: "border-t-amber-500",
  superficie: "border-t-slate-400",
  co2: "border-t-emerald-500",
};

function RiepilogoCard({ label, value, sotto, accento = "superficie" }) {
  return (
    <div className={`bg-white border border-slate-200 border-t-[3px] ${ACCENTO_KPI[accento]} rounded-xl p-4`}>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-2xl font-bold text-slate-800 tabular-nums">{value}</div>
      {sotto && <div className="text-xs text-slate-400 mt-0.5">{sotto}</div>}
    </div>
  );
}

function BollitoreDettaglio({ acs }) {
  const risultato = calcolaBollitore(acs.numeroPersone, acs.abitudine);
  const { consigliati, messaggio } = trovaBollitoriConsigliati(risultato.litriConsigliati);
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between border-b border-slate-100 py-1">
        <span className="text-slate-500">Consumo giornaliero stimato</span>
        <span className="font-medium">{risultato.litriGiorno.toFixed(0)} l/giorno</span>
      </div>
      <div className="flex justify-between border-b border-slate-100 py-1">
        <span className="text-slate-500">Capacità consigliata (+20% punte di prelievo)</span>
        <span className="font-medium">{risultato.litriConsigliati.toFixed(0)} l</span>
      </div>
      <div className="flex justify-between border-b border-slate-100 py-1">
        <span className="text-slate-500">Taglia bollitore standard</span>
        <span className="font-medium">{risultato.taglia ? `${risultato.taglia} L` : risultato.messaggio}</span>
      </div>
      <div className="flex justify-between py-1">
        <span className="text-slate-500">Fabbisogno energetico annuo stimato</span>
        <span className="font-medium">{Math.round(risultato.kWhAnno).toLocaleString("it-IT")} kWh/anno</span>
      </div>
      {messaggio ? (
        <p className="text-xs text-slate-400">{messaggio}</p>
      ) : (
        <ul className="text-xs text-slate-500 list-disc list-inside">
          {consigliati.map((p) => (
            <li key={p.modello}>
              {p.marchio} {p.modello} — {p.capacitaLitri} L, classe {p.classeEnergetica}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

