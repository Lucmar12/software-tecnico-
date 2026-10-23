import React, { useState } from "react";
import { profiloVuoto, profiloCompilato, salvaProfilo, eliminaProfilo, riduciLogo } from "../utils/profiloProfessionista.js";

const inputCls =
  "mt-1 w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400";

/**
 * Pannello in cui un professionista inserisce i propri dati per firmare la
 * relazione. Sta accanto a "Progetti salvati", fuori dal percorso di
 * calcolo: il privato non lo incontra mai sulla propria strada, chi lo
 * cerca lo trova subito.
 */
export default function ProfiloProfessionistaPanel({ profilo, onChange }) {
  const [aperto, setAperto] = useState(false);
  const [bozza, setBozza] = useState(profilo);
  const [messaggio, setMessaggio] = useState("");
  const compilato = profiloCompilato(profilo);

  function apri() {
    setBozza(profilo);
    setMessaggio("");
    setAperto((v) => !v);
  }

  async function caricaLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const logo = await riduciLogo(file);
      setBozza((b) => ({ ...b, logo }));
      setMessaggio("");
    } catch (errore) {
      setMessaggio(errore.message);
    }
  }

  function salva() {
    if (!profiloCompilato(bozza)) {
      setMessaggio("Inserisci almeno il nome dell'azienda o dello studio.");
      return;
    }
    if (salvaProfilo(bozza)) {
      onChange(bozza);
      setAperto(false);
    } else {
      setMessaggio("Spazio del browser non disponibile (es. navigazione privata): i dati non sono stati salvati.");
    }
  }

  function rimuovi() {
    eliminaProfilo();
    onChange(profiloVuoto());
    setBozza(profiloVuoto());
    setAperto(false);
  }

  return (
    <div className="relative no-print">
      <button
        onClick={apri}
        className={`text-sm px-3 py-1.5 rounded-lg border bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 ${
          compilato ? "border-brand-400 text-brand-700" : "border-slate-300 text-slate-600 hover:border-brand-400 hover:text-brand-700"
        }`}
      >
        {compilato ? `✍️ Firmata da ${profilo.nome}` : "✍️ Firma la relazione"}
      </button>

      {aperto && (
        <div className="absolute right-0 z-40 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-xl p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">Sei un installatore, un rivenditore o un tecnico?</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inserisci i tuoi dati: la relazione che consegni al cliente porterà il tuo nome in testa. Restano su
              questo dispositivo e valgono per tutti i tuoi progetti.
            </p>
          </div>

          <label className="block text-xs">
            <span className="font-medium text-slate-600">Azienda o studio *</span>
            <input className={inputCls} value={bozza.nome} placeholder="es. Rossi Impianti srl" onChange={(e) => setBozza({ ...bozza, nome: e.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs">
              <span className="font-medium text-slate-600">Telefono</span>
              <input className={inputCls} value={bozza.telefono} onChange={(e) => setBozza({ ...bozza, telefono: e.target.value })} />
            </label>
            <label className="block text-xs">
              <span className="font-medium text-slate-600">Email</span>
              <input className={inputCls} type="email" value={bozza.email} onChange={(e) => setBozza({ ...bozza, email: e.target.value })} />
            </label>
          </div>
          <label className="block text-xs">
            <span className="font-medium text-slate-600">Sito web</span>
            <input className={inputCls} value={bozza.sito} placeholder="facoltativo" onChange={(e) => setBozza({ ...bozza, sito: e.target.value })} />
          </label>

          <div className="text-xs">
            <span className="font-medium text-slate-600">Logo</span>
            <div className="flex items-center gap-3 mt-1">
              {bozza.logo ? (
                <img src={bozza.logo} alt="Logo" className="h-12 w-12 object-contain rounded border border-slate-200 bg-slate-50" />
              ) : (
                <div className="h-12 w-12 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-300">—</div>
              )}
              <label className="text-brand-700 underline cursor-pointer">
                {bozza.logo ? "Cambia" : "Carica un'immagine"}
                <input type="file" accept="image/*" className="hidden" onChange={caricaLogo} />
              </label>
              {bozza.logo && (
                <button className="text-slate-500 underline" onClick={() => setBozza({ ...bozza, logo: null })}>
                  Togli
                </button>
              )}
            </div>
          </div>

          {messaggio && <p className="text-xs text-red-600">{messaggio}</p>}

          <div className="flex items-center justify-between gap-2 pt-1">
            {compilato ? (
              <button onClick={rimuovi} className="text-xs text-slate-500 underline">
                Togli la firma
              </button>
            ) : (
              <span />
            )}
            <button
              onClick={salva}
              className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              Salva
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
