/**
 * Coordonnées (en % de la largeur/hauteur du boîtier) des éléments
 * fonctionnels, mesurées précisément sur les images de référence
 * fournies (analyse pixel par pixel des zones transparentes/grises).
 *
 * Le viseur et le compte-poses sont RÉVÉLÉS À TRAVERS de vraies zones
 * transparentes de l'image du boîtier (vérifié : alpha=0 à ces
 * coordonnées même dans l'image jaune "remplie") — ils doivent donc
 * être rendus DERRIÈRE l'image. Le déclencheur, le flash et la molette
 * sont dessinés en plein dans l'image ; nos contrôles réels sont des
 * zones cliquables/glissables invisibles superposées exactement au
 * bon endroit, PAR-DESSUS l'image.
 *
 * Remplace entièrement l'ancien système de thème personnalisé
 * (positionnement libre par élément, palette de couleurs, effets) —
 * la personnalisation se limite désormais à changer l'image du
 * boîtier elle-même (voir SkinContext).
 */
export const HOTSPOTS = {
  landscape: {
    skin: "/skins/default-horizontal.webp",
    mask: "/skins/mask-horizontal.webp",
    windowsCutout: "/skins/windows-cutout-horizontal.webp",
    wheelAxis: "horizontal", // glissé gauche→droite
    viewfinder: { x: 47.6, y: 10.4, w: 7.7, h: 13 },
    poseCounter: { x: 75.4, y: 65.5, w: 5.7, h: 7.5 },
    flashButton: { x: 71, y: 12.3, w: 9.3, h: 9.3 },
    // Zone de clic élargie mais modérée (l'agrandissement précédent
    // grignotait trop l'espace disponible pour les instructions).
    shutter: { x: 49.7, y: 75.8, w: 20, h: 20 },
    filmWheel: { x: 91, y: 11, w: 20, h: 14 },
    // Zone vide entre la grip du haut (viseur/flash/molette, finit vers
    // 17%) et la zone déclencheur/poses du bas (débute vers 65.8%) —
    // marge de sécurité large (>8%) des deux côtés, plus généreuse que
    // le minimum de 5% demandé pour absorber toute variation d'écran.
    instructionsZone: { x: 50, y: 39, w: 88, h: 25 },
    // Petites annotations imprimées façon vrai jetable (thème par
    // défaut uniquement) — placées juste à côté des commandes qu'elles
    // désignent, sans jamais recouvrir leur zone cliquable.
    annotations: {
      wheelLabel: { x: 91, y: 24, w: 16, h: 5 },
      flashLabel: { x: 71, y: 22, w: 12, h: 4 },
      badge: { x: 10, y: 90, w: 16, h: 8 },
    },
  },
  portrait: {
    skin: "/skins/default-vertical.webp",
    mask: "/skins/mask-vertical.webp",
    windowsCutout: "/skins/windows-cutout-vertical.webp",
    wheelAxis: "vertical", // glissé haut→bas
    viewfinder: { x: 49.9, y: 7.6, w: 14.1, h: 6.1 },
    poseCounter: { x: 85.4, y: 82.9, w: 9.4, h: 3.7 },
    flashButton: { x: 84.6, y: 26.2, w: 14, h: 14 },
    shutter: { x: 48.9, y: 73.3, w: 20, h: 20 },
    filmWheel: { x: 89.9, y: 8.9, w: 10, h: 18 },
    // Le flash occupe la colonne droite jusqu'à y≈33% — zone
    // d'instructions resserrée avec marge large des deux côtés
    // (>6.5%) plutôt que le minimum tout juste suffisant d'avant.
    instructionsZone: { x: 50, y: 48, w: 86, h: 15 },
    annotations: {
      wheelLabel: { x: 89.9, y: 22, w: 16, h: 4 },
      flashLabel: { x: 84.6, y: 38, w: 16, h: 4 },
      badge: { x: 15, y: 90, w: 20, h: 7 },
    },
  },
};

/**
 * Style CSS absolu (position:absolute) pour un hotspot donné, calculé
 * à partir des pourcentages ci-dessus. Le conteneur parent doit être
 * position:relative et couvrir tout le boîtier.
 */
export function hotspotStyle(spot) {
  return {
    position: "absolute",
    left: `${spot.x}%`,
    top: `${spot.y}%`,
    width: `${spot.w}%`,
    height: `${spot.h}%`,
    transform: "translate(-50%, -50%)",
  };
}
