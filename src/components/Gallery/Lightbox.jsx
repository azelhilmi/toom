import { useState } from "react";
import { downloadImage, shareImage } from "../../utils/saveImage";
import "./Lightbox.css";

export default function Lightbox({ url, filename, onClose }) {
  const [status, setStatus] = useState(null);

  async function handleShare() {
    setStatus("En cours…");
    const result = await shareImage(url, filename);
    if (result === "unsupported") {
      downloadImage(url, filename);
      setStatus("Téléchargée (partage indisponible sur ce navigateur)");
    } else if (result === "shared") {
      setStatus("Partagée !");
    } else {
      setStatus(null);
    }
    setTimeout(() => setStatus(null), 2500);
  }

  function handleDownload() {
    downloadImage(url, filename);
    setStatus("Téléchargée !");
    setTimeout(() => setStatus(null), 2500);
  }

  return (
    <div className="lightbox" onClick={onClose}>
      <button type="button" className="lightbox__close" onClick={onClose} aria-label="Fermer">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path fill="currentColor" d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>

      <img src={url} alt="" className="lightbox__img" onClick={(e) => e.stopPropagation()} />

      <div className="lightbox__actions" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="lightbox__button" onClick={handleDownload}>
          Télécharger
        </button>
        <button type="button" className="lightbox__button lightbox__button--primary" onClick={handleShare}>
          Partager
        </button>
      </div>

      {status && <p className="lightbox__status">{status}</p>}
    </div>
  );
}
