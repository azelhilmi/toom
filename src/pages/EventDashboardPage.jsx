import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PhotoCard from "../components/Gallery/PhotoCard";
import Lightbox from "../components/Gallery/Lightbox";
import {
  listenEventGuests, listenEventPhotos, getEvent, updateEvent,
  syncGuestShotsAllowed, resetGuestRoll,
} from "../firebase/firestore";
import { downloadPhotosAsZip } from "../utils/downloadAlbum";
import "./EventDashboardPage.css";
import LoadingScreen from "../components/UI/LoadingScreen";

function toDatetimeLocalValue(timestamp) {
  if (!timestamp?.toDate) return "";
  const d = timestamp.toDate();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventDashboardPage() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [openPhoto, setOpenPhoto] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [applyToExisting, setApplyToExisting] = useState(false);
  const [busyGuestId, setBusyGuestId] = useState(null);
  const [zipProgress, setZipProgress] = useState(null);

  useEffect(() => {
    const unsub1 = listenEventGuests(eventId, setGuests);
    const unsub2 = listenEventPhotos(eventId, setPhotos);
    const id = setInterval(() => setNow(Date.now()), 30_000);
    getEvent(eventId).then((e) => {
      setEvent(e);
      setForm({
        shotsPerGuest: e.shotsPerGuest,
        revealDate: toDatetimeLocalValue(e.revealAt),
      });
    });
    return () => {
      unsub1();
      unsub2();
      clearInterval(id);
    };
  }, [eventId]);

  const photosByGuest = guests.map((guest) => ({
    guest,
    photos: photos.filter((p) => p.ownerId === guest.id),
  }));

  const revealedPhotos = photos.filter((p) => {
    const t = p.revealAt?.toMillis ? p.revealAt.toMillis() : Infinity;
    return now >= t;
  });

  async function handleSaveSettings(e) {
    e.preventDefault();
    setSaving(true);
    await updateEvent(eventId, {
      shotsPerGuest: Number(form.shotsPerGuest),
      revealDate: form.revealDate,
    });
    if (applyToExisting) {
      await syncGuestShotsAllowed(eventId, Number(form.shotsPerGuest));
    }
    const refreshed = await getEvent(eventId);
    setEvent(refreshed);
    setSaving(false);
    setSettingsOpen(false);
  }

  async function handleResetGuest(guest) {
    const guestPhotoCount = photos.filter((p) => p.ownerId === guest.id).length;
    if (guestPhotoCount === 0) return;
    const confirmed = window.confirm(
      `Supprimer les ${guestPhotoCount} photo(s) de ${guest.name} et remettre sa pellicule à zéro ? Cette action est irréversible.`
    );
    if (!confirmed) return;
    setBusyGuestId(guest.id);
    await resetGuestRoll(eventId, guest.id);
    setBusyGuestId(null);
  }

  async function handleDownloadGuestAlbum(guest) {
    const guestRevealed = revealedPhotos.filter((p) => p.ownerId === guest.id);
    if (guestRevealed.length === 0) return;
    setZipProgress({ label: guest.name, done: 0, total: guestRevealed.length });
    await downloadPhotosAsZip(
      guestRevealed,
      `${event.name.replace(/\s+/g, "-")}-${guest.name}.zip`,
      (done, total) => setZipProgress({ label: guest.name, done, total })
    );
    setZipProgress(null);
  }

  async function handleDownloadFullAlbum() {
    if (revealedPhotos.length === 0) return;
    setZipProgress({ label: "album complet", done: 0, total: revealedPhotos.length });
    await downloadPhotosAsZip(
      revealedPhotos,
      `${event.name.replace(/\s+/g, "-")}-album-complet.zip`,
      (done, total) => setZipProgress({ label: "album complet", done, total })
    );
    setZipProgress(null);
  }

  if (!event || !form) return <LoadingScreen />;

  return (
    <div className="event-dashboard">
      <header className="event-dashboard__header">
        <div>
          <h2>{event.name}</h2>
          <p className="event-dashboard__subtitle">
            {photos.length} photo{photos.length > 1 ? "s" : ""} · {guests.length} invité{guests.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="event-dashboard__header-actions">
          <button type="button" className="event-dashboard__btn" onClick={() => setSettingsOpen((v) => !v)}>
            Réglages
          </button>
          <button
            type="button"
            className="event-dashboard__btn event-dashboard__btn--primary"
            onClick={handleDownloadFullAlbum}
            disabled={revealedPhotos.length === 0 || !!zipProgress}
          >
            Télécharger l'album
          </button>
        </div>
      </header>

      {zipProgress && (
        <p className="event-dashboard__zip-progress">
          Préparation de l'archive ({zipProgress.label})… {zipProgress.done}/{zipProgress.total}
        </p>
      )}

      {settingsOpen && (
        <form className="event-dashboard__settings" onSubmit={handleSaveSettings}>
          <label>
            Poses par invité
            <input
              type="number"
              min="1"
              max="72"
              value={form.shotsPerGuest}
              onChange={(e) => setForm((f) => ({ ...f, shotsPerGuest: e.target.value }))}
            />
          </label>

          <label className="event-dashboard__checkbox">
            <input
              type="checkbox"
              checked={applyToExisting}
              onChange={(e) => setApplyToExisting(e.target.checked)}
            />
            Appliquer aussi aux invités déjà inscrits
          </label>

          <label>
            Date de révélation
            <input
              type="datetime-local"
              value={form.revealDate}
              onChange={(e) => setForm((f) => ({ ...f, revealDate: e.target.value }))}
            />
          </label>

          <p className="event-dashboard__note">
            L'habillage visuel se règle individuellement par chaque invité, dans ses propres Réglages.
          </p>

          <button type="submit" className="event-dashboard__btn event-dashboard__btn--primary" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer les réglages"}
          </button>
        </form>
      )}

      {photosByGuest.length === 0 && <p>Aucun invité n'a encore rejoint l'événement.</p>}

      {photosByGuest.map(({ guest, photos: guestPhotos }) => {
        const guestRevealedCount = revealedPhotos.filter((p) => p.ownerId === guest.id).length;
        return (
          <section key={guest.id} className="event-dashboard__guest">
            <div className="event-dashboard__guest-header">
              <h3>{guest.name} · {guestPhotos.length} photo{guestPhotos.length > 1 ? "s" : ""}</h3>
              <div className="event-dashboard__guest-actions">
                <button
                  type="button"
                  className="event-dashboard__link-btn"
                  onClick={() => handleDownloadGuestAlbum(guest)}
                  disabled={guestRevealedCount === 0 || !!zipProgress}
                >
                  Télécharger
                </button>
                <button
                  type="button"
                  className="event-dashboard__link-btn event-dashboard__link-btn--danger"
                  onClick={() => handleResetGuest(guest)}
                  disabled={guestPhotos.length === 0 || busyGuestId === guest.id}
                >
                  {busyGuestId === guest.id ? "Réinitialisation…" : "Réinitialiser"}
                </button>
              </div>
            </div>
            <div className="event-dashboard__grid">
              {guestPhotos.map((photo, i) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  index={guestPhotos.length - 1 - i}
                  now={now}
                  onOpen={setOpenPhoto}
                />
              ))}
            </div>
          </section>
        );
      })}

      {openPhoto && (
        <Lightbox url={openPhoto.url} filename={openPhoto.filename} onClose={() => setOpenPhoto(null)} />
      )}
    </div>
  );
}
