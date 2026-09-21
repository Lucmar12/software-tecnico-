import React, { useEffect, useMemo, useState } from "react";
import Header from "./components/Header.jsx";
import TipoImpiantoSelector from "./components/TipoImpiantoSelector.jsx";
import ComuneSelector from "./components/ComuneSelector.jsx";
import ScenariTabs from "./components/ScenariTabs.jsx";
import AmbientiTabella from "./components/AmbientiTabella.jsx";
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
import { applicaStime } from "./utils/stime.js";

const STATO_INIZIALE = {
  tipiImpianto: { climatizzazione: true, acs: true, trattamentoAcque: false, pompeIdrauliche: false },
  comune: null,
  scenari: [nuovoScenario("Stato di fatto")],
  scenarioAttivoId: null,
  // Scenario su cui si basano il prodotto consigliato e la richiesta di preventivo.
  scenarioProgettoId: null,
  acs: { numeroPersone: 3, abitudine: "doccia_normale", generatore: "elettrico", tempoRicaricaOre: 6, cop: 3.2 },
  sistemaCentralizzato: { tipo: "nessuno", fattoreContemporaneita: FATTORE_CONTEMPORANEITA_DEFAULT, lunghezzaEquivalenteM: 15, dislivelloM: 5 },
  solareTermico: { attivo: false, coperturaPct: 55 },
  fotovoltaico: { attivo: false, kWp: 4, conAccumulo: false },
  trattamentoAcque: nuovoTrattamentoAcque(),
  pompeIdrauliche: nuovaPompeIdrauliche(),
};
STATO_INIZIALE.scenarioAttivoId = STATO_INIZIALE.scenari[0].id;
STATO_INIZIALE.scenarioProgettoId = STATO_INIZIALE.scenari[0].id;

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
  const fuso = {
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
    // Ogni ambiente caricato passa dalla normalizzazione: i progetti salvati
    // prima di lunghezza, larghezza e serramenti hanno solo la superficie, e
    // senza questo passaggio arriverebbero in tabella con celle vuote e
    // segnalate come errore.
    scenari: (statoCaricato.scenari?.length ? statoCaricato.scenari : STATO_INIZIALE.scenari).map((sc) => ({
      ...sc,
      ambienti: (sc.ambienti || []).map(applicaStime),
    })),
  };

  // Gli id di scenario ereditati dai default non appartengono agli scenari
  // appena caricati: vanno sempre ricondotti a uno scenario realmente
  // presente, altrimenti puntano nel vuoto.
  const ids = fuso.scenari.map((sc) => sc.id);
  if (!ids.includes(fuso.scenarioAttivoId)) fuso.scenarioAttivoId = ids[0];
  if (!ids.includes(fuso.scenarioProgettoId)) fuso.scenarioProgettoId = ids[0];

  return fuso;
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
  const [scenarioProgettoId, setScenarioProgettoId] = useState(iniziale.scenarioProgettoId);
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
    scenarioProgettoId,
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
  }, [tipiImpianto, comune, scenari, scenarioAttivoId, scenarioProgettoId, acs, sistemaCentralizzato, solareTermico, fotovoltaico, trattamentoAcque, pompeIdrauliche]);

  function caricaProgetto(progettoSalvato) {
    const s = fondiConDefault(progettoSalvato.stato);
    setTipiImpianto(s.tipiImpianto);
    setComune(s.comune);
    setScenari(s.scenari);
    setScenarioAttivoId(s.scenarioAttivoId);
    setScenarioProgettoId(s.scenarioProgettoId);
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

  /**
   * Scenario su cui si basano il prodotto consigliato e il preventivo.
   * Se quello designato è stato cancellato o non è ancora calcolabile si
   * ripiega sul primo disponibile: la proposta commerciale deve sempre
   * riferirsi a uno scenario reale e dichiarato, mai al primo che capita.
   */
  const scenarioProgetto =
    scenariCalcolati.find((sc) => sc.id === scenarioProgettoId) || scenariCalcolati[0] || null;

  // Numerazione dinamica delle sezioni di input, in base a cosa è effettivamente mostrato.
  let numeroSezione = 0;
  const prossimoNumero = () => ++numeroSezione;
  const nComune = tipiImpianto.climatizzazione ? prossimoNumero() : null;
  const nScenari = tipiImpianto.climatizzazione ? prossimoNumero() : null;
  const nAmbienti = tipiImpianto.climatizzazione ? prossimoNumero() : null;
  const nAcs = tipiImpianto.acs ? prossimoNumero() : null;
  const nTrattamentoAcque = tipiImpianto.trattamentoAcque ? prossimoNumero() : null;
  const nPompeIdrauliche = tipiImpianto.pompeIdrauliche ? prossimoNumero() : null;

  /**
   * Elenco di cosa impedisce il calcolo, ciascuna voce collegata alla
   * sezione da completare: l'avviso sta in fondo alla pagina, spesso
   * lontano dal campo incompleto, e dire cosa manca senza portarci è
   * metà del lavoro.
   */
  const mancanze = [
    tipiImpianto.climatizzazione && !comune && { id: "sezione-comune", testo: "Seleziona il comune per ricavare i dati climatici di progetto" },
    tipiImpianto.climatizzazione && Boolean(comune) && !ambientiValidi && { id: "sezione-ambienti", testo: "Completa correttamente almeno un ambiente" },
    tipiImpianto.acs && !acsOk && { id: "sezione-acs", testo: "Inserisci il numero di persone servite dall'acqua calda sanitaria" },
    tipiImpianto.trattamentoAcque && !trattamentoAcqueOk && { id: "sezione-trattamento-acque", testo: "Inserisci numero di persone e durezza dell'acqua per l'addolcitore" },
    tipiImpianto.pompeIdrauliche && !pompeIdraulicheOk && { id: "sezione-pompe-idrauliche", testo: "Completa i dati dell'autoclave e delle pompe attivate" },
  ].filter(Boolean);

  function vaiA(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const mostraRisultati = pronto && climatizzazionePronta && (tipiImpianto.climatizzazione || tipiImpianto.acs || tipiImpianto.trattamentoAcque || tipiImpianto.pompeIdrauliche);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
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
          <section id="sezione-comune" className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 no-print">
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
            <StepHeader
              numero={nScenari}
              titolo="Vuoi confrontare più situazioni? (facoltativo)"
              sottotitolo="es. la casa com'è oggi e come sarà dopo i lavori — se non ti serve, prosegui"
            />
            <ScenariTabs
              scenari={scenari}
              scenarioAttivoId={scenarioAttivoId}
              scenarioProgettoId={scenarioProgettoId}
              onCambiaScenario={setScenarioAttivoId}
              onCambiaScenarioProgetto={setScenarioProgettoId}
              onAggiornaScenari={setScenari}
            />
          </section>
        )}

        {tipiImpianto.climatizzazione && (
          <section id="sezione-ambienti" className="space-y-3 no-print">
            <StepHeader numero={nAmbienti} titolo={`Ambienti — ${scenarioAttivo.nome}`} />
            <AmbientiTabella
              ambienti={scenarioAttivo.ambienti}
              comune={comune}
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
          <section id="sezione-acs" className="space-y-3 no-print">
            <StepHeader numero={nAcs} titolo="Acqua calda sanitaria" />
            <ACSForm acs={acs} onChange={setAcs} />
            <SolareTermicoPanel solareTermico={solareTermico} onChange={setSolareTermico} />
          </section>
        )}

        {tipiImpianto.trattamentoAcque && (
          <section id="sezione-trattamento-acque" className="space-y-3 no-print">
            <StepHeader numero={nTrattamentoAcque} titolo="Trattamento acque" />
            <TrattamentoAcqueForm trattamentoAcque={trattamentoAcque} onChange={setTrattamentoAcque} />
          </section>
        )}

        {tipiImpianto.pompeIdrauliche && (
          <section id="sezione-pompe-idrauliche" className="space-y-3 no-print">
            <StepHeader numero={nPompeIdrauliche} titolo="Pompe idrauliche" />
            <PompeIdraulicheForm pompeIdrauliche={pompeIdrauliche} onChange={setPompeIdrauliche} />
          </section>
        )}

        {!pronto && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 no-print space-y-2">
            <p className="font-semibold">Manca ancora qualcosa per calcolare:</p>
            <ul className="space-y-1">
              {mancanze.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => vaiA(m.id)}
                    className="text-left underline decoration-amber-400 underline-offset-2 hover:text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
                  >
                    {m.testo} →
                  </button>
                </li>
              ))}
            </ul>
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
                scenarioProgetto={scenarioProgetto}
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
