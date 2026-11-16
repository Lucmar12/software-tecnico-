/**
 * inBreve.js — Il risultato detto in parole semplici, poche frasi in cima
 * alla relazione. Per chi non leggerà mai una tabella di kW: cosa serve,
 * e se la macchina che ha in mente va bene. I numeri tecnici restano
 * sotto, per chi li vuole.
 */
import { formattaKw } from "./export.js";

export function frasiInBreve({ edificio = null, mostraAmbienti = false, mostraClima = false, voci = [], verifica = null }) {
  const frasi = [];

  if (mostraAmbienti && edificio?.totaleInvernaleKw > 0) {
    frasi.push(
      mostraClima
        ? `Per scaldare la casa nel giorno più freddo servono circa ${formattaKw(edificio.totaleInvernaleKw)}; per rinfrescarla nel giorno più caldo circa ${formattaKw(edificio.totaleEstivoKw)}.`
        : `Per scaldare la casa nel giorno più freddo servono circa ${formattaKw(edificio.totaleInvernaleKw)}.`
    );
  }

  if (verifica) {
    const macchina = `La macchina da ${formattaKw(verifica.potenzaKw)}`;
    const chiede = `la casa ne chiede circa ${formattaKw(verifica.caricoKw)}`;
    if (verifica.esito === "insufficiente") frasi.push(`${macchina} non basta: ${chiede}.`);
    else if (verifica.esito === "adeguata") frasi.push(`${macchina} va bene per questa casa: ${chiede}.`);
    else frasi.push(`${macchina} basta e avanza, ma è più grande del necessario: ${chiede}.`);
  }

  for (const v of voci) {
    const titolo = v.titolo.split(" — ")[0];
    if (v.prodotto) {
      const nome = [v.prodotto.marchio, v.prodotto.modello].filter(Boolean).join(" ");
      frasi.push(`${titolo}: ti consigliamo ${nome}${v.specifica ? ` (${v.specifica})` : ""}.`);
    } else if (v.suRichiesta) {
      frasi.push(`${titolo}: ${v.specificaRichiesta ? `${v.specificaRichiesta}, ` : ""}prezzo su richiesta, chiedi la quotazione qui sotto.`);
    }
  }

  return frasi;
}
