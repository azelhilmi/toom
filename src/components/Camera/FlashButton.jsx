import "./FlashButton.css";

export default function FlashButton({ active, onToggle, torchSupported }) {
  return (
    <button
      type="button"
      className={`flash-hotspot ${active ? "flash-hotspot--on" : ""}`}
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? "Désactiver le flash" : "Activer le flash"}
      title={torchSupported ? "Flash réel disponible sur cet appareil" : "Flash à l'écran"}
    />
  );
}
