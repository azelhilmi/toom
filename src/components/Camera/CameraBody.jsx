import { useRef, useState, useEffect } from "react";
import Viewfinder from "./Viewfinder";
import FilmWheel from "./FilmWheel";
import PoseCounter from "./PoseCounter";
import FlashButton from "./FlashButton";
import InstructionSteps from "./InstructionSteps";
import BottomIconNav from "../UI/BottomIconNav";
import { useCameraStream } from "../../utils/useCameraStream";
import { requestAppFullscreen } from "../../utils/fullscreen";
import { useTheme } from "../../context/ThemeContext";
import { getFisheyeFilter } from "../../utils/themeUtils";
import "./CameraBody.css";

export default function CameraBody({ shotsRemaining, shotsAllowed, onCapture }) {
  const { videoRef, error, ready, torchSupported, applyTorch } = useCameraStream();
  const { customTheme } = useTheme();
  const [armed, setArmed] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [flashPulse, setFlashPulse] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const fullscreenRequested = useRef(false);

  const outOfFilm = shotsRemaining <= 0;

  // Appliquer les positions des éléments depuis le thème custom
  const getElementPosition = (elementId, defaultPosition) => {
    if (!customTheme?.elements?.[elementId]) {
      return defaultPosition;
    }
    const element = customTheme.elements[elementId];
    return {
      position: element.position || defaultPosition.position,
      size: element.size || defaultPosition.size
    };
  };

  // Styles dynamiques pour les éléments
  const cameraBodyStyle = {
    background: customTheme?.background ? `url(${customTheme.background}) center/cover` : undefined
  };

  // Style pour le viseur avec effet fisheye personnalisé
  const viewfinderStyle = {
    filter: customTheme?.effects?.fisheye 
      ? getFisheyeFilter(customTheme.effects.fisheyeIntensity) 
      : 'blur(1.5px) url(#fisheye-medium)'
  };

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
      // Toujours éteindre le flash matériel si on a tenté de l'allumer
      if (flashOn) {
        await applyTorch(false);
        setFlashOn(false);
      }
      setArmed(false);
      setCapturing(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  // Rendu des éléments avec positions personnalisées
  const renderElement = (elementId, Component, props = {}, defaultPosition) => {
    const element = customTheme?.elements?.[elementId];
    const config = getElementPosition(elementId, defaultPosition);

    // Calculer la position absolue en % du conteneur
    const containerWidth = 420; // Largeur max du camera-body
    const containerHeight = 800; // Hauteur estimée

    const posX = (config.position.x / 100) * containerWidth;
    const posY = (config.position.y / 100) * containerHeight;
    // Échelle relative : 20% = taille normale (1x). Un élément à 30%
    // s'affiche 1.5x plus grand, un élément à 10% deux fois plus petit.
    const scale = (config.size ?? 20) / 20;

    return (
      <div
        style={{
          position: 'absolute',
          left: `${posX}px`,
          top: `${posY}px`,
          transform: `translate(-50%, -50%) scale(${scale})`,
          zIndex: element?.zIndex || props.zIndex || 0
        }}
      >
        <Component {...props} />
      </div>
    );
  };

  return (
    <div className="camera-body" onPointerDownCapture={tryEnterFullscreen} style={cameraBodyStyle}>
      <div className="camera-body__top">
        <div className="camera-body__top-row">
          {renderElement(
            'poseCounter', 
            PoseCounter, 
            { remaining: Math.max(shotsRemaining, 0), total: shotsAllowed },
            { position: { x: 9, y: 7 }, size: 20 }
          )}
          {renderElement(
            'flashButton',
            FlashButton,
            { active: flashOn, torchSupported, onToggle: () => setFlashOn((v) => !v) },
            { position: { x: 21, y: 7 }, size: 20 }
          )}
          {renderElement(
            'filmWheel', 
            FilmWheel, 
            { armed, disabled: outOfFilm, onArmed: () => setArmed(true) },
            { position: { x: 88, y: 5 }, size: 20 }
          )}
        </div>

        <div className="camera-body__viewfinder-wrap">
          <Viewfinder 
            videoRef={videoRef} 
            error={error} 
            flashPulse={flashPulse}
            style={viewfinderStyle}
          />
        </div>
      </div>

      <div className="camera-body__label">
        <div className="camera-body__brand">
          <span
            className="camera-body__brand-name"
            style={customTheme?.colors?.accent ? { color: customTheme.colors.accent } : undefined}
          >
            {customTheme?.elements?.brandName?.text || "Toom"}
          </span>
          <span
            className="camera-body__brand-tagline"
            style={customTheme?.colors?.inkSoft ? { color: customTheme.colors.inkSoft } : undefined}
          >
            {customTheme?.elements?.brandTagline?.text || "We'll see tomorrow"}
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
          {renderElement(
            'shutter',
            'button',
            {
              type: 'button',
              className: 'camera-body__shutter',
              onClick: handleShutter,
              disabled: !armed || capturing || outOfFilm || !ready,
              'aria-label': 'Déclencher'
            },
            { position: { x: 50, y: 85 }, size: 20 }
          )}
        </div>

        <BottomIconNav />
      </div>
    </div>
  );
}
