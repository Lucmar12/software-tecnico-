/**
 * validazione.js — Validazione robusta dei dati di input degli ambienti,
 * per evitare calcoli su geometrie o valori fisicamente incoerenti.
 */
export function validaAmbiente(ambiente) {
  const errori = {};

  if (!ambiente.nome || !ambiente.nome.trim()) errori.nome = "Il nome dell'ambiente è obbligatorio.";

  if (!(ambiente.lunghezzaM > 0)) errori.lunghezzaM = "Inserire una lunghezza maggiore di zero.";
  else if (ambiente.lunghezzaM > 30) errori.lunghezzaM = "Lunghezza non plausibile per un ambiente residenziale (> 30 m).";

  if (!(ambiente.larghezzaM > 0)) errori.larghezzaM = "Inserire una larghezza maggiore di zero.";
  else if (ambiente.larghezzaM > 30) errori.larghezzaM = "Larghezza non plausibile per un ambiente residenziale (> 30 m).";

  if (ambiente.lunghezzaM > 0 && ambiente.larghezzaM > 0 && ambiente.lunghezzaM * ambiente.larghezzaM > 200)
    errori.lunghezzaM = "Superficie non plausibile per un singolo ambiente residenziale (> 200 m²).";

  if (!(ambiente.numeroFinestre >= 0)) errori.numeroFinestre = "Il numero di finestre non può essere negativo.";

  // Fino a 8 m: saloni a doppia altezza e casali con soffitti alti
  // esistono, e il calcolo per volume e superfici li tratta correttamente.
  if (!(ambiente.altezza >= 1 && ambiente.altezza <= 8)) {
    errori.altezza =
      ambiente.soffitto === "dueFalde"
        ? "L'altezza all'imposta deve essere compresa tra 1 e 8 m."
        : "L'altezza interna deve essere compresa tra 2 e 8 m.";
  } else if (ambiente.soffitto !== "dueFalde" && ambiente.altezza < 2) {
    errori.altezza = "L'altezza interna deve essere compresa tra 2 e 8 m.";
  }

  // Con il soffitto a falde l'imposta può scendere sotto i 2 m, ma il colmo
  // deve stare sopra di essa: altrimenti non c'è nessuna falda.
  if (ambiente.soffitto === "dueFalde") {
    if (!(Number(ambiente.altezzaColmo) > Number(ambiente.altezza)))
      errori.altezzaColmo = "Con il soffitto a falde l'altezza al colmo deve superare quella all'imposta.";
    else if (Number(ambiente.altezzaColmo) > 9) errori.altezzaColmo = "Altezza al colmo non plausibile per un ambiente residenziale (> 9 m).";
  }

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
