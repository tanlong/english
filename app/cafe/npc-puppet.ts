import {
  Application,
  Assets,
  Container,
  MeshPlane,
  Sprite,
  type Spritesheet,
  type Texture,
} from "pixi.js";
import { gsap } from "gsap";
import { sampleNpcPose, type MotionRig, type MotionState } from "./npc-motion";

type Placement = {
  x: number;
  y: number;
  width: number;
  height: number;
  pivotX?: number;
  pivotY?: number;
  pawX?: number;
  pawY?: number;
  order?: number;
};
type Box = { left: number; top: number; width: number; height: number };
type Rig = MotionRig & {
  npcId: string;
  atlas: string;
  phase: number;
  coordinateSystem: { width: number; height: number };
  root: { anchor: { x: number; y: number } };
  layers: { id: string; texture: string; trim: Box }[];
  placement: Record<string, Placement>;
  mouth?: { src: string; trim: Box };
};
const leases = new Map<string, { users: number; promise: Promise<unknown> }>();
function borrow<T>(url: string) {
  let entry = leases.get(url);
  if (!entry) {
    entry = { users: 0, promise: Assets.load(url) };
    leases.set(url, entry);
  }
  entry.users++;
  return entry.promise as Promise<T>;
}
function release(url: string) {
  const entry = leases.get(url);
  if (!entry) return;
  entry.users--;
  void entry.promise
    .then(async () => {
      if (entry.users === 0 && leases.get(url) === entry) {
        leases.delete(url);
        await Assets.unload(url);
      }
    })
    .catch(() => {
      if (leases.get(url) === entry && entry.users === 0) leases.delete(url);
    });
}

