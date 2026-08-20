import React, { useState } from "react";
import { validaLead } from "../utils/validazione.js";
import { generaRiepilogoTesto, generaMailtoLink, generaWhatsAppLink, copiaNegliAppunti, formattaEuro } from "../utils/export.js";
import { registraRichiestaStorico } from "../utils/persistenza.js";

// Indirizzo email placeholder a cui viene indirizzata la richiesta di preventivo — sostituire con l'indirizzo reale dell'agente/rivenditore.
const EMAIL_PLACEHOLDER = "preventivi@azienda-esempio.it";
// Indirizzo email placeholder per le richieste di supporto tecnico prioritario (es. progetti complessi VRF/plurifamiliari) — può coincidere con quello sopra.
const EMAIL_SUPPORTO_PLACEHOLDER = "supporto-tecnico@azienda-esempio.it";

/**
 * Sezione "Richiedi preventivo": nome/azienda del compilatore, cliente
 * finale, contatti, selezione dei prodotti consigliati da includere,
 * note libere. Genera un riepilogo strutturato inviabile via mailto:,
 * WhatsApp o copiabile negli appunti. Ogni invio viene registrato nello
 * storico locale del dispositivo (non una dashboard multi-installatore).
 */
export default function RichiediPreventivo({ prodottiConsigliati, edificio, comune, branding, modalita, evidenziato }) {
  const [lead, setLead] = useState({ nomeAzienda: "", clienteFinale: "", email: "", telefono: "", note: "" });
  const [selezionati, setSelezionati] = useState(() => new Set(prodottiConsigliati.slice(0, 1).map((p) => `${p.marchio}|${p.modello}`)));
  const [prioritaria, setPrioritaria] = useState(false);
  const [inviato, setInviato] = useState(false);
  const [copiato, setCopiato] = useState(false);
  const errori = validaLead(lead);

  function toggle(p) {
    const chiave = `${p.marchio}|${p.modello}`;
    setSelezionati((prev) => {
      const next = new Set(prev);
      if (next.has(chiave)) next.delete(chiave);
      else next.add(chiave);
      return next;
    });
  }

  const prodottiSelezionati = prodottiConsigliati.filter((p) => selezionati.has(`${p.marchio}|${p.modello}`));

  function registraInvio(canale) {
    registraRichiestaStorico({
      canale,
      prioritaria,
      clienteFinale: lead.clienteFinale || null,
      comune: comune?.nome || null,
      nProdotti: prodottiSelezionati.length,
      modalita,
    });
  }

  function handleInvia() {
    if (Object.keys(errori).length > 0) {
      setInviato(true);
      return;
    }
    const testo = generaRiepilogoTesto({ branding, comune, edificio, prodottiSelezionati, lead, modalita });
    const oggetto = prioritaria
      ? "[SUPPORTO TECNICO PRIORITARIO] Richiesta preventivo — dimensionamento impianto"
      : "Richiesta preventivo — dimensionamento impianto";
    const link = generaMailtoLink({ destinatarioEmail: prioritaria ? EMAIL_SUPPORTO_PLACEHOLDER : EMAIL_PLACEHOLDER, testo, oggetto });
    registraInvio("email");
    window.location.href = link;
  }

  function handleWhatsApp() {
    const testo = generaRiepilogoTesto({ branding, comune, edificio, prodottiSelezionati, lead, modalita });
    registraInvio("whatsapp");
    window.open(generaWhatsAppLink(testo), "_blank", "noopener,noreferrer");
  }

  async function handleCopia() {
    const testo = generaRiepilogoTesto({ branding, comune, edificio, prodottiSelezionati, lead, modalita });
    const ok = await copiaNegliAppunti(testo);
    setCopiato(ok);
    if (ok) registraInvio("copia");
    setTimeout(() => setCopiato(false), 2500);
  }

  return (
    <div
      id="richiedi-preventivo"
      className={`rounded-2xl p-5 space-y-4 no-print ${
        evidenziato ? "bg-brand-600 text-white shadow-xl" : "bg-white border border-slate-200"
      }`}
    >
      <h3 className={`font-bold text-lg ${evidenziato ? "text-white" : "text-slate-800"}`}>Richiedi preventivo</h3>

      {prodottiConsigliati.length > 0 && (
        <div className={`space-y-1.5 ${evidenziato ? "" : ""}`}>
          <p className={`text-xs ${evidenziato ? "text-brand-100" : "text-slate-500"}`}>Prodotti da includere:</p>
          {prodottiConsigliati.map((p) => {
            const chiave = `${p.marchio}|${p.modello}`;
            return (
              <label
                key={chiave}
                className={`flex items-center justify-between gap-2 text-sm rounded-lg px-2.5 py-1.5 ${
                  evidenziato ? "bg-white/10" : "bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <input type="checkbox" checked={selezionati.has(chiave)} onChange={() => toggle(p)} className="h-4 w-4" />
                  {p.marchio} {p.modello}
                </span>
                <span className={evidenziato ? "text-brand-100" : "text-slate-400"}>
                  {formattaEuro(p.prezzoIndicativoMin)}–{formattaEuro(p.prezzoIndicativoMax)}
                </span>
              </label>
            );
          })}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <Campo evidenziato={evidenziato} label="Nome e azienda (chi compila)" errore={inviato && errori.nomeAzienda}>
          <input
            className={inputCls(evidenziato)}
            value={lead.nomeAzienda}
            onChange={(e) => setLead({ ...lead, nomeAzienda: e.target.value })}
          />
        </Campo>
        <Campo evidenziato={evidenziato} label="Cliente finale / cantiere (opzionale)">
          <input
            className={inputCls(evidenziato)}
            value={lead.clienteFinale}
            onChange={(e) => setLead({ ...lead, clienteFinale: e.target.value })}
          />
        </Campo>
        <Campo evidenziato={evidenziato} label="Email" errore={inviato && errori.email}>
          <input
            type="email"
            className={inputCls(evidenziato)}
            value={lead.email}
            onChange={(e) => setLead({ ...lead, email: e.target.value })}
          />
        </Campo>
        <Campo evidenziato={evidenziato} label="Telefono" errore={inviato && errori.telefono}>
          <input
            className={inputCls(evidenziato)}
            value={lead.telefono}
            onChange={(e) => setLead({ ...lead, telefono: e.target.value })}
          />
        </Campo>
      </div>
      <Campo evidenziato={evidenziato} label="Note">
        <textarea
          className={inputCls(evidenziato)}
          rows={2}
          value={lead.note}
          onChange={(e) => setLead({ ...lead, note: e.target.value })}
        />
      </Campo>

      <label className={`flex items-start gap-2 text-xs rounded-lg px-2.5 py-2 ${evidenziato ? "bg-white/10" : "bg-amber-50 border border-amber-200"}`}>
        <input type="checkbox" checked={prioritaria} onChange={(e) => setPrioritaria(e.target.checked)} className="h-4 w-4 mt-0.5" />
        <span className={evidenziato ? "text-white" : "text-amber-800"}>
          Segnala come progetto complesso — richiedi supporto tecnico diretto (es. VRF, edificio plurifamiliare)
        </span>
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleInvia}
          className={`px-4 py-2 rounded-lg font-semibold text-sm ${
            evidenziato ? "bg-white text-brand-700" : "bg-brand-600 text-white"
          }`}
        >
          Invia richiesta
        </button>
        <button
          onClick={handleWhatsApp}
          className={`px-4 py-2 rounded-lg font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-700`}
        >
          Invia via WhatsApp
        </button>
        <button
          onClick={handleCopia}
          className={`px-4 py-2 rounded-lg font-medium text-sm border ${
            evidenziato ? "border-white/40 text-white" : "border-slate-300 text-slate-600"
          }`}
        >
          {copiato ? "Copiato ✓" : "Copia riepilogo negli appunti"}
        </button>
      </div>
      <p className={`text-[11px] ${evidenziato ? "text-brand-100" : "text-slate-400"}`}>
        L'indirizzo email di destinazione ({prioritaria ? EMAIL_SUPPORTO_PLACEHOLDER : EMAIL_PLACEHOLDER}) è un
        segnaposto: sostituirlo con il recapito reale prima della messa in produzione.
      </p>
    </div>
  );
}

function Campo({ label, children, errore, evidenziato }) {
  return (
    <label className="block">
      <span className={`text-xs font-medium ${evidenziato ? "text-brand-100" : "text-slate-500"}`}>{label}</span>
      {children}
      {errore && <span className="block text-[11px] text-red-200">{errore}</span>}
    </label>
  );
}

function inputCls(evidenziato) {
  return `mt-1 w-full rounded-lg px-2.5 py-1.5 text-sm focus:outline-none ${
    evidenziato ? "bg-white/90 text-slate-800" : "border border-slate-300"
  }`;
}
