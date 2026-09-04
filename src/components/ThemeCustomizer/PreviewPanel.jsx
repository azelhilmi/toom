import { useMemo } from 'react';
import { DEFAULT_ELEMENTS } from '../../utils/themeUtils';
import Viewfinder from '../Camera/Viewfinder';
import FlashButton from '../Camera/FlashButton';
import FilmWheel from '../Camera/FilmWheel';
import PoseCounter from '../Camera/PoseCounter';
import CameraBody from '../Camera/CameraBody';
import './ThemeCustomizer.css';

/**
 * Panneau d'aperçu double (portrait + paysage)
 * Affiche le thème en cours de customisation
 */
export default function PreviewPanel({ 
  theme, 
  selectedElement, 
  onElementSelect,
  isLandscape = false 
}) {
  const elements = theme?.elements || DEFAULT_ELEMENTS;
  
  // Style du conteneur en fonction de l'orientation
  const containerStyle = useMemo(() => {
    if (isLandscape) {
      return {
        width: '320px',
        height: '180px'
      };
    }
    return {
      width: '180px',
      height: '320px'
    };
  }, [isLandscape]);

  // Calcule la position absolue d'un élément
  const getElementStyle = (elementId) => {
    const element = elements[elementId];
    if (!element) return { display: 'none' };
    
    // Utiliser les overrides paysage si nécessaire
    const config = isLandscape && element.landscape 
      ? { ...element, ...element.landscape } 
      : element;
    
    const size = sizeToPixels(config.size, isLandscape ? 320 : 180);
    const posX = percentToPixels(config.position, containerStyle.width);
    const posY = percentToPixels(config.position, containerStyle.height);
    
    return {
      position: 'absolute',
      left: `${posX}px`,
      top: `${posY}px`,
      width: `${size}px`,
      height: `${size}px`,
      transform: 'translate(-50%, -50%)',
      zIndex: config.zIndex || 0,
      cursor: 'pointer',
      // Mise en évidence de l'élément sélectionné
      boxShadow: selectedElement === elementId 
        ? '0 0 0 2px var(--body-color, #f5c518)' 
        : 'none'
    };
  };

  // Helper functions
  function percentToPixels(position, containerSize) {
    return (position / 100) * containerSize;
  }
  
  function sizeToPixels(sizePercent, containerSize) {
    return (sizePercent / 100) * containerSize;
  }

  // Rendu des éléments en fonction de leur type
  const renderElement = (elementId) => {
    const element = elements[elementId];
    if (!element) return null;
    
    const config = isLandscape && element.landscape 
      ? { ...element, ...element.landscape } 
      : element;
    
    switch (element.type) {
      case 'viewfinder':
        return (
          <div 
            style={getElementStyle(elementId)}
            onClick={() => onElementSelect(elementId)}
          >
            <div style={{ 
              width: '100%', 
              height: '100%',
              position: 'relative',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <Viewfinder 
                videoRef={{ current: null }}
                error={null}
                flashPulse={false}
              />
            </div>
          </div>
        );
        
      case 'button':
        if (elementId === 'shutter') {
          return (
            <div 
              style={getElementStyle(elementId)}
              onClick={() => onElementSelect(elementId)}
            >
              <button 
                type="button"
                className="camera-body__shutter"
                style={{ width: '100%', height: '100%' }}
              >
                <span className="camera-body__shutter-ring" />
              </button>
            </div>
          );
        }
        if (elementId === 'flashButton') {
          return (
            <div 
              style={getElementStyle(elementId)}
              onClick={() => onElementSelect(elementId)}
            >
              <FlashButton active={false} torchSupported={false} onToggle={() => {}} />
            </div>
          );
        }
        break;
        
      case 'dial':
        if (elementId === 'filmWheel') {
          return (
            <div 
              style={getElementStyle(elementId)}
              onClick={() => onElementSelect(elementId)}
            >
              <FilmWheel armed={false} disabled={false} onArmed={() => {}} />
            </div>
          );
        }
        break;
        
      case 'text':
        if (elementId === 'poseCounter') {
          return (
            <div 
              style={getElementStyle(elementId)}
              onClick={() => onElementSelect(elementId)}
            >
              <PoseCounter remaining={24} total={24} />
            </div>
          );
        }
        if (elementId === 'brandName' || elementId === 'brandTagline') {
          return (
            <div 
              style={{
                ...getElementStyle(elementId),
                width: 'auto',
                height: 'auto',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}
              onClick={() => onElementSelect(elementId)}
            >
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: `${sizeToPixels(config.size, isLandscape ? 320 : 180) / 2}px`,
                fontWeight: elementId === 'brandName' ? 800 : 400,
                color: 'var(--accent, #e0e0e0)',
                whiteSpace: 'nowrap'
              }}>
                {config.text || element.text || elementId}
              </span>
            </div>
          );
        }
        break;
        
      default:
        return null;
    }
    
    return null;
  };

  return (
    <div className="settings-page__preview">
      <div className="settings-page__preview-label">
        {isLandscape ? 'PAYSAGE' : 'PORTRAIT'}
      </div>
      <div 
        className="settings-page__preview-frame"
        style={containerStyle}
      >
        <div 
          className="settings-page__preview-camera"
          style={{
            background: theme?.background ? `url(${theme.background})` : 'var(--chassis-color, #0a0a0a)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Rendre tous les éléments */}
          {Object.keys(elements).map((elementId) => (
            <div key={elementId}>
              {renderElement(elementId)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
