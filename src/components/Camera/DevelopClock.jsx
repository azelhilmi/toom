import { useEffect, useState } from "react";
import "./DevelopClock.css";

function formatCountdown(ms) {
  if (ms <= 0) return "quelques instants";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h === 0) return `${m} min`;
  return `${h} h ${String(m).padStart(2, "0")}`;
}

/**
 * Petite horloge analogique "easter egg" affichée quand la pellicule
 * est épuisée. Les aiguilles pointent l'heure RÉELLE de développement
 * (figées, pas une horloge en temps réel) — l'appli reste utilisable
 * autour, seuls le déclencheur et la molette sont désactivés par
 * CameraBody lui-même.
 */
export default function DevelopClock({ targetMs, ready, onReload }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const target = new Date(targetMs);
  const hourAngle = ((target.getHours() % 12) + target.getMinutes() / 60) * 30;
  const minuteAngle = target.getMinutes() * 6;
  const dateLabel = target.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" });
  const timeLabel = target.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="develop-clock">
      <div className="develop-clock__face">
        <div className="develop-clock__gear" aria-hidden="true" />
        <svg viewBox="0 0 100 100" className="develop-clock__svg">
          <circle cx="50" cy="50" r="46" className="develop-clock__ring" />
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              x1="50" y1="8" x2="50" y2="14"
              className="develop-clock__tick"
              transform={`rotate(${i * 30} 50 50)`}
            />
          ))}
          <line x1="50" y1="50" x2="50" y2="26" className="develop-clock__hand develop-clock__hand--hour"
            transform={`rotate(${hourAngle} 50 50)`} />
          <line x1="50" y1="50" x2="50" y2="16" className="develop-clock__hand develop-clock__hand--minute"
            transform={`rotate(${minuteAngle} 50 50)`} />
          <circle cx="50" cy="50" r="3" className="develop-clock__pin" />
        </svg>
      </div>

      <p className="develop-clock__time">{dateLabel} à {timeLabel}</p>

      {ready ? (
        <>
          <p className="develop-clock__label">Pellicule développée !</p>
          <button type="button" className="develop-clock__button" onClick={onReload}>
            Charger une nouvelle pellicule
          </button>
        </>
      ) : (
        <p className="develop-clock__label">Développement dans {formatCountdown(targetMs - now)}</p>
      )}
    </div>
  );
}
