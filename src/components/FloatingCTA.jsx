import React, { useEffect, useState } from "react";

/**
 * Pulsante flottante "Richiedi preventivo", sempre raggiungibile in un
 * tap: rimane visibile durante lo scroll e porta direttamente al form di
 * richiesta. Si nasconde quando il form è già a schermo (per non
 * coprirlo) e in fase di stampa.
 */
export default function FloatingCTA() {
  const [visibile, setVisibile] = useState(true);

  useEffect(() => {
    const target = document.getElementById("richiedi-preventivo");
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setVisibile(!entry.isIntersecting), {
      rootMargin: "0px 0px -20% 0px",
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  if (!visibile) return null;

  return (
    <button
      onClick={() => document.getElementById("richiedi-preventivo")?.scrollIntoView({ behavior: "smooth", block: "start" })}
      className="no-print fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-brand-600 text-white font-semibold text-sm px-5 py-3 rounded-full shadow-xl hover:bg-brand-700 transition flex items-center gap-2"
    >
      Richiedi preventivo →
    </button>
  );
}
