import "./Viewfinder.css";

export default function Viewfinder({ videoRef, error, flashPulse }) {
  return (
    <div className="viewfinder-fill">
      {error ? (
        <p className="viewfinder-fill__error">{error}</p>
      ) : (
        <video ref={videoRef} className="viewfinder-fill__video" muted playsInline />
      )}
      {flashPulse && <div className="viewfinder-fill__flash-pulse" />}
    </div>
  );
}
