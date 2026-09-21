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
      sopralluogo: <strong className="text-slate-600">questo documento non ha valore legale</strong> e non sostituisce
      il progetto.
      <span className="block mt-2">
        <strong className="text-slate-600">Cosa è assunto per convenzione.</strong> Trasmittanze per epoca
        costruttiva in assenza di diagnosi energetica; maggiorazione forfettaria per ponti termici invece del calcolo
        puntuale dei giunti; affollamento convenzionale per destinazione d'uso; umidità specifica esterna media per
        l'Italia centrale al posto del bulbo umido del comune; gradi giorno rappresentativi della zona climatica
        anziché il valore tabellato del singolo comune; profili orari di irraggiamento e temperatura di forma
        convenzionale, senza inerzia termica delle murature. Ogni coefficiente è esposto e modificabile
        nell'interfaccia: inserendo i dati reali il calcolo smette di essere convenzionale nel punto corrispondente.
        Prima dell'ordine dei materiali, confermare con un rilievo.
      </span>
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
