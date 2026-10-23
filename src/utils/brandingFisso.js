/**
 * brandingFisso.js — Branding fisso dell'applicazione: nome azienda/agente
 * e logo, non modificabili dall'interfaccia. Il software viene distribuito
 * dall'agente ai propri clienti (tecnici, rivenditori, installatori): il
 * logo deve comparire sempre, ovunque nell'interfaccia e nell'estratto
 * PDF, senza possibilità di essere sovrascritto o rimosso.
 *
 * Un professionista può aggiungere i propri dati (utils/profiloProfessionista.js)
 * per firmare la relazione che consegna al suo cliente: il suo nome va in
 * testa e questo branding scende a "con il supporto tecnico di", ma resta.
 */
export const BRANDING_FISSO = {
  nomeAzienda: "Luca Maracchia Rappresentanze",
  logoUrl: "/logo.png",
};
