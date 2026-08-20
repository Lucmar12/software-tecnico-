/**
 * export.js — Generazione del riepilogo strutturato del progetto per la
 * richiesta di preventivo: testo per invio via mailto: e per copia negli
 * appunti.
 */

export function formattaKw(v) {
  return `${v.toFixed(2)} kW`;
}

export function formattaBtu(v) {
  return `${Math.round(v).toLocaleString("it-IT")} BTU/h`;
}

export function formattaEuro(v) {
  return v.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

/**
 * Costruisce il testo del riepilogo (comune/edificio, carichi calcolati,
 * prodotti selezionati, contatti) da usare sia per il link mailto: sia
 * per la copia negli appunti.
 */
export function generaRiepilogoTesto({ branding, comune, edificio, prodottiSelezionati, lead }) {
  const righe = [];
  righe.push(`RICHIESTA PREVENTIVO — ${branding?.nomeAzienda || "[Azienda]"}`);
  righe.push("");
  righe.push(`Comune: ${comune?.nome || "-"} (zona climatica ${comune?.zona || "-"})`);
  righe.push(`Temperatura invernale di progetto: ${comune?.teInv ?? "-"} °C`);
  righe.push(`Temperatura estiva di progetto: ${comune?.tbse ?? "-"} °C`);
  righe.push("");
  righe.push("FABBISOGNO CALCOLATO");
  righe.push(`Totale invernale: ${formattaKw(edificio.totaleInvernaleKw)} (${formattaBtu(edificio.totaleInvernaleBtu)})`);
  righe.push(`Totale estivo: ${formattaKw(edificio.totaleEstivoKw)} (${formattaBtu(edificio.totaleEstivoBtu)})`);
  righe.push(`Superficie totale: ${edificio.superficieTotale} m²`);
  righe.push("");
  edificio.risultatiAmbienti.forEach((r) => {
    righe.push(
      `- ${r.ambiente.nome}: invernale ${formattaKw(r.invernaleKw)}, estivo ${formattaKw(r.estivoKw)}`
    );
  });
  righe.push("");
  if (prodottiSelezionati?.length) {
    righe.push("PRODOTTI SELEZIONATI");
    prodottiSelezionati.forEach((p) => {
      righe.push(`- ${p.marchio} ${p.modello} (${p.classeEnergetica}) — indicativo ${formattaEuro(p.prezzoIndicativoMin)}–${formattaEuro(p.prezzoIndicativoMax)}`);
    });
    righe.push("");
  }
  righe.push("CONTATTI RICHIEDENTE");
  righe.push(`Nome e azienda: ${lead?.nomeAzienda || "-"}`);
  if (lead?.clienteFinale) righe.push(`Cliente finale/cantiere: ${lead.clienteFinale}`);
  righe.push(`Email: ${lead?.email || "-"}`);
  righe.push(`Telefono: ${lead?.telefono || "-"}`);
  if (lead?.note) {
    righe.push("");
    righe.push(`Note: ${lead.note}`);
  }
  righe.push("");
  righe.push("Calcolo eseguito con dettaglio normativo completo (relazione tecnica disponibile su richiesta).");
  righe.push(`Dimensionamento realizzato con ${branding?.nomeAzienda || "[Azienda]"}`);
  return righe.join("\n");
}

/** Costruisce un link mailto: precompilato con oggetto e corpo del riepilogo. */
export function generaMailtoLink({ destinatarioEmail, testo, oggetto }) {
  const params = new URLSearchParams({
    subject: oggetto || "Richiesta preventivo — dimensionamento impianto",
    body: testo,
  });
  return `mailto:${destinatarioEmail || ""}?${params.toString()}`;
}

/** Costruisce un link wa.me con testo precompilato, per l'invio rapido via WhatsApp (canale tipico di installatori/rivenditori da sopralluogo). */
export function generaWhatsAppLink(testo) {
  return `https://wa.me/?text=${encodeURIComponent(testo)}`;
}

export async function copiaNegliAppunti(testo) {
  try {
    await navigator.clipboard.writeText(testo);
    return true;
  } catch {
    return false;
  }
}
