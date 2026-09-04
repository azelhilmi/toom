import "./BrandMark.css";

export default function BrandMark({ size = "medium", withTagline = true }) {
  return (
    <div className={`brand-mark brand-mark--${size}`}>
      <img src="/brand/wordmark.webp" alt="Toom" className="brand-mark__logo" />
      {withTagline && <p className="brand-mark__tagline">We'll see tomorrow</p>}
    </div>
  );
}
