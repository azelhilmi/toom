import "./InstructionsOverlay.css";

export default function InstructionsOverlay({ wheelAxis }) {
  return (
    <div className="instructions-overlay">
      <div className="instructions-overlay__header">
        <img src="/brand/icon-round-small.webp" alt="" className="instructions-overlay__logo" />
        <p className="instructions-overlay__title">Mode d'emploi simple</p>
      </div>

      <ol className="instructions-overlay__steps">
        <li>
          <strong>1.</strong> Tournez la <strong>molette</strong>{" "}
          {wheelAxis === "horizontal" ? "à droite" : "vers le bas"} jusqu'à l'arrêt
        </li>
        <li>
          <strong>2.</strong> Cadrez le sujet avec le viseur
        </li>
        <li>
          <strong>3.</strong> Appuyez à fond sur le <strong>déclencheur</strong>
        </li>
        <li>
          <strong>⚡</strong> Le petit éclair active le <strong>flash</strong> (intérieur / faible luminosité)
        </li>
      </ol>
    </div>
  );
}
