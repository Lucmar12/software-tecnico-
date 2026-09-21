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
import { formattaKw, formattaBtu, formattaFrigorie } from "../utils/export.js";
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
 * Unico output dell'app: relazione di calcolo esportabile/stampabile, con
 * ogni passaggio, coefficiente e riferimento normativo in primo piano, il
 * riepilogo "Prodotto consigliato" per categoria e il form di richiesta
 * preventivo in primo piano. Mostra solo i blocchi (climatizzazione, ACS,
 * trattamento acque, pompe idrauliche) effettivamente richiesti.
 */
export default function RelazioneCalcolo({ scenari, scenarioProgetto, comune, acs, branding, tipiImpianto, sistemaCentralizzato, solareTermico, fotovoltaico, trattamentoAcque, pompeIdrauliche }) {
  const mostraClima = tipiImpianto.climatizzazione;
  const mostraAcs = tipiImpianto.acs;
  const mostraTrattamentoAcque = tipiImpianto.trattamentoAcque;
  const mostraPompeIdrauliche = tipiImpianto.pompeIdrauliche;

  // Prodotto consigliato e preventivo si riferiscono sempre e solo alla
  // situazione che l'utente ha indicato di voler realizzare: le altre
  // sono alternative escluse, non fanno parte della fornitura.
  const scenarioDaPreventivare = scenarioProgetto || scenari[0] || null;
  const confrontoAttivo = scenari.length > 1;

  const vociRiepilogo = calcolaVociRiepilogoProdotti({
    tipiImpianto,
    scenario: scenarioDaPreventivare,
    comune,
    acs,
    sistemaCentralizzato,
    solareTermico,
    fotovoltaico,
    trattamentoAcque,
    pompeIdrauliche,
  });

  // Ogni scheda è un blocco di JSX: raggruppa le sezioni che rispondono
  // alla stessa domanda dell'utente, invece di srotolarle tutte in un
  // unico scorrimento in cui "quanto costa" e "come l'hai calcolato"
  // stanno alla stessa distanza.
  const schedaCosaTiServe = (
    <>
      <RiepilogoSceltaProdotti
        voci={vociRiepilogo}
        nomeScenario={mostraClima && confrontoAttivo ? scenarioDaPreventivare?.nome : null}
      />
      <div className="no-print">
        <RichiediPreventivo
          prodottiConsigliati={prodottiSelezionabiliDaVoci(vociRiepilogo)}
          edificio={mostraClima && scenarioDaPreventivare ? scenarioDaPreventivare.edificio : EDIFICIO_VUOTO}
          comune={comune}
          branding={branding}
          evidenziato={true}
        />
      </div>
    </>
  );

  const schedaNumeri = (
    <>
      {mostraClima && confrontoAttivo && scenarioDaPreventivare && (
        <ConfrontoScenari scenari={scenari} scenarioDaPreventivare={scenarioDaPreventivare} />
      )}
      {mostraClima &&
        scenari.map((scenario) => (
          <section key={scenario.id} className="space-y-4">
            <TitoloScenario scenario={scenario} confrontoAttivo={confrontoAttivo} scenarioDaPreventivare={scenarioDaPreventivare} />
            <div className="grid sm:grid-cols-4 gap-3">
              <RiepilogoCard
                accento="invernale"
                label="Fabbisogno invernale totale"
                value={formattaKw(scenario.edificio.totaleInvernaleKw)}
                sotto={formattaBtu(scenario.edificio.totaleInvernaleBtu)}
              />
              <RiepilogoCard
                accento="estivo"
                label="Fabbisogno estivo totale"
                value={formattaKw(scenario.edificio.totaleEstivoKw)}
                sotto={`${formattaBtu(scenario.edificio.totaleEstivoBtu)} · ${formattaFrigorie(scenario.edificio.totaleEstivoKw)}${
                  scenario.edificio.oraDiPuntaEstiva != null ? ` · punta alle ${scenario.edificio.oraDiPuntaEstiva}:00` : ""
                }`}
              />
              <RiepilogoCard
                accento="superficie"
                label="Superficie totale"
                value={`${scenario.edificio.superficieTotale.toFixed(1)} m²`}
                sotto={`Zona ${comune.zona} — ${ZONE_CLIMATICHE[comune.zona].oreRiscaldamento} h/giorno, ${ZONE_CLIMATICHE[comune.zona].periodo}`}
              />
              <RiepilogoCard
                accento="co2"
                label="CO2 stimata"
                value={`${Math.round(
                  calcolaCO2Annua(
                    stimaConsumoAnnuoClimatizzazione({
                      totaleInvernaleKw: scenario.edificio.totaleInvernaleKw,
                      totaleEstivoKw: scenario.edificio.totaleEstivoKw,
                      comune,
                    }).consumoAnnuoKwh,
                    "elettrico"
                  )
                ).toLocaleString("it-IT")} kg/anno`}
                sotto="Classe rappresentativa A++, mix elettrico medio IT"
              />
            </div>
            {scenario.edificio.riduzionePerContemporaneitaPct > 0.5 && (
              <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <span className="font-semibold text-slate-700">Contemporaneità estiva.</span> Gli ambienti non vanno
                in punta alla stessa ora: uno esposto a est raggiunge il massimo a metà mattina, uno a ovest nel tardo
                pomeriggio. Sommando i picchi dei singoli ambienti si otterrebbero{" "}
                {formattaKw(scenario.edificio.sommaPicchiEstiviKw)}, ma nell'ora peggiore — le{" "}
                {scenario.edificio.oraDiPuntaEstiva}:00 — l'edificio ne chiede{" "}
                {formattaKw(scenario.edificio.totaleEstivoKw)}:{" "}
                <span className="font-semibold text-emerald-700">
                  {scenario.edificio.riduzionePerContemporaneitaPct.toFixed(0)}% di potenza in meno
                </span>{" "}
                da installare, senza scoprire nulla.
              </p>
            )}

            <AnalisiCritica edificio={scenario.edificio} />
            <FotovoltaicoDettaglio edificio={scenario.edificio} comune={comune} fotovoltaico={fotovoltaico} />
          </section>
        ))}
      {mostraAcs && <SolareTermicoDettaglio acs={acs} solareTermico={solareTermico} />}
    </>
  );

  const schedaComeCalcolato = (
    <>
      {mostraClima &&
        scenari.map((scenario) => {
          const mostraSplit = sistemaCentralizzato.tipo === "nessuno" || scenario.edificio.risultatiAmbienti.length < 2;
          return (
            <section key={scenario.id} className="space-y-4 print-break">
              <TitoloScenario scenario={scenario} confrontoAttivo={confrontoAttivo} scenarioDaPreventivare={scenarioDaPreventivare} />
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-800">Dettaglio calcolo tecnico per ambiente</h3>
                {scenario.edificio.risultatiAmbienti.map((r) => (
                  <DettaglioCalcolo key={r.ambiente.id} risultato={r} comune={comune} defaultOpen={true} mostraBtu={mostraSplit} />
                ))}
              </div>
              <VRFDettaglio risultatiAmbienti={scenario.edificio.risultatiAmbienti} sistemaCentralizzato={sistemaCentralizzato} comune={comune} mostraCatalogo={false} />
              <ChillerDettaglio risultatiAmbienti={scenario.edificio.risultatiAmbienti} sistemaCentralizzato={sistemaCentralizzato} comune={comune} mostraCatalogo={false} />
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

      {mostraTrattamentoAcque && (
        <section className="print-break">
          <AddolcitoreDettaglio trattamentoAcque={trattamentoAcque} />
        </section>
      )}

      {mostraPompeIdrauliche && (
        <section className="print-break">
          <PompeIdraulicheDettaglio pompeIdrauliche={pompeIdrauliche} />
        </section>
      )}

      <DisclaimerBox />
    </>
  );

  const schedaAlternative = (
    <>
      {mostraClima &&
        scenari.map((scenario) => {
          const mostraSplit = sistemaCentralizzato.tipo === "nessuno" || scenario.edificio.risultatiAmbienti.length < 2;
          const fabbisognoKw = Math.max(scenario.edificio.totaleInvernaleKw, scenario.edificio.totaleEstivoKw);
          return (
            <section key={scenario.id} className="space-y-4 print-break">
              <TitoloScenario scenario={scenario} confrontoAttivo={confrontoAttivo} scenarioDaPreventivare={scenarioDaPreventivare} />
              {mostraSplit ? (
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-slate-800">Catalogo tecnico comparativo — climatizzazione</h3>
                  <p className="text-xs text-slate-400">
                    Selezione basata sul fabbisogno di dimensionamento (massimo tra carico invernale ed estivo):{" "}
                    {formattaKw(fabbisognoKw)}.
                  </p>
                  <CatalogoTabella fabbisognoKw={fabbisognoKw} tipo="climatizzatore_split" />
                </div>
              ) : (
                <>
                  <VRFDettaglio risultatiAmbienti={scenario.edificio.risultatiAmbienti} sistemaCentralizzato={sistemaCentralizzato} comune={comune} compatto={true} />
                  <ChillerDettaglio risultatiAmbienti={scenario.edificio.risultatiAmbienti} sistemaCentralizzato={sistemaCentralizzato} comune={comune} compatto={true} />
                </>
              )}
            </section>
          );
        })}
    </>
  );

  const schede = [
    { chiave: "serve", etichetta: "Cosa ti serve", icona: "🛒", sottotitolo: "Prodotti consigliati e richiesta di preventivo", contenuto: schedaCosaTiServe },
    { chiave: "numeri", etichetta: "Numeri e risparmio", icona: "📊", sottotitolo: "Fabbisogni, consumi, CO2 e confronti", contenuto: schedaNumeri },
    { chiave: "calcolo", etichetta: "Come l'abbiamo calcolato", icona: "📐", sottotitolo: "Ogni passaggio, coefficiente e norma applicata", contenuto: schedaComeCalcolato },
    ...(mostraClima ? [{ chiave: "alternative", etichetta: "Alternative a catalogo", icona: "🔍", sottotitolo: "Altri modelli idonei al fabbisogno calcolato", contenuto: schedaAlternative }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <p className="text-xs text-slate-400">
          Tutte le schede finiscono comunque nel PDF: la suddivisione serve solo a leggere a schermo.
        </p>
        <button
          onClick={() => window.print()}
          className="shrink-0 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 transition-colors active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          🖨️ Stampa / Esporta relazione completa (PDF)
        </button>
      </div>

      <IntestazioneStampa branding={branding} comune={comune} titolo="Relazione di calcolo" sottotitolo="Dimensionamento impianto residenziale" />

      <Schede schede={schede} />

      <FooterBranding nomeAzienda={branding.nomeAzienda} />
    </div>
  );
}

/**
 * Navigazione a schede dell'output.
 *
 * Le schede non attive restano nel DOM e vengono nascoste solo a schermo:
 * in stampa tornano tutte visibili, così il PDF resta la relazione
 * integrale a prescindere dalla scheda aperta al momento del comando di
 * stampa. Nasconderle smontandole dal DOM produrrebbe un PDF parziale
 * senza che l'utente se ne accorga.
 */
function Schede({ schede }) {
  const [attiva, setAttiva] = React.useState(schede[0].chiave);
  const schedaAttiva = schede.find((s) => s.chiave === attiva) || schede[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 no-print" role="tablist">
        {schede.map((s) => {
          const selezionata = s.chiave === schedaAttiva.chiave;
          return (
            <button
              key={s.chiave}
              role="tab"
              aria-selected={selezionata}
              onClick={() => setAttiva(s.chiave)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                selezionata
                  ? "bg-brand-600 border-brand-600 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:border-brand-400 hover:text-brand-700"
              }`}
            >
              <span className="mr-1.5">{s.icona}</span>
              {s.etichetta}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 no-print">{schedaAttiva.sottotitolo}</p>

      {schede.map((s) => (
        <div key={s.chiave} className={s.chiave === schedaAttiva.chiave ? "space-y-6" : "space-y-6 solo-stampa"}>
          <h2 className="hidden print:block text-xl font-bold text-slate-800">{s.etichetta}</h2>
          {s.contenuto}
        </div>
      ))}
    </div>
  );
}

/** Intestazione di scenario, ripetuta in ogni scheda per non perdere il riferimento passando da una all'altra. */
function TitoloScenario({ scenario, confrontoAttivo, scenarioDaPreventivare }) {
  return (
    <h2 className="text-xl font-bold text-slate-800 flex flex-wrap items-center gap-2">
      <span>{confrontoAttivo ? `Situazione: ${scenario.nome}` : "Calcolo del fabbisogno"}</span>
      {confrontoAttivo && scenario.id === scenarioDaPreventivare?.id && (
        <span className="text-[11px] font-bold uppercase tracking-wide bg-brand-600 text-white px-2 py-0.5 rounded-full">
          Da realizzare — è questa che viene preventivata
        </span>
      )}
    </h2>
  );
}

/**
 * Confronto dei totali fra le situazioni messe a paragone: è il motivo
 * per cui gli scenari esistono (quanto fa risparmiare l'intervento), e
 * dice a chiare lettere quale delle due viene poi preventivata.
 */
function ConfrontoScenari({ scenari, scenarioDaPreventivare }) {
  const riferimento = scenari[0];
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
      <div>
        <h2 className="font-bold text-lg text-slate-800">Confronto tra le situazioni</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Differenza di fabbisogno rispetto a “{riferimento.nome}”. Il preventivo riguarda solo la situazione
          indicata come da realizzare.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 text-left">
              <th className="font-medium py-1 pr-3">Situazione</th>
              <th className="font-medium py-1 pr-3 text-right">Invernale</th>
              <th className="font-medium py-1 pr-3 text-right">Estivo</th>
              <th className="font-medium py-1 text-right">Differenza invernale</th>
            </tr>
          </thead>
          <tbody>
            {scenari.map((sc) => {
              const delta = sc.edificio.totaleInvernaleKw - riferimento.edificio.totaleInvernaleKw;
              const daPreventivare = sc.id === scenarioDaPreventivare.id;
              return (
                <tr key={sc.id} className={`border-t border-slate-100 ${daPreventivare ? "bg-brand-50/50" : ""}`}>
                  <td className="py-2 pr-3 font-medium text-slate-800">
                    {sc.nome}
                    {daPreventivare && <span className="ml-2 text-[11px] font-bold text-brand-700">← da realizzare</span>}
                  </td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formattaKw(sc.edificio.totaleInvernaleKw)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{formattaKw(sc.edificio.totaleEstivoKw)}</td>
                  <td className={`py-2 text-right tabular-nums ${delta < 0 ? "text-emerald-600" : delta > 0 ? "text-amber-600" : "text-slate-400"}`}>
                    {sc.id === riferimento.id
                      ? "—"
                      : delta === 0
                      ? "nessuna differenza"
                      : `${delta > 0 ? "+" : ""}${formattaKw(delta)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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

