let ctx = null;

function getContext() {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

/**
 * Petit "tic" sec et aigu — imite le déclic mécanique d'une molette
 * crantée à chaque cran franchi.
 */
export function playWheelTick() {
  const c = getContext();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "square";
  osc.frequency.value = 1400;
  gain.gain.setValueAtTime(0.06, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.03);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.03);
}

/**
 * Petit "clac" plus grave et plus plein — la pellicule vient de
 * s'armer complètement.
 */
export function playWheelArmed() {
  const c = getContext();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(500, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.08);
  gain.gain.setValueAtTime(0.12, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + 0.1);
}

/**
 * Déclic d'obturateur : un bref souffle de bruit filtré (le "clac"
 * mécanique) suivi d'un tic plus aigu (le retour du miroir/rideau) —
 * synthétisé plutôt que chargé, pour ne dépendre d'aucun fichier audio.
 */
export function playShutter() {
  const c = getContext();
  if (!c) return;
  const now = c.currentTime;

  // Bruit filtré bref (le "clac" principal).
  const bufferSize = Math.floor(c.sampleRate * 0.06);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const bandpass = c.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 1800;
  bandpass.Q.value = 0.7;
  const noiseGain = c.createGain();
  noiseGain.gain.setValueAtTime(0.35, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  noise.connect(bandpass).connect(noiseGain).connect(c.destination);
  noise.start(now);

  // Petit tic aigu juste après (retour du mécanisme).
  const osc = c.createOscillator();
  const oscGain = c.createGain();
  osc.type = "square";
  osc.frequency.value = 2200;
  oscGain.gain.setValueAtTime(0, now);
  oscGain.gain.setValueAtTime(0.05, now + 0.05);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
  osc.connect(oscGain).connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.09);
}
