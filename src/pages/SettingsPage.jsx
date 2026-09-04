import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { AVAILABLE_THEMES, useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { saveCustomBackground, deleteCustomBackground, loadCustomTheme, saveCustomTheme } from "../firebase/firestore";
import { imageToOptimizedBase64 } from "../utils/imageCompression";
import ThemeCustomizer from "../components/ThemeCustomizer/ThemeCustomizer";
import InstallAppCard from "../components/UI/InstallAppCard";
import "./SettingsPage.css";

export default function SettingsPage() {
  const { theme, setTheme, customBackground, setCustomBackground } = useTheme();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const fileInputRef = useRef(null);

  const handleBackgroundUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Veuillez sélectionner une image');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const optimizedBase64 = await imageToOptimizedBase64(file, 420, 0.75);
      await saveCustomBackground(user.uid, optimizedBase64);
      setCustomBackground(optimizedBase64);
    } catch (err) {
      setUploadError('Échec du traitement de l\'image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveBackground = async () => {
    if (!user?.uid) return;
    await deleteCustomBackground(user.uid);
    setCustomBackground(null);
  };

  const handleSaveTheme = useCallback(async (themeData) => {
    if (!user?.uid) return;
    await saveCustomTheme(user.uid, themeData);
  }, [user?.uid]);

  const handleOpenCustomizer = () => {
    setShowCustomizer(true);
  };

  const handleCloseCustomizer = () => {
    setShowCustomizer(false);
  };

  if (showCustomizer) {
    return (
      <ThemeCustomizer
        onClose={handleCloseCustomizer}
        onSave={handleSaveTheme}
      />
    );
  }

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
        <h2>Installer l'application</h2>
        <InstallAppCard />
      </section>

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

      <section className="settings-page__section">
        <h2>Personnalisation avancée</h2>
        <p className="settings-page__hint">
          Créez un thème 100% personnalisé avec positionnement des éléments,
          couleurs, textes et effets visuels.
        </p>
        <button
          type="button"
          className="settings-page__customize-button"
          onClick={handleOpenCustomizer}
        >
          Ouvrir le customisateur de thème
        </button>
      </section>

      <section className="settings-page__section">
        <h2>Arrière-plan personnalisé</h2>
        <p className="settings-page__hint">
          Upload n'importe quelle photo pour le boîtier de ton appareil — elle
          est automatiquement compressée, quelle que soit sa taille d'origine.
          Les boutons et le viseur resteront par-dessus.
        </p>
        
        <div className="settings-page__upload">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleBackgroundUpload}
            accept="image/jpeg,image/png,image/webp"
            disabled={isUploading}
            className="settings-page__file-input"
            id="background-upload"
          />
          <label htmlFor="background-upload" className="settings-page__upload-button">
            {isUploading ? 'Traitement...' : 'Choisir une image'}
          </label>
          
          {customBackground && (
            <button
              type="button"
              onClick={handleRemoveBackground}
              className="settings-page__remove-button"
              disabled={isUploading}
            >
              Supprimer
            </button>
          )}
        </div>
        
        {uploadError && (
          <p className="settings-page__error">{uploadError}</p>
        )}
        
        {customBackground && (
          <div className="settings-page__preview">
            <div
              className="settings-page__preview-image"
              style={{ backgroundImage: `url(${customBackground})` }}
            />
          </div>
        )}
      </section>
    </div>
  );
}
