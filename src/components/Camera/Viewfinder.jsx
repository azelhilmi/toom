import "./Viewfinder.css";

export default function Viewfinder({ videoRef, error, flashPulse, retry }) {
  return (
    <div className="viewfinder-fill">
      {error ? (
        <div className="viewfinder-fill__error">
          <p>{error}</p>
          {retry && (
            <button type="button" className="viewfinder-fill__retry" onClick={retry}>
              Réessayer
            </button>
          )}
        </div>
      ) : (
        <video ref={videoRef} className="viewfinder-fill__video" muted playsInline />
      )}
      {flashPulse && <div className="viewfinder-fill__flash-pulse" />}
    </div>
  );
}
