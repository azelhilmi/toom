import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createEvent, saveEventTheme } from "../firebase/firestore";
import { imageToOptimizedBase64 } from "../utils/imageCompression";
import { generateInviteQrCode } from "../utils/qrCode";
import ImageCropModal from "../components/UI/ImageCropModal";
import "./EventCreatePage.css";

const DEFAULT_MASK_COLOR = "#8a8a8a";

export default function EventCreatePage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [shotsPerGuest, setShotsPerGuest] = useState(24);
  const [revealDate, setRevealDate] = useState("");
  const [result, setResult] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Thème imposé aux invités (facultatif).
  const [wantsTheme, setWantsTheme] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [maskColor, setMaskColor] = useState(DEFAULT_MASK_COLOR);
  const [transparent, setTransparent] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!result) return;
    const inviteUrl = `${window.location.origin}/invite/${result.inviteCode}`;
    generateInviteQrCode(inviteUrl).then(setQrDataUrl);
  }, [result]);

  function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ready || !user || !name || !revealDate) return;
    setSubmitting(true);
    const { eventId, inviteCode } = await createEvent(user.uid, {
      name,
      shotsPerGuest: Number(shotsPerGuest),
      revealDate,
    });

    if (wantsTheme && croppedBlob) {
      const optimized = await imageToOptimizedBase64(croppedBlob, 1200, 0.85);
      await saveEventTheme(eventId, { maskColor: transparent ? "transparent" : maskColor, backgroundBase64: optimized });
    }

    setResult({ eventId, inviteCode });
    setSubmitting(false);
  }

  if (result) {
    const inviteUrl = `${window.location.origin}/invite/${result.inviteCode}`;
    return (
      <div className="event-form">
        <h2>Événement créé</h2>
        <p>Partage ce lien à tes invités :</p>
        <input readOnly value={inviteUrl} className="event-form__invite" onFocus={(e) => e.target.select()} />

        <p>Ou communique simplement ce code :</p>
        <div className="event-form__code-display">{result.inviteCode}</div>

        {qrDataUrl && (
          <>
            <p>Ou fais-le scanner :</p>
            <img src={qrDataUrl} alt="QR code d'invitation" className="event-form__qr" width={180} height={180} />
          </>
        )}

        <button type="button" onClick={() => navigate(`/event/${result.eventId}`)}>
          Aller au tableau de bord
        </button>
      </div>
    );
  }

  return (
    <>
      {pendingFile && (
        <ImageCropModal
          file={pendingFile}
          onConfirm={(blob) => {
            setCroppedBlob(blob);
            setPendingFile(null);
          }}
          onCancel={() => {
            setPendingFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      )}

      <form className="event-form" onSubmit={handleSubmit}>
        <h2>Créer un événement</h2>

        <label>
          Nom de l'événement
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mariage de Léa & Tom" required />
        </label>

        <label>
          Poses par invité
          <input
            type="number"
            min="1"
            max="72"
            value={shotsPerGuest}
            onChange={(e) => setShotsPerGuest(e.target.value)}
          />
        </label>

        <label>
          Date de révélation des photos
          <input type="datetime-local" value={revealDate} onChange={(e) => setRevealDate(e.target.value)} required />
        </label>

        <label className="event-form__checkbox-label">
          <input type="checkbox" checked={wantsTheme} onChange={(e) => setWantsTheme(e.target.checked)} />
          Imposer un habillage à tous les invités
        </label>

        {wantsTheme && (
          <div className="event-form__theme-block">
            <p className="event-form__theme-hint">
              Tous les invités verront cet habillage sur leur appareil, à la
              place de leur thème personnel, pour la durée de l'événement.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              accept="image/*"
              id="event-theme-upload"
              style={{ display: "none" }}
            />
            <label htmlFor="event-theme-upload" className="event-form__upload-button">
              {croppedBlob ? "Changer l'image" : "Choisir une image"}
            </label>

            {croppedBlob && (
              <div
                className="event-form__theme-preview"
                style={{ backgroundImage: `url(${URL.createObjectURL(croppedBlob)})` }}
              />
            )}

            <div className="event-form__color-row">
              <input type="color" value={maskColor} onChange={(e) => setMaskColor(e.target.value)} disabled={transparent} />
              <label className="event-form__checkbox-label">
                <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} />
                Garder le mécanisme gris d'origine
              </label>
            </div>
          </div>
        )}

        <button type="submit" disabled={submitting || (wantsTheme && !croppedBlob)}>
          {submitting ? "Création…" : "Créer l'événement"}
        </button>
      </form>
    </>
  );
}
