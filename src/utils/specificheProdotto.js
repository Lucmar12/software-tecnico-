/**
 * specificheProdotto.js — Formattazione sintetica in linguaggio semplice
 * delle caratteristiche tecniche di un prodotto a catalogo, per il
 * riepilogo "Prodotto consigliato" (una riga per prodotto, kW sempre
 * primario dove pertinente, unità di settore per le altre categorie).
 */
import { kwToCv } from "./pompeIdrauliche.js";

export function specificaClimatizzatore(p) {
  const potenza = `${p.potenzaKw} kW${p.potenzaBtu ? ` (${p.potenzaBtu.toLocaleString("it-IT")} BTU/h)` : ""}`;
  return `${potenza} · classe ${p.classeEnergetica}${p.seer ? ` · SEER ${p.seer}` : ""}${p.scop ? ` · SCOP ${p.scop}` : ""}`;
}

export function specificaBollitore(p) {
  return `${p.capacitaLitri} L · classe ${p.classeEnergetica}`;
}

export function specificaScaldacquaPdC(p) {
  return `${p.capacitaLitri} L · ${p.potenzaKw} kW · COP ${p.scop}`;
}

export function specificaFotovoltaico(p) {
  return `${p.potenzaKw} kWp`;
}

export function specificaSolareTermico(p) {
  return `${p.capacitaLitri} L accumulo integrativo`;
}

export function specificaAddolcitore(p) {
  return `${p.volumeResinaLitri} L resina · portata ${p.portataNominaleMc} m³/h`;
}

export function specificaPompa(p) {
  return `${p.portataNominaleMc} m³/h · ${p.prevalenzaM} m prevalenza · ${p.potenzaKw} kW (${kwToCv(p.potenzaKw).toFixed(2)} CV)`;
}
