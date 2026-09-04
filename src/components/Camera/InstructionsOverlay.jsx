import "./InstructionsOverlay.css";

export default function InstructionsOverlay({ wheelAxis }) {
  return (
    <div className="instructions-overlay">
      <div className="instructions-overlay__header">
        <img src="/brand/icon-round-small.webp" alt="" className="instructions-overlay__logo" />
        <p className="instructions-overlay__title">Mode d'emploi</p>
      </div>

      <p className="instructions-overlay__line">
        <strong>1</strong> Molette {wheelAxis === "horizontal" ? "→ droite" : "→ bas"}
        <span className="instructions-overlay__arrow">→</span>
        <strong>2</strong> Viseur
        <span className="instructions-overlay__arrow">→</span>
        <strong>3</strong> Déclencheur
      </p>
      <p className="instructions-overlay__line instructions-overlay__line--flash">
        <strong>⚡</strong> Active le flash avant de déclencher
      </p>
    </div>
  );
}
