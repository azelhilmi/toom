/**
 * Résolution cible : 10×15 cm à 300 dpi (qualité labo photo, "sans
 * perte" visible à l'impression) = 1181 × 1772 px sur le grand côté.
 * On ne recadre jamais à un ratio fixe : on limite juste le plus grand
 * côté de la capture native à cette valeur (jamais d'agrandissement si
 * la caméra sort une image plus petite).
 */
const PRINT_LONG_EDGE = 1772;
const IMAGE_QUALITY = 0.82;

/**
 * Capture le flux vidéo dans un canvas, applique le rendu "pellicule
 * bon marché" (teinte chaude, vignette, grain) et renvoie un Blob à
 * pleine résolution d'impression, encodé en WebP (25-35% plus léger
 * qu'un JPEG à qualité équivalente — précieux vu qu'on stocke tout en
 * base64 dans Firestore). Repli automatique en JPEG si le navigateur ne
 * sait pas encoder de WebP (très rare aujourd'hui, mais gratuit à couvrir).
 *
 * @param {HTMLVideoElement} videoEl
 * @returns {Promise<Blob>}
 */
export async function captureFramePrintQuality(videoEl) {
  const nativeLong = Math.max(videoEl.videoWidth, videoEl.videoHeight);
  const scale = Math.min(1, PRINT_LONG_EDGE / nativeLong);
  const width = Math.round(videoEl.videoWidth * scale);
  const height = Math.round(videoEl.videoHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Rendu "pellicule bon marché des années 2000" : teinte chaude légèrement
  // décalée vers le jaune/orangé, noirs remontés (aspect délavé), contraste
  // et saturation modérés. Baked dans l'image (pas un filtre CSS d'aperçu) :
  // la photo garde ce rendu même une fois téléchargée/imprimée.
  ctx.filter = "sepia(0.22) saturate(1.35) contrast(1.1) brightness(1.03) hue-rotate(-8deg)";
  ctx.drawImage(videoEl, 0, 0, width, height);

  applyVignette(ctx, width, height);
  applyGrain(ctx, width, height, 7); // intensité réduite : à cette résolution, le bruit pèse plus lourd une fois compressé

  const webpBlob = await canvasToBlob(canvas, "image/webp", IMAGE_QUALITY);
  if (webpBlob && webpBlob.type === "image/webp") return webpBlob;

  // Repli : navigateur sans encodage WebP (canvas.toBlob renvoie alors
  // soit null, soit silencieusement un PNG non compressé selon les cas).
  return canvasToBlob(canvas, "image/jpeg", IMAGE_QUALITY);
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
}

/**
 * Convertit un Blob en data URL base64 (ex. "data:image/jpeg;base64,...").
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Capture le flux vidéo et renvoie directement la data URL base64 en
 * pleine résolution d'impression. À cette résolution, le résultat
 * dépasse presque toujours la limite de 1 Mo par document Firestore :
 * voir splitBase64 dans firebase/firestore.js pour le découpage en
 * plusieurs documents qui permet de rester sur le plan gratuit.
 *
 * @param {HTMLVideoElement} videoEl
 * @returns {Promise<string>}
 */
export async function captureFrameAsBase64(videoEl) {
  const blob = await captureFramePrintQuality(videoEl);
  return blobToBase64(blob);
}

/**
 * Déduit l'extension de fichier appropriée ("webp" ou "jpg") à partir
 * d'une data URL, pour nommer correctement les fichiers téléchargés/
 * partagés quel que soit le format réellement utilisé (WebP normalement,
 * JPEG en repli sur les rares navigateurs qui ne savent pas encoder WebP).
 */
export function extensionFromDataUrl(dataUrl) {
  const match = /^data:image\/(\w+);/.exec(dataUrl);
  const type = match?.[1];
  if (type === "webp") return "webp";
  if (type === "jpeg" || type === "jpg") return "jpg";
  return "jpg";
}

function applyVignette(ctx, width, height) {
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.35,
    width / 2, height / 2, Math.max(width, height) * 0.7
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(20,15,5,0.35)");
  ctx.save();
  ctx.filter = "none";
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function applyGrain(ctx, width, height, intensity) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * intensity;
    data[i] += noise;
    data[i + 1] += noise;
    data[i + 2] += noise;
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Redimensionne une image (Blob/File) et la convertit en WebP optimisé.
 * Idéal pour les backgrounds personnalisés : réduit la taille
 * au minimum pour les écrans mobile tout en gardant un bon rendu.
 *
 * @param {Blob|File} imageBlob - Image source
 * @param {number} maxWidth - Largeur maximale (défaut: 420 pour le boîtier)
 * @param {number} quality - Qualité WebP (0.0-1.0, défaut: 0.75)
 * @returns {Promise<Blob>}
 */
export async function resizeToWebP(imageBlob, maxWidth = 420, quality = 0.75) {
  // Les photos iPhone sont souvent en HEIC/HEIF par défaut — un format
  // que <img>/canvas ne savent PAS décoder nativement dans la plupart
  // des navigateurs. Sans conversion préalable, l'image échoue
  // silencieusement au chargement (onerror), d'où "Échec du traitement
  // de l'image" même sur un fichier parfaitement valide.
  const isHeic = /image\/hei[cf]/i.test(imageBlob.type) || /\.hei[cf]$/i.test(imageBlob.name || "");
  if (isHeic) {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({ blob: imageBlob, toType: "image/jpeg", quality: 0.9 });
    imageBlob = Array.isArray(converted) ? converted[0] : converted;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, maxWidth / img.width);
      const newWidth = Math.round(img.width * ratio);
      const newHeight = Math.round(img.height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            canvas.toBlob((fallbackBlob) => {
              resolve(fallbackBlob || imageBlob);
            }, 'image/jpeg', quality);
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Format d'image non supporté (${imageBlob.type || "inconnu"})`));
    };

    img.src = url;
  });
}

/**
 * Convertit une image en base64 WebP optimisée pour le stockage.
 * @param {Blob|File} imageBlob - Image source
 * @param {number} maxWidth - Largeur maximale
 * @param {number} quality - Qualité de compression
 * @returns {Promise<string>} - Data URL base64
 */
export async function imageToOptimizedBase64(imageBlob, maxWidth = 420, quality = 0.75) {
  const optimizedBlob = await resizeToWebP(imageBlob, maxWidth, quality);
  return blobToBase64(optimizedBlob);
}
