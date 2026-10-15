/**
 * biomassa.js — Dimensionamento di stufe e camini a pellet o a legna.
 *
 * COSA CALCOLA
 *   1. la potenza nominale da cercare, partendo dal carico invernale degli
 *      ambienti che l'apparecchio deve davvero scaldare;
 *   2. il consumo di combustibile al giorno più freddo e in un anno;
 *   3. il costo annuo del combustibile.
 *
 * QUALI AMBIENTI. È la scelta che decide tutto, ed è diversa per i due tipi
 * di distribuzione:
 *   - ad aria: l'apparecchio scalda il locale in cui sta e, con l'aria,
 *     quelli aperti o vicini. Le camere dietro una porta chiusa no. Il
 *     carico è quello degli ambienti indicati come serviti;
 *   - idro (termostufa, termocamino): l'apparecchio scalda l'acqua dei
 *     termosifoni o del pavimento radiante, quindi serve tutta la casa.
 *     Il carico è quello di tutti gli ambienti.
 * Dimensionare una stufa ad aria sul carico di tutta la casa è l'errore più
 * comune: il soggiorno diventa un forno e le camere restano fredde.
 *
 * Il carico invernale degli ambienti si somma senza riduzioni: d'inverno il
 * picco è simultaneo (l'ora più fredda è la stessa per tutte le stanze), a
 * differenza dell'estate dove l'esposizione sfasa le punte.
 *
 * COSA NON CALCOLA. La canna fumaria (sezione, altezza, tiraggio) si
 * verifica secondo UNI EN 13384-1 sui dati del singolo apparecchio, e
 * l'installazione segue la UNI 10683: sono riportate come requisiti, non
 * calcolate, perché dipendono dal modello e dal fabbricato.
 */
import { oreEquivalentiRiscaldamento } from "./fotovoltaico.js";

/**
 * Combustibili. Il potere calorifico inferiore dipende dalla qualità e
 * dall'umidità, quindi è un dato modificabile; questi sono i valori di
 * riferimento.
 *
 * Il prezzo è espresso nell'unità in cui si compra — il sacco per il
 * pellet, il quintale per la legna — perché è quella che il cliente
 * conosce e può confrontare con la propria bolletta.
 */
export const COMBUSTIBILI = {
  pellet: {
    etichetta: "Pellet",
    pciKwhKg: 4.6,
    fontePci: "EN ISO 17225-2, classe A1: potere calorifico inferiore di almeno 16,5 MJ/kg, cioè 4,6 kWh/kg",
    unitaVendita: { nome: "sacco", plurale: "sacchi", kg: 15 },
    prezzoUnitaDefault: 6.0,
    notaPrezzo: "prezzo indicativo di un sacco da 15 kg, da sostituire con quello che paghi davvero",
  },
  legna: {
    etichetta: "Legna",
    pciKwhKg: 4.0,
    fontePci: "legna stagionata con umidità intorno al 20%: circa 14,4 MJ/kg, cioè 4,0 kWh/kg. Legna più umida rende sensibilmente meno",
    unitaVendita: { nome: "quintale", plurale: "quintali", kg: 100 },
    prezzoUnitaDefault: 18.0,
    notaPrezzo: "prezzo indicativo di un quintale di legna stagionata, da sostituire con quello che paghi davvero",
  },
};

/** Tipi di apparecchio, con la norma di prodotto di riferimento. */
export const APPARECCHI = {
  stufa: {
    etichetta: "Stufa",
    descrizione: "Apparecchio a sé stante, appoggiato a pavimento.",
    norma: { pellet: "EN 14785", legna: "EN 13240" },
  },
  camino: {
    etichetta: "Camino",
    descrizione: "Inserto o monoblocco chiuso, incassato nella muratura o in un rivestimento.",
    norma: { pellet: "EN 14785", legna: "EN 13229" },
  },
};

export const DISTRIBUZIONI = {
  aria: {
    etichetta: "Ad aria",
    descrizione: "Scalda il locale in cui si trova e quelli aperti o vicini.",
  },
  idro: {
    etichetta: "Idro",
    descrizione: "Termostufa o termocamino: scalda l'acqua dei termosifoni o del pavimento, quindi tutta la casa.",
  },
};

