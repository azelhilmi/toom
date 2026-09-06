import { useEffect, useState } from "react";
import Gallery from "../components/Gallery/Gallery";
import { useAuth } from "../context/AuthContext";
import { listenToPhotos } from "../firebase/firestore";
import { downloadPhotosAsZip } from "../utils/downloadAlbum";
import "./GalleryPage.css";
import LoadingScreen from "../components/UI/LoadingScreen";
import BackToCameraButton from "../components/UI/BackToCameraButton";

export default function GalleryPage() {
  const { user, ready } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [exporting, setExporting] = useState(null); // { done, total } | null

  useEffect(() => {
    if (!ready || !user) return;
    const unsub = listenToPhotos(user.uid, setPhotos);
    return unsub;
  }, [ready, user]);

  if (!ready) return <LoadingScreen />;

  const revealedPhotos = photos.filter((p) => {
    const revealAtMs = p.revealAt?.toMillis ? p.revealAt.toMillis() : 0;
    return Date.now() >= revealAtMs;
  });

  async function handleExportAll() {
    setExporting({ done: 0, total: revealedPhotos.length });
    await downloadPhotosAsZip(revealedPhotos, "toom-photos.zip", (done, total) => setExporting({ done, total }));
    setExporting(null);
  }

  return (
    <div className="gallery-page">
      <header className="gallery-page__header">
        <div>
          <img src="/brand/icon-round-small.webp" alt="" className="page-header-logo" />
          <h1>Labo Photo</h1>
          <p>Vos souvenirs, développés.</p>
        </div>
        <BackToCameraButton />
      </header>

      {photos.length > 0 && (
        <div className="gallery-page__toolbar">
          <p className="gallery-page__stats">
            {photos.length} photo{photos.length > 1 ? "s" : ""} · {revealedPhotos.length} développée
            {revealedPhotos.length > 1 ? "s" : ""}
          </p>
          {revealedPhotos.length > 0 && (
            <button type="button" className="gallery-page__export" onClick={handleExportAll} disabled={!!exporting}>
              {exporting ? `Export… ${exporting.done}/${exporting.total}` : "Télécharger tout"}
            </button>
          )}
        </div>
      )}

      <Gallery photos={photos} />
    </div>
  );
}
