import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createDefaultTheme, DEFAULT_COLORS, DEFAULT_EFFECTS, validateElementPositions, getFisheyeFilter } from '../../utils/themeUtils';
import { saveCustomTheme, loadCustomTheme } from '../../firebase/firestore';
import { imageToOptimizedBase64 } from '../../utils/imageCompression';
import PoseCounter from '../Camera/PoseCounter';
import FlashButton from '../Camera/FlashButton';
import FilmWheel from '../Camera/FilmWheel';
import ColorPicker from './ColorPicker';
import './ThemeCustomizer.css';

// Seuls ces 4 éléments sont réellement repositionnables dans l'app (le
// viseur et le nom de marque restent ancrés à leur zone pour ne pas
// casser la mise en page du bandeau/viseur) — l'éditeur ne propose donc
// de glisser-déposer que pour ceux-ci, en toute honnêteté.
const DRAGGABLE_ELEMENTS = [
  { id: 'poseCounter', label: 'Compteur de poses' },
  { id: 'flashButton', label: 'Flash' },
  { id: 'filmWheel', label: 'Molette' },
  { id: 'shutter', label: 'Déclencheur' },
];

const TABS = [
  { id: 'position', label: 'Position' },
  { id: 'colors', label: 'Couleurs' },
  { id: 'effects', label: 'Effets' },
  { id: 'background', label: 'Fond' },
];

function renderPreviewElement(id) {
  switch (id) {
    case 'poseCounter':
      return <PoseCounter remaining={24} total={24} />;
    case 'flashButton':
      return <FlashButton active={false} torchSupported={false} onToggle={() => {}} />;
    case 'filmWheel':
      return <FilmWheel armed={false} disabled={false} onArmed={() => {}} />;
    case 'shutter':
      return (
        <button type="button" className="camera-body__shutter" style={{ pointerEvents: 'none' }}>
          <span className="camera-body__shutter-ring" />
        </button>
      );
    default:
      return null;
  }
}

