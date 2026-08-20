import React from "react";

/**
 * Analisi critica del fabbisogno: individua se
 * il carico è dominato da trasmissione o ventilazione, quali ambienti
 * hanno le dispersioni più critiche per m² e se l'involucro (in
 * particolare i serramenti) rappresenta il vero collo di bottiglia
 * rispetto al dimensionamento dell'impianto.
 */
export default function AnalisiCritica({ edificio }) {
  const { risultatiAmbienti, ambientePiuCritico, totaleInvernaleKw } = edificio;

  const osservazioni = [];

  risultatiAmbienti.forEach((r) => {
    const { quotaTrasmissionePct, quotaVentilazionePct } = r.scomposizioneInvernale;
    const dominante = quotaTrasmissionePct >= quotaVentilazionePct ? "trasmissione" : "ventilazione";
    osservazioni.push(
      `${r.ambiente.nome}: il carico invernale è dominato dalla ${dominante} (${
        dominante === "trasmissione" ? quotaTrasmissionePct.toFixed(0) : quotaVentilazionePct.toFixed(0)
      }% del totale).`
    );

    const vetriPct = r.componentiInvolucro.vetri.pct;
    if (vetriPct >= 40) {
      osservazioni.push(
        `${r.ambiente.nome}: il ${vetriPct.toFixed(0)}% del fabbisogno per trasmissione di questo ambiente deriva dai serramenti — un intervento su vetri/infissi avrebbe più impatto di una taglia di impianto superiore.`
      );
    }
  });

  const intensitaCritica = ambientePiuCritico
    ? ambientePiuCritico.invernaleKw / (ambientePiuCritico.ambiente.superficiePavimento || 1)
    : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold text-slate-800">Analisi critica del fabbisogno</h3>

      {ambientePiuCritico && (
        <p className="text-sm text-slate-600">
          L'ambiente con la maggiore intensità di dispersione per m² è <strong>{ambientePiuCritico.ambiente.nome}</strong>{" "}
          ({intensitaCritica.toFixed(3)} kW/m², a fronte di un fabbisogno invernale complessivo di{" "}
          {totaleInvernaleKw.toFixed(2)} kW): è l'ambiente su cui un intervento di riqualificazione dell'involucro
          produrrebbe il maggior beneficio relativo.
        </p>
      )}

      <ul className="text-sm text-slate-600 space-y-1.5 list-disc list-inside">
        {osservazioni.map((o, i) => (
          <li key={i}>{o}</li>
        ))}
      </ul>

      <p className="text-xs text-slate-400">
        Le osservazioni sono generate automaticamente dal rapporto tra le componenti di dispersione calcolate e non
        sostituiscono la valutazione del tecnico abilitato in fase di relazione esecutiva.
      </p>
    </div>
  );
}
