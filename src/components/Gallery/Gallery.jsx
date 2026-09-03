import { useEffect, useRef, useState } from "react";
import PhotoCard from "./PhotoCard";
import Lightbox from "./Lightbox";
import "./Gallery.css";

const EASTER_EGG_CLICKS = 10;
const EASTER_EGG_WINDOW_MS = 5000;

export default function Gallery({ photos }) {
  const [now, setNow] = useState(Date.now());
  const [cheatMode, setCheatMode] = useState(false);
  const [openPhoto, setOpenPhoto] = useState(null);
  const clickTimestamps = useRef([]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  function handleSecretClick() {
    const t = Date.now();
    clickTimestamps.current = [...clickTimestamps.current, t].filter(
      (ts) => t - ts <= EASTER_EGG_WINDOW_MS
    );
    if (clickTimestamps.current.length >= EASTER_EGG_CLICKS) {
      setCheatMode(true);
      clickTimestamps.current = [];
    }
  }

  if (photos.length === 0) {
    return (
      <div className="gallery gallery--empty" onClick={handleSecretClick}>
        <p>Aucune photo pour l'instant. Ta première pellicule attend d'être développée.</p>
      </div>
    );
  }

  return (
    <div className="gallery">
      {cheatMode && (
        <p className="gallery__cheat-banner">
          🥚 Easter egg activé : toutes les photos sont révélées avant l'heure, rien que pour toi.
        </p>
      )}
      <div className="gallery__grid" onClick={handleSecretClick}>
        {photos.map((photo, i) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            index={photos.length - 1 - i}
            now={now}
            forceReveal={cheatMode}
            onOpen={setOpenPhoto}
          />
        ))}
      </div>

      {openPhoto && (
        <Lightbox url={openPhoto.url} filename={openPhoto.filename} onClose={() => setOpenPhoto(null)} />
      )}
    </div>
  );
}