export default function ThemeCustomizer({ onClose, onSave }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('position');
  const [theme, setTheme] = useState(() => createDefaultTheme());
  const [selectedElement, setSelectedElement] = useState('poseCounter');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const dragState = useRef(null);

  useEffect(() => {
    if (!user?.uid) { setIsLoading(false); return; }
    loadCustomTheme(user.uid)
      .then((saved) => { if (saved) setTheme(saved); })
      .catch((err) => console.error('Erreur de chargement du thème:', err))
      .finally(() => setIsLoading(false));
  }, [user?.uid]);

  const updateElement = useCallback((elementId, updates) => {
    setTheme((prev) => ({
      ...prev,
      elements: {
        ...prev.elements,
        [elementId]: { ...prev.elements[elementId], ...updates },
      },
    }));
  }, []);

  const updateColor = useCallback((colorKey, value) => {
    setTheme((prev) => ({ ...prev, colors: { ...prev.colors, [colorKey]: value } }));
  }, []);

  const updateEffect = useCallback((effectKey, value) => {
    setTheme((prev) => ({ ...prev, effects: { ...prev.effects, [effectKey]: value } }));
  }, []);

  // --- Glisser-déposer réel sur l'aperçu ---
  function handlePointerDown(elementId, e) {
    e.preventDefault();
    setSelectedElement(elementId);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { elementId };
  }

  function handlePointerMove(e) {
    if (!dragState.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    updateElement(dragState.current.elementId, { position: { x, y } });
  }

  function handlePointerUp() {
    dragState.current = null;
  }

  async function handleBackgroundFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setError('Sélectionne un fichier image.');
      return;
    }
    setIsCompressing(true);
    setError(null);
    try {
      // Compression automatique à la volée, quelle que soit la taille
      // d'origine — une photo de téléphone (souvent plusieurs Mo) est
      // toujours redimensionnée et convertie en WebP léger, jamais
      // rejetée pour être "trop grosse".
      const optimized = await imageToOptimizedBase64(file, 420, 0.8);
      setTheme((prev) => ({ ...prev, background: optimized }));
    } catch (err) {
      setError("Échec du traitement de l'image.");
    } finally {
      setIsCompressing(false);
    }
  }

  async function handleSave() {
    if (!user?.uid) { setError('Connecte-toi pour sauvegarder.'); return; }
    setIsSaving(true);
    setError(null);
    try {
      const validated = { ...theme, elements: validateElementPositions(theme.elements), updatedAt: new Date().toISOString() };
      await saveCustomTheme(user.uid, validated);
      onSave?.(validated);
      onClose?.();
    } catch (err) {
      setError('Échec de la sauvegarde.');
    } finally {
      setIsSaving(false);
    }
  }

  const colors = theme?.colors || DEFAULT_COLORS;
  const effects = theme?.effects || DEFAULT_EFFECTS;
  const selected = theme?.elements?.[selectedElement];

  return (
    <div className="theme-customizer">
      <div className="theme-customizer__header">
        <h2 className="theme-customizer__title">Personnaliser le thème</h2>
        <div className="theme-customizer__actions">
          <button type="button" className="theme-customizer__cancel" onClick={onClose} disabled={isSaving}>
            Annuler
          </button>
          <button type="button" className="theme-customizer__save" onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="theme-customizer__tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`theme-customizer__tab ${activeTab === tab.id ? 'theme-customizer__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && <div className="theme-customizer__error">{error}</div>}

      {isLoading ? (
        <div className="theme-customizer__loading">Chargement…</div>
      ) : (
        <div className="theme-customizer__content">
          {activeTab === 'position' && (
            <>
              <p className="theme-customizer__hint">
                Glisse directement les éléments sur l'aperçu pour les repositionner.
              </p>
              <div
                ref={canvasRef}
                className="theme-customizer__canvas"
                style={{
                  background: theme.background
                    ? `url(${theme.background}) center/cover`
                    : colors.chassisColor || '#0a0a0a',
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                <div
                  className="theme-customizer__canvas-band"
                  style={{ background: colors.bodyColor || '#141414' }}
                >
                  <span style={{ color: colors.accent || '#e0e0e0' }}>
                    {theme.elements?.brandName?.text || 'Toom'}
                  </span>
                </div>
                {DRAGGABLE_ELEMENTS.map(({ id }) => {
                  const el = theme.elements?.[id];
                  if (!el) return null;
                  const scale = (el.size ?? 20) / 20;
                  return (
                    <div
                      key={id}
                      className={`theme-customizer__marker ${selectedElement === id ? 'theme-customizer__marker--active' : ''}`}
                      style={{
                        left: `${el.position.x}%`,
                        top: `${el.position.y}%`,
                        transform: `translate(-50%, -50%) scale(${scale})`,
                      }}
                      onPointerDown={(e) => handlePointerDown(id, e)}
                    >
                      {renderPreviewElement(id)}
                    </div>
                  );
                })}
              </div>

              <div className="theme-customizer__element-picker">
                {DRAGGABLE_ELEMENTS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    className={`theme-customizer__chip ${selectedElement === id ? 'theme-customizer__chip--active' : ''}`}
                    onClick={() => setSelectedElement(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {selected && (
                <div className="theme-customizer__element-settings">
                  <label className="theme-customizer__control-label">Taille</label>
                  <input
                    type="range"
                    className="theme-customizer__slider"
                    min="8"
                    max="40"
                    value={selected.size ?? 20}
                    onChange={(e) => updateElement(selectedElement, { size: Number(e.target.value) })}
                  />
                </div>
              )}
            </>
          )}

          {activeTab === 'colors' && (
            <div className="theme-customizer__colors-grid">
              {Object.entries({
                bodyColor: 'Couleur principale',
                bodyColorDark: 'Principale (foncé)',
                bodyShadow: 'Ombre du boîtier',
                chassisColor: 'Boîtier',
                accent: 'Texte / accent',
                accentSoft: 'Texte secondaire',
                flashOn: 'Flash actif',
                ink: 'Texte galerie',
              }).map(([key, label]) => (
                <ColorPicker key={key} label={label} value={colors[key]} onChange={(v) => updateColor(key, v)} />
              ))}
            </div>
          )}

          {activeTab === 'effects' && (
            <div className="theme-customizer__section">
              <div className="theme-customizer__fisheye-toggle">
                <span>Effet fisheye (viseur)</span>
                <button
                  type="button"
                  className={`theme-customizer__toggle ${effects.fisheye ? 'theme-customizer__toggle--on' : ''}`}
                  onClick={() => updateEffect('fisheye', !effects.fisheye)}
                  aria-label="Activer/désactiver le fisheye"
                />
              </div>
              {effects.fisheye && (
                <div className="theme-customizer__element-settings">
                  <label className="theme-customizer__control-label">
                    Intensité — {Math.round(effects.fisheyeIntensity * 100)}%
                  </label>
                  <input
                    type="range"
                    className="theme-customizer__slider"
                    min="0" max="100"
                    value={effects.fisheyeIntensity * 100}
                    onChange={(e) => updateEffect('fisheyeIntensity', Number(e.target.value) / 100)}
                  />
                </div>
              )}
              <div className="theme-customizer__fisheye-toggle">
                <span>Vignette</span>
                <button
                  type="button"
                  className={`theme-customizer__toggle ${effects.vignette ? 'theme-customizer__toggle--on' : ''}`}
                  onClick={() => updateEffect('vignette', !effects.vignette)}
                  aria-label="Activer/désactiver la vignette"
                />
              </div>
              <div
                className="theme-customizer__viewfinder-preview"
                style={{ filter: effects.fisheye ? getFisheyeFilter(effects.fisheyeIntensity) : 'none' }}
              >
                Aperçu du viseur
              </div>
            </div>
          )}

          {activeTab === 'background' && (
            <div className="theme-customizer__section">
              <input
                type="file"
                id="bg-upload"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleBackgroundFile(e.target.files?.[0])}
              />
              <label htmlFor="bg-upload" className="theme-customizer__upload-button">
                {isCompressing ? 'Compression en cours…' : theme.background ? "Changer l'image" : 'Choisir une photo'}
              </label>
              {theme.background && !isCompressing && (
                <button
                  type="button"
                  className="theme-customizer__remove-button"
                  onClick={() => setTheme((prev) => ({ ...prev, background: null }))}
                >
                  Supprimer
                </button>
              )}
              <p className="theme-customizer__hint">
                N'importe quelle photo convient — elle est automatiquement compressée et redimensionnée, quelle que soit sa taille d'origine.
              </p>
              {theme.background && (
                <div
                  className="theme-customizer__bg-preview"
                  style={{ background: `url(${theme.background}) center/cover` }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
