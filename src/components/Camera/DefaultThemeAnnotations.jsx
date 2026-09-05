import { hotspotStyle } from "../../utils/hotspots";
import "./DefaultThemeAnnotations.css";

// Numéro de série décoratif, fixé une fois par chargement de page —
// purement cosmétique, comme sur un vrai emballage produit.
const SERIAL = `TM-${Math.floor(1000 + Math.random() * 8999)}`;

export default function DefaultThemeAnnotations({ layout }) {
  const { wheelLabel, flashLabel, badge } = layout.annotations;

  return (
    <>
      <p className="theme-annotation theme-annotation--wheel" style={hotspotStyle(wheelLabel)}>
        AVANCE FILM
        <span className="theme-annotation__arrow" aria-hidden="true">
          {layout.wheelAxis === "horizontal" ? "→" : "↓"}
        </span>
      </p>

      <p className="theme-annotation theme-annotation--flash" style={hotspotStyle(flashLabel)}>
        FLASH
      </p>

      <div className="theme-annotation theme-annotation--badge" style={hotspotStyle(badge)}>
        <div className="theme-annotation__barcode" aria-hidden="true">
          {Array.from({ length: 22 }).map((_, i) => (
            <span key={i} style={{ width: (i * 37) % 3 === 0 ? 2 : 1 }} />
          ))}
        </div>
        <span className="theme-annotation__serial">{SERIAL} · 27 POSES</span>
      </div>
    </>
  );
}
