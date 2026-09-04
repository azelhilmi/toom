import { Link } from "react-router-dom";
import "./BottomIconNav.css";

export default function BottomIconNav() {
  return (
    <div className="bottom-icon-nav">
      <Link to="/event" className="bottom-icon-nav__button" aria-label="Événement" title="Événement">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="currentColor"
            d="M7 2v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2V2h-2v2H9V2H7zM5 9h14v11H5V9zm7 2l1.2 2.4 2.6.4-1.9 1.9.5 2.6L12 17l-2.4 1.3.5-2.6-1.9-1.9 2.6-.4L12 11z"
          />
        </svg>
      </Link>
      <Link to="/gallery" className="bottom-icon-nav__button" aria-label="Ouvrir la galerie" title="Galerie">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="currentColor"
            d="M4 5a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2H4zm0 2h16v10H4V7zm3 1.5A1.5 1.5 0 108.5 10 1.5 1.5 0 007 8.5zM6 16l3.5-4.5 2.5 3L15 10l3 6H6z"
          />
        </svg>
      </Link>
      <Link to="/settings" className="bottom-icon-nav__button" aria-label="Réglages" title="Réglages">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="currentColor"
            d="M19.4 13a7.4 7.4 0 000-2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 00-1.7-1L15 3h-6l-.3 2.5a7.6 7.6 0 00-1.7 1l-2.4-1-2 3.4L4.6 11a7.4 7.4 0 000 2l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 001.7 1L9 21h6l.3-2.5a7.6 7.6 0 001.7-1l2.4 1 2-3.4L19.4 13zM12 15.5A3.5 3.5 0 1115.5 12 3.5 3.5 0 0112 15.5z"
          />
        </svg>
      </Link>
    </div>
  );
}
