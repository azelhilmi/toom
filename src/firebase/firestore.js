import {
  doc, getDoc, getDocs, setDoc, updateDoc, increment, serverTimestamp,
  collection, addDoc, query, where, orderBy, limit, onSnapshot, Timestamp,
  deleteDoc, writeBatch,
} from "firebase/firestore";
import { db } from "./init";
import { captureFrameAsBase64 } from "../utils/imageCompression";

const DAILY_SHOTS = 24;
const REVEAL_DELAY_MS = 24 * 60 * 60 * 1000;

/**
 * Récupère la pellicule "active" de l'utilisateur, ou en crée une
 * nouvelle. Une pellicule reste active tant qu'elle n'est pas à la fois
 * (a) épuisée (24 poses utilisées) ET (b) développée (24h écoulées
 * depuis la 1ère photo de cette pellicule). Dans ce cas seulement, une
 * nouvelle pellicule de 24 poses est créée. C'est ce qui implémente
 * "24h après la 1ère photo, tout se révèle d'un coup" + "il faut
 * attendre le développement pour recharger une pellicule" — sans Cloud
 * Function, juste en choisissant quel document réutiliser ou créer.
 */
export async function getOrCreateActiveRoll(uid, theme = "kodak-funsaver") {
  const q = query(
    collection(db, "cameras"),
    where("ownerId", "==", uid),
    where("type", "==", "daily"),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    const existing = snap.docs[0];
    const data = existing.data();
    const isFull = data.shotsUsed >= data.shotsAllowed;
    const isDeveloped = data.revealAt ? data.revealAt.toMillis() <= Date.now() : false;
    if (!isFull || !isDeveloped) {
      return existing.id;
    }
    // Sinon : pellicule pleine ET développée → on en crée une nouvelle.
  }

  const cameraId = `${uid}_roll_${Date.now()}`;
  await setDoc(doc(db, "cameras", cameraId), {
    ownerId: uid,
    type: "daily",
    shotsAllowed: DAILY_SHOTS,
    shotsUsed: 0,
    theme,
    firstPhotoAt: null,
    revealAt: null,
    createdAt: serverTimestamp(),
  });
  return cameraId;
}

