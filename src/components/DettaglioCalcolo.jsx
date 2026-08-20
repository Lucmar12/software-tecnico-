import React, { useState } from "react";
import {
  TEMP_INTERNA_PROGETTO,
  TEMP_INTERNA_ESTIVA,
  FATTORE_ESPOSIZIONE,
  APPORTO_SOLARE,
  ETICHETTE_TIPO_LOCALE,
} from "../data/calculations.js";

function Riga({ label, value, nota }) {
  return (
    <div className="flex justify-between py-1 border-b border-slate-100 last:border-0 text-sm">
      <span className="text-slate-500">
        {label}
        {nota && <span className="block text-[11px] text-slate-400">{nota}</span>}
      </span>
      <span className="font-medium text-slate-800 shrink-0 ml-3 text-right tabular-nums">{value}</span>
    </div>
  );
}

/**
 * Pannello "Dettaglio calcolo tecnico": riporta ogni passaggio, il
 * coefficiente applicato e la norma di riferimento per un singolo
 * ambiente, secondo UNI EN 12831 (invernale) e metodo Carrier / UNI 10339
 * (estivo). Aperto di default; `defaultOpen` resta configurabile dal
 * chiamante per contesti specifici (es. collassato nella card prodotto).
 *
 * Il kW è sempre il valore primario. Il BTU/h (taglia commerciale split)
 * ha senso solo quando l'ambiente sarà servito da un climatizzatore
 * split/multisplit indipendente: va nascosto quando l'edificio è servito
 * da un sistema centralizzato (VRF/chiller), segmento in cui non si usa.
 */