/**
 * Rendimento di riferimento per combinazione di combustibile e
 * apparecchio. Valori tipici dichiarati per apparecchi chiusi di
 * produzione corrente; il rendimento del modello scelto è sulla sua
 * scheda tecnica e va inserito al posto di questo appena lo si conosce.
 *
 * Il camino aperto non è previsto: con rendimenti intorno al 10–20% non
 * è un generatore di calore e non ha senso dimensionarlo come tale.
 */
export const RENDIMENTO_DEFAULT = {
  pellet: { stufa: 0.9, camino: 0.88 },
  legna: { stufa: 0.8, camino: 0.75 },
};

/**
 * Margine sulla potenza nominale rispetto al carico di progetto.
 *
 * Il pellet modula: la stufa riduce la fiamma quando serve meno calore,
 * quindi una taglia un po' più grande non crea problemi. La legna invece
 * non modula bene: una stufa sovradimensionata lavora quasi sempre a
 * fiamma bassa, con combustione peggiore, più fuliggine in canna e più
 * emissioni. Per questo il margine è stretto.
 * Valori di pratica corrente.
 */
export const MARGINE_POTENZA = { pellet: 1.25, legna: 1.1 };

/**
 * Taglia nominale più piccola in commercio, per tipo di distribuzione:
 * ordine di grandezza dei prodotti correnti, da confermare sul listino
 * quando sarà disponibile.
 *
 * Come per i climatizzatori, sotto questa soglia il mercato non scende:
 * se gli ambienti serviti chiedono meno si propone comunque la taglia
 * minima. Con il pellet non è un problema, perché la stufa modula e
 * lavora a fiamma ridotta; con la legna sì, e lo si dice; con un
 * apparecchio idro significa che per quel fabbisogno non è la scelta
 * giusta.
 */
export const POTENZA_MINIMA_COMMERCIALE_KW = { aria: 5, idro: 10 };

/**
 * Oltre questa potenza una singola stufa ad aria non è la soluzione
 * tipica: l'aria calda non arriva negli ambienti lontani e il locale in
 * cui si trova si surriscalda.
 */
export const POTENZA_MASSIMA_TIPICA_ARIA_KW = 15;

/** Configurazione di partenza per un nuovo progetto. */
export function nuovaBiomassa(overrides = {}) {
  return {
    combustibile: "pellet",
    apparecchio: "stufa",
    distribuzione: "aria",
    // Quota del fabbisogno degli ambienti serviti coperta dall'apparecchio:
    // 100 se è il riscaldamento principale, meno se integra un altro impianto.
    quotaCoperturaPct: 100,
    // null = valore di riferimento del combustibile / dell'apparecchio.
    prezzoUnita: null,
    rendimento: null,
    pciKwhKg: null,
    ...overrides,
  };
}

/**
 * Ambienti scaldati dall'apparecchio.
 *
 * Con la distribuzione idro sono tutti. Ad aria sono quelli segnati come
 * serviti (`ambiente.servitoDaBiomassa`); se l'utente non ne ha segnato
 * nessuno si parte dal soggiorno — dove una stufa si mette quasi sempre —
 * o, se non c'è, dal primo ambiente. La scelta implicita è dichiarata, così
 * l'interfaccia può dire all'utente che va confermata.
 */
export function ambientiServiti(ambienti, distribuzione) {
  if (distribuzione === "idro") return { ambienti: [...ambienti], implicita: false };
  const segnati = ambienti.filter((a) => a.servitoDaBiomassa);
  if (segnati.length > 0) return { ambienti: segnati, implicita: false };
  const soggiorni = ambienti.filter((a) => a.tipoLocale === "soggiorno");
  return { ambienti: soggiorni.length > 0 ? soggiorni : ambienti.slice(0, 1), implicita: true };
}

function arrotonda(valore, decimali = 1) {
  const f = 10 ** decimali;
  return Math.round(valore * f) / f;
}

