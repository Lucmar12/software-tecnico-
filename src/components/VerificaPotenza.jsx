import React from "react";
import { TIPI_EDIFICIO, TIPI_GENERATORE, IPOTESI_EDIFICIO_EQUIVALENTE, eseguiVerifica, edificioEquivalente, haTetto } from "../utils/verificaPotenza.js";
import { geometriaSoffitto } from "../utils/stime.js";
import { OPZIONI_EPOCA } from "../utils/modelli.js";
import { formattaKw } from "../utils/export.js";

const inputCls =
  "mt-1 w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400";

const STILE_ESITO = {
  insufficiente: { classe: "bg-red-50 border-red-200 text-red-800", titolo: "Non basta" },
  adeguata: { classe: "bg-emerald-50 border-emerald-200 text-emerald-800", titolo: "Adeguata" },
  sovradimensionata: { classe: "bg-amber-50 border-amber-200 text-amber-800", titolo: "Basta, ma è sovradimensionata" },
};

/**
 * Verdetto e numeri della verifica. Usato sia sotto il modulo, mentre si
 * compila, sia nella relazione.
 */
export function EsitoVerifica({ risultato, compatto = false }) {
  if (!risultato) return null;
  const stile = STILE_ESITO[risultato.esito];
  const r = risultato;
  return (
    <div className={`rounded-xl border p-4 space-y-2 ${stile.classe}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-bold text-base">{stile.titolo}</span>
        <span className="text-sm font-semibold tabular-nums">copre il {Math.round(r.copertura * 100)}% del carico</span>
      </div>
      <p className="text-sm">
        La macchina rende {formattaKw(r.potenzaEffettivaKw)}
        {r.potenzaAcquaKw
          ? ` all'acqua dei termosifoni (su ${formattaKw(r.potenzaKw)} nominali: ${formattaKw(r.potenzaKw - r.potenzaAcquaKw)} scaldano solo il locale dove è installata)`
          : ""}
        {r.fattoreDerating < 1 ? ` al giorno più freddo (${formattaKw(r.potenzaKw)} di catalogo × ${r.fattoreDerating.toFixed(2)})` : ""}; la casa
        ne chiede {formattaKw(r.caricoKw)}
        {r.volumeM3 ? ` su ${Math.round(r.volumeM3)} m³, cioè ${Math.round((r.caricoKw * 1000) / r.volumeM3)} W/m³` : ""}.
      </p>
      {r.volumeMassimoM3 && (
        <p className="text-sm">
          Per una casa così basta fino a <strong>{Math.round(r.volumeMassimoM3)} m³</strong>
          {r.volumeIdealeMinimoM3 ? (
            <>
              ; è giusta, senza essere troppo grande, tra <strong>{Math.round(r.volumeIdealeMinimoM3)}</strong> e{" "}
              <strong>{Math.round(r.volumeMassimoM3)} m³</strong>
            </>
          ) : null}
          .
        </p>
      )}
      {!compatto && <p className="text-xs opacity-90">{r.potenzaAcquaKw ? r.tipo.nota.replace(/: controlla sulla scheda la potenza resa all'acqua\./, ": la verifica usa la potenza resa all'acqua che hai indicato.") : r.tipo.nota}</p>}
      {!compatto && !r.daAmbienti && (
        <p className="text-xs opacity-80">
          Carico stimato su un edificio equivalente — pianta quadrata, vetrate al{" "}
          {Math.round(IPOTESI_EDIFICIO_EQUIVALENTE.quotaVetrata * 100)}% del pavimento, esposizione neutra. Per il dato
          preciso descrivi gli ambienti nella tabella e scegli "dagli ambienti".
        </p>
      )}
    </div>
  );
}

/**
 * Modulo del calcolo inverso: si dà la potenza di una macchina e si
 * scopre se basta. Il risultato compare mentre si scrive, perché è la
 * risposta a una domanda precisa e non va cercata in fondo alla pagina.
 */
export default function VerificaPotenzaForm({ verifica, onChange, comune, edificio, ambientiDisponibili }) {
  const set = (campo, valore) => onChange({ ...verifica, [campo]: valore });
  const modalita = ambientiDisponibili ? verifica.modalita : "volume";
  const risultato = eseguiVerifica({ verifica: { ...verifica, modalita }, comune, edificio });
  const tipoGen = TIPI_GENERATORE[verifica.tipoGeneratore];
  const conTetto = haTetto(verifica.tipoEdificio);
  const falde = conTetto && verifica.soffitto === "dueFalde";
  // Superficie e geometria ricavate dallo stesso edificio equivalente usato
  // nel calcolo, così quello che si legge sotto i campi è quello calcolato.
  const ambientiEq = verifica.volumeM3 > 0 && verifica.altezzaM > 0 ? edificioEquivalente(verifica) : [];
  const superficieTotale = ambientiEq.reduce((s, a) => s + a.superficiePavimento, 0);
  const ultimoEq = ambientiEq[ambientiEq.length - 1];
  const geoUltimo = ultimoEq ? geometriaSoffitto(ultimoEq) : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Potenza nominale della macchina [kW]</span>
          <input type="number" min="0" step="0.5" className={inputCls} value={verifica.potenzaKw} onChange={(e) => set("potenzaKw", Number(e.target.value))} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Che macchina è?</span>
          <select className={inputCls} value={verifica.tipoGeneratore} onChange={(e) => set("tipoGeneratore", e.target.value)}>
            {Object.entries(TIPI_GENERATORE).map(([valore, t]) => (
              <option key={valore} value={valore}>
                {t.etichetta}
              </option>
            ))}
          </select>
        </label>
        {tipoGen?.idro && (
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-slate-500">Potenza resa all'acqua [kW] — facoltativa</span>
            <input
              type="number"
              min="0"
              step="0.1"
              className={inputCls}
              value={verifica.potenzaAcquaKw ?? ""}
              placeholder="dalla scheda tecnica, es. 24,6"
              onChange={(e) => set("potenzaAcquaKw", e.target.value === "" ? null : Number(e.target.value))}
            />
            <span className="text-[11px] text-slate-400">
              {verifica.potenzaAcquaKw > verifica.potenzaKw
                ? "Supera la nominale: non è possibile, si usa la nominale."
                : "È la parte che arriva ai termosifoni. Se la inserisci la verifica usa questa, non la nominale."}
            </span>
          </label>
        )}
      </div>

      {ambientiDisponibili && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-xs font-medium text-slate-500 self-center">Carico della casa:</span>
          {[
            ["volume", "stima da volume"],
            ["ambienti", "dagli ambienti della tabella"],
          ].map(([valore, etichetta]) => (
            <button
              key={valore}
              type="button"
              onClick={() => set("modalita", valore)}
              aria-pressed={modalita === valore}
              className={`px-3 py-1 rounded-lg border-2 ${modalita === valore ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"}`}
            >
              {etichetta}
            </button>
          ))}
        </div>
      )}

      {modalita === "volume" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Volume da scaldare [m³]</span>
            <input type="number" min="0" step="10" className={inputCls} value={verifica.volumeM3} onChange={(e) => set("volumeM3", Number(e.target.value))} />
          </label>
          <label className={`block ${falde && TIPI_EDIFICIO[verifica.tipoEdificio]?.piani === 1 ? "hidden" : ""}`}>
            <span className="text-xs font-medium text-slate-500">{falde ? "Altezza dei piani sotto [m]" : "Altezza dei locali [m]"}</span>
            <input type="number" min="2" step="0.05" className={inputCls} value={verifica.altezzaM} onChange={(e) => set("altezzaM", Number(e.target.value))} />
            <span className="text-[11px] text-slate-400">superficie: {superficieTotale > 0 ? Math.round(superficieTotale) : "—"} m²</span>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Che edificio è?</span>
            <select className={inputCls} value={verifica.tipoEdificio} onChange={(e) => set("tipoEdificio", e.target.value)}>
              {Object.entries(TIPI_EDIFICIO).map(([valore, t]) => (
                <option key={valore} value={valore}>
                  {t.etichetta}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Quando è stato costruito?</span>
            <select className={inputCls} value={verifica.epocaCostruttiva} onChange={(e) => set("epocaCostruttiva", e.target.value)}>
              {OPZIONI_EPOCA.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {conTetto && (
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Soffitto dell'ultimo piano</span>
              <select
                className={inputCls}
                value={verifica.soffitto ?? "piano"}
                onChange={(e) =>
                  onChange({
                    ...verifica,
                    soffitto: e.target.value,
                    // Proposta di partenza, da sostituire con le misure vere.
                    altezzaImpostaM: verifica.altezzaImpostaM ?? verifica.altezzaM,
                    altezzaColmoM: verifica.altezzaColmoM ?? Math.round((verifica.altezzaM + 1.5) * 100) / 100,
                  })
                }
              >
                <option value="piano">Piano</option>
                <option value="dueFalde">Inclinato, tetto a due falde</option>
              </select>
            </label>
          )}
          {falde && (
            <>
              <label className="block">
                <span className="text-xs font-medium text-slate-500">Altezza all'imposta [m]</span>
                <input
                  type="number"
                  min="0"
                  step="0.05"
                  className={inputCls}
                  value={verifica.altezzaImpostaM ?? ""}
                  onChange={(e) => set("altezzaImpostaM", e.target.value === "" ? null : Number(e.target.value))}
                />
                <span className="text-[11px] text-slate-400">la più bassa, lungo i muri sotto la gronda</span>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-500">Altezza al colmo [m]</span>
                <input
                  type="number"
                  min="0"
                  step="0.05"
                  className={inputCls}
                  value={verifica.altezzaColmoM ?? ""}
                  onChange={(e) => set("altezzaColmoM", e.target.value === "" ? null : Number(e.target.value))}
                />
                <span className="text-[11px] text-slate-400">
                  {geoUltimo?.inclinato
                    ? `media ${geoUltimo.altezzaMedia.toFixed(2)} m, falde ${Math.round(geoUltimo.superficieCopertura)} m²`
                    : "deve superare l'altezza all'imposta"}
                </span>
              </label>
            </>
          )}
        </div>
      )}

      {!comune ? (
        <p className="text-xs text-amber-700">Scegli il comune: il carico dipende dalla temperatura esterna di progetto.</p>
      ) : (
        <EsitoVerifica risultato={risultato} />
      )}
    </div>
  );
}
