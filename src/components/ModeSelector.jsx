import React from "react";

/**
 * Schermata iniziale di selezione modalità. È la prima scelta che
 * l'utente compie: definisce il flusso, la profondità dell'input e lo
 * scopo finale dell'output (consulenza tecnica vs. preventivo
 * commerciale), pur condividendo lo stesso motore di calcolo normativo.
 */
export default function ModeSelector({ onSelect }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          Dimensionamento impianti di climatizzazione residenziale
        </h1>
        <p className="text-slate-500 mt-2">
          Metodologia UNI EN 12831 · metodo Carrier (UNI 10339) · UNI 9182 — Umbria e Italia
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <button
          onClick={() => onSelect("ingegnere")}
          className="text-left bg-white border border-slate-200 rounded-2xl p-6 hover:border-brand-400 hover:shadow-lg active:scale-[0.99] transition group focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-600 mb-2">Consulenza tecnica</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-brand-700">Ingegnere / Tecnico</h2>
          <p className="text-sm text-slate-600 mb-4">
            Input granulare ambiente per ambiente, coefficienti normativi sovrascrivibili, confronto tra scenari
            (es. stato di fatto vs. riqualificazione). Output: relazione di calcolo con ogni formula, coefficiente e
            riferimento normativo, per costruire la propria valutazione progettuale.
          </p>
          <ul className="text-sm text-slate-500 space-y-1 list-disc list-inside">
            <li>Dettaglio calcolo tecnico sempre aperto</li>
            <li>Analisi critica del fabbisogno (trasmissione vs. ventilazione)</li>
            <li>Catalogo come tabella tecnica comparativa</li>
            <li>Relazione esportabile e stampabile</li>
          </ul>
        </button>

        <button
          onClick={() => onSelect("venditore")}
          className="text-left bg-white border border-slate-200 rounded-2xl p-6 hover:border-brand-400 hover:shadow-lg active:scale-[0.99] transition group focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-brand-600 mb-2">Preventivo commerciale</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-brand-700">Venditore / Installatore</h2>
          <p className="text-sm text-slate-600 mb-4">
            Input semplificato, pochi minuti da mobile durante o dopo il sopralluogo, con default automatici
            dichiarati come stima. Output: card prodotto visive, prezzo in evidenza, form di richiesta preventivo in
            primo piano.
          </p>
          <ul className="text-sm text-slate-500 space-y-1 list-disc list-inside">
            <li>Calcolo sintetico, dettaglio a un tap</li>
            <li>Card prodotto con prezzo e badge "Consigliato"</li>
            <li>Confronto costo in bolletta tra classi energetiche</li>
            <li>Richiesta preventivo pre-compilata</li>
          </ul>
        </button>
      </div>

      <p className="text-center text-xs text-slate-400 mt-8">
        Puoi passare da una modalità all'altra in qualsiasi momento senza perdere i dati inseriti.
      </p>
    </div>
  );
}
