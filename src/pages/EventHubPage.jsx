import { Link } from "react-router-dom";
import "./EventHubPage.css";

export default function EventHubPage() {
  return (
    <div className="event-hub">
      <img src="/brand/icon-round-small.webp" alt="" className="page-header-logo" />
      <h1>Événement</h1>
      <p>Organise une pellicule partagée pour un mariage, un anniversaire, une soirée…</p>

      <Link to="/event/new" className="event-hub__card">
        <span className="event-hub__card-title">Créer un événement</span>
        <span className="event-hub__card-desc">Invite des proches et centralise leurs photos</span>
      </Link>

      <Link to="/join" className="event-hub__card">
        <span className="event-hub__card-title">Rejoindre un événement</span>
        <span className="event-hub__card-desc">Avec un code ou un lien d'invitation</span>
      </Link>

      <Link to="/" className="event-hub__back">Retour à l'appareil</Link>
    </div>
  );
}