/**
 * Dimensionamento completo.
 *
 * @param {object} p
 * @param {Array<{ambiente:object, invernaleKw:number}>} p.risultatiAmbienti  risultati del calcolo per ambiente
 * @param {object} p.comune
 * @param {object} p.biomassa  configurazione (vedi nuovaBiomassa)
 */
export function dimensionaBiomassa({ risultatiAmbienti, comune, biomassa }) {
  const config = nuovaBiomassa(biomassa);
  const combustibile = COMBUSTIBILI[config.combustibile] ?? COMBUSTIBILI.pellet;
  const apparecchio = APPARECCHI[config.apparecchio] ?? APPARECCHI.stufa;

  const { ambienti, implicita } = ambientiServiti(
    risultatiAmbienti.map((r) => r.ambiente),
    config.distribuzione
  );
  const idServiti = new Set(ambienti.map((a) => a.id));
  const risultatiServiti = risultatiAmbienti.filter((r) => idServiti.has(r.ambiente.id));

  // --- Potenza ---
  const caricoKw = risultatiServiti.reduce((s, r) => s + r.invernaleKw, 0);
  const margine = MARGINE_POTENZA[config.combustibile] ?? MARGINE_POTENZA.pellet;
  const tagliaMinimaKw = POTENZA_MINIMA_COMMERCIALE_KW[config.distribuzione] ?? POTENZA_MINIMA_COMMERCIALE_KW.aria;
  const sottoTagliaMinima = caricoKw < tagliaMinimaKw;
  // Sotto la taglia minima l'intervallo si riduce a quella: è la macchina
  // che si installa, non un intervallo che non esiste a listino.
  const potenzaMinimaKw = sottoTagliaMinima ? tagliaMinimaKw : caricoKw;
  const potenzaMassimaKw = sottoTagliaMinima ? tagliaMinimaKw : caricoKw * margine;

  // --- Combustibile ---
  const rendimento = config.rendimento ?? RENDIMENTO_DEFAULT[config.combustibile]?.[config.apparecchio] ?? 0.8;
  const pciKwhKg = config.pciKwhKg ?? combustibile.pciKwhKg;
  const energiaUtilePerKg = pciKwhKg * rendimento; // kWh di calore in casa per ogni kg bruciato

  // Al giorno più freddo l'apparecchio deve rendere esattamente il carico.
  const consumoOrarioProgettoKg = energiaUtilePerKg > 0 ? caricoKw / energiaUtilePerKg : 0;

  // In un anno: fabbisogno dagli stessi gradi giorno usati per la pompa di calore.
  const riscaldamento = oreEquivalentiRiscaldamento(comune);
  const quotaCopertura = Math.min(100, Math.max(0, Number(config.quotaCoperturaPct) || 0)) / 100;
  const fabbisognoAnnuoKwh = caricoKw * riscaldamento.ore * quotaCopertura;
  const combustibileAnnuoKg = energiaUtilePerKg > 0 ? fabbisognoAnnuoKwh / energiaUtilePerKg : 0;
  const unitaAnno = combustibileAnnuoKg / combustibile.unitaVendita.kg;

  const prezzoUnita = config.prezzoUnita ?? combustibile.prezzoUnitaDefault;
  const costoAnnuo = unitaAnno * prezzoUnita;

  // --- Avvertenze di dimensionamento: dicono se la scelta è adatta ---
  const avvertenze = [];
  if (sottoTagliaMinima && config.distribuzione === "aria" && config.combustibile === "legna") {
    avvertenze.push(
      `Gli ambienti serviti chiedono ${arrotonda(caricoKw)} kW, meno della stufa a legna più piccola in commercio (circa ${tagliaMinimaKw} kW). La legna non modula: la stufa lavorerebbe quasi sempre a fiamma bassa, con combustione peggiore e più fuliggine in canna. Il pellet, che modula, è più adatto; oppure servi più ambienti.`
    );
  }
  if (sottoTagliaMinima && config.distribuzione === "idro") {
    avvertenze.push(
      `Gli ambienti serviti chiedono ${arrotonda(caricoKw)} kW, mentre termostufe e termocamini partono da circa ${tagliaMinimaKw} kW: per questo fabbisogno un apparecchio idro è sovradimensionato. Ha senso quando deve scaldare una casa più grande o produrre anche acqua calda sanitaria.`
    );
  }
  if (config.distribuzione === "aria" && caricoKw > POTENZA_MASSIMA_TIPICA_ARIA_KW) {
    avvertenze.push(
      `Oltre i ${POTENZA_MASSIMA_TIPICA_ARIA_KW} kW un apparecchio ad aria non porta il calore negli ambienti lontani e surriscalda quello in cui si trova. Valuta la versione idro, collegata ai termosifoni, o più apparecchi.`
    );
  }

  // --- Requisiti di installazione: valgono qualunque modello si scelga ---
  const requisiti = [
    "Installazione secondo UNI 10683 da parte di un installatore abilitato, con dichiarazione di conformità (D.M. 37/2008).",
    "Canna fumaria dedicata, verificata secondo UNI EN 13384-1 sui dati dell'apparecchio scelto: sezione e altezza dipendono dal modello e dal fabbricato.",
    "Presa d'aria esterna per l'aria comburente nel locale di installazione, dimensionata come da scheda tecnica e UNI 10683.",
    "Classe di certificazione ambientale (stelle, D.M. 186/2017): alcune regioni limitano l'uso degli apparecchi sotto una certa classe e gli incentivi la richiedono. Verificala sul modello prima dell'acquisto.",
  ];
  if (config.combustibile === "pellet") {
    requisiti.push("Presa elettrica vicina: negli apparecchi a pellet coclea, ventilatore e accensione funzionano a corrente.");
  }
  if (config.distribuzione === "idro") {
    requisiti.push(
      "Progettazione insieme all'impianto di riscaldamento: vaso di espansione, dispositivi di sicurezza e, se deve produrre acqua calda sanitaria, un accumulo (puffer)."
    );
  }

  return {
    config,
    combustibile,
    apparecchio,
    norma: apparecchio.norma[config.combustibile],
    distribuzione: DISTRIBUZIONI[config.distribuzione] ?? DISTRIBUZIONI.aria,
    ambientiServiti: risultatiServiti.map((r) => ({ nome: r.ambiente.nome, invernaleKw: r.invernaleKw })),
    sceltaAmbientiImplicita: implicita,
    caricoKw,
    margine,
    tagliaMinimaKw,
    sottoTagliaMinima,
    potenzaMinimaKw,
    potenzaMassimaKw,
    rendimento,
    pciKwhKg,
    energiaUtilePerKg,
    consumoOrarioProgettoKg,
    gradiGiorno: riscaldamento.gradiGiorno,
    deltaTProgetto: riscaldamento.deltaTProgetto,
    quotaApportiGratuiti: riscaldamento.quotaCopertaDallImpianto,
    oreEquivalenti: riscaldamento.ore,
    quotaCopertura,
    fabbisognoAnnuoKwh,
    combustibileAnnuoKg,
    unitaAnno,
    prezzoUnita,
    costoAnnuo,
    avvertenze,
    requisiti,
  };
}

/** Descrizione breve dell'apparecchio da cercare, per il riepilogo e il preventivo. */
export function descrizioneApparecchio(risultato) {
  const { combustibile, apparecchio, config, potenzaMinimaKw, potenzaMassimaKw, sottoTagliaMinima } = risultato;
  const nome = `${apparecchio.etichetta} a ${combustibile.etichetta.toLowerCase()}${config.distribuzione === "idro" ? " idro" : " ad aria"}`;
  const potenza = sottoTagliaMinima
    ? `taglia più piccola in commercio, circa ${potenzaMinimaKw.toFixed(0)} kW`
    : `potenza nominale ${potenzaMinimaKw.toFixed(1)}–${potenzaMassimaKw.toFixed(1)} kW`;
  return `${nome} · ${potenza}`;
}
