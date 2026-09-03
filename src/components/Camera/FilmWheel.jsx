import { useRef, useState } from "react";
import "./FilmWheel.css";

// Distance cumulée (en pixels) de glissé vers la droite nécessaire pour
// armer l'appareil. Plusieurs petits glissés s'additionnent.
const DRAG_DISTANCE_NEEDED = 160;

export default function FilmWheel({ armed, disabled, onArmed }) {
  const [progress, setProgress] = useState(0); // 0 → 1
  const dragState = useRef(null);

  function handlePointerDown(e) {
    if (disabled || armed) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { lastX: e.clientX };
  }

  function handlePointerMove(e) {
    if (!dragState.current || disabled || armed) return;
    const deltaX = e.clientX - dragState.current.lastX;
    dragState.current.lastX = e.clientX;
    if (deltaX <= 0) return; // seul le glissé vers la droite fait avancer le film
    setProgress((p) => {
      const next = p + deltaX / DRAG_DISTANCE_NEEDED;
      if (next >= 1) {
        onArmed();
        return 0;
      }
      return next;
    });
  }

  function handlePointerUp(e) {
    if (dragState.current) {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    }
    dragState.current = null;
  }

  return (
    <div className="film-wheel-group">
      <div
        className={`film-wheel ${armed ? "film-wheel--armed" : ""} ${disabled ? "film-wheel--disabled" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={armed ? 100 : Math.round(progress * 100)}
        aria-label={armed ? "Film remonté, prêt à photographier" : "Glisse vers la droite pour remonter le film"}
      >
        <div className="film-wheel__fill" style={{ width: `${Math.min(progress, 1) * 100}%` }} />
        <div className="film-wheel__ridges">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="film-wheel__ridge" />
          ))}
        </div>
      </div>
      {!armed && (
        <span className="film-wheel-group__label">
          GLISSER
          <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
            <path fill="currentColor" d="M4 11h13l-4.5-4.5L14 5l7 7-7 7-1.5-1.5L17 13H4z" />
          </svg>
        </span>
      )}
    </div>
  );
}