export async function mountNpcPuppet(host: HTMLElement, rigUrl: string) {
  const response = await fetch(rigUrl);
  if (!response.ok) throw new Error("NPC rig unavailable");
  const rig = (await response.json()) as Rig;
  if (
    !rig.layers?.length ||
    !(rig.coordinateSystem.width > 0) ||
    !(rig.coordinateSystem.height > 0)
  )
    throw new Error("Invalid NPC rig");
  const app = new Application();
  const borrowed: string[] = [];
  let timeline: gsap.core.Timeline | undefined;
  let destroyed = false;
  let current: MotionState | undefined;
  const clock = { seconds: 0 };
  try {
    borrowed.push(rig.atlas);
    const sheet = await borrow<Spritesheet>(rig.atlas);
    let mouthTexture: Texture | undefined;
    if (rig.mouth) {
      borrowed.push(rig.mouth.src);
      mouthTexture = await borrow<Texture>(rig.mouth.src);
    }
    await app.init({
      width: 512,
      height: 640,
      backgroundAlpha: 0,
      antialias: true,
      autoStart: false,
      sharedTicker: false,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      preference: "webgl",
    });
    const world = new Container();
    world.sortableChildren = true;
    const scale = Math.min(480 / rig.coordinateSystem.width, 608 / rig.coordinateSystem.height);
    world.scale.set(scale);
    world.position.set(256 - rig.root.anchor.x * scale, 630 - rig.root.anchor.y * scale);
    app.stage.addChild(world);
    const sprites: Record<string, Sprite | MeshPlane> = {};
    let cloak: MeshPlane | undefined;
    let restingVertices: Float32Array | undefined;
    for (const layer of rig.layers) {
      const texture = sheet.textures[layer.texture];
      if (!texture) throw new Error(`Missing NPC texture ${layer.id}`);
      const sprite =
        rig.npcId === "gray_boo" && layer.id === "body"
          ? new MeshPlane({ texture, verticesX: 25, verticesY: 31 })
          : new Sprite(texture);
      if (sprite instanceof MeshPlane) {
        cloak = sprite;
        restingVertices = new Float32Array(sprite.geometry.getAttribute("aPosition").buffer.data);
      }
      const p = rig.placement[layer.id];
      if (p) {
        if (sprite instanceof Sprite) sprite.anchor.set(p.pivotX ?? 0, p.pivotY ?? 0);
        sprite.position.set(p.x ?? 0, p.y ?? 0);
        sprite.width = p.width;
        sprite.height = p.height;
        sprite.zIndex = p.order ?? 0;
      } else {
        sprite.position.set(layer.trim.left, layer.trim.top);
        sprite.width = layer.trim.width;
        sprite.height = layer.trim.height;
        sprite.zIndex = 5;
      }
      if (layer.id.startsWith("eye_")) sprite.visible = false;
      sprites[layer.id] = sprite;
      world.addChild(sprite);
    }
    let mouth: Sprite | undefined;
    if (rig.mouth && mouthTexture) {
      mouth = new Sprite(mouthTexture);
      const box = rig.mouth.trim;
      mouth.position.set(box.left, box.top);
      mouth.width = box.width;
      mouth.height = box.height;
      mouth.zIndex = 7;
      world.addChild(mouth);
    }
    const paw = (id: string, degrees: number) => {
      const p = rig.placement[id],
        angle = (degrees * Math.PI) / 180;
      const x = ((p.pawX ?? 0) - (p.pivotX ?? 0)) * p.width;
      const y = ((p.pawY ?? 0) - (p.pivotY ?? 0)) * p.height;
      return {
        x: p.x + x * Math.cos(angle) - y * Math.sin(angle),
        y: p.y + x * Math.sin(angle) + y * Math.cos(angle),
      };
    };
    function draw(seconds: number, state: MotionState) {
      if (destroyed) return;
      const pose = sampleNpcPose(rig, seconds, state);
      if (cloak && restingVertices) {
        const buffer = cloak.geometry.getAttribute("aPosition").buffer;
        const vertices = buffer.data;
        const flutter =
          state === "idle" || state === "ambient_01" ? Math.sin((seconds / 3) * Math.PI * 2) : 0;
        // Only the outer robe tips flex; face, tablet, legs and shoe vertices stay fixed.
        for (let i = 0; i < restingVertices.length; i += 2) {
          const x = restingVertices[i],
            y = restingVertices[i + 1];
          const sourceX = (x / cloak.texture.width) * rig.coordinateSystem.width;
          const sourceY = (y / cloak.texture.height) * rig.coordinateSystem.height;
          const weight =
            Math.max(0, 1 - Math.abs((sourceY - 990) / 150)) *
            Math.max(0, (Math.abs((sourceX - 560) / 560) - 0.45) / 0.55);
          vertices[i] =
            x + ((4 * cloak.texture.width) / rig.coordinateSystem.width) * weight * flutter;
          vertices[i + 1] = y;
        }
        buffer.update();
      }
      sprites.arm_wave.angle = pose.wave;
      if (sprites.arm_hold) {
        sprites.arm_hold.angle = pose.hold;
        const point = paw("arm_hold", pose.hold),
          rest = paw("arm_hold", 0);
        sprites.cup.position.set(
          rig.placement.cup.x + point.x - rest.x,
          rig.placement.cup.y + point.y - rest.y,
        );
      }
      if (sprites.cloth) {
        const point = paw("arm_wave", pose.wave);
        sprites.cloth.visible = pose.cloth;
        sprites.cloth.position.set(point.x - rig.placement.cloth.width / 2, point.y - 10);
      }
      for (const id of ["eye_l_closed", "eye_r_closed"])
        if (sprites[id]) sprites[id].visible = pose.blink;
      if (mouth) mouth.visible = pose.mouthClosed;
      host.dataset.motionState = pose.state;
      host.dataset.foregroundCount = String(pose.foregroundCount);
      host.dataset.time = seconds.toFixed(3);
      app.render();
    }
    draw(0, "listening");
    host.appendChild(app.canvas);
    return {
      snapshot(seconds: number, state: MotionState = "idle") {
        timeline?.pause();
        draw(seconds, state);
        return app.canvas.toDataURL("image/png");
      },
      update(state: MotionState, paused: boolean) {
        if (destroyed) return;
        host.dataset.paused = String(paused);
        if (state === current) {
          timeline?.paused(paused);
          if (paused) host.dataset.foregroundCount = "0";
          return;
        }
        timeline?.kill();
        timeline = undefined;
        current = state;
        clock.seconds = 0;
        const phase = state === "idle" || state === "ambient_01" ? rig.phase : 0;
        draw(paused ? 0 : phase, paused ? "listening" : state);
        if (state === "listening" || state === "error") return;
        const oneShot = state === "notice" || state === "interaction" || state === "happy";
        const duration = oneShot ? rig.clips.interaction.duration : rig.clips.idle.duration;
        timeline = gsap.timeline({
          paused,
          repeat: oneShot ? 0 : -1,
          onUpdate: () => draw(clock.seconds + phase, state),
          onComplete: () => draw(duration, state),
        });
        timeline.to(clock, { seconds: duration, duration, ease: "none" });
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        timeline?.kill();
        app.destroy({ removeView: true }, { children: true, texture: false, textureSource: false });
        borrowed.forEach(release);
      },
    };
  } catch (error) {
    timeline?.kill();
    if (app.renderer)
      app.destroy({ removeView: true }, { children: true, texture: false, textureSource: false });
    borrowed.forEach(release);
    throw error;
  }
}
