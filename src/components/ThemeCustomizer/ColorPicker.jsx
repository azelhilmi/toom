import { useState, useRef, useEffect } from 'react';
import './ThemeCustomizer.css';

/**
 * Composant de sélection de couleur avec aperçu
 */
export default function ColorPicker({ 
  label, 
  value, 
  onChange,
  showAlpha = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const colorInputRef = useRef(null);

  // Synchroniser avec la valeur externe
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setInternalValue(newColor);
    onChange(newColor);
  };

  const handleInputChange = (e) => {
    const newColor = e.target.value;
    // Valider le format hex
    if (/^#[0-9A-Fa-f]{6}$/.test(newColor) || /^#[0-9A-Fa-f]{3}$/.test(newColor)) {
      setInternalValue(newColor);
      onChange(newColor);
    }
  };

  const togglePicker = () => {
    setIsOpen(!isOpen);
  };

  const handleClickOutside = (e) => {
    if (colorInputRef.current && !colorInputRef.current.contains(e.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="theme-customizer__color-picker" ref={colorInputRef}>
      <button 
        type="button"
        className="theme-customizer__color-swatch"
        style={{ backgroundColor: internalValue || '#000' }}
        onClick={togglePicker}
        aria-label={`Choisir une couleur pour ${label}`}
      />
      
      <input
        type="color"
        value={internalValue || '#000000'}
        onChange={handleColorChange}
        style={{ display: 'none' }}
        id={`color-picker-${label}`}
      />
      
      {isOpen && (
        <div 
          style={{
            position: 'absolute',
            top: '40px',
            left: 0,
            zIndex: 100,
            background: '#222',
            borderRadius: '8px',
            padding: '0.8rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
            border: '1px solid #444'
          }}
        >
          <label 
            htmlFor={`color-picker-${label}`} 
            style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              color: '#aaa'
            }}
          >
            {label}
          </label>
          
          <input
            type="color"
            value={internalValue || '#000000'}
            onChange={handleColorChange}
            style={{
              width: '100%',
              height: '40px',
              padding: 0,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              background: 'none'
            }}
          />
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '0.5rem'
          }}>
            <span style={{ fontSize: '0.75rem', color: '#777' }}>#</span>
            <input
              type="text"
              value={internalValue || ''}
              onChange={handleInputChange}
              maxLength={7}
              style={{
                flex: 1,
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                padding: '0.3rem',
                background: '#181818',
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
      )}
      
      <input
        type="text"
        value={internalValue || ''}
        onChange={handleInputChange}
        className="theme-customizer__color-input"
        maxLength={7}
        placeholder="#000000"
      />
    </div>
  );
}
