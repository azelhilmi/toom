import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEventByInviteCode } from "../firebase/firestore";
import "./EventCreatePage.css";

export default function JoinByCodePage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) return;
    setChecking(true);
    setError("");
    const event = await getEventByInviteCode(cleaned);
    setChecking(false);
    if (!event) {
      setError("Code introuvable. Vérifie l'orthographe auprès de l'organisateur.");
      return;
    }
    navigate(`/invite/${cleaned}`);
  }

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <h2>Rejoindre un événement</h2>
      <p>Saisis le code communiqué par l'organisateur.</p>
      <label>
        Code événement
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(""); }}
          placeholder="EX. 7K2P9Q"
          className="event-form__code-input"
          autoCapitalize="characters"
          autoFocus
          required
        />
      </label>
      {error && <p className="event-form__error">{error}</p>}
      <button type="submit" disabled={checking}>
        {checking ? "Recherche…" : "Continuer"}
      </button>
    </form>
  );
}
