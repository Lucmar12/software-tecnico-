import React from "react";
import { trovaFotovoltaicoConsigliati } from "../data/catalogo.js";
import { stimaAreaGeografica, stimaConsumoAnnuoClimatizzazione, calcolaCoperturaFotovoltaico } from "../utils/fotovoltaico.js";

const ETICHETTA_AREA = { nord: "Nord Italia", centro: "Centro Italia/Umbria", sud_isole: "Sud Italia e Isole" };

/** Dettaglio della copertura, tramite fotovoltaico, dei consumi elettrici dell'impianto di climatizzazione dimensionato. */
export default function FotovoltaicoDettaglio({ edificio, comune, fotovoltaico }) {
  if (!fotovoltaico.attivo) return null;

  const area = stimaAreaGeografica(comune);
  const consumo = stimaConsumoAnnuoClimatizzazione({
    totaleInvernaleKw: edificio.totaleInvernaleKw,
    totaleEstivoKw: edificio.totaleEstivoKw,
    comune,
  });
  const copertura = calcolaCoperturaFotovoltaico({
    kWp: fotovoltaico.kWp,
    consumoAnnuoKwh: consumo.consumoAnnuoKwh,
    areaGeografica: area,
    conAccumulo: fotovoltaico.conAccumulo,
  });
  const { consigliati, messaggio } = trovaFotovoltaicoConsigliati(fotovoltaico.kWp);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-slate-800">Copertura fotovoltaico — impianto di climatizzazione</h3>
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
        Stima con producibilità media indicativa per {ETICHETTA_AREA[area]} ({copertura.producibilitaSpecifica} kWh/kWp/anno)
        e classe energetica rappresentativa {consumo.classeRappresentativa}: non sostituisce un calcolo di
        producibilità puntuale (orientamento, inclinazione, ombreggiamenti reali).
      </p>
      <div className="grid sm:grid-cols-4 gap-3 text-sm">
        <Riquadro label="Consumo annuo stimato" value={`${Math.round(consumo.consumoAnnuoKwh).toLocaleString("it-IT")} kWh`} />
        <Riquadro label="Producibilità FV annua" value={`${Math.round(copertura.producibilitaAnnuaKwh).toLocaleString("it-IT")} kWh`} />
        <Riquadro label="Quota autoconsumo" value={`${(copertura.quotaAutoconsumo * 100).toFixed(0)}%`} />
        <Riquadro
          label="Copertura consumi climatizzazione"
          value={`${copertura.coperturaPct.toFixed(0)}%`}
          evidenziato
        />
      </div>
      {messaggio ? (
        <p className="text-xs text-slate-400">{messaggio}</p>
      ) : (
        <ul className="text-xs text-slate-500 list-disc list-inside">
          {consigliati.map((p) => (
            <li key={p.modello}>
              {p.marchio} {p.modello} — {p.potenzaKw} kWp
              {p.schedaTecnicaUrl && (
                <>
                  {" "}
                  <a href={p.schedaTecnicaUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                    scheda ↗
                  </a>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Riquadro({ label, value, evidenziato }) {
  return (
    <div className={`rounded-lg p-3 border ${evidenziato ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
      <div className={`text-xs ${evidenziato ? "text-emerald-700" : "text-slate-500"}`}>{label}</div>
      <div className={`text-xl font-bold ${evidenziato ? "text-emerald-800" : "text-slate-800"}`}>{value}</div>
    </div>
  );
}
