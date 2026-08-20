import React from "react";
import { calcolaBollitore } from "../data/calculations.js";
import { trovaScaldacquaPdCConsigliati, trovaProdottiConsigliati } from "../data/catalogo.js";
import { calcolaPotenzaPompaCaloreAcs, calcolaConsumoAnnuoAcsPompaDiCalore } from "../utils/pompaDiCaloreAcs.js";
import { calcolaPotenzaNominaleRichiesta } from "../utils/deratingPompaDiCalore.js";
import { formattaKw } from "../utils/export.js";

const ETICHETTA_GENERATORE = {
  pompa_di_calore_integrata: "Scaldacqua a pompa di calore (accumulo + PdC integrati)",
  pompa_di_calore_dedicata: "Bollitore con pompa di calore aria-acqua dedicata",
};

/**
 * Dimensionamento della potenza [kW] della pompa di calore per la
 * produzione di ACS — non è solo una scelta di capacità in litri: la
 * macchina va scelta anche in base alla potenza termica necessaria per
 * ricaricare l'accumulo nel tempo desiderato (vedi
 * utils/pompaDiCaloreAcs.js). Per la pompa di calore dedicata (unità
 * esterna aria-acqua) si applica anche il derating per temperatura
 * esterna di progetto: lo scaldacqua integrato, che tipicamente preleva
 * aria da un locale tecnico a temperatura più stabile, ne è escluso.
 */
export default function PompaCaloreAcsDettaglio({ acs, comune }) {
  if (!acs.generatore || acs.generatore === "elettrico") return null;

  const bollitore = calcolaBollitore(acs.numeroPersone, acs.abitudine);
  const potenza = calcolaPotenzaPompaCaloreAcs({
    capacitaLitri: bollitore.litriConsigliati,
    tempoRicaricaOre: acs.tempoRicaricaOre,
    cop: acs.cop,
  });
  const consumoElettricoAnnoKwh = calcolaConsumoAnnuoAcsPompaDiCalore(bollitore.kWhAnno, acs.cop);
  const risparmioVsElettricoKwh = bollitore.kWhAnno - consumoElettricoAnnoKwh;

  const perIntegrata = acs.generatore === "pompa_di_calore_integrata";
  const derating =
    !perIntegrata && comune?.teInv != null ? calcolaPotenzaNominaleRichiesta(potenza.potenzaTermicaRichiestaKw, comune.teInv) : null;
  const potenzaRicercaCatalogo = derating ? derating.potenzaNominaleRichiestaKw : potenza.potenzaTermicaRichiestaKw;

  const risultatoCatalogo = perIntegrata
    ? trovaScaldacquaPdCConsigliati(bollitore.litriConsigliati, potenza.potenzaTermicaRichiestaKw)
    : trovaProdottiConsigliati(potenzaRicercaCatalogo, "pompa_di_calore_aria_acqua");

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-slate-800">Dimensionamento pompa di calore ACS — {ETICHETTA_GENERATORE[acs.generatore]}</h3>
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
        La potenza non deriva da una norma specifica ma da un bilancio energetico su tempo di ricarica e COP
        dichiarati: verificare sempre le curve di resa reali del modello selezionato alla temperatura dell'aria
        esterna di progetto.
      </p>
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <Riga label="Capacità accumulo di riferimento" value={`${bollitore.litriConsigliati.toFixed(0)} L`} />
        <Riga label="Salto termico (rete → set-point)" value={`${potenza.deltaT} K`} />
        <Riga label="Energia termica per ricarica" value={`${potenza.energiaTermicaRichiestaKwh.toFixed(1)} kWh`} />
        <Riga label="Tempo di ricarica desiderato" value={`${potenza.tempoRicaricaOre} h`} />
        <Riga label="COP di riferimento" value={potenza.cop} />
        <Riga label="Potenza termica richiesta (a condizioni reali)" value={<strong>{formattaKw(potenza.potenzaTermicaRichiestaKw)}</strong>} />
        <Riga label="Potenza elettrica assorbita stimata" value={formattaKw(potenza.potenzaElettricaAssorbitaKw)} />
        {derating && (
          <>
            <Riga
              label="Fattore di derating per temperatura esterna"
              value={`× ${derating.fattoreDerating.toFixed(2)}`}
              nota={`unità esterna aria-acqua a ${comune.teInv}°C, rispetto al punto di prova standard +7°C`}
            />
            <Riga label="Potenza nominale richiesta (punto di prova +7°C)" value={<strong>{formattaKw(derating.potenzaNominaleRichiestaKw)}</strong>} />
          </>
        )}
      </div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm">
        <div className="text-xs text-emerald-700">Consumo elettrico annuo stimato</div>
        <div className="text-lg font-bold text-emerald-800">{Math.round(consumoElettricoAnnoKwh).toLocaleString("it-IT")} kWh/anno</div>
        <div className="text-xs text-emerald-700 mt-0.5">
          {Math.round(risparmioVsElettricoKwh).toLocaleString("it-IT")} kWh/anno in meno rispetto a un bollitore elettrico a resistenza,
          a parità di fabbisogno
        </div>
      </div>

      {risultatoCatalogo.messaggio ? (
        <p className="text-xs text-slate-400">{risultatoCatalogo.messaggio}</p>
      ) : (
        <ul className="text-xs text-slate-500 list-disc list-inside">
          {risultatoCatalogo.consigliati.map((p) => (
            <li key={p.modello}>
              {p.marchio} {p.modello} — {perIntegrata ? `${p.capacitaLitri} L, ${p.potenzaKw} kW, COP ${p.scop}` : `${p.potenzaKw} kW, SCOP ${p.scop}`}
              {!perIntegrata && " (da abbinare a un accumulo puro dedicato all'ACS)"}
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
