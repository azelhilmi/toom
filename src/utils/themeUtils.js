/**
 * Utilitaires pour la personnalisation des thèmes
 */

// Éléments personnalisables avec leurs propriétés par défaut
// Les positions sont en % pour s'adapter à toutes les tailles
export const DEFAULT_ELEMENTS = {
  viewfinder: {
    id: 'viewfinder',
    label: 'Viseur',
    type: 'viewfinder',
    icon: '👁️',
    position: { x: 50, y: 45 },
    size: 24,
    zIndex: 5,
    landscape: { x: 30, y: 50, size: 20 }
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
    position: { x: 21, y: 7 },
    size: 20,
    zIndex: 10,
    landscape: { x: 15, y: 5, size: 15 }
  },
  filmWheel: {
    id: 'filmWheel',
    label: 'Molette',
    type: 'dial',
    icon: '🎞️',
    position: { x: 88, y: 5 },
    size: 20,
    zIndex: 10,
    landscape: { x: 90, y: 5, size: 15 }
  },
  poseCounter: {
    id: 'poseCounter',
    label: 'Compteur',
    type: 'text',
    icon: '🔢',
    position: { x: 9, y: 7 },
    size: 20,
    zIndex: 10,
    landscape: { x: 5, y: 5, size: 15 }
  },
  brandName: {
    id: 'brandName',
    label: 'Nom marque',
    type: 'text',
    icon: '🏷️',
    position: { x: 15, y: 60 },
    size: 20,
    zIndex: 15,
    landscape: { x: 10, y: 55, size: 15 },
    text: 'Toom'
  },
  brandTagline: {
    id: 'brandTagline',
    label: 'Slogan',
    type: 'text',
    icon: '💬',
    position: { x: 15, y: 65 },
    size: 20,
    zIndex: 15,
    landscape: { x: 10, y: 60, size: 15 },
    text: "We'll see tomorrow"
  }
};

// Couleurs par défaut
export const DEFAULT_COLORS = {
  chassisColor: '#0a0a0a',
  chassisColorDark: '#000000',
  bodyColor: '#f5c518',
  bodyColorDark: '#d9a800',
  bodyShadow: '#8a6a00',
  accent: '#1a1a1a',
  accentSoft: '#3a3a3a',
  viewfinderBg: '#101010',
  viewfinderRing: '#3a3a3a',
  flashOn: '#ff5a3c',
  flashOff: '#444444',
  ink: '#1a1a1a',
  inkSoft: '#5c5240'
};

// Effets par défaut (fisheye désactivé par défaut pour éviter déformation)
export const DEFAULT_EFFECTS = {
  fisheye: false,
  fisheyeIntensity: 0.3,
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
  const blur = intensity * 0.3;
  const scale = Math.round(intensity * 30);
  return `blur(${blur}px) url(#fisheye-medium)`;
}

// Convertit un thème en CSS custom properties
export function themeToCssVariables(theme) {
  const variables = [];
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([key, value]) => {
      variables.push(`--custom-${key}: ${value};`);
    });
  }
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
