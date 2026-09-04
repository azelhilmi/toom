import BrandMark from "./BrandMark";
import "./LoadingScreen.css";

export default function LoadingScreen({ message = "Chargement…" }) {
  return (
    <div className="loading-screen">
      <BrandMark size="medium" />
      <p className="loading-screen__message">{message}</p>
    </div>
  );
}
