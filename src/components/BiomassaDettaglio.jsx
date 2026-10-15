import React from "react";
import { dimensionaBiomassa, descrizioneApparecchio } from "../utils/biomassa.js";
import { formattaEuro, formattaKw } from "../utils/export.js";

/**
 * Relazione per stufe e camini: potenza da cercare, consumi e costo del
 * combustibile, requisiti di installazione. Come per le altre categorie,
 * ogni numero è accompagnato dal passaggio che lo produce.
 */
export default function BiomassaDettaglio({ edificio, comune, biomassa }) {
  if (!edificio || !comune) return null;
  const r = dimensionaBiomassa({ risultatiAmbienti: edificio.risultatiAmbienti, comune, biomassa });
  const unita = r.combustibile.unitaVendita;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 text-sm">
      <div>
        <h3 className="font-semibold text-slate-800">Stufa o camino — {descrizioneApparecchio(r)}</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Norma di prodotto {r.norma}. Rendimento {Math.round(r.rendimento * 100)}% e potere calorifico{" "}
          {r.pciKwhKg.toFixed(1)} kWh/kg{biomassa.rendimento != null || biomassa.pciKwhKg != null ? " inseriti dall'utente" : " di riferimento"}.
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-slate-700 mb-1">Ambienti serviti</h4>
        {r.ambientiServiti.map((a) => (
          <Riga key={a.nome} label={a.nome} value={formattaKw(a.invernaleKw)} />
        ))}
        <Riga
          label="Carico invernale degli ambienti serviti"
          value={<strong>{formattaKw(r.caricoKw)}</strong>}
          nota="somma dei carichi al giorno più freddo: d'inverno il picco è lo stesso per tutte le stanze"
        />
      </div>

      <div>
        <h4 className="font-semibold text-slate-700 mb-1">Potenza nominale da cercare</h4>
        {r.sottoTagliaMinima ? (
          <Riga
            label="Taglia proposta"
            value={<strong>circa {r.tagliaMinimaKw} kW</strong>}
            nota={`il carico (${r.caricoKw.toFixed(2)} kW) è sotto la taglia più piccola in commercio per un apparecchio ${r.config.distribuzione === "idro" ? "idro" : "ad aria"}`}
          />
        ) : (
          <>
            <Riga label="Potenza minima" value={formattaKw(r.potenzaMinimaKw)} nota="pari al carico degli ambienti serviti" />
            <Riga
              label="Potenza massima"
              value={formattaKw(r.potenzaMassimaKw)}
              nota={`carico × ${r.margine.toFixed(2)}: ${
                r.config.combustibile === "pellet"
                  ? "il pellet modula, un margine del 25% non crea problemi"
                  : "la legna non modula, oltre il 10% la stufa lavorerebbe a fiamma bassa"
              }`}
            />
          </>
        )}
      </div>

      <div>
        <h4 className="font-semibold text-slate-700 mb-1">Consumo di {r.combustibile.etichetta.toLowerCase()}</h4>
        <Riga
          label="Calore utile per kg bruciato"
          value={`${r.energiaUtilePerKg.toFixed(2)} kWh/kg`}
          nota={`${r.pciKwhKg.toFixed(1)} kWh/kg × rendimento ${Math.round(r.rendimento * 100)}%`}
        />
        <Riga
          label="Consumo al giorno più freddo"
          value={`${r.consumoOrarioProgettoKg.toFixed(2)} kg/h`}
          nota={`${r.caricoKw.toFixed(2)} kW ÷ ${r.energiaUtilePerKg.toFixed(2)} kWh/kg`}
        />
        <Riga
          label="Ore equivalenti a pieno carico"
          value={`${Math.round(r.oreEquivalenti)} h/anno`}
          nota={`${r.gradiGiorno} gradi giorno × 24 ÷ ${r.deltaTProgetto} K × ${Math.round(r.quotaApportiGratuiti * 100)}% (al netto degli apporti gratuiti)`}
        />
        <Riga
          label="Calore fornito in un anno"
          value={`${Math.round(r.fabbisognoAnnuoKwh).toLocaleString("it-IT")} kWh`}
          nota={`${r.caricoKw.toFixed(2)} kW × ${Math.round(r.oreEquivalenti)} h × ${Math.round(r.quotaCopertura * 100)}% coperto dall'apparecchio`}
        />
        <Riga
          label="Combustibile in un anno"
          value={
            <strong>
              {Math.round(r.combustibileAnnuoKg).toLocaleString("it-IT")} kg · {Math.round(r.unitaAnno)} {unita.plurale}
            </strong>
          }
          nota={`${unita.nome} da ${unita.kg} kg`}
        />
        <Riga
          label="Costo del combustibile in un anno"
          value={<strong>{formattaEuro(r.costoAnnuo)}</strong>}
          nota={`${r.unitaAnno.toFixed(1)} ${unita.plurale} × ${formattaEuro(r.prezzoUnita)}${
            biomassa.prezzoUnita != null ? " (prezzo inserito)" : " (prezzo indicativo, da sostituire con quello reale)"
          }`}
        />
      </div>

      {r.avvertenze.length > 0 && (
        <div className="space-y-1.5">
          {r.avvertenze.map((a, i) => (
            <p key={i} className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
              {a}
            </p>
          ))}
        </div>
      )}

      <div>
        <h4 className="font-semibold text-slate-700 mb-1">Requisiti di installazione</h4>
        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
          {r.requisiti.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Riga({ label, value, nota }) {
  return (
    <div className="flex justify-between py-1 border-b border-slate-100 last:border-0">
      <span className="text-slate-500">
        {label}
        {nota && <span className="block text-[11px] text-slate-400">{nota}</span>}
      </span>
      <span className="font-medium text-slate-800 shrink-0 ml-3 text-right tabular-nums">{value}</span>
    </div>
  );
}
