import { useRef, useState } from "react";
import "./FilmWheel.css";

// Distance cumulée (en pixels) de glissé nécessaire pour armer l'appareil.
const DRAG_DISTANCE_NEEDED = 140;

export default function FilmWheel({ armed, disabled, onArmed, axis = "horizontal" }) {
  const [progress, setProgress] = useState(0); // 0 → 1
  const dragState = useRef(null);

  function handlePointerDown(e) {
    if (disabled || armed) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { last: axis === "horizontal" ? e.clientX : e.clientY };
  }

  function handlePointerMove(e) {
    if (!dragState.current || disabled || armed) return;
    const current = axis === "horizontal" ? e.clientX : e.clientY;
    const delta = current - dragState.current.last;
    dragState.current.last = current;
    if (delta <= 0) return; // seul le glissé dans le sens attendu (droite ou bas) compte
    setProgress((p) => {
      const next = p + delta / DRAG_DISTANCE_NEEDED;
      if (next >= 1) {
        onArmed();
        return 0;
      }
      return next;
    });
  }

  function handlePointerUp(e) {
    if (dragState.current) e.currentTarget.releasePointerCapture?.(e.pointerId);
    dragState.current = null;
  }

  return (
    <div
      className={`film-wheel-hotspot ${armed ? "film-wheel-hotspot--armed" : ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={armed ? 100 : Math.round(progress * 100)}
      aria-label={armed ? "Film remonté" : `Glisse pour remonter le film`}
      style={{ "--wheel-progress": progress }}
    />
  );
}
