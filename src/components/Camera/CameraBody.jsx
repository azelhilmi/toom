import { useEffect, useRef, useState } from "react";
import Viewfinder from "./Viewfinder";
import FilmWheel from "./FilmWheel";
import PoseCounter from "./PoseCounter";
import FlashButton from "./FlashButton";
import HamburgerMenu from "../UI/HamburgerMenu";
import InstructionsOverlay from "./InstructionsOverlay";
import DevelopClock from "./DevelopClock";
import { useCameraStream } from "../../utils/useCameraStream";
import { requestAppFullscreen } from "../../utils/fullscreen";
import { hapticCapture } from "../../utils/haptics";
import { useTheme } from "../../context/ThemeContext";
import { HOTSPOTS, hotspotStyle } from "../../utils/hotspots";
import "./CameraBody.css";

function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(
    () => window.matchMedia("(orientation: landscape)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape)");
    const onChange = (e) => setIsLandscape(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isLandscape ? "landscape" : "portrait";
}

export default function CameraBody({ shotsRemaining, shotsAllowed, onCapture, developingUntilMs = null, onReload = null }) {
  const { videoRef, error, ready, torchSupported, applyTorch } = useCameraStream();
  const { customSkin } = useTheme();
  const orientation = useOrientation();
  const layout = HOTSPOTS[orientation];

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
      torchWasLit = await applyTorch(true);
      setFlashPulse(true);
      setTimeout(() => setFlashPulse(false), 220);
      await new Promise((r) => setTimeout(r, torchWasLit ? 250 : 80));
    }

    try {
      hapticCapture();
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
      {/* Couche 1 : viseur et compte-poses, révélés à travers les vraies
          zones transparentes de l'image du boîtier posée par-dessus. */}
      <div className="camera-body__viewfinder-slot" style={hotspotStyle(layout.viewfinder)}>
        <Viewfinder videoRef={videoRef} error={error} flashPulse={flashPulse} fill />
      </div>
      <div className="camera-body__pose-slot" style={hotspotStyle(layout.poseCounter)}>
        <PoseCounter remaining={Math.max(shotsRemaining, 0)} total={shotsAllowed} bare />
      </div>

      {/* Couche 2 : l'image du boîtier (par défaut ou personnalisée),
          étirée pour remplir exactement l'écran quelle que soit sa taille. */}
      <img
        className="camera-body__skin"
        src={customSkin || layout.skin}
        alt=""
        draggable={false}
        style={
          customSkin
            ? {
                WebkitMaskImage: `url(${layout.mask})`,
                maskImage: `url(${layout.mask})`,
                WebkitMaskSize: "100% 100%",
                maskSize: "100% 100%",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
              }
            : undefined
        }
      />

      {/* Sur une image personnalisée uniquement : le masque est réappliqué
          par-dessus, cette fois en tant qu'image visible (fusion "multiply")
          plutôt que comme découpe alpha. Ça restitue le relief du boîtier
          (contours du viseur, des boutons, de la molette) qui donnerait
          sinon un aplat de photo sans plus aucun aspect "appareil photo". */}
      {customSkin && (
        <img
          className="camera-body__skin-relief"
          src={layout.mask}
          alt=""
          draggable={false}
        />
      )}

      {/* Couche 3 : zones fonctionnelles transparentes, superposées
          exactement à l'endroit où l'image dessine chaque contrôle. */}
      <div className="camera-body__hotspot" style={hotspotStyle(layout.shutter)}>
        <button
          type="button"
          className="camera-body__shutter-hotspot"
          onClick={handleShutter}
          disabled={!armed || capturing || outOfFilm || !ready}
          aria-label="Déclencher"
        />
      </div>

      <div className="camera-body__hotspot" style={hotspotStyle(layout.flashButton)}>
        <FlashButton active={flashOn} torchSupported={torchSupported} onToggle={() => setFlashOn((v) => !v)} bare />
      </div>

      <div className="camera-body__hotspot" style={hotspotStyle(layout.filmWheel)}>
        <FilmWheel
          armed={armed}
          disabled={outOfFilm}
          onArmed={() => setArmed(true)}
          axis={layout.wheelAxis}
          bare
        />
      </div>

      {/* Zone vide de l'image : instructions d'usage tant qu'il reste de
          la pellicule, ou horloge de développement (non bloquante — le
          reste de l'app reste utilisable) une fois épuisée. */}
      <div className="camera-body__hotspot camera-body__instructions" style={hotspotStyle(layout.instructionsZone)}>
        {developingUntilMs ? (
          <DevelopClock targetMs={developingUntilMs} ready={!!onReload} onReload={onReload} />
        ) : (
          <InstructionsOverlay wheelAxis={layout.wheelAxis} />
        )}
      </div>

      <HamburgerMenu />

      {/* Cadre "étiquette" bien visible pour le statut courant (armé,
          instructions de glissé, retour après capture…). */}
      <div className="camera-body__status-label">
        <p className="camera-body__status-text" role="status">
          {outOfFilm
            ? "Pellicule épuisée — regarde l'heure de développement ci-dessus."
            : feedback
            ? feedback
            : armed
            ? "Prêt ! Appuie sur le déclencheur."
            : layout.wheelAxis === "horizontal"
            ? "Glisse la molette vers la droite"
            : "Glisse la molette vers le bas"}
        </p>
      </div>
    </div>
  );
}
