import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CameraBody from "../components/Camera/CameraBody";
import { useAuth } from "../context/AuthContext";
import { listenToRoll, takePhoto, getEvent } from "../firebase/firestore";
import LoadingScreen from "../components/UI/LoadingScreen";

export default function EventCameraPage() {
  const { eventId } = useParams();
  const { user, ready } = useAuth();
  const [roll, setRoll] = useState(null);
  const [event, setEvent] = useState(null);

  useEffect(() => {
    if (!ready || !user) return;
    const cameraId = `${eventId}_${user.uid}`;
    const unsub = listenToRoll(cameraId, setRoll);
    getEvent(eventId).then(setEvent);
    return unsub;
  }, [ready, user, eventId]);

  if (!ready || !roll || !event) {
    return <LoadingScreen message="Chargement de ta pellicule d'événement…" />;
  }

  async function handleCapture(videoEl, flashUsed) {
    await takePhoto({
      cameraId: roll.id,
      ownerId: user.uid,
      videoEl,
      flashUsed,
      guestName: roll.guestName,
      eventId,
      // Date de révélation commune fixée par l'organisateur (pas de
      // logique "24h après la 1ère photo" ici, contrairement à la
      // pellicule perso — tout le monde se révèle en même temps).
      revealAtOverride: event.revealAt,
    });
  }

  const isFull = roll.shotsUsed >= roll.shotsAllowed;
  const revealAtMs = event.revealAt?.toMillis ? event.revealAt.toMillis() : null;

  return (
    <CameraBody
      shotsRemaining={roll.shotsAllowed - roll.shotsUsed}
      shotsAllowed={roll.shotsAllowed}
      onCapture={handleCapture}
      developingUntilMs={isFull ? revealAtMs : null}
    />
  );
}
