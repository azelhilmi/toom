import "./Viewfinder.css";

export default function Viewfinder({ videoRef, error, flashPulse }) {
  return (
    <div className="viewfinder">
      {error ? (
        <p className="viewfinder__error">{error}</p>
      ) : (
        <video ref={videoRef} className="viewfinder__video" muted playsInline />
      )}
      <div className="viewfinder__vignette" />
      <div className="viewfinder__crosshair" aria-hidden="true">
        <span />
        <span />
      </div>
      {flashPulse && <div className="viewfinder__flash-pulse" />}
    </div>
  );
}
