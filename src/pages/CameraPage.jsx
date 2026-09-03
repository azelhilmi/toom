import { useCallback, useEffect, useState } from "react";
import CameraBody from "../components/Camera/CameraBody";
import DevelopingScreen from "../components/Camera/DevelopingScreen";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getOrCreateActiveRoll, listenToRoll, takePhoto } from "../firebase/firestore";

export default function CameraPage() {
  const { user, ready } = useAuth();
  const { theme } = useTheme();
  const [rollId, setRollId] = useState(null);
  const [roll, setRoll] = useState(null);

  const loadActiveRoll = useCallback(() => {
    if (!user) return () => {};
    let unsub = () => {};
    getOrCreateActiveRoll(user.uid, theme).then((id) => {
      setRollId(id);
      unsub = listenToRoll(id, setRoll);
    });
    return () => unsub();
  }, [user, theme]);

  useEffect(() => {
    if (!ready || !user) return;
    const cleanup = loadActiveRoll();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user, theme]);

  if (!ready || !roll) {
    return <p className="page-loading">Chargement de la pellicule…</p>;
  }

  const isFull = roll.shotsUsed >= roll.shotsAllowed;
  const revealAtMs = roll.revealAt?.toMillis ? roll.revealAt.toMillis() : null;
  const isDeveloped = revealAtMs ? Date.now() >= revealAtMs : false;

  // Pellicule épuisée mais pas encore développée : on ne peut ni
  // photographier, ni recharger — il faut attendre les 24h.
  if (isFull && !isDeveloped) {
    return <DevelopingScreen revealAtMs={revealAtMs} />;
  }

  // Pellicule épuisée ET développée : propose de recharger un nouveau
  // rouleau de 24 poses (getOrCreateActiveRoll en créera un nouveau).
  if (isFull && isDeveloped) {
    return (
      <DevelopingScreen
        revealAtMs={revealAtMs}
        ready
        onReload={() => {
          setRoll(null);
          loadActiveRoll();
        }}
      />
    );
  }

  async function handleCapture(videoEl, flashUsed) {
    await takePhoto({
      cameraId: rollId,
      ownerId: user.uid,
      videoEl,
      flashUsed,
    });
  }

  return (
    <CameraBody
      shotsRemaining={roll.shotsAllowed - roll.shotsUsed}
      shotsAllowed={roll.shotsAllowed}
      onCapture={handleCapture}
    />
  );
}
