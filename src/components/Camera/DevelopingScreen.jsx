import { useEffect, useState } from "react";
import "./DevelopingScreen.css";

function formatCountdown(ms) {
  if (ms <= 0) return "quelques instants";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h === 0) return `${m} min`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

export default function DevelopingScreen({ revealAtMs, ready, onReload }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const remaining = revealAtMs - now;
  const revealDate = revealAtMs ? new Date(revealAtMs) : null;

  return (
    <div className="developing-screen">
      <div className="developing-screen__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="40" height="40">
          <path
            fill="currentColor"
            d="M12 2a10 10 0 100 20 10 10 0 000-20zm.5 5v5.4l4.2 2.5-.7 1.2-5-3V7h1.5z"
          />
        </svg>
      </div>

      {ready ? (
        <>
          <h2>Pellicule développée</h2>
          <p>Tes 24 photos sont prêtes dans la galerie. Recharge une nouvelle pellicule pour continuer.</p>
          <button type="button" className="developing-screen__button" onClick={onReload}>
            Charger une nouvelle pellicule
          </button>
        </>
      ) : (
        <>
          <h2>Pellicule au labo</h2>
          <p>
            Les 24 poses sont prises. Le développement est en cours et tes photos seront toutes
            visibles ensemble d'ici <strong>{formatCountdown(remaining)}</strong>
            {revealDate && (
              <>
                {" "}
                (le {revealDate.toLocaleDateString("fr-FR")} à{" "}
                {revealDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })})
              </>
            )}
            .
          </p>
        </>
      )}
    </div>
  );
}
