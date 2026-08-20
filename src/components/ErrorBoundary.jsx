import React from "react";
import { eliminaBozza } from "../utils/persistenza.js";

/**
 * Rete di sicurezza per errori imprevisti a runtime: senza questo
 * componente, un errore in un qualunque punto dell'albero React fa
 * sparire l'intera interfaccia (pagina bianca, nessuna spiegazione).
 * Mostra invece un messaggio comprensibile con un'azione di recupero
 * (ripristino allo stato iniziale, utile se la causa è una bozza salvata
 * incompatibile con una versione più recente dell'applicazione).
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { errore: null };
  }

  static getDerivedStateFromError(errore) {
    return { errore };
  }

  componentDidCatch(errore, info) {
    console.error("Errore non gestito nell'interfaccia:", errore, info);
  }

  render() {
    if (!this.state.errore) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 space-y-4 text-center">
          <h1 className="text-lg font-bold text-slate-800">Si è verificato un errore imprevisto</h1>
          <p className="text-sm text-slate-500">
            L'interfaccia ha incontrato un problema e non può continuare. La causa più comune è un progetto salvato
            su questo dispositivo non più compatibile con la versione corrente dell'applicazione.
          </p>
          <p className="text-[11px] text-slate-400 font-mono bg-slate-50 border border-slate-200 rounded p-2 text-left break-words">
            {this.state.errore.message}
          </p>
          <button
            onClick={() => {
              eliminaBozza();
              window.location.reload();
            }}
            className="w-full px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
          >
            Ripristina e ricarica l'applicazione
          </button>
          <p className="text-[11px] text-slate-400">
            Questa azione cancella solo la bozza automatica salvata in locale, non i progetti salvati esplicitamente.
          </p>
        </div>
      </div>
    );
  }
}
