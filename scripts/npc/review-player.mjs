// Shared deterministic review renderer. This is not mounted in the learner app.
export async function createReviewPlayer(canvas, rig, sources) {
  const ctx = canvas.getContext("2d");
  const images = {};
  await Promise.all(
    Object.entries(sources).map(async ([id, src]) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      images[id] = image;
    }),
  );
  let clip = "idle",
    time = 0,
    debug = false;
  const p = rig.placement;
  const smooth = (x) => {
    const t = Math.max(0, Math.min(1, x));
    return t * t * (3 - 2 * t);
  };
  const interpolate = (a, b, x) => a + (b - a) * smooth(x);
  const point = (layer, x, y, angle) => {
    const dx = (x - layer.pivotX) * layer.width,
      dy = (y - layer.pivotY) * layer.height;
    return {
      x: layer.x + dx * Math.cos(angle) - dy * Math.sin(angle),
      y: layer.y + dx * Math.sin(angle) + dy * Math.cos(angle),
    };
  };
  const drawArm = (id, degrees) => {
    const layer = p[id],
      radians = (degrees * Math.PI) / 180;
    ctx.save();
    ctx.translate(layer.x, layer.y);
    ctx.rotate(radians);
    ctx.drawImage(
      images[id],
      -layer.pivotX * layer.width,
      -layer.pivotY * layer.height,
      layer.width,
      layer.height,
    );
    ctx.restore();
    return point(layer, layer.pawX, layer.pawY, radians);
  };
  function sample(seconds, state = clip) {
    const duration =
      state === "interaction" ? rig.clips.interaction.duration : rig.clips.idle.duration;
    const t =
      state === "interaction"
        ? Math.min(duration, Math.max(0, seconds))
        : ((seconds % duration) + duration) % duration;
    let wave = 108,
      hold = 0,
      cloth = true;
    let blink = (t >= 5.2 && t < 5.37) || (t >= 7.15 && t < 7.31);
    if (rig.mode === "single-arm") {
      const m = rig.motion;
      const direction = m.direction ?? 1;
      wave = (m.restAngle ?? 0) + m.idleAmplitude * Math.sin((t / duration) * Math.PI * 2);
      if (state === "interaction") {
        const u = t / duration;
        const amount =
          u < 0.3
            ? smooth(u / 0.3)
            : u < 0.7
              ? 1 + 0.25 * Math.sin(((u - 0.3) / 0.4) * Math.PI * 2)
              : 1 - smooth((u - 0.7) / 0.3);
        wave = (m.restAngle ?? 0) + direction * m.waveAmplitude * amount;
        blink = u > 0.81 && u < 0.9;
      } else if (state === "listening") {
        wave = m.restAngle ?? 0;
        blink = false;
      }
      return {
        time: t,
        wave,
        hold: 0,
        cloth: false,
        blink,
        state: state === "interaction" && t === duration ? "listening" : state,
      };
    }
    if (state === "interaction") {
      wave =
        t < 0.7
          ? interpolate(108, 5, t / 0.7)
          : t < 1.5
            ? 5 + 10 * Math.sin(((t - 0.7) / 0.8) * 2 * Math.PI)
            : interpolate(5, 88, (t - 1.5) / 0.5);
      hold = 0;
      cloth = false;
      blink = t > 1.67 && t < 1.79;
    } else if (state === "listening") {
      wave = 88;
      cloth = false;
      blink = false;
    } else {
      // One bounded polishing passage; two cycles, zero offset at both ends.
      const active = t > 1.5 && t < 3.8;
      wave = 108 + (active ? 7 * Math.sin(((t - 1.5) / 2.3) * Math.PI * 4) : 0);
      hold = 1.2 * Math.sin((t / duration) * Math.PI * 2);
    }
    return {
      time: t,
      wave,
      hold,
      cloth,
      blink,
      state: state === "interaction" && t === duration ? "listening" : state,
    };
  }
  function render(seconds = time, state = clip) {
    time = seconds;
    clip = state;
    const pose = sample(seconds, state);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = Math.min(
      (canvas.width - 48) / rig.coordinateSystem.width,
      (canvas.height - 40) / rig.coordinateSystem.height,
    );
    ctx.save();
    ctx.translate(
      (canvas.width - rig.coordinateSystem.width * scale) / 2,
      (canvas.height - rig.coordinateSystem.height * scale) / 2,
    );
    ctx.scale(scale, scale);
    ctx.drawImage(images.body, p.body.x, p.body.y, p.body.width, p.body.height);
    if (pose.blink) {
      for (const id of ["eye_l_closed", "eye_r_closed"]) {
        const layer = rig.layers.find((layer) => layer.id === id);
        ctx.drawImage(
          images[id],
          layer.trim.left,
          layer.trim.top,
          layer.trim.width,
          layer.trim.height,
        );
      }
    }
    if (p.arm_hold) {
      const holdPaw = drawArm("arm_hold", pose.hold);
      // Cup follows the holding paw in world coordinates; exactly one parent.
      const restPaw = point(p.arm_hold, p.arm_hold.pawX, p.arm_hold.pawY, 0);
      const cupX = p.cup.x + holdPaw.x - restPaw.x,
        cupY = p.cup.y + holdPaw.y - restPaw.y;
      ctx.drawImage(images.cup, cupX, cupY, p.cup.width, p.cup.height);
    }
    const wavePaw = drawArm("arm_wave", pose.wave);
    if (pose.cloth)
      ctx.drawImage(
        images.cloth,
        wavePaw.x - p.cloth.width * 0.5,
        wavePaw.y - 10,
        p.cloth.width,
        p.cloth.height,
      );
    if (debug) {
      ctx.strokeStyle = "#dc2626";
      ctx.fillStyle = "#dc2626";
      ctx.lineWidth = 4;
      ctx.font = "26px sans-serif";
      for (const [id, v] of [
        ["shoulder_wave", p.arm_wave],
        ["shoulder_hold", p.arm_hold],
        ["feet", rig.root.anchor],
      ].filter(([, value]) => value)) {
        ctx.beginPath();
        ctx.arc(v.x, v.y, 10, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fillText(id, v.x + 14, v.y);
      }
    }
    ctx.restore();
    return {
      ...pose,
      feetAnchor: rig.root.anchor,
      activeForegroundTimelines:
        state === "interaction" && seconds < rig.clips.interaction.duration ? 1 : 0,
    };
  }
  render(0);
  return {
    render,
    sample,
    rig,
    setDebug(value) {
      debug = value;
      render();
    },
    get time() {
      return time;
    },
    get clip() {
      return clip;
    },
  };
}
