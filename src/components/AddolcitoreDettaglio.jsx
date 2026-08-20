import React, { useState } from "react";
import { calcolaAddolcitore, CAPACITA_CICLICA_RESINA_GF_L, DOSAGGIO_SALE_KG_PER_LITRO_RESINA } from "../utils/addolcitore.js";
import { trovaAddolcitoriConsigliati } from "../data/catalogo.js";

/**
 * Dimensionamento dell'addolcitore a scambio ionico (UNI EN 14743): volume
 * di resina necessario a coprire il fabbisogno di acqua addolcita per
 * l'autonomia target tra due rigenerazioni. Il pannello "Dettaglio
 * calcolo" è aperto di default in modalità Ingegnere, collassato in
 * modalità Venditore.
 */
export default function AddolcitoreDettaglio({ trattamentoAcque, modalita }) {
  const risultato = calcolaAddolcitore(trattamentoAcque);
  const { consigliati, messaggio } = trovaAddolcitoriConsigliati(risultato.volumeResinaRichiestoLitri, risultato.portataPuntaMc);
  const [aperto, setAperto] = useState(modalita === "ingegnere");

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-slate-800">Dimensionamento addolcitore — Trattamento acque</h3>

      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <Riga label="Consumo idrico giornaliero stimato" value={`${risultato.consumoGiornalieroLitri.toFixed(0)} l/giorno`} />
        <Riga label="Durezza da abbattere" value={`${risultato.durezzaDaAbbattereGf.toFixed(1)} °fH`} />
        <Riga label="Volume di resina richiesto" value={<strong>{risultato.volumeResinaRichiestoLitri.toFixed(1)} L</strong>} nota={`per ${risultato.autonomiaGiorniTarget} giorni di autonomia tra rigenerazioni`} />
        <Riga label="Taglia commerciale consigliata" value={risultato.tagliaResinaLitri ? `${risultato.tagliaResinaLitri} L` : risultato.messaggio} />
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setAperto((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 text-sm font-medium text-slate-700"
        >
          <span>Dettaglio calcolo tecnico — addolcitore</span>
          <span className="text-slate-400">{aperto ? "▲ nascondi" : "▼ mostra"}</span>
        </button>
        {aperto && (
          <div className="p-4 space-y-2 text-sm">
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              UNI EN 14743 definisce i requisiti prestazionali dichiarabili dall'addolcitore (capacità di scambio,
              portata nominale) ma non un metodo di calcolo unico: il dimensionamento segue la prassi tecnica
              corrente del settore. Capacità di scambio ciclica specifica della resina e dosaggio sale sono valori
              indicativi — il costruttore selezionato dichiara il proprio valore specifico.
            </p>
            <Riga label="Numero persone" value={trattamentoAcque.numeroPersone} />
            <Riga label="Consumo idrico pro capite" value={`${trattamentoAcque.consumoLitriPersonaGiorno} l/persona/giorno`} />
            <Riga label="Durezza in ingresso" value={`${trattamentoAcque.durezzaIngressoGf} °fH`} />
            <Riga label="Durezza residua obiettivo" value={`${trattamentoAcque.durezzaResiduaGf} °fH`} />
            <Riga label="Capacità di scambio ciclica specifica applicata" value={`${CAPACITA_CICLICA_RESINA_GF_L.toLocaleString("it-IT")} °fH·l/l resina`} />
            <Riga label="Portata di punta di riferimento" value={`${risultato.portataPuntaMc.toFixed(1)} m³/h`} />
            <Riga label="Rigenerazioni stimate" value={`${Math.round(risultato.numeroRigenerazioniAnno)}/anno`} />
            <Riga
              label="Consumo di sale stimato"
              value={`${Math.round(risultato.consumoSaleKgAnno)} kg/anno`}
              nota={`dosaggio ${DOSAGGIO_SALE_KG_PER_LITRO_RESINA * 1000} g/l resina per rigenerazione`}
            />
          </div>
        )}
      </div>

      {messaggio ? (
        <p className="text-xs text-slate-400">{messaggio}</p>
      ) : (
        <ul className="text-xs text-slate-500 list-disc list-inside">
          {consigliati.map((p) => (
            <li key={p.modello}>
              {p.marchio} {p.modello} — {p.volumeResinaLitri} L resina, {p.portataNominaleMc} m³/h
            </li>
          ))}
        </ul>
      )}
    </div>
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
