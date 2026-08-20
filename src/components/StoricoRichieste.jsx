import React, { useState } from "react";
import { elencaStoricoRichieste } from "../utils/persistenza.js";

const ETICHETTA_CANALE = { email: "Email", whatsapp: "WhatsApp", copia: "Copia appunti" };

/**
 * Storico locale delle richieste di preventivo inviate da QUESTO
 * dispositivo/browser. Utile al singolo installatore/tecnico per
 * rivedere le proprie richieste; NON aggrega dati da altri dispositivi
 * o altri installatori della rete — per quello serve una dashboard con
 * backend condiviso (vedi nota).
 */
export default function StoricoRichieste() {
  const [aperto, setAperto] = useState(false);
  const [storico, setStorico] = useState(() => elencaStoricoRichieste());

  return (
    <div className="relative no-print">
      <button
        onClick={() => {
          setStorico(elencaStoricoRichieste());
          setAperto((v) => !v);
        }}
        className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:border-brand-400 hover:text-brand-700 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400"
      >
        🕘 Storico richieste
      </button>
      {aperto && (
        <div className="absolute z-40 mt-2 w-80 right-0 bg-white border border-slate-200 rounded-xl shadow-xl p-3 space-y-2">
          <p className="text-[11px] text-slate-400">
            Solo le richieste inviate da questo dispositivo. Non è una dashboard condivisa con altri
            installatori/dispositivi.
          </p>
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {storico.length === 0 && <p className="text-xs text-slate-400 py-2">Nessuna richiesta inviata finora da questo dispositivo.</p>}
            {storico.map((r) => (
              <div key={r.id} className="py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">{r.clienteFinale || r.comune || "Richiesta"}</span>
                  <span className="text-[11px] text-slate-400">{ETICHETTA_CANALE[r.canale] || r.canale}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {new Date(r.inviatoIl).toLocaleString("it-IT")} · {r.nProdotti} prodotti
                  {r.prioritaria && <span className="ml-1 text-amber-600 font-semibold">· prioritaria</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
