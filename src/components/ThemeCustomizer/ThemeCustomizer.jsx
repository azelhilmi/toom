import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createDefaultTheme, DEFAULT_ELEMENTS, DEFAULT_COLORS, DEFAULT_EFFECTS, validateElementPositions } from '../../utils/themeUtils';
import { saveCustomTheme, loadCustomTheme } from '../../firebase/firestore';
import { imageToOptimizedBase64 } from '../../utils/imageCompression';
import PreviewPanel from './PreviewPanel';
import ColorPicker from './ColorPicker';
import './ThemeCustomizer.css';

/**
 * Composant principal du customisateur de thème
 * Permet de personnaliser complètement l'apparence de l'appareil
 */
export default function ThemeCustomizer({ onClose, onSave }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('elements');
  const [theme, setTheme] = useState(() => createDefaultTheme());
  const [selectedElement, setSelectedElement] = useState('viewfinder');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Charger le thème existant au montage
  const loadTheme = useCallback(async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      const savedTheme = await loadCustomTheme(user.uid);
      if (savedTheme) {
        setTheme(savedTheme);
      }
    } catch (err) {
      console.error('Erreur de chargement du thème:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Charger au montage
  useState(() => {
    loadTheme();
  }, []);

  // Mettre à jour un élément
  const updateElement = useCallback((elementId, updates) => {
    setTheme(prev => ({
      ...prev,
      elements: {
        ...prev.elements,
        [elementId]: {
          ...prev.elements[elementId],
          ...updates
        }
      }
    }));
  }, []);

  // Mettre à jour une couleur
  const updateColor = useCallback((colorKey, value) => {
    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value
      }
    }));
  }, []);

  // Mettre à jour un texte
  const updateText = useCallback((elementId, text) => {
    setTheme(prev => ({
      ...prev,
      elements: {
        ...prev.elements,
        [elementId]: {
          ...prev.elements[elementId],
          text
        }
      }
    }));
  }, []);

  // Mettre à jour un effet
  const updateEffect = useCallback((effectKey, value) => {
    setTheme(prev => ({
      ...prev,
      effects: {
        ...prev.effects,
        [effectKey]: value
      }
    }));
  }, []);

  // Mettre à jour le background
  const updateBackground = useCallback(async (file) => {
    if (!file) return;
    
    try {
      const optimizedBase64 = await imageToOptimizedBase64(file, 420, 0.85);
      setTheme(prev => ({
        ...prev,
        background: optimizedBase64
      }));
    } catch (err) {
      setError('Échec du traitement de l\'image');
    }
  }, []);

  // Supprimer le background
  const removeBackground = useCallback(() => {
    setTheme(prev => ({
      ...prev,
      background: null
    }));
  }, []);

  // Sauvegarder le thème
  const handleSave = useCallback(async () => {
    if (!user?.uid) {
      setError('Connectez-vous pour sauvegarder');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Valider les positions
      const validatedTheme = {
        ...theme,
        elements: validateElementPositions(theme.elements),
        updatedAt: new Date().toISOString()
      };
      
      await saveCustomTheme(user.uid, validatedTheme);
      onSave?.(validatedTheme);
      onClose?.();
    } catch (err) {
      setError('Échec de la sauvegarde');
      console.error('Erreur de sauvegarde:', err);
    } finally {
      setIsSaving(false);
    }
  }, [user?.uid, theme, onSave, onClose]);

  // Annuler
  const handleCancel = useCallback(() => {
    onClose?.();
  }, [onClose]);

  // Éléments disponibles
  const elements = useMemo(() => (
    theme?.elements || DEFAULT_ELEMENTS
  ), [theme?.elements]);

  // Couleurs disponibles
  const colors = useMemo(() => (
    theme?.colors || DEFAULT_COLORS
  ), [theme?.colors]);

  // Effets disponibles
  const effects = useMemo(() => (
    theme?.effects || DEFAULT_EFFECTS
  ), [theme?.effects]);

  // Élément sélectionné
  const selected = elements[selectedElement];

  // Rendu des onglets
  const renderTabs = () => (
    <div className="theme-customizer__tabs">
      <button 
        type="button"
        className={`theme-customizer__tab ${activeTab === 'elements' ? 'theme-customizer__tab--active' : ''}`}
        onClick={() => setActiveTab('elements')}
      >
        Éléments
      </button>
      <button 
        type="button"
        className={`theme-customizer__tab ${activeTab === 'colors' ? 'theme-customizer__tab--active' : ''}`}
        onClick={() => setActiveTab('colors')}
      >
        Couleurs
      </button>
      <button 
        type="button"
        className={`theme-customizer__tab ${activeTab === 'texts' ? 'theme-customizer__tab--active' : ''}`}
        onClick={() => setActiveTab('texts')}
      >
        Textes
      </button>
      <button 
        type="button"
        className={`theme-customizer__tab ${activeTab === 'effects' ? 'theme-customizer__tab--active' : ''}`}
        onClick={() => setActiveTab('effects')}
      >
        Effets
      </button>
      <button 
        type="button"
        className={`theme-customizer__tab ${activeTab === 'background' ? 'theme-customizer__tab--active' : ''}`}
        onClick={() => setActiveTab('background')}
      >
        Fond
      </button>
    </div>
  );

  // Rendu de l'onglet Éléments
  const renderElementsTab = () => (
    <div className="theme-customizer__content">
      <section className="theme-customizer__section">
        <h3 className="theme-customizer__section-title">Sélectionnez un élément à modifier</h3>
        <div className="theme-customizer__element-selector">
          {Object.entries(elements).map(([id, element]) => (
            <button
              key={id}
              type="button"
              className={`theme-customizer__element-btn ${selectedElement === id ? 'theme-customizer__element-btn--active' : ''}`}
              onClick={() => setSelectedElement(id)}
            >
              <span>{element.icon} {element.label}</span>
            </button>
          ))}
        </div>
      </section>

      {selected && (
        <section className="theme-customizer__section">
          <h3 className="theme-customizer__section-title">
            Position de {selected.label}
          </h3>
          <div className="theme-customizer__position-controls">
            <div className="theme-customizer__control">
              <label className="theme-customizer__control-label">Position X (%)</label>
              <input
                type="number"
                className="theme-customizer__position-input"
                value={selected.position.x}
                onChange={(e) => updateElement(selected.id, { 
                  position: { 
                    ...selected.position, 
                    x: Math.max(0, Math.min(100, Number(e.target.value) || 0)) 
                  } 
                })}
                min="0"
                max="100"
              />
              <input
                type="range"
                className="theme-customizer__slider"
                value={selected.position.x}
                onChange={(e) => updateElement(selected.id, { 
                  position: { 
                    ...selected.position, 
                    x: Number(e.target.value) 
                  } 
                })}
                min="0"
                max="100"
              />
            </div>
            <div className="theme-customizer__control">
              <label className="theme-customizer__control-label">Position Y (%)</label>
              <input
                type="number"
                className="theme-customizer__position-input"
                value={selected.position.y}
                onChange={(e) => updateElement(selected.id, { 
                  position: { 
                    ...selected.position, 
                    y: Math.max(0, Math.min(100, Number(e.target.value) || 0)) 
                  } 
                })}
                min="0"
                max="100"
              />
              <input
                type="range"
                className="theme-customizer__slider"
                value={selected.position.y}
                onChange={(e) => updateElement(selected.id, { 
                  position: { 
                    ...selected.position, 
                    y: Number(e.target.value) 
                  } 
                })}
                min="0"
                max="100"
              />
            </div>
            <div className="theme-customizer__control">
              <label className="theme-customizer__control-label">Taille (%)</label>
              <input
                type="number"
                className="theme-customizer__position-input"
                value={selected.size}
                onChange={(e) => updateElement(selected.id, { 
                  size: Math.max(1, Math.min(100, Number(e.target.value) || 10)) 
                })}
                min="1"
                max="100"
              />
              <input
                type="range"
                className="theme-customizer__slider"
                value={selected.size}
                onChange={(e) => updateElement(selected.id, { 
                  size: Number(e.target.value) 
                })}
                min="1"
                max="100"
              />
            </div>
            <div className="theme-customizer__control">
              <label className="theme-customizer__control-label">Z-Index</label>
              <input
                type="number"
                className="theme-customizer__position-input"
                value={selected.zIndex}
                onChange={(e) => updateElement(selected.id, { 
                  zIndex: Math.max(0, Math.min(100, Number(e.target.value) || 0)) 
                })}
                min="0"
                max="100"
              />
            </div>
          </div>
        </section>
      )}

      {/* Aperçu */}
      <section className="theme-customizer__section">
        <h3 className="theme-customizer__section-title">Aperçu</h3>
        <div className="theme-customizer__previews">
          <PreviewPanel
            theme={theme}
            selectedElement={selectedElement}
            onElementSelect={setSelectedElement}
            isLandscape={false}
          />
          <PreviewPanel
            theme={theme}
            selectedElement={selectedElement}
            onElementSelect={setSelectedElement}
            isLandscape={true}
          />
        </div>
      </section>
    </div>
  );

  // Rendu de l'onglet Couleurs
  const renderColorsTab = () => (
    <div className="theme-customizer__content">
      <section className="theme-customizer__section">
        <h3 className="theme-customizer__section-title">Couleurs du thème</h3>
        <div className="theme-customizer__controls">
          {Object.entries(colors).map(([key, value]) => (
            <div className="theme-customizer__control" key={key}>
              <label className="theme-customizer__control-label">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </label>
              <ColorPicker
                label={key}
                value={value}
                onChange={(color) => updateColor(key, color)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="theme-customizer__section">
        <h3 className="theme-customizer__section-title">Aperçu</h3>
        <div className="theme-customizer__previews">
          <PreviewPanel
            theme={theme}
            selectedElement={selectedElement}
            onElementSelect={setSelectedElement}
            isLandscape={false}
          />
          <PreviewPanel
            theme={theme}
            selectedElement={selectedElement}
            onElementSelect={setSelectedElement}
            isLandscape={true}
          />
        </div>
      </section>
    </div>
  );

  // Rendu de l'onglet Textes
  const renderTextsTab = () => {
    const textElements = Object.entries(elements).filter(([_, el]) => el.type === 'text');
    
    return (
      <div className="theme-customizer__content">
        <section className="theme-customizer__section">
          <h3 className="theme-customizer__section-title">Textes personnalisables</h3>
          <div className="theme-customizer__element-list">
            {textElements.map(([id, element]) => (
              <div 
                key={id}
                className="theme-customizer__element-item"
                onClick={() => setSelectedElement(id)}
              >
                <span className="theme-customizer__element-name">
                  {element.icon} {element.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {selected && selected.type === 'text' && (
          <section className="theme-customizer__section">
            <h3 className="theme-customizer__section-title">
              Éditer: {selected.label}
            </h3>
            <div className="theme-customizer__text-editor">
              <textarea
                className="theme-customizer__text-input"
                value={selected.text || ''}
                onChange={(e) => updateText(selected.id, e.target.value)}
                placeholder={`Texte pour ${selected.label}`}
                rows={3}
              />
            </div>
          </section>
        )}

        <section className="theme-customizer__section">
          <h3 className="theme-customizer__section-title">Aperçu</h3>
          <div className="theme-customizer__previews">
            <PreviewPanel
              theme={theme}
              selectedElement={selectedElement}
              onElementSelect={setSelectedElement}
              isLandscape={false}
            />
            <PreviewPanel
              theme={theme}
              selectedElement={selectedElement}
              onElementSelect={setSelectedElement}
              isLandscape={true}
            />
          </div>
        </section>
      </div>
    );
  };

  // Rendu de l'onglet Effets
  const renderEffectsTab = () => (
    <div className="theme-customizer__content">
      <section className="theme-customizer__section">
        <h3 className="theme-customizer__section-title">Effets visuels</h3>
        
        <div className="theme-customizer__fisheye-controls">
          <div className="theme-customizer__fisheye-toggle">
            <span style={{ fontSize: '0.85rem' }}>Effet Fisheye</span>
            <button
              type="button"
              className={`theme-customizer__toggle ${effects.fisheye ? 'theme-customizer__toggle--on' : ''}`}
              onClick={() => updateEffect('fisheye', !effects.fisheye)}
              aria-label={effects.fisheye ? 'Désactiver fisheye' : 'Activer fisheye'}
            />
          </div>
          
          {effects.fisheye && (
            <div className="theme-customizer__control">
              <label className="theme-customizer__control-label">Intensité Fisheye</label>
              <input
                type="range"
                className="theme-customizer__slider"
                value={effects.fisheyeIntensity * 100}
                onChange={(e) => updateEffect('fisheyeIntensity', Number(e.target.value) / 100)}
                min="0"
                max="100"
              />
              <div className="theme-customizer__control-value">
                {Math.round(effects.fisheyeIntensity * 100)}%
              </div>
            </div>
          )}
        </div>

        <div className="theme-customizer__control">
          <label className="theme-customizer__control-label">Flou du viseur</label>
          <input
            type="range"
            className="theme-customizer__slider"
            value={effects.blur}
            onChange={(e) => updateEffect('blur', Number(e.target.value))}
            min="0"
            max="5"
            step="0.1"
          />
          <div className="theme-customizer__control-value">
            {effects.blur}px
          </div>
        </div>

        <div className="theme-customizer__fisheye-toggle">
          <span style={{ fontSize: '0.85rem' }}>Vignette</span>
          <button
            type="button"
            className={`theme-customizer__toggle ${effects.vignette ? 'theme-customizer__toggle--on' : ''}`}
            onClick={() => updateEffect('vignette', !effects.vignette)}
            aria-label={effects.vignette ? 'Désactiver vignette' : 'Activer vignette'}
          />
        </div>
      </section>

      <section className="theme-customizer__section">
        <h3 className="theme-customizer__section-title">Aperçu</h3>
        <div className="theme-customizer__previews">
          <PreviewPanel
            theme={theme}
            selectedElement={selectedElement}
            onElementSelect={setSelectedElement}
            isLandscape={false}
          />
          <PreviewPanel
            theme={theme}
            selectedElement={selectedElement}
            onElementSelect={setSelectedElement}
            isLandscape={true}
          />
        </div>
      </section>
    </div>
  );

  // Rendu de l'onglet Fond
  const renderBackgroundTab = () => {
    const [fileInputKey, setFileInputKey] = useState(Date.now());
    
    const handleFileChange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image');
        return;
      }
      
      if (file.size > 500 * 1024) {
        setError('L\'image doit faire moins de 500 Ko');
        return;
      }
      
      await updateBackground(file);
      setFileInputKey(Date.now());
    };

    return (
      <div className="theme-customizer__content">
        <section className="theme-customizer__section">
          <h3 className="theme-customizer__section-title">Arrière-plan du boîtier</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="file"
              id="background-upload"
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              key={fileInputKey}
            />
            <label htmlFor="background-upload" className="theme-customizer__upload-button">
              {theme.background ? 'Changer l\'image' : 'Choisir une image'}
            </label>
            
            {theme.background && (
              <button
                type="button"
                className="theme-customizer__remove-button"
                onClick={removeBackground}
                style={{ marginLeft: '0.5rem' }}
              >
                Supprimer
              </button>
            )}
          </div>

          {theme.background && (
            <div style={{ 
              background: `url(${theme.background}) center/cover`,
              width: '100%',
              height: '150px',
              borderRadius: '8px',
              border: '1px solid #333',
              marginBottom: '1rem'
            }} />
          )}

          <p style={{ fontSize: '0.75rem', color: '#777' }}>
            Formats acceptés: JPEG, PNG, WebP<br />
            Taille max: 500 Ko (sera redimensionné à 420px)
          </p>
        </section>

        <section className="theme-customizer__section">
          <h3 className="theme-customizer__section-title">Aperçu</h3>
          <div className="theme-customizer__previews">
            <PreviewPanel
              theme={theme}
              selectedElement={selectedElement}
              onElementSelect={setSelectedElement}
              isLandscape={false}
            />
            <PreviewPanel
              theme={theme}
              selectedElement={selectedElement}
              onElementSelect={setSelectedElement}
              isLandscape={true}
            />
          </div>
        </section>
      </div>
    );
  };

  // Rendu de l'onglet actif
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'colors':
        return renderColorsTab();
      case 'texts':
        return renderTextsTab();
      case 'effects':
        return renderEffectsTab();
      case 'background':
        return renderBackgroundTab();
      default:
        return renderElementsTab();
    }
  };

  return (
    <div className="theme-customizer">
      <div className="theme-customizer__header">
        <h2 className="theme-customizer__title">Personnaliser le thème</h2>
        <div className="theme-customizer__actions">
          <button
            type="button"
            className="theme-customizer__cancel"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Annuler
          </button>
          <button
            type="button"
            className="theme-customizer__save"
            onClick={handleSave}
            disabled={isSaving || isLoading}
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {renderTabs()}
      
      {error && (
        <div style={{
          padding: '0 1rem',
          color: '#ff4444',
          fontSize: '0.8rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#777'
        }}>
          Chargement...
        </div>
      ) : (
        renderActiveTab()
      )}
    </div>
  );
}
