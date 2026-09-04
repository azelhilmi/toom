import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { setDisplayName } from "../firebase/auth";
import { getEventByInviteCode, joinEvent } from "../firebase/firestore";
import "./EventCreatePage.css";

export default function EventJoinPage() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(undefined);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getEventByInviteCode(inviteCode).then(setEvent);
  }, [inviteCode]);

  if (event === undefined) return <p className="page-loading">Chargement…</p>;
  if (event === null) return <p className="page-loading">Ce lien d'invitation n'est plus valide.</p>;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const user = await setDisplayName(name.trim());
    await joinEvent(event.id, user.uid, name.trim(), event.shotsPerGuest);
    navigate(`/event/${event.id}/camera`);
  }

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <h2>{event.name}</h2>
      <p>Tu es invité·e à immortaliser ce moment avec un appareil jetable virtuel. Tes photos seront révélées le jour J.</p>
      <label>
        Ton prénom
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Camille" required autoFocus />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? "Un instant…" : "Rejoindre l'événement"}
      </button>
    </form>
  );
}
