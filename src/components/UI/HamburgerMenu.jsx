import { useState } from "react";
import { Link } from "react-router-dom";
import "./HamburgerMenu.css";

const LINKS = [
  { to: "/event", label: "Événement" },
  { to: "/gallery", label: "Galerie" },
  { to: "/settings", label: "Réglages" },
];

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="hamburger-menu">
      <button
        type="button"
        className="hamburger-menu__button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <>
          <div className="hamburger-menu__backdrop" onClick={() => setOpen(false)} />
          <div className="hamburger-menu__panel">
            <img src="/brand/icon-round-small.webp" alt="Toom" className="hamburger-menu__logo" />
            {LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="hamburger-menu__link" onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
