import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AVAILABLE_THEMES } from "../context/ThemeContext";
import { createEvent } from "../firebase/firestore";
import "./EventCreatePage.css";

export default function EventCreatePage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [theme, setTheme] = useState("kodak-funsaver");
  const [shotsPerGuest, setShotsPerGuest] = useState(24);
  const [revealDate, setRevealDate] = useState("");
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ready || !user || !name || !revealDate) return;
    setSubmitting(true);
    const { eventId, inviteCode } = await createEvent(user.uid, {
      name,
      theme,
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
        Thème
        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          {AVAILABLE_THEMES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
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
