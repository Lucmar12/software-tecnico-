import React from "react";

/**
 * Avviso unico: è una stima a spanne, non un calcolo di progetto. Lo
 * stesso testo ovunque compaia un numero che qualcuno potrebbe usare per
 * comprare, così nessuno può leggerlo come un progetto firmato.
 */
import { BRANDING_FISSO } from "../utils/brandingFisso.js";

export const TESTO_AVVISO_STIMA = `Dimensionamento di massima a carattere puramente indicativo. I valori sono ottenuti con metodi semplificati e parametri convenzionali: non costituiscono progetto termotecnico né calcolo professionale ai sensi della normativa vigente. Ogni scelta di acquisto e installazione deve essere verificata da un tecnico abilitato. ${BRANDING_FISSO.nomeAzienda} declina ogni responsabilità per decisioni assunte sulla sola base dei presenti risultati.`;

export default function AvvisoStima({ compatto = false }) {
  if (compatto) return <p className="text-xs text-slate-500 italic">{TESTO_AVVISO_STIMA}</p>;
  return (
    <div className="rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <strong>Avvertenza.</strong> {TESTO_AVVISO_STIMA}
    </div>
  );
}
