import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PhotoCard from "../components/Gallery/PhotoCard";
import Lightbox from "../components/Gallery/Lightbox";
import { listenEventGuests, listenEventPhotos } from "../firebase/firestore";
import "./EventDashboardPage.css";

export default function EventDashboardPage() {
  const { eventId } = useParams();
  const [guests, setGuests] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [openPhoto, setOpenPhoto] = useState(null);

  useEffect(() => {
    const unsub1 = listenEventGuests(eventId, setGuests);
    const unsub2 = listenEventPhotos(eventId, setPhotos);
    const id = setInterval(() => setNow(Date.now()), 30_000);
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

  return (
    <div className="event-dashboard">
      <h2>Photos de l'événement</h2>
      {photosByGuest.length === 0 && <p>Aucun invité n'a encore rejoint l'événement.</p>}
      {photosByGuest.map(({ guest, photos: guestPhotos }) => (
        <section key={guest.id} className="event-dashboard__guest">
          <h3>{guest.name} · {guestPhotos.length} photo{guestPhotos.length > 1 ? "s" : ""}</h3>
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
      ))}

      {openPhoto && (
        <Lightbox url={openPhoto.url} filename={openPhoto.filename} onClose={() => setOpenPhoto(null)} />
      )}
    </div>
  );
}
