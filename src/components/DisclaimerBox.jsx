import React from "react";

/** Disclaimer tecnico finale, visibile in entrambe le modalità e nell'export. */
export default function DisclaimerBox() {
  return (
    <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
      <strong className="text-slate-600">Disclaimer tecnico.</strong> Il calcolo è stato eseguito secondo
      metodologia UNI EN 12831 (carico invernale), metodo Carrier con dati climatici UNI 10339 (carico estivo),
      UNI 9182 (fabbisogno ACS, reti di distribuzione idrica e dimensionamento di autoclavi/pompe di sollevamento e
      circolazione) e UNI EN 14743 (requisiti prestazionali degli addolcitori a scambio ionico). Le temperature di
      progetto derivano da UNI 5364/UNI 10339 per i capoluoghi di provincia e per le principali città italiane ed
      umbre; per i comuni non elencati il valore è corretto per altitudine secondo il metodo UNI 10349. Per la
      progettazione esecutiva, il dimensionamento definitivo e l'accesso a detrazioni fiscali (Ecobonus, Conto
      Termico) è necessaria una relazione tecnica firmata da un termotecnico abilitato, con software certificato e
      sopralluogo.
    </div>
  );
}

export function FooterBranding({ nomeAzienda }) {
  return (
    <footer className="text-center text-xs text-slate-400 py-6">
      Dimensionamento realizzato con {nomeAzienda || "[nome azienda]"}
    </footer>
  );
}