export default function DettaglioCalcolo({ risultato, comune, defaultOpen = false, mostraBtu = true }) {
  const [aperto, setAperto] = useState(defaultOpen);
  const {
    ambiente,
    U,
    teInv,
    tbse,
    componentiInvolucro,
    scomposizioneInvernale,
    nonStandard,
    ricambiAriaOra,
    maggiorazionePontiTermici,
    frazioneNonRiscaldata,
    incrementoSoleAria,
  } = risultato;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setAperto((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 text-sm font-medium text-slate-700"
      >
        <span>Dettaglio calcolo tecnico — {ambiente.nome}</span>
        <span className="text-slate-400">{aperto ? "▲ nascondi" : "▼ mostra"}</span>
      </button>
      {aperto && (
        <div className="p-4 space-y-4 text-sm">
          {nonStandard && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded p-2">
              Calcolo con coefficienti sovrascritti dal tecnico: non è un calcolo standard a valori tabellari.
            </div>
          )}

          <div>
            <h4 className="font-semibold text-slate-700 mb-1">Dati climatici di progetto</h4>
            <Riga label="Temperatura interna di progetto (invernale)" value={`${TEMP_INTERNA_PROGETTO} °C`} nota="DPR 412/93, uso residenziale" />
            <Riga label="Temperatura esterna di progetto invernale" value={`${teInv} °C`} nota={comune.fonteInv === "UNI5364" ? "UNI 5364" : comune.fonteInv === "manuale" ? "inserimento manuale, corretta per altitudine (UNI 10349)" : "derivata per analogia (UNI 10349)"} />
            <Riga label="ΔT invernale" value={`${(TEMP_INTERNA_PROGETTO - teInv).toFixed(1)} K`} />
            <Riga label="Temperatura interna di progetto (estiva)" value={`${TEMP_INTERNA_ESTIVA} °C`} />
            <Riga label="Temperatura a bulbo secco estiva di progetto" value={`${tbse} °C`} nota={comune.fonteEst === "UNI10339" ? "UNI 10339" : "derivata/manuale"} />
            <Riga label="ΔT estivo" value={`${(tbse - TEMP_INTERNA_ESTIVA).toFixed(1)} K`} />
          </div>

          <div>
            <h4 className="font-semibold text-slate-700 mb-1">Trasmittanze applicate [W/m²K]</h4>
            <Riga label="Muro (U)" value={U.muro} />
            <Riga label="Tetto/copertura (U)" value={U.tetto} />
            <Riga label="Pavimento (U)" value={U.pavimento} />
            <Riga label="Serramenti/vetro (U)" value={U.vetro} />
          </div>

          <div className="border-l-2 border-sky-300 bg-sky-50/40 rounded-r-lg pl-3 pr-2 py-2 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wide text-sky-600">Invernale</span>

            <div>
              <h4 className="font-semibold text-slate-700 mb-1">Dispersione per trasmissione (UNI EN 12831)</h4>
              <Riga label="Componente muri" value={`${componentiInvolucro.muri.kw.toFixed(3)} kW (${componentiInvolucro.muri.pct.toFixed(0)}%)`} />
              <Riga label="Componente serramenti" value={`${componentiInvolucro.vetri.kw.toFixed(3)} kW (${componentiInvolucro.vetri.pct.toFixed(0)}%)`} />
              <Riga label="Componente copertura" value={`${componentiInvolucro.tetto.kw.toFixed(3)} kW (${componentiInvolucro.tetto.pct.toFixed(0)}%)`} nota={ambiente.ultimoPiano ? "ambiente all'ultimo piano" : "non applicabile"} />
              <Riga label="Componente pavimento contro terra" value={`${componentiInvolucro.pavimento.kw.toFixed(3)} kW (${componentiInvolucro.pavimento.pct.toFixed(0)}%)`} nota={ambiente.pianoTerra ? "ambiente a piano terra, coeff. 0,7" : "non applicabile"} />
              <Riga label="Fattore correttivo esposizione" value={`× ${FATTORE_ESPOSIZIONE[ambiente.esposizionePrevalente]}`} nota={`esposizione ${ambiente.esposizionePrevalente}`} />
              <Riga label="Fattore correttivo posizione in edificio" value={`× ${ambiente.ultimoPiano ? "1,15 (ultimo piano)" : ambiente.pianoTerra ? "1,10 (piano terra)" : "1,00 (piano intermedio)"}`} />
              {frazioneNonRiscaldata > 0 && (
                <Riga
                  label="Riduzione per parete verso locale non riscaldato (fattore b)"
                  value={`${(frazioneNonRiscaldata * 100).toFixed(0)}% della parete a ΔT ridotto × 0,5`}
                  nota="UNI EN 12831, dispersione verso ambiente a temperatura intermedia"
                />
              )}
              <Riga
                label="Maggiorazione ponti termici"
                value={`+${(maggiorazionePontiTermici * 100).toFixed(0)}%`}
                nota="UNI EN 12831, valore forfettario per epoca costruttiva"
              />
              <Riga label="Totale dispersione per trasmissione" value={`${scomposizioneInvernale.trasmissioneKw.toFixed(3)} kW (${scomposizioneInvernale.quotaTrasmissionePct.toFixed(0)}% del carico invernale)`} />
            </div>

            <div>
              <h4 className="font-semibold text-slate-700 mb-1">Dispersione per ventilazione (UNI EN 12831 / UNI 10339)</h4>
              <Riga
                label="Ricambi d'aria orari convenzionali"
                value={`${ricambiAriaOra} vol/h`}
                nota={`${ETICHETTE_TIPO_LOCALE[ambiente.tipoLocale] || ETICHETTE_TIPO_LOCALE.altro}, uso residenziale UNI 10339`}
              />
              <Riga label="Volume ambiente" value={`${(ambiente.superficiePavimento * ambiente.altezza).toFixed(1)} m³`} />
              <Riga label="Totale dispersione per ventilazione" value={`${scomposizioneInvernale.ventilazioneKw.toFixed(3)} kW (${scomposizioneInvernale.quotaVentilazionePct.toFixed(0)}% del carico invernale)`} />
            </div>

            <div>
              <h4 className="font-semibold text-slate-700 mb-1">Carico termico invernale di progetto</h4>
              <Riga label="Totale (trasmissione + ventilazione)" value={<strong>{scomposizioneInvernale.totaleKw.toFixed(3)} kW</strong>} />
            </div>
          </div>

          <div className="border-l-2 border-amber-300 bg-amber-50/40 rounded-r-lg pl-3 pr-2 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600">Estivo</span>
            <h4 className="font-semibold text-slate-700 mb-1 mt-1">Carico termico estivo di progetto (metodo Carrier)</h4>
            <Riga
              label="Incremento sole-aria su superfici opache"
              value={`+${incrementoSoleAria} K`}
              nota={`esposizione ${ambiente.esposizionePrevalente}, irraggiamento su pareti`}
            />
            <Riga label="Apporto solare per esposizione" value={`${APPORTO_SOLARE[ambiente.esposizionePrevalente]} W/m² vetro`} />
            <Riga label="Apporto persone" value="130 W/persona" />
            <Riga label="Apporto apparecchiature" value="8 W/m²" />
            <Riga label="Margine di sicurezza" value="+10%" />
            <Riga label="Totale carico estivo" value={<strong>{risultato.estivoKw.toFixed(3)} kW</strong>} />
          </div>

          <div className="bg-brand-50 border border-brand-200 rounded-lg p-3">
            <h4 className="font-semibold text-brand-800 mb-1">
              Fabbisogno di dimensionamento{mostraBtu ? " e taglia commerciale" : ""}
            </h4>
            <Riga
              label="Fabbisogno di dimensionamento (max invernale/estivo)"
              value={
                <strong>
                  {risultato.fabbisognoDimensionamento.toFixed(3)} kW
                  {mostraBtu && ` ≈ ${Math.round(risultato.fabbisognoDimensionamento * 3412).toLocaleString("it-IT")} BTU/h`}
                </strong>
              }
            />
            {mostraBtu && (
              <Riga
                label="Taglia commerciale suggerita (split)"
                value={
                  risultato.tagliaCommerciale.disponibile
                    ? `${(risultato.tagliaCommerciale.btu / 3412).toFixed(1)} kW (${risultato.tagliaCommerciale.btu.toLocaleString("it-IT")} BTU/h)`
                    : risultato.tagliaCommerciale.messaggio
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
