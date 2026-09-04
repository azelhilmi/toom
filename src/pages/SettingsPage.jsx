import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { saveCustomBackground, deleteCustomBackground } from "../firebase/firestore";
import { imageToOptimizedBase64 } from "../utils/imageCompression";
import InstallAppCard from "../components/UI/InstallAppCard";
import ImageCropModal from "../components/UI/ImageCropModal";
import "./SettingsPage.css";

export default function SettingsPage() {
  const { customSkin, setCustomSkin } = useTheme();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const fileInputRef = useRef(null);

  function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Sélectionne une image.");
      return;
    }
    setUploadError(null);
    // Ouvre la modale de recadrage/rotation avant tout traitement.
    setPendingFile(file);
  }

  async function handleCropConfirm(croppedBlob) {
    setPendingFile(null);
    setIsUploading(true);
    setUploadError(null);
    try {
      // Compression automatique à la volée, quelle que soit la taille
      // d'origine — une photo de téléphone (souvent plusieurs Mo) est
      // toujours acceptée, jamais rejetée pour être "trop grosse".
      const optimized = await imageToOptimizedBase64(croppedBlob, 1200, 0.85);
      await saveCustomBackground(user.uid, optimized);
      setCustomSkin(optimized);
    } catch (err) {
      console.error("Erreur upload skin:", err);
      setUploadError(err?.message || "Échec du traitement de l'image.");
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
      {pendingFile && (
        <ImageCropModal
          file={pendingFile}
          onConfirm={handleCropConfirm}
          onCancel={() => {
            setPendingFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      )}

      <header className="settings-page__header">
        <div>
          <img src="/brand/icon-round-small.webp" alt="" className="page-header-logo" />
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
          automatiquement. Tu pourras la recadrer et la faire pivoter avant
          de valider.
        </p>

        <div className="settings-page__upload">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelected}
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
