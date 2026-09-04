import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Gallery from "../components/Gallery/Gallery";
import { useAuth } from "../context/AuthContext";
import { listenToPhotos } from "../firebase/firestore";
import "./GalleryPage.css";
import LoadingScreen from "../components/UI/LoadingScreen";

export default function GalleryPage() {
  const { user, ready } = useAuth();
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    if (!ready || !user) return;
    const unsub = listenToPhotos(user.uid, setPhotos);
    return unsub;
  }, [ready, user]);

  if (!ready) return <LoadingScreen />;

  return (
    <div className="gallery-page">
      <header className="gallery-page__header">
        <div>
          <img src="/brand/wordmark-small.webp" alt="" className="page-header-logo" />
          <h1>Labo Photo</h1>
          <p>Vos souvenirs, développés.</p>
        </div>
        <Link to="/" className="gallery-page__back">Appareil</Link>
      </header>
      <Gallery photos={photos} />
    </div>
  );
}
