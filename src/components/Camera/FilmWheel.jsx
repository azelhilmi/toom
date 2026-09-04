import { useRef, useState } from "react";
import { hapticTick, hapticConfirm } from "../../utils/haptics";
import "./FilmWheel.css";

// Distance cumulée (en pixels) de glissé nécessaire pour armer l'appareil.
const DRAG_DISTANCE_NEEDED = 140;
// Nombre de "crans" haptiques ressentis pendant le glissé complet — imite
// le déclic mécanique d'une vraie molette crantée.
const NOTCH_COUNT = 5;

export default function FilmWheel({ armed, disabled, onArmed, axis = "horizontal" }) {
  const [progress, setProgress] = useState(0); // 0 → 1
  const dragState = useRef(null);
  const lastNotch = useRef(0);

  function handlePointerDown(e) {
    if (disabled || armed) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { last: axis === "horizontal" ? e.clientX : e.clientY };
    lastNotch.current = 0;
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
        hapticConfirm();
        onArmed();
        return 0;
      }
      const notch = Math.floor(next * NOTCH_COUNT);
      if (notch > lastNotch.current) {
        lastNotch.current = notch;
        hapticTick();
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
