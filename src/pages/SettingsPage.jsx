import { Link } from "react-router-dom";
import { AVAILABLE_THEMES, useTheme } from "../context/ThemeContext";
import "./SettingsPage.css";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <div>
          <h1>Réglages</h1>
          <p>Personnalise l'apparence de ton appareil.</p>
        </div>
        <Link to="/" className="settings-page__back">Appareil</Link>
      </header>

      <section className="settings-page__section">
        <h2>Thème</h2>
        <div className="settings-page__themes">
          {AVAILABLE_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`settings-page__theme ${theme === t.id ? "settings-page__theme--active" : ""}`}
              onClick={() => setTheme(t.id)}
              data-theme={t.id}
            >
              <span className="settings-page__theme-swatch" />
              {t.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
