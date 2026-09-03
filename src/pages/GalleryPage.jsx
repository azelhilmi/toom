import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Gallery from "../components/Gallery/Gallery";
import { useAuth } from "../context/AuthContext";
import { listenToPhotos } from "../firebase/firestore";
import "./GalleryPage.css";

export default function GalleryPage() {
  const { user, ready } = useAuth();
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    if (!ready || !user) return;
    const unsub = listenToPhotos(user.uid, setPhotos);
    return unsub;
  }, [ready, user]);

  if (!ready) return <p className="page-loading">Chargement…</p>;

  return (
    <div className="gallery-page">
      <header className="gallery-page__header">
        <div>
          <h1>Labo Photo</h1>
          <p>Vos souvenirs, développés.</p>
        </div>
        <Link to="/" className="gallery-page__back">Appareil</Link>
      </header>
      <Gallery photos={photos} />
    </div>
  );
}
