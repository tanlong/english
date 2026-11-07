import config from "../../configs/scenes.json" with { type: "json" };
export type SceneId = "inside_cafe" | "outdoor_terrace" | "mountain_view";
export const sceneConfig = config;
export const scenes = config.scenes;
export function canNavigate(from: string, to: string) {
  return scenes.find((s) => s.id === from)?.exits.some((exit) => exit.to === to) === true;
}
