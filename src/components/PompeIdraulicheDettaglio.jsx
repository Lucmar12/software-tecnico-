import React, { useState } from "react";
import { calcolaAutoclave, calcolaSollevamento, calcolaCircolazione, kwToCv, PRESSIONE_RESIDUA_MINIMA_BAR_DEFAULT } from "../utils/pompeIdrauliche.js";

/** Formatta la potenza del motore [kW, valore primario] con il CV tra parentesi come valore secondario — taglia commerciale corrente per le elettropompe. */
function formattaPotenzaMotore(potenzaKw) {
  return `${potenzaKw} kW (${kwToCv(potenzaKw).toFixed(2)} CV)`;
}
import { trovaPompeConsigliate } from "../data/catalogo.js";

/**
 * Dimensionamento delle pompe idrauliche domestiche (UNI 9182): autoclave
 * (sempre presente), pompa di sollevamento e pompa di circolazione per il
 * ricircolo ACS, quando attivate. Ogni sotto-sezione ha un proprio
 * pannello "Dettaglio calcolo", aperto di default in modalità Ingegnere e
 * collassato in modalità Venditore.
 */
export default function PompeIdraulicheDettaglio({ pompeIdrauliche, modalita }) {
  const autoclave = calcolaAutoclave(pompeIdrauliche.autoclave);
  const risultatoAutoclave = trovaPompeConsigliate("autoclave", autoclave.portataPuntaMc, autoclave.prevalenzaM);

  const sollevamentoAttivo = pompeIdrauliche.sollevamento?.attivo;
  const sollevamento = sollevamentoAttivo ? calcolaSollevamento(pompeIdrauliche.sollevamento) : null;
  const risultatoSollevamento = sollevamento ? trovaPompeConsigliate("pompa_sollevamento", pompeIdrauliche.sollevamento.portataMc, sollevamento.prevalenzaM) : null;

  const circolazioneAttiva = pompeIdrauliche.circolazione?.attivo;
  const circolazione = circolazioneAttiva ? calcolaCircolazione(pompeIdrauliche.circolazione) : null;
  const risultatoCircolazione = circolazione ? trovaPompeConsigliate("pompa_circolazione", circolazione.portataRicircoloMc, circolazione.prevalenzaM) : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
      <h3 className="font-semibold text-slate-800">Dimensionamento pompe idrauliche</h3>

      <SottoSezione titolo="Autoclave (gruppo di pressurizzazione)" modalita={modalita}>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <Riga label="Portata di punta stimata" value={`${autoclave.portataPuntaMc.toFixed(2)} m³/h`} />
          <Riga label="Altezza geodetica" value={`${autoclave.altezzaGeodeticaM.toFixed(1)} m`} />
          <Riga label="Prevalenza manometrica richiesta" value={<strong>{autoclave.prevalenzaM.toFixed(1)} m</strong>} nota={`pressione residua minima ${pompeIdrauliche.autoclave.pressioneResiduaBar ?? PRESSIONE_RESIDUA_MINIMA_BAR_DEFAULT} bar, UNI 9182`} />
          <Riga label="Pressione di esercizio equivalente" value={`${autoclave.pressioneEsercizioBar.toFixed(1)} bar`} />
        </div>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          Portata di punta e perdite di carico sono stime forfettarie di pratica tecnica corrente: il calcolo puntuale
          della rete (diametri, tracciato, apparecchi effettivamente installati) compete alla progettazione idraulica
          esecutiva.
        </p>
        <ListaProdotti risultato={risultatoAutoclave} formattaVoce={(p) => `${p.marchio} ${p.modello} — ${p.portataNominaleMc} m³/h, ${p.prevalenzaM} m, ${formattaPotenzaMotore(p.potenzaKw)}`} />
      </SottoSezione>

      {sollevamentoAttivo && (
        <SottoSezione titolo="Pompa di sollevamento" modalita={modalita}>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <Riga label="Dislivello geodetico" value={`${pompeIdrauliche.sollevamento.dislivelloM} m`} />
            <Riga label="Portata richiesta" value={`${sollevamento.portataMc.toFixed(2)} m³/h`} />
            <Riga label="Prevalenza manometrica richiesta" value={<strong>{sollevamento.prevalenzaM.toFixed(1)} m</strong>} />
          </div>
          <ListaProdotti risultato={risultatoSollevamento} formattaVoce={(p) => `${p.marchio} ${p.modello} — ${p.portataNominaleMc} m³/h, ${p.prevalenzaM} m, ${formattaPotenzaMotore(p.potenzaKw)}`} />
        </SottoSezione>
      )}

      {circolazioneAttiva && (
        <SottoSezione titolo="Pompa di circolazione (ricircolo ACS)" modalita={modalita}>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <Riga label="Lunghezza tubazioni ricircolo" value={`${pompeIdrauliche.circolazione.lunghezzaTubazioniM} m`} />
            <Riga label="Dispersione termica stimata" value={`${circolazione.dispersioneTotaleW.toFixed(0)} W`} />
            <Riga label="Portata di ricircolo richiesta" value={<strong>{circolazione.portataRicircoloLh.toFixed(0)} l/h</strong>} nota={`salto termico max ammesso 5 K`} />
            <Riga label="Prevalenza manometrica richiesta" value={`${circolazione.prevalenzaM.toFixed(1)} m`} />
          </div>
          <ListaProdotti risultato={risultatoCircolazione} formattaVoce={(p) => `${p.marchio} ${p.modello} — ${(p.portataNominaleMc * 1000).toFixed(0)} l/h, ${p.prevalenzaM} m, ${formattaPotenzaMotore(p.potenzaKw)}`} />
        </SottoSezione>
      )}
    </div>
  );
}

function SottoSezione({ titolo, modalita, children }) {
  const [aperto, setAperto] = useState(modalita === "ingegnere");
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setAperto((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 text-sm font-medium text-slate-700"
      >
        <span>Dettaglio calcolo tecnico — {titolo}</span>
        <span className="text-slate-400">{aperto ? "▲ nascondi" : "▼ mostra"}</span>
      </button>
      {aperto && <div className="p-4 space-y-2">{children}</div>}
    </div>
  );
}

function ListaProdotti({ risultato, formattaVoce }) {
  if (!risultato) return null;
  if (risultato.messaggio) return <p className="text-xs text-slate-400">{risultato.messaggio}</p>;
  return (
    <ul className="text-xs text-slate-500 list-disc list-inside">
      {risultato.consigliati.map((p) => (
        <li key={p.modello}>{formattaVoce(p)}</li>
      ))}
    </ul>
  );
}

function Riga({ label, value, nota }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1">
      <span className="text-slate-500">
        {label}
        {nota && <span className="block text-[11px] text-slate-400">{nota}</span>}
      </span>
      <span className="font-medium text-slate-800 shrink-0 ml-3 text-right tabular-nums">{value}</span>
    </div>
  );
}
