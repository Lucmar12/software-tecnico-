import React, { useMemo, useState } from "react";
import { ELENCO_COMUNI, getComuniUmbria, correggiTemperaturaPerAltitudine } from "../data/comuni.js";

const BADGE_STILE = {
  UNI5364: "bg-emerald-100 text-emerald-800",
  UNI10339: "bg-emerald-100 text-emerald-800",
  derivata: "bg-amber-100 text-amber-800",
  manuale: "bg-sky-100 text-sky-800",
};

export function BadgeFonte({ fonte, children }) {
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${BADGE_STILE[fonte] || "bg-slate-100 text-slate-600"}`}>
      {children}
    </span>
  );
}

/**
 * Selettore comune a tre livelli:
 * 1) capoluoghi di provincia (dato diretto UNI 5364/UNI 10339)
 * 2) comuni non capoluogo, priorità Umbria (dato "derivata" per analogia)
 * 3) "Il mio comune non è in elenco" — capoluogo di riferimento più
 *    vicino + altitudine del proprio comune, con correzione UNI 10349.
 */
export default function ComuneSelector({ comuneEffettivo, onChange }) {
  const [ricerca, setRicerca] = useState("");
  const [soloUmbria, setSoloUmbria] = useState(true);
  const [modalitaManuale, setModalitaManuale] = useState(false);
  const [riferimentoManuale, setRiferimentoManuale] = useState("");
  const [altitudineManuale, setAltitudineManuale] = useState("");
  const [nomeComuneManuale, setNomeComuneManuale] = useState("");

  const comuniUmbria = useMemo(() => getComuniUmbria(), []);

  const elencoFiltrato = useMemo(() => {
    const base = soloUmbria ? comuniUmbria : ELENCO_COMUNI;
    if (!ricerca.trim()) return base;
    const q = ricerca.trim().toLowerCase();
    return base.filter((c) => c.nome.toLowerCase().includes(q));
  }, [ricerca, soloUmbria, comuniUmbria]);

  function selezionaComune(comune) {
    onChange({
      nome: comune.nome,
      zona: comune.zona,
      alt: comune.alt,
      teInv: comune.teInv,
      fonteInv: comune.fonteInv,
      tbse: comune.tbse,
      escursione: comune.escursione,
      fonteEst: comune.fonteEst,
      regione: comune.regione,
    });
    setModalitaManuale(false);
  }

  function confermaManuale() {
    const riferimento = ELENCO_COMUNI.find((c) => c.nome === riferimentoManuale);
    if (!riferimento || altitudineManuale === "" || !nomeComuneManuale.trim()) return;
    const altComune = Number(altitudineManuale);
    const teInvCorretta = correggiTemperaturaPerAltitudine(riferimento.teInv, riferimento.alt, altComune);
    onChange({
      nome: nomeComuneManuale.trim(),
      zona: riferimento.zona,
      alt: altComune,
      teInv: teInvCorretta,
      fonteInv: "manuale",
      tbse: riferimento.tbse,
      escursione: riferimento.escursione,
      fonteEst: "manuale",
      comuneRiferimento: riferimento.nome,
      regione: riferimento.regione,
    });
  }

  return (
    <div className="space-y-3">
      {!modalitaManuale ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={ricerca}
              onChange={(e) => setRicerca(e.target.value)}
              placeholder="Cerca comune..."
              className="flex-1 min-w-[160px] border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={() => setSoloUmbria((v) => !v)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                soloUmbria ? "bg-brand-600 text-white border-brand-600 hover:bg-brand-700" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
              }`}
            >
              Filtro Umbria
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
            {elencoFiltrato.length === 0 && (
              <div className="p-3 text-sm text-slate-400">Nessun comune trovato.</div>
            )}
            {elencoFiltrato.map((c) => (
              <button
                key={c.nome}
                onClick={() => selezionaComune(c)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-50 ${
                  comuneEffettivo?.nome === c.nome ? "bg-brand-50" : ""
                }`}
              >
                <span>
                  {c.nome}
                  {c.regione === "Umbria" && <span className="ml-1 text-[10px] text-brand-600 font-semibold">UMBRIA</span>}
                  <span className="ml-2 text-xs text-slate-400">Zona {c.zona} · {c.alt} m slm</span>
                </span>
                <BadgeFonte fonte={c.fonteInv}>{c.fonteInv === "derivata" ? "derivata" : "UNI 5364"}</BadgeFonte>
              </button>
            ))}
          </div>

          <button
            onClick={() => setModalitaManuale(true)}
            className="text-sm text-brand-700 underline hover:text-brand-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 rounded"
          >
            Il mio comune non è in elenco
          </button>
        </>
      ) : (
        <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50">
          <p className="text-xs text-slate-500">
            Scegli il capoluogo di riferimento più vicino e inserisci nome e altitudine del tuo comune: la
            temperatura invernale di progetto verrà corretta per altitudine secondo il metodo UNI 10349 (±1°C ogni
            200 m di dislivello, oltre i 200 m di soglia).
          </p>
          <input
            type="text"
            placeholder="Nome del tuo comune"
            value={nomeComuneManuale}
            onChange={(e) => setNomeComuneManuale(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={riferimentoManuale}
            onChange={(e) => setRiferimentoManuale(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Capoluogo di riferimento...</option>
            {ELENCO_COMUNI.filter((c) => c.livello === 1).map((c) => (
              <option key={c.nome} value={c.nome}>
                {c.nome} ({c.alt} m slm, {c.teInv}°C)
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Altitudine del tuo comune [m slm]"
            value={altitudineManuale}
            onChange={(e) => setAltitudineManuale(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={confermaManuale}
              className="px-3 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              Conferma
            </button>
            <button
              onClick={() => setModalitaManuale(false)}
              className="px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {comuneEffettivo && (
        <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 text-sm">
          <div className="font-semibold text-brand-900">
            {comuneEffettivo.nome} — Zona climatica {comuneEffettivo.zona}
            {comuneEffettivo.comuneRiferimento && (
              <span className="text-xs font-normal text-slate-500"> (rif. {comuneEffettivo.comuneRiferimento})</span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-slate-600">
            <span>
              T. invernale progetto: <strong>{comuneEffettivo.teInv} °C</strong>{" "}
              <BadgeFonte fonte={comuneEffettivo.fonteInv}>
                {comuneEffettivo.fonteInv === "UNI5364" ? "UNI 5364" : comuneEffettivo.fonteInv === "manuale" ? "inserimento manuale + correzione altimetrica" : "derivata"}
              </BadgeFonte>
            </span>
            <span>
              T. estiva progetto: <strong>{comuneEffettivo.tbse} °C</strong>{" "}
              <BadgeFonte fonte={comuneEffettivo.fonteEst}>
                {comuneEffettivo.fonteEst === "UNI10339" ? "UNI 10339" : comuneEffettivo.fonteEst === "manuale" ? "inserimento manuale" : "derivata"}
              </BadgeFonte>
            </span>
            <span>Escursione termica: <strong>{comuneEffettivo.escursione} °C</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
