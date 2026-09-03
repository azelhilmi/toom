import "./PoseCounter.css";

export default function PoseCounter({ remaining, total }) {
  return (
    <div className="pose-counter" title={`${remaining} poses restantes sur ${total}`}>
      {remaining}
    </div>
  );
}
