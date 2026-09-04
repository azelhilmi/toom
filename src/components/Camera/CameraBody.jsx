import { useRef, useState, useMemo } from "react";
import Viewfinder from "./Viewfinder";
import FilmWheel from "./FilmWheel";
import PoseCounter from "./PoseCounter";
import FlashButton from "./FlashButton";
import InstructionSteps from "./InstructionSteps";
import BottomIconNav from "../UI/BottomIconNav";
import { useCameraStream } from "../../utils/useCameraStream";
import { requestAppFullscreen } from "../../utils/fullscreen";
import { useTheme } from "../../context/ThemeContext";
import { getFisheyeFilter, DEFAULT_ELEMENTS } from "../../utils/themeUtils";
import "./CameraBody.css";

export default function CameraBody({ shotsRemaining, shotsAllowed, onCapture }) {
  const { videoRef, error, ready, torchSupported, applyTorch } = useCameraStream();
  const { theme, customTheme } = useTheme();
  const [armed, setArmed] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [flashPulse, setFlashPulse] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const fullscreenRequested = useRef(false);

  const outOfFilm = shotsRemaining <= 0;

  // Utiliser les positions par défaut ou celles du thème custom
  const elements = useMemo(() => {
    if (customTheme?.elements) {
      return customTheme.elements;
    }
    return DEFAULT_ELEMENTS;
  }, [customTheme]);

  // Style pour le viseur avec effet fisheye personnalisé (désactivé par défaut pour éviter déformation)
  const viewfinderStyle = useMemo(() => {
    if (customTheme?.effects?.fisheye && customTheme.effects.fisheye) {
      return { filter: getFisheyeFilter(customTheme.effects.fisheyeIntensity) };
    }
    // Par défaut : pas de fisheye, juste un léger blur pour l'effet "sans aperçu"
    return { filter: 'saturate(0.85) contrast(1.1) brightness(1.05) blur(1.5px)' };
  }, [customTheme]);

  // Style pour le boîtier avec background custom
  const cameraBodyStyle = useMemo(() => {
    if (customTheme?.background) {
      return { background: `url(${customTheme.background}) center/cover` };
    }
    return {};
  }, [customTheme]);

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
      if (flashOn) {
        await applyTorch(false);
        setFlashOn(false);
      }
      setArmed(false);
      setCapturing(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  // Rendu avec positions en % pour flexibilité
  return (
    <div className="camera-body" onPointerDownCapture={tryEnterFullscreen} style={cameraBodyStyle}>
      <div className="camera-body__top">
        <div className="camera-body__top-row">
          {/* Compteur de poses - position par défaut ou custom */}
          <div style={{
            position: 'absolute',
            left: `${elements.poseCounter?.position?.x || 9}%`,
            top: `${elements.poseCounter?.position?.y || 7}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: elements.poseCounter?.zIndex || 10
          }}>
            <PoseCounter remaining={Math.max(shotsRemaining, 0)} total={shotsAllowed} />
          </div>

          {/* Bouton Flash - position par défaut ou custom */}
          <div style={{
            position: 'absolute',
            left: `${elements.flashButton?.position?.x || 21}%`,
            top: `${elements.flashButton?.position?.y || 7}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: elements.flashButton?.zIndex || 10
          }}>
            <FlashButton active={flashOn} torchSupported={torchSupported} onToggle={() => setFlashOn((v) => !v)} />
          </div>

          {/* Molette - position par défaut ou custom */}
          <div style={{
            position: 'absolute',
            left: `${elements.filmWheel?.position?.x || 88}%`,
            top: `${elements.filmWheel?.position?.y || 5}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: elements.filmWheel?.zIndex || 10
          }}>
            <FilmWheel armed={armed} disabled={outOfFilm} onArmed={() => setArmed(true)} />
          </div>
        </div>

        <div className="camera-body__viewfinder-wrap">
          <Viewfinder videoRef={videoRef} error={error} flashPulse={flashPulse} style={viewfinderStyle} />
        </div>
      </div>

      <div className="camera-body__label">
        <div className="camera-body__brand">
          <span className="camera-body__brand-name">
            {elements.brandName?.text || "Toom"}
          </span>
          <span className="camera-body__brand-tagline">
            {elements.brandTagline?.text || "We'll see tomorrow"}
          </span>
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
          {/* Déclencheur - position par défaut ou custom */}
          <div style={{
            position: 'absolute',
            left: `${elements.shutter?.position?.x || 50}%`,
            top: `${elements.shutter?.position?.y || 85}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: elements.shutter?.zIndex || 10
          }}>
            <button
              type="button"
              className="camera-body__shutter"
              onClick={handleShutter}
              disabled={!armed || capturing || outOfFilm || !ready}
              aria-label="Déclencher"
            >
              <span className="camera-body__shutter-ring" />
            </button>
          </div>
        </div>

        <BottomIconNav />
      </div>
    </div>
  );
}
