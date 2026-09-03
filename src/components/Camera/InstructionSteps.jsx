import "./InstructionSteps.css";

const STEPS = [
  { n: 1, text: "Chargez la pellicule en haut à droite" },
  { n: 2, text: "Prenez la photo avec ou sans flash" },
  { n: 3, text: "Attendez le développement dans 24h" },
];

export default function InstructionSteps() {
  return (
    <div className="instruction-steps">
      {STEPS.map((step, i) => (
        <div className="instruction-steps__step" key={step.n}>
          {i > 0 && (
            <svg className="instruction-steps__arrow" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
              <path fill="currentColor" d="M4 11h13l-4.5-4.5L14 5l7 7-7 7-1.5-1.5L17 13H4z" />
            </svg>
          )}
          <div className="instruction-steps__item">
            <span className="instruction-steps__number">{step.n}</span>
            <span className="instruction-steps__text">{step.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
