/**
 * Utilitaires pour la personnalisation des thèmes
 */

// Éléments personnalisables avec leurs propriétés par défaut
// Les positions sont en % pour s'adapter à toutes les tailles
// Les tailles sont en % de la dimension du conteneur

export const DEFAULT_ELEMENTS = {
  viewfinder: {
    id: 'viewfinder',
    label: 'Viseur',
    type: 'viewfinder',
    icon: '👁️',
    position: { x: 50, y: 45 },
    size: 24,
    zIndex: 5,
    // Positions spécifiques pour paysage
    landscape: { x: 30, y: 50, size: 20 },
    // Effets
    effects: {
      fisheye: true,
      fisheyeIntensity: 0.5, // 0-1
      blur: 1.5,
      vignette: true
    }
  },
  shutter: {
    id: 'shutter',
    label: 'Déclencheur',
    type: 'button',
    icon: '🎯',
    position: { x: 50, y: 85 },
    size: 20,
    zIndex: 10,
    landscape: { x: 50, y: 90, size: 20 }
  },
  flashButton: {
    id: 'flashButton',
    label: 'Flash',
    type: 'button',
    icon: '⚡',
    position: { x: 63, y: 10 },
    size: 20,
    zIndex: 10,
    landscape: { x: 63, y: 10, size: 20 }
  },
  filmWheel: {
    id: 'filmWheel',
    label: 'Molette',
    type: 'dial',
    icon: '🎞️',
    position: { x: 20, y: 10 },
    size: 20,
    zIndex: 10,
    landscape: { x: 20, y: 10, size: 20 }
  },
  poseCounter: {
    id: 'poseCounter',
    label: 'Compteur',
    type: 'text',
    icon: '🔢',
    position: { x: 80, y: 10 },
    size: 20,
    zIndex: 10,
    landscape: { x: 80, y: 10, size: 20 }
  },
  brandName: {
    id: 'brandName',
    label: 'Nom marque',
    type: 'text',
    icon: '🏷️',
    position: { x: 15, y: 60 },
    size: 12,
    zIndex: 15,
    landscape: { x: 5, y: 55, size: 10 },
    text: 'TOOM'
  },
  brandTagline: {
    id: 'brandTagline',
    label: 'Slogan',
    type: 'text',
    icon: '💬',
    position: { x: 15, y: 65 },
    size: 8,
    zIndex: 15,
    landscape: { x: 5, y: 60, size: 6 },
    text: 'We\'ll see tomorrow'
  }
};

// Couleurs par défaut
export const DEFAULT_COLORS = {
  chassisColor: '#0a0a0a',
  chassisColorDark: '#000000',
  bodyColor: '#141414',
  bodyColorDark: '#080808',
  bodyShadow: '#000000',
  accent: '#e0e0e0',
  accentSoft: '#9a9a9a',
  viewfinderBg: '#000000',
  viewfinderRing: '#1c1c1c',
  flashOn: '#ff4444',
  flashOff: '#2a2a2a',
  paper: '#121212',
  ink: '#f0f0f0',
  inkSoft: '#a0a0a0'
};

// Effets par défaut
export const DEFAULT_EFFECTS = {
  fisheye: true,
  fisheyeIntensity: 0.5,
  blur: 1.5,
  vignette: true
};

// Génère un ID unique
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Crée un thème par défaut
export function createDefaultTheme() {
  return {
    id: generateId(),
    name: 'Mon Thème Perso',
    background: null,
    elements: { ...DEFAULT_ELEMENTS },
    colors: { ...DEFAULT_COLORS },
    effects: { ...DEFAULT_EFFECTS },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Convertit les positions % en pixels pour un conteneur donné
export function percentToPixels(position, containerWidth, containerHeight) {
  return {
    x: (position.x / 100) * containerWidth,
    y: (position.y / 100) * containerHeight
  };
}

// Convertit les pixels en %
export function pixelsToPercent(pixels, containerWidth, containerHeight) {
  return {
    x: (pixels.x / containerWidth) * 100,
    y: (pixels.y / containerHeight) * 100
  };
}

// Calcule la taille en pixels
export function sizeToPixels(sizePercent, containerSize) {
  return (sizePercent / 100) * containerSize;
}

// Applique les overrides paysage si nécessaire
export function getElementConfig(element, elements, isLandscape) {
  const config = elements[element];
  if (!config) return null;
  
  if (isLandscape && config.landscape) {
    return {
      ...config,
      position: config.landscape.position || config.position,
      size: config.landscape.size || config.size
    };
  }
  
  return config;
}

// Génère le filtre CSS pour le viseur en fonction de l'intensité fisheye
export function getFisheyeFilter(intensity = 0.5) {
  if (!intensity || intensity === 0) return 'none';
  
  // Map l'intensité (0-1) à une échelle (0-30)
  const scale = Math.round(intensity * 30);
  const blur = intensity * 0.3;
  
  return `blur(${blur}px) url(#fisheye-medium)`;
}

// Convertit un thème en CSS custom properties
export function themeToCssVariables(theme) {
  const variables = [];
  
  // Couleurs
  for (const [key, value] of Object.entries(theme.colors || {})) {
    variables.push(`--custom-${key}: ${value};`);
  }
  
  // Background
  if (theme.background) {
    variables.push(`--custom-background: url(${theme.background});`);
  }
  
  return variables.join(' ');
}

// Valide les positions des éléments (doivent être entre 0 et 100)
export function validateElementPositions(elements) {
  const validated = { ...elements };
  
  for (const [key, element] of Object.entries(validated)) {
    if (element.position) {
      validated[key] = {
        ...element,
        position: {
          x: Math.max(0, Math.min(100, element.position.x)),
          y: Math.max(0, Math.min(100, element.position.y))
        }
      };
    }
    
    if (element.size !== undefined) {
      validated[key].size = Math.max(1, Math.min(100, element.size));
    }
    
    if (element.landscape) {
      validated[key].landscape = {
        ...element.landscape,
        position: {
          x: Math.max(0, Math.min(100, element.landscape.position?.x || 0)),
          y: Math.max(0, Math.min(100, element.landscape.position?.y || 0))
        },
        size: Math.max(1, Math.min(100, element.landscape.size || 10))
      };
    }
  }
  
  return validated;
}
