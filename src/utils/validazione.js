/**
 * validazione.js — Validazione robusta dei dati di input degli ambienti,
 * per evitare calcoli su geometrie o valori fisicamente incoerenti.
 */
export function validaAmbiente(ambiente) {
  const errori = {};

  if (!ambiente.nome || !ambiente.nome.trim()) errori.nome = "Il nome dell'ambiente è obbligatorio.";

  if (!(ambiente.superficiePavimento > 0)) errori.superficiePavimento = "Inserire una superficie di pavimento maggiore di zero.";
  else if (ambiente.superficiePavimento > 200) errori.superficiePavimento = "Superficie non plausibile per un singolo ambiente residenziale (> 200 m²).";

  if (!(ambiente.altezza >= 2 && ambiente.altezza <= 4.5)) errori.altezza = "L'altezza interna deve essere compresa tra 2 e 4,5 m.";

  if (!(ambiente.superficieMuriEsterni >= 0)) errori.superficieMuriEsterni = "La superficie dei muri esterni non può essere negativa.";

  if (!(ambiente.superficieFinestre >= 0)) errori.superficieFinestre = "La superficie finestrata non può essere negativa.";
  else if (ambiente.superficieFinestre > ambiente.superficieMuriEsterni)
    errori.superficieFinestre = "La superficie finestrata non può superare la superficie totale dei muri esterni.";

  if (!(ambiente.numeroOccupanti >= 0)) errori.numeroOccupanti = "Il numero di occupanti non può essere negativo.";

  if (ambiente.ultimoPiano && ambiente.pianoTerra) errori.piano = "Un ambiente non può essere contemporaneamente al piano terra e all'ultimo piano.";

  return errori;
}

export function ambienteValido(ambiente) {
  return Object.keys(validaAmbiente(ambiente)).length === 0;
}

export function validaLead(lead) {
  const errori = {};
  if (!lead.nomeAzienda || !lead.nomeAzienda.trim()) errori.nomeAzienda = "Nome e azienda obbligatori.";
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email || "");
  if (!emailOk) errori.email = "Inserire un indirizzo email valido.";
  if (!lead.telefono || lead.telefono.replace(/\D/g, "").length < 6) errori.telefono = "Inserire un recapito telefonico valido.";
  return errori;
}
