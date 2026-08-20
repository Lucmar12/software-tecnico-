import React, { useEffect, useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import TipoImpiantoSelector from "./components/TipoImpiantoSelector.jsx";
import ComuneSelector from "./components/ComuneSelector.jsx";
import ScenariTabs from "./components/ScenariTabs.jsx";
import AmbientiList from "./components/AmbientiList.jsx";
import ACSForm from "./components/ACSForm.jsx";
import TrattamentoAcqueForm from "./components/TrattamentoAcqueForm.jsx";
import PompeIdraulicheForm from "./components/PompeIdraulicheForm.jsx";
import RelazioneCalcolo from "./components/RelazioneCalcolo.jsx";
import FloatingCTA from "./components/FloatingCTA.jsx";
import SistemaCentralizzatoPanel from "./components/SistemaCentralizzatoPanel.jsx";
import SolareTermicoPanel from "./components/SolareTermicoPanel.jsx";
import FotovoltaicoPanel from "./components/FotovoltaicoPanel.jsx";
import ProgettiPanel from "./components/ProgettiPanel.jsx";
import StoricoRichieste from "./components/StoricoRichieste.jsx";
import StepHeader from "./components/StepHeader.jsx";
import { BRANDING_FISSO } from "./utils/brandingFisso.js";
import { nuovoScenario, nuovoTrattamentoAcque, nuovaPompeIdrauliche } from "./utils/modelli.js";
import { ambienteValido } from "./utils/validazione.js";
import { calcolaEdificioConOverride } from "./utils/overrides.js";
import { FATTORE_CONTEMPORANEITA_DEFAULT } from "./utils/vrf.js";
import { caricaBozza, salvaBozza } from "./utils/persistenza.js";

const STATO_INIZIALE = {
  tipiImpianto: { climatizzazione: true, acs: true, trattamentoAcque: false, pompeIdrauliche: false },
  comune: null,
  scenari: [nuovoScenario("Stato di fatto")],
  scenarioAttivoId: null,
  acs: { numeroPersone: 3, abitudine: "doccia_normale", generatore: "elettrico", tempoRicaricaOre: 6, cop: 3.2 },
  sistemaCentralizzato: { tipo: "nessuno", fattoreContemporaneita: FATTORE_CONTEMPORANEITA_DEFAULT, lunghezzaEquivalenteM: 15, dislivelloM: 5 },
  solareTermico: { attivo: false, coperturaPct: 55 },
  fotovoltaico: { attivo: false, kWp: 4, conAccumulo: false },
  trattamentoAcque: nuovoTrattamentoAcque(),
  pompeIdrauliche: nuovaPompeIdrauliche(),
};
STATO_INIZIALE.scenarioAttivoId = STATO_INIZIALE.scenari[0].id;

/**
 * Completa uno stato caricato (bozza o progetto salvato) con i valori di
 * default per qualunque campo mancante, ai livelli annidati (acs,
 * sistemaCentralizzato, ecc.) — non solo alla radice. Necessario perché
 * lo schema dello stato evolve nel tempo (nuovi campi aggiunti): uno
 * stato salvato da una versione precedente dell'app non deve mai
 * produrre `undefined` in un punto che il resto del codice legge come
 * oggetto sempre presente, altrimenti l'intera interfaccia va in errore
 * al primo render che lo tocca.
 */
function fondiConDefault(statoCaricato) {
  if (!statoCaricato) return STATO_INIZIALE;
  return {
    ...STATO_INIZIALE,
    ...statoCaricato,
    tipiImpianto: { ...STATO_INIZIALE.tipiImpianto, ...(statoCaricato.tipiImpianto || {}) },
    acs: { ...STATO_INIZIALE.acs, ...(statoCaricato.acs || {}) },
    // "vrf" è il nome del campo in versioni precedenti dell'app, prima della rinomina in "sistemaCentralizzato".
    sistemaCentralizzato: { ...STATO_INIZIALE.sistemaCentralizzato, ...(statoCaricato.sistemaCentralizzato || statoCaricato.vrf || {}) },
    solareTermico: { ...STATO_INIZIALE.solareTermico, ...(statoCaricato.solareTermico || {}) },
    fotovoltaico: { ...STATO_INIZIALE.fotovoltaico, ...(statoCaricato.fotovoltaico || {}) },
    trattamentoAcque: { ...STATO_INIZIALE.trattamentoAcque, ...(statoCaricato.trattamentoAcque || {}) },
    pompeIdrauliche: {
      ...STATO_INIZIALE.pompeIdrauliche,
      ...(statoCaricato.pompeIdrauliche || {}),
      autoclave: { ...STATO_INIZIALE.pompeIdrauliche.autoclave, ...(statoCaricato.pompeIdrauliche?.autoclave || {}) },
      sollevamento: { ...STATO_INIZIALE.pompeIdrauliche.sollevamento, ...(statoCaricato.pompeIdrauliche?.sollevamento || {}) },
      circolazione: { ...STATO_INIZIALE.pompeIdrauliche.circolazione, ...(statoCaricato.pompeIdrauliche?.circolazione || {}) },
    },
    scenari: statoCaricato.scenari?.length ? statoCaricato.scenari : STATO_INIZIALE.scenari,
  };
}

/**
 * Componente radice dell'applicazione di dimensionamento impianti
 * residenziali. Il motore di calcolo (data/comuni.js, data/calculations.js,
 * data/catalogo.js) è unico e condiviso da tutte le categorie; l'input è
 * sempre completo e granulare (nessuna modalità semplificata) e l'output è
 * sempre la relazione di calcolo integrale, con il form di richiesta
 * preventivo in primo piano.
 *
 * Lo stato completo viene salvato automaticamente come bozza nel
 * localStorage del dispositivo (nessuna sincronizzazione multi-
 * dispositivo/multi-utente) e può essere salvato con nome come progetto
 * tramite ProgettiPanel.
 */
export default function App() {
  const iniziale = useMemo(() => fondiConDefault(caricaBozza()?.stato), []);

  const [tipiImpianto, setTipiImpianto] = useState(iniziale.tipiImpianto);
  const [comune, setComune] = useState(iniziale.comune);
  const [scenari, setScenari] = useState(iniziale.scenari);
  const [scenarioAttivoId, setScenarioAttivoId] = useState(iniziale.scenarioAttivoId);
  const [acs, setAcs] = useState(iniziale.acs);
  const [sistemaCentralizzato, setSistemaCentralizzato] = useState(iniziale.sistemaCentralizzato);
  const [solareTermico, setSolareTermico] = useState(iniziale.solareTermico);
  const [fotovoltaico, setFotovoltaico] = useState(iniziale.fotovoltaico);
  const [trattamentoAcque, setTrattamentoAcque] = useState(iniziale.trattamentoAcque);
  const [pompeIdrauliche, setPompeIdrauliche] = useState(iniziale.pompeIdrauliche);
  const [progettoAttivoId, setProgettoAttivoId] = useState(null);

  const statoCompleto = {
    tipiImpianto,
    comune,
    scenari,
    scenarioAttivoId,
    acs,
    sistemaCentralizzato,
    solareTermico,
    fotovoltaico,
    trattamentoAcque,
    pompeIdrauliche,
  };

  // Bozza automatica: salvata ad ogni modifica di stato rilevante, ripristinata all'apertura dell'app.
  useEffect(() => {
    salvaBozza(statoCompleto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipiImpianto, comune, scenari, scenarioAttivoId, acs, sistemaCentralizzato, solareTermico, fotovoltaico, trattamentoAcque, pompeIdrauliche]);

  function caricaProgetto(progettoSalvato) {
    const s = fondiConDefault(progettoSalvato.stato);
    setTipiImpianto(s.tipiImpianto);
    setComune(s.comune);
    setScenari(s.scenari);
    setScenarioAttivoId(s.scenarioAttivoId);
    setAcs(s.acs);
    setSistemaCentralizzato(s.sistemaCentralizzato);
    setSolareTermico(s.solareTermico);
    setFotovoltaico(s.fotovoltaico);
    setTrattamentoAcque(s.trattamentoAcque);
    setPompeIdrauliche(s.pompeIdrauliche);
    setProgettoAttivoId(progettoSalvato.id);
  }

  const scenarioAttivo = scenari.find((s) => s.id === scenarioAttivoId) || scenari[0];

  function aggiornaAmbientiScenario(id, ambienti) {
    setScenari(scenari.map((s) => (s.id === id ? { ...s, ambienti } : s)));
  }

  const ambientiValidi = scenarioAttivo.ambienti.length > 0 && scenarioAttivo.ambienti.every(ambienteValido);
  const acsValido = acs.numeroPersone > 0;
  const trattamentoAcqueValido = trattamentoAcque.numeroPersone > 0 && trattamentoAcque.durezzaIngressoGf >= 0;
  const pompeIdraulicheValide =
    pompeIdrauliche.autoclave.numeroPersone > 0 &&
    pompeIdrauliche.autoclave.numeroPiani > 0 &&
    (!pompeIdrauliche.sollevamento.attivo || pompeIdrauliche.sollevamento.portataMc > 0) &&
    (!pompeIdrauliche.circolazione.attivo || pompeIdrauliche.circolazione.lunghezzaTubazioniM > 0);

  const climatizzazioneOk = !tipiImpianto.climatizzazione || (Boolean(comune) && ambientiValidi);
  const acsOk = !tipiImpianto.acs || acsValido;
  const trattamentoAcqueOk = !tipiImpianto.trattamentoAcque || trattamentoAcqueValido;
  const pompeIdraulicheOk = !tipiImpianto.pompeIdrauliche || pompeIdraulicheValide;
  const pronto = climatizzazioneOk && acsOk && trattamentoAcqueOk && pompeIdraulicheOk;

  // Calcolo edificio per ogni scenario, solo se la climatizzazione è richiesta e il comune è selezionato.
  const scenariCalcolati = useMemo(() => {
    if (!tipiImpianto.climatizzazione || !comune) return [];
    return scenari
      .filter((s) => s.ambienti.length > 0 && s.ambienti.every(ambienteValido))
      .map((s) => ({ ...s, edificio: calcolaEdificioConOverride(s.ambienti, comune) }));
  }, [scenari, comune, tipiImpianto.climatizzazione]);

  const climatizzazionePronta = !tipiImpianto.climatizzazione || scenariCalcolati.length > 0;

  // Numerazione dinamica delle sezioni di input, in base a cosa è effettivamente mostrato.
  let numeroSezione = 0;
  const prossimoNumero = () => ++numeroSezione;
  const nComune = tipiImpianto.climatizzazione ? prossimoNumero() : null;
  const nScenari = tipiImpianto.climatizzazione ? prossimoNumero() : null;
  const nAmbienti = tipiImpianto.climatizzazione ? prossimoNumero() : null;
  const nAcs = tipiImpianto.acs ? prossimoNumero() : null;
  const nTrattamentoAcque = tipiImpianto.trattamentoAcque ? prossimoNumero() : null;
  const nPompeIdrauliche = tipiImpianto.pompeIdrauliche ? prossimoNumero() : null;

  const mostraRisultati = pronto && climatizzazionePronta && (tipiImpianto.climatizzazione || tipiImpianto.acs || tipiImpianto.trattamentoAcque || tipiImpianto.pompeIdrauliche);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-wrap gap-2 justify-end no-print">
          <ProgettiPanel statoCorrente={statoCompleto} progettoAttivoId={progettoAttivoId} onCarica={caricaProgetto} onSalvatoConSuccesso={setProgettoAttivoId} />
          <StoricoRichieste />
        </div>

        <section id="cosa-vuoi-dimensionare" className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 no-print">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">Prima di tutto</span>
            <h2 className="font-bold text-slate-800">Cosa vuoi dimensionare?</h2>
          </div>
          <TipoImpiantoSelector
            tipiImpianto={tipiImpianto}
            onChange={(nuovo) => {
              setTipiImpianto(nuovo);
              // Le sezioni si aprono/chiudono sopra il punto di scroll corrente: riporta in vista il cambiamento.
              document.getElementById("cosa-vuoi-dimensionare")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        </section>

        {tipiImpianto.climatizzazione ? (
          <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 no-print">
            <StepHeader numero={nComune} titolo="Comune e dati climatici" />
            <ComuneSelector comuneEffettivo={comune} onChange={setComune} />
          </section>
        ) : (
          <button
            onClick={() => setTipiImpianto({ ...tipiImpianto, climatizzazione: true })}
            className="w-full text-left bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-700 no-print transition-colors"
          >
            Climatizzazione disattivata per questo progetto — <span className="underline">tocca per riattivarla</span>
          </button>
        )}

        {tipiImpianto.climatizzazione && (
          <section className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 no-print">
            <StepHeader numero={nScenari} titolo="Scenari a confronto" sottotitolo="es. stato di fatto vs. post-riqualificazione" />
            <ScenariTabs
              scenari={scenari}
              scenarioAttivoId={scenarioAttivoId}
              onCambiaScenario={setScenarioAttivoId}
              onAggiornaScenari={setScenari}
            />
          </section>
        )}

        {tipiImpianto.climatizzazione && (
          <section className="space-y-3 no-print">
            <StepHeader numero={nAmbienti} titolo={`Ambienti — ${scenarioAttivo.nome}`} />
            <AmbientiList
              ambienti={scenarioAttivo.ambienti}
              onChange={(ambienti) => aggiornaAmbientiScenario(scenarioAttivo.id, ambienti)}
            />
            <SistemaCentralizzatoPanel
              sistemaCentralizzato={sistemaCentralizzato}
              onChange={setSistemaCentralizzato}
              numeroAmbienti={scenarioAttivo.ambienti.length}
            />
            <FotovoltaicoPanel fotovoltaico={fotovoltaico} onChange={setFotovoltaico} />
          </section>
        )}

        {tipiImpianto.acs && (
          <section className="space-y-3 no-print">
            <StepHeader numero={nAcs} titolo="Acqua calda sanitaria" />
            <ACSForm acs={acs} onChange={setAcs} />
            <SolareTermicoPanel solareTermico={solareTermico} onChange={setSolareTermico} />
          </section>
        )}

        {tipiImpianto.trattamentoAcque && (
          <section className="space-y-3 no-print">
            <StepHeader numero={nTrattamentoAcque} titolo="Trattamento acque" />
            <TrattamentoAcqueForm trattamentoAcque={trattamentoAcque} onChange={setTrattamentoAcque} />
          </section>
        )}

        {tipiImpianto.pompeIdrauliche && (
          <section className="space-y-3 no-print">
            <StepHeader numero={nPompeIdrauliche} titolo="Pompe idrauliche" />
            <PompeIdraulicheForm pompeIdrauliche={pompeIdrauliche} onChange={setPompeIdrauliche} />
          </section>
        )}

        {!pronto && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 no-print">
            {tipiImpianto.climatizzazione && !climatizzazioneOk && "Seleziona un comune e completa correttamente almeno un ambiente per calcolare il fabbisogno di climatizzazione. "}
            {tipiImpianto.acs && !acsOk && "Inserisci il numero di persone per calcolare il fabbisogno di acqua calda sanitaria. "}
            {tipiImpianto.trattamentoAcque && !trattamentoAcqueOk && "Inserisci il numero di persone e la durezza dell'acqua per dimensionare l'addolcitore. "}
            {tipiImpianto.pompeIdrauliche && !pompeIdraulicheOk && "Completa i dati dell'autoclave (e delle pompe attivate) per dimensionare le pompe idrauliche."}
          </div>
        )}

        {mostraRisultati && (
          <section className="pt-2">
            <div className="no-print rounded-2xl bg-brand-700 text-white p-5 shadow-lg shadow-brand-700/25">
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-brand-200">Risultati</span>
              <h2 className="font-bold text-xl leading-tight mt-0.5">Relazione di calcolo e preventivo</h2>
              <p className="text-sm text-brand-100 mt-1">
                Calcolo completo, con ogni passaggio, coefficiente e riferimento normativo applicato, prodotto
                consigliato per categoria e richiesta preventivo pronta da inviare.
              </p>
            </div>
            <div className="mt-5">
              <RelazioneCalcolo
                scenari={scenariCalcolati}
                comune={comune}
                acs={acs}
                branding={BRANDING_FISSO}
                tipiImpianto={tipiImpianto}
                sistemaCentralizzato={sistemaCentralizzato}
                solareTermico={solareTermico}
                fotovoltaico={fotovoltaico}
                trattamentoAcque={trattamentoAcque}
                pompeIdrauliche={pompeIdrauliche}
              />
            </div>
          </section>
        )}
      </main>

      {mostraRisultati && <FloatingCTA />}
    </div>
  );
}