export function listenToRoll(cameraId, callback) {
  return onSnapshot(doc(db, "cameras", cameraId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

// Taille max d'un morceau de base64 par document (marge sous la limite
// Firestore de 1 Mo). À la résolution d'impression 10×15 (1181×1772),
// une photo dépasse presque toujours cette taille : on la découpe donc
// en plusieurs documents "photoDataChunks" plutôt que de dégrader la
// qualité, ce qui permet de rester sur le plan gratuit Spark.
const CHUNK_SIZE = 650_000;

/**
 * Prend une photo : capture le flux vidéo en pleine résolution
 * d'impression, encode en base64, découpe en morceaux, puis écrit :
 *  - photos/{photoId}                 → métadonnées légères (qui, quand, révélation)
 *  - photoData/{photoId}              → manifeste (nombre de morceaux)
 *  - photoDataChunks/{photoId}_{i}     → les morceaux de l'image (lourd)
 * Séparer métadonnées et image évite de télécharger les octets quand on
 * liste juste la galerie ; l'image n'est récupérée que lorsque la photo
 * doit réellement s'afficher (voir getPhotoBase64).
 *
 * La date de révélation (+24h) est fixée UNE SEULE FOIS, sur la
 * pellicule elle-même, au moment de la toute première photo prise sur
 * ce rouleau. Toutes les photos suivantes de la même pellicule héritent
 * de cette même date : le développement se fait pour tout le rouleau
 * d'un coup, comme demandé, pas photo par photo.
 */
export async function takePhoto({ cameraId, ownerId, videoEl, flashUsed, guestName = null, eventId = null, revealAtOverride = null }) {
  const base64 = await captureFrameAsBase64(videoEl);

  const cameraRef = doc(db, "cameras", cameraId);
  let revealAt = revealAtOverride;
  const cameraUpdates = { shotsUsed: increment(1) };

  if (!revealAtOverride) {
    const cameraSnap = await getDoc(cameraRef);
    const cameraData = cameraSnap.data() || {};
    revealAt = cameraData.revealAt || null;
    if (!cameraData.firstPhotoAt) {
      const firstPhotoAt = Timestamp.now();
      revealAt = Timestamp.fromMillis(firstPhotoAt.toMillis() + REVEAL_DELAY_MS);
      cameraUpdates.firstPhotoAt = firstPhotoAt;
      cameraUpdates.revealAt = revealAt;
    }
  }

  const photoId = `${cameraId}_${Date.now()}`;

  await setDoc(doc(db, "photos", photoId), {
    cameraId,
    ownerId,
    takenAt: Timestamp.now(),
    revealAt,
    flashUsed: !!flashUsed,
    guestName,
    eventId,
  });

  const chunkCount = Math.ceil(base64.length / CHUNK_SIZE);
  await setDoc(doc(db, "photoData", photoId), { ownerId, eventId, chunkCount });
  await Promise.all(
    Array.from({ length: chunkCount }, (_, i) =>
      setDoc(doc(db, "photoDataChunks", `${photoId}_${i}`), {
        ownerId,
        eventId,
        data: base64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      })
    )
  );

  await updateDoc(cameraRef, cameraUpdates);

  return photoId;
}

export function listenToPhotos(ownerId, callback) {
  const q = query(
    collection(db, "photos"),
    where("ownerId", "==", ownerId),
    orderBy("takenAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/**
 * Récupère l'image (base64) d'une photo précise en réassemblant ses
 * morceaux. Appelé uniquement au moment où une photo doit réellement
 * s'afficher (révélée, easter egg, ou visionneuse plein écran), jamais
 * lors du simple listing de la galerie.
 */
export async function getPhotoBase64(photoId) {
  const manifestSnap = await getDoc(doc(db, "photoData", photoId));
  if (!manifestSnap.exists()) return null;
  const { chunkCount } = manifestSnap.data();

  const chunkSnaps = await Promise.all(
    Array.from({ length: chunkCount }, (_, i) => getDoc(doc(db, "photoDataChunks", `${photoId}_${i}`)))
  );
  return chunkSnaps.map((snap) => snap.data()?.data || "").join("");
}

/**
 * Supprime entièrement une photo : sa métadonnée, son manifeste et tous
 * ses morceaux d'image. Utilisé par la réinitialisation de pellicule
 * d'un invité (voir resetGuestRoll).
 */
export async function deletePhoto(photoId) {
  const manifestSnap = await getDoc(doc(db, "photoData", photoId));
  const chunkCount = manifestSnap.exists() ? manifestSnap.data().chunkCount : 0;

  const batch = writeBatch(db);
  batch.delete(doc(db, "photos", photoId));
  batch.delete(doc(db, "photoData", photoId));
  for (let i = 0; i < chunkCount; i++) {
    batch.delete(doc(db, "photoDataChunks", `${photoId}_${i}`));
  }
  await batch.commit();
}

// ---------- Événements ----------

function makeInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createEvent(organizerId, { name, theme, shotsPerGuest, revealDate, customColors = null }) {
  const inviteCode = makeInviteCode();
  const docRef = await addDoc(collection(db, "events"), {
    organizerId,
    name,
    theme,
    customColors,
    shotsPerGuest,
    revealAt: Timestamp.fromDate(new Date(revealDate)),
    inviteCode,
    createdAt: serverTimestamp(),
  });
  return { eventId: docRef.id, inviteCode };
}

/**
 * Met à jour les réglages d'un événement (nom, thème, couleurs
 * personnalisées, nombre de poses par défaut pour les nouveaux invités,
 * date de révélation). N'affecte pas rétroactivement les invités déjà
 * inscrits — voir syncGuestShotsAllowed pour ça.
 */
export async function updateEvent(eventId, updates) {
  const payload = { ...updates };
  if (payload.revealDate) {
    payload.revealAt = Timestamp.fromDate(new Date(payload.revealDate));
    delete payload.revealDate;
  }
  await updateDoc(doc(db, "events", eventId), payload);
}

/**
 * Applique un nouveau quota de poses à tous les invités déjà inscrits
 * (pas seulement aux futurs arrivants). Utile si l'organisateur change
 * d'avis après coup.
 */
export async function syncGuestShotsAllowed(eventId, shotsAllowed) {
  const q = query(collection(db, "cameras"), where("eventId", "==", eventId), where("type", "==", "event"));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { shotsAllowed }));
  await batch.commit();
}

/**
 * Réinitialise la pellicule d'un invité : supprime toutes ses photos de
 * cet événement et remet son compteur de poses à zéro, pour qu'il
 * puisse recommencer une pellicule complète.
 */
export async function resetGuestRoll(eventId, guestUid) {
  const q = query(
    collection(db, "photos"),
    where("eventId", "==", eventId),
    where("ownerId", "==", guestUid)
  );
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => deletePhoto(d.id)));

  const cameraId = `${eventId}_${guestUid}`;
  await updateDoc(doc(db, "cameras", cameraId), { shotsUsed: 0 });
}

export async function getEvent(eventId) {
  const snap = await getDoc(doc(db, "events", eventId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getEventByInviteCode(inviteCode) {
  const q = query(collection(db, "events"), where("inviteCode", "==", inviteCode));
  return new Promise((resolve) => {
    const unsub = onSnapshot(q, (snap) => {
      unsub();
      resolve(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
    });
  });
}

/**
 * Un invité rejoint un événement : on crée sa pellicule dédiée
 * (cameras/{eventId_uid}) avec le quota de poses défini par l'organisateur.
 */
export async function joinEvent(eventId, uid, guestName, shotsAllowed, theme) {
  await setDoc(doc(db, "events", eventId, "guests", uid), {
    name: guestName,
    joinedAt: serverTimestamp(),
  });
  const cameraId = `${eventId}_${uid}`;
  await setDoc(doc(db, "cameras", cameraId), {
    ownerId: uid,
    type: "event",
    eventId,
    guestName,
    shotsAllowed,
    shotsUsed: 0,
    theme,
    createdAt: serverTimestamp(),
  }, { merge: true });
  return cameraId;
}

export function listenEventGuests(eventId, callback) {
  const q = collection(db, "events", eventId, "guests");
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function listenEventPhotos(eventId, callback) {
  const q = query(collection(db, "photos"), where("eventId", "==", eventId), orderBy("takenAt", "desc"));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

// ---------- Personnalisation utilisateur ----------

const CUSTOMIZATION_COLLECTION = "userCustomizations";

export async function saveCustomBackground(uid, backgroundBase64) {
  await setDoc(
    doc(db, CUSTOMIZATION_COLLECTION, uid),
    { background: backgroundBase64, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function getCustomBackground(uid) {
  const snap = await getDoc(doc(db, CUSTOMIZATION_COLLECTION, uid));
  return snap.exists() ? snap.data().background || null : null;
}

export function listenToCustomization(uid, callback) {
  return onSnapshot(
    doc(db, CUSTOMIZATION_COLLECTION, uid),
    (snap) => callback(snap.exists() ? snap.data() : null)
  );
}

export async function deleteCustomBackground(uid) {
  await updateDoc(doc(db, CUSTOMIZATION_COLLECTION, uid), { background: null });
}

// Thèmes personnalisés complets
const CUSTOM_THEMES_COLLECTION = "customThemes";

/**
 * Sauvegarde un thème personnalisé complet
 */
export async function saveCustomTheme(uid, themeData) {
  await setDoc(
    doc(db, CUSTOM_THEMES_COLLECTION, uid),
    {
      ...themeData,
      ownerId: uid,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

/**
 * Charge un thème personnalisé complet
 */
export async function loadCustomTheme(uid) {
  const snap = await getDoc(doc(db, CUSTOM_THEMES_COLLECTION, uid));
  return snap.exists() ? snap.data() : null;
}

/**
 * Écoute les changements d'un thème personnalisé
 */
export function listenToCustomTheme(uid, callback) {
  return onSnapshot(
    doc(db, CUSTOM_THEMES_COLLECTION, uid),
    (snap) => callback(snap.exists() ? snap.data() : null)
  );
}

/**
 * Supprime un thème personnalisé
 */
export async function deleteCustomTheme(uid) {
  await deleteDoc(doc(db, CUSTOM_THEMES_COLLECTION, uid));
}
