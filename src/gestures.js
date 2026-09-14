/* Gesture helpers, straight from the fluid-interface doctrine in SKILL.md:
   1:1 tracking with a short velocity history, momentum projection on release,
   and progressive resistance at a boundary. */

/** Where a flick comes to rest, using the exponential-decay form. */
export function project(velocity, decelerationRate = 0.998) {
  return (velocity / 1000) * decelerationRate / (1 - decelerationRate);
}

/** The further past a bound you drag, the less the surface follows. */
export function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/** Keeps the last few pointer samples so release velocity is real, not guessed. */
export class VelocityTracker {
  constructor(window = 5) { this.window = window; this.samples = []; }

  add(value, time = performance.now()) {
    this.samples.push({ value, time });
    if (this.samples.length > this.window) this.samples.shift();
  }

  /** px per second across the retained samples. */
  get velocity() {
    const s = this.samples;
    if (s.length < 2) return 0;
    const first = s[0];
    const last = s[s.length - 1];
    const dt = last.time - first.time;
    if (dt <= 0) return 0;
    return ((last.value - first.value) / dt) * 1000;
  }

  reset() { this.samples.length = 0; }
}
