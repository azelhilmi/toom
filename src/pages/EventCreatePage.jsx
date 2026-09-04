import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createEvent } from "../firebase/firestore";
import { generateInviteQrCode } from "../utils/qrCode";
import "./EventCreatePage.css";

export default function EventCreatePage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [shotsPerGuest, setShotsPerGuest] = useState(24);
  const [revealDate, setRevealDate] = useState("");
  const [result, setResult] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!result) return;
    const inviteUrl = `${window.location.origin}/invite/${result.inviteCode}`;
    generateInviteQrCode(inviteUrl).then(setQrDataUrl);
  }, [result]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ready || !user || !name || !revealDate) return;
    setSubmitting(true);
    const { eventId, inviteCode } = await createEvent(user.uid, {
      name,
      shotsPerGuest: Number(shotsPerGuest),
      revealDate,
    });
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

      <button type="submit" disabled={submitting}>
        {submitting ? "Création…" : "Créer l'événement"}
      </button>
    </form>
  );
}
