import React from "react";

/**
 * Selettore del tipo di impianto da dimensionare: climatizzazione
 * (condizionatori/pompe di calore) e/o acqua calda sanitaria
 * (bollitori/scaldacqua). Determina quali sezioni di input e di output
 * vengono mostrate, per mantenere il flusso pertinente ed evitare di
 * chiedere/mostrare dati non necessari.
 */
const CHIAVI_TIPO_IMPIANTO = ["climatizzazione", "acs", "trattamentoAcque", "pompeIdrauliche"];

export default function TipoImpiantoSelector({ tipiImpianto, onChange }) {
  function toggle(chiave) {
    const aggiornato = { ...tipiImpianto, [chiave]: !tipiImpianto[chiave] };
    // Almeno una selezione deve restare attiva.
    if (!CHIAVI_TIPO_IMPIANTO.some((k) => aggiornato[k])) return;
    onChange(aggiornato);
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <Opzione
        attivo={tipiImpianto.climatizzazione}
        onClick={() => toggle("climatizzazione")}
        titolo="Climatizzazione"
        descrizione="Condizionatori e pompe di calore — riscaldamento e/o raffrescamento ambienti"
        icona="❄️"
      />
      <Opzione
        attivo={tipiImpianto.acs}
        onClick={() => toggle("acs")}
        titolo="Acqua calda sanitaria"
        descrizione="Bollitori e scaldacqua — fabbisogno ACS secondo UNI 9182"
        icona="🚿"
      />
      <Opzione
        attivo={tipiImpianto.trattamentoAcque}
        onClick={() => toggle("trattamentoAcque")}
        titolo="Trattamento acque"
        descrizione="Addolcitori a scambio ionico — dimensionamento secondo UNI EN 14743"
        icona="💧"
      />
      <Opzione
        attivo={tipiImpianto.pompeIdrauliche}
        onClick={() => toggle("pompeIdrauliche")}
        titolo="Pompe idrauliche"
        descrizione="Autoclavi, pompe di sollevamento e circolazione — dimensionamento secondo UNI 9182"
        icona="🔧"
      />
    </div>
  );
}

function Opzione({ attivo, onClick, titolo, descrizione, icona }) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border-2 p-4 transition-all duration-150 active:scale-[0.99] ${
        attivo
          ? "border-brand-500 bg-brand-50 shadow-md shadow-brand-500/10"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">{icona}</span>
        <span className="font-semibold text-slate-800">{titolo}</span>
        <span
          className={`ml-auto h-5 w-5 rounded-md border-2 flex items-center justify-center text-white text-xs shrink-0 transition-colors duration-150 ${
            attivo ? "bg-brand-600 border-brand-600" : "border-slate-300"
          }`}
        >
          {attivo && "✓"}
        </span>
      </div>
      <p className="text-xs text-slate-500 mt-1">{descrizione}</p>
    </button>
  );
}
