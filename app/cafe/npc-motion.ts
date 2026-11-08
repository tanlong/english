export type MotionState =
  | "idle"
  | "ambient_01"
  | "interaction"
  | "notice"
  | "listening"
  | "thinking"
  | "talking"
  | "happy"
  | "error";
export type MotionRig = {
  npcId?: string;
  mode?: string | null;
  clips: { idle: { duration: number }; interaction: { duration: number } };
  motion?: {
    idleAmplitude: number;
    waveAmplitude: number;
    direction?: number;
    restAngle?: number;
  } | null;
};

export function sampleNpcPose(rig: MotionRig, seconds: number, state: MotionState) {
  const greeting = state === "notice" || state === "interaction";
  const grayIdle = rig.npcId === "gray_boo" && (state === "idle" || state === "ambient_01");
  const duration =
    greeting || state === "happy"
      ? rig.clips.interaction.duration
      : grayIdle
        ? 3
        : rig.clips.idle.duration;
  const input = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const t = greeting ? Math.min(duration, input) : input % duration;
  const smooth = (value: number) => {
    const x = Math.max(0, Math.min(1, value));
    return x * x * (3 - 2 * x);
  };
  const interpolate = (a: number, b: number, x: number) => a + (b - a) * smooth(x);
  const quiet = state === "listening" || state === "error";
  let wave = 108,
    hold = 0,
    cloth = state === "idle" || state === "ambient_01";
  let blink = grayIdle ? t >= 1.15 && t < 1.38 : (t >= 5.2 && t < 5.37) || (t >= 7.15 && t < 7.31);
  // Daisy's source arm is already raised, with the palm facing the viewer.
  // The old 88–108° rest turned that upright artwork across her chest.
  const motion =
    rig.mode === "single-arm"
      ? rig.motion
      : rig.npcId === "cloud_daisy"
        ? { restAngle: 0, idleAmplitude: 2, waveAmplitude: 18, direction: -1 }
        : null;
  if (motion) {
    cloth = false;
    const rest = motion.restAngle ?? 0;
    wave = rest + motion.idleAmplitude * Math.sin((t / duration) * Math.PI * 2);
    if (greeting) {
      const u = t / duration;
      const amount =
        u < 0.3
          ? smooth(u / 0.3)
          : u < 0.7
            ? 1 + 0.25 * Math.sin(((u - 0.3) / 0.4) * Math.PI * 2)
            : 1 - smooth((u - 0.7) / 0.3);
      wave = rest + (motion.direction ?? 1) * motion.waveAmplitude * amount;
      blink = u > 0.81 && u < 0.9;
    } else if (quiet) {
      wave = rest;
      blink = false;
    } else if (state === "talking") wave = rest + 4 * Math.sin(t * 2.2);
    else if (state === "thinking") wave = rest + 1.5 * Math.sin(t * 0.8);
  } else if (greeting) {
    wave =
      t < 0.7
        ? interpolate(108, 5, t / 0.7)
        : t < 1.5
          ? 5 + 10 * Math.sin(((t - 0.7) / 0.8) * 2 * Math.PI)
          : interpolate(5, 88, (t - 1.5) / 0.5);
    cloth = false;
    blink = t > 1.67 && t < 1.79;
  } else if (quiet || state === "thinking" || state === "talking") {
    wave = state === "talking" ? 88 + 4 * Math.sin(t * 2.2) : 88;
    cloth = false;
    if (quiet) blink = false;
  } else {
    const polishing = t > 1.5 && t < 3.8;
    wave = 108 + (polishing ? 7 * Math.sin(((t - 1.5) / 2.3) * Math.PI * 4) : 0);
    hold = 1.2 * Math.sin((t / duration) * Math.PI * 2);
  }
  const resolvedState = greeting && t >= duration ? "listening" : state;
  const mouthClosed =
    resolvedState === "talking" ? Math.sin(t * Math.PI * 8) < 0.1 : resolvedState !== "happy";
  return {
    time: t,
    wave,
    hold,
    cloth,
    blink,
    mouthClosed,
    state: resolvedState,
    foregroundCount: (greeting && t < duration) || state === "talking" ? 1 : 0,
  };
}
