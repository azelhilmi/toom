import { useRef, useState } from "react";
import Viewfinder from "./Viewfinder";
import FilmWheel from "./FilmWheel";
import PoseCounter from "./PoseCounter";
import FlashButton from "./FlashButton";
import InstructionSteps from "./InstructionSteps";
import BottomIconNav from "../UI/BottomIconNav";
import { useCameraStream } from "../../utils/useCameraStream";
import { requestAppFullscreen } from "../../utils/fullscreen";
import "./CameraBody.css";

export default function CameraBody({ shotsRemaining, shotsAllowed, onCapture }) {
  const { videoRef, error, ready, torchSupported, applyTorch } = useCameraStream();
  const [armed, setArmed] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [flashPulse, setFlashPulse] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const fullscreenRequested = useRef(false);

  const outOfFilm = shotsRemaining <= 0;

  function tryEnterFullscreen() {
    if (fullscreenRequested.current) return;
    fullscreenRequested.current = true;
    requestAppFullscreen();
  }

  async function handleShutter() {
    tryEnterFullscreen();
    if (!armed || capturing || outOfFilm || !ready) return;
    setCapturing(true);

    let torchWasLit = false;
    if (flashOn) {
      // Vrai flash matériel quand le navigateur le permet (Chrome/Android,
      // Safari iOS 17.4+) — sinon repli silencieux, seul l'éclair visuel joue.
      torchWasLit = await applyTorch(true);
      setFlashPulse(true);
      setTimeout(() => setFlashPulse(false), 220);
      await new Promise((r) => setTimeout(r, torchWasLit ? 250 : 80));
    }

    try {
      await onCapture(videoRef.current, flashOn);
      setFeedback("Cliché capturé. Rendez-vous demain pour le découvrir.");
    } catch (e) {
      setFeedback("La prise de vue a échoué, réessaie.");
    } finally {
      if (torchWasLit) applyTorch(false);
      setArmed(false);
      setCapturing(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  return (
    <div className="camera-body" onPointerDownCapture={tryEnterFullscreen}>
      <div className="camera-body__top">
        <div className="camera-body__top-row">
          <PoseCounter remaining={Math.max(shotsRemaining, 0)} total={shotsAllowed} />
          <FilmWheel armed={armed} disabled={outOfFilm} onArmed={() => setArmed(true)} />
        </div>

        <div className="camera-body__viewfinder-wrap">
          <Viewfinder videoRef={videoRef} error={error} flashPulse={flashPulse} />
        </div>
      </div>

      <div className="camera-body__label">
        <div className="camera-body__brand">
          <span className="camera-body__brand-name">Toom</span>
          <span className="camera-body__brand-tagline">We'll see tomorrow</span>
        </div>
        <InstructionSteps />
      </div>

      <div className="camera-body__bottom">
        <p className="camera-body__hint" role="status">
          {outOfFilm
            ? "Pellicule terminée."
            : feedback
            ? feedback
            : armed
            ? "Prêt. Appuie sur le déclencheur."
            : "Glisse la molette vers la droite pour remonter le film."}
        </p>

        <div className="camera-body__shutter-row">
          <button
            type="button"
            className="camera-body__shutter"
            onClick={handleShutter}
            disabled={!armed || capturing || outOfFilm || !ready}
            aria-label="Déclencher"
          >
            <span className="camera-body__shutter-ring" />
          </button>

          <FlashButton active={flashOn} torchSupported={torchSupported} onToggle={() => setFlashOn((v) => !v)} />
        </div>

        <BottomIconNav />
      </div>
    </div>
  );
}
