import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { saveCustomBackground, deleteCustomBackground } from "../firebase/firestore";
import { imageToOptimizedBase64 } from "../utils/imageCompression";
import InstallAppCard from "../components/UI/InstallAppCard";
import "./SettingsPage.css";

export default function SettingsPage() {
  const { customSkin, setCustomSkin } = useTheme();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Sélectionne une image.");
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      // Compression automatique à la volée, quelle que soit la taille
      // d'origine — une photo de téléphone (souvent plusieurs Mo) est
      // toujours acceptée, jamais rejetée pour être "trop grosse".
      const optimized = await imageToOptimizedBase64(file, 1200, 0.85);
      await saveCustomBackground(user.uid, optimized);
      setCustomSkin(optimized);
    } catch {
      setUploadError("Échec du traitement de l'image.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!user?.uid) return;
    await deleteCustomBackground(user.uid);
    setCustomSkin(null);
  }

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <div>
          <img src="/brand/wordmark-small.webp" alt="" className="page-header-logo" />
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
        <h2>Habillage de l'appareil</h2>
        <p className="settings-page__hint">
          Remplace l'habillage jaune par défaut par une image de ton choix —
          elle s'adapte automatiquement à ton écran, en portrait comme en
          paysage. N'importe quelle photo convient, elle est compressée
          automatiquement.
        </p>

        <div className="settings-page__upload">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept="image/*"
            disabled={isUploading}
            className="settings-page__file-input"
            id="skin-upload"
          />
          <label htmlFor="skin-upload" className="settings-page__upload-button">
            {isUploading ? "Traitement…" : customSkin ? "Changer l'image" : "Choisir une image"}
          </label>

          {customSkin && (
            <button
              type="button"
              onClick={handleRemove}
              className="settings-page__remove-button"
              disabled={isUploading}
            >
              Revenir au thème par défaut
            </button>
          )}
        </div>

        {uploadError && <p className="settings-page__error">{uploadError}</p>}

        {customSkin && (
          <div className="settings-page__preview">
            <div className="settings-page__preview-image" style={{ backgroundImage: `url(${customSkin})` }} />
          </div>
        )}
      </section>
    </div>
  );
}
