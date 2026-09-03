import "./FlashButton.css";

export default function FlashButton({ active, onToggle, torchSupported }) {
  return (
    <button
      type="button"
      className={`flash-button ${active ? "flash-button--on" : ""}`}
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? "Désactiver le flash" : "Activer le flash"}
      title={torchSupported ? "Flash réel disponible sur cet appareil" : "Flash à l'écran (pas de flash matériel sur ce navigateur)"}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M11 2L3 14h6l-1 8 9-13h-6l1-7z"
        />
      </svg>
      {torchSupported && <span className="flash-button__dot" aria-hidden="true" />}
    </button>
  );
}
