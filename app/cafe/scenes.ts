import config from "../../configs/scenes.json" with { type: "json" };
import npcAssets from "./topic-npc-assets.json" with { type: "json" };
import { curriculum, npcs } from "./content.ts";
export const mapPoints = [
  {
    id: "forest_path",
    label: "Vườn cây ăn trái",
    subtitle: "Lối nhỏ dưới tán xoài, mít và dừa",
    x: 58,
    y: 12,
  },
  { id: "village_homes", label: "Khu nhà", subtitle: "Một góc làng yên bình", x: 55, y: 72 },
  {
    id: "river_bridge",
    label: "Cầu qua sông",
    subtitle: "Dừng chân bên dòng nước xanh",
    x: 52,
    y: 48,
  },
  { id: "lakeside", label: "Bờ hồ", subtitle: "Nghỉ chân bên chòi lá ven hồ", x: 18, y: 35 },
  {
    id: "farm_fields",
    label: "Cánh đồng",
    subtitle: "Chiều tối mưa giông cùng Planner Monkey",
    x: 84,
    y: 35,
  },
] as const;
export type MapPointId = (typeof mapPoints)[number]["id"];
export const villageRooms = [
  {
    id: "village_market",
    label: "Cửa hàng Bình Nguyên",
    shortLabel: "Cửa hàng",
    mapPoint: { x: 30, y: 55 },
    subtitle: "Tiệm tạp hoá những năm 2000 cùng Shopping Panda",
    npcs: [{ id: "penny_panda", x: 55, y: 89, width: 14 }],
  },
  {
    id: "work_lounge",
    label: "Góc làm việc",
    shortLabel: "Góc làm việc",
    mapPoint: { x: 91, y: 12 },
    subtitle: "Chuyện công việc hằng ngày cùng Office Corgi",
    npcs: [
      { id: "toby_corgi", x: 34, y: 90, width: 13 },
      { id: "alex_otter", x: 70, y: 90, width: 13 },
    ],
  },
  {
    id: "project_room",
    label: "Phòng dự án",
    shortLabel: "Phòng dự án",
    mapPoint: { x: 18, y: 12 },
    subtitle: "Quản lý dự án cùng Project Wolf",
    npcs: [
      { id: "morgan_wolf", x: 33, y: 91, width: 14 },
      { id: "bailey_beaver", x: 72, y: 91, width: 14 },
    ],
  },
  {
    id: "design_studio",
    label: "Studio sản phẩm",
    shortLabel: "Studio sản phẩm",
    mapPoint: { x: 90, y: 66 },
    subtitle: "Thiết kế trải nghiệm cùng Designer Cat",
    npcs: [
      { id: "ivy_cat", x: 23, y: 91, width: 12 },
      { id: "dex_robot", x: 50, y: 91, width: 12 },
      { id: "tess_turtle", x: 77, y: 91, width: 12 },
    ],
  },
] as const;
export const mapDestinations = [
  ...mapPoints.map((point) => ({ ...point, shortLabel: point.label })),
  ...villageRooms.map((room) => ({
    id: room.id,
    label: room.label,
    shortLabel: room.shortLabel,
    subtitle: room.subtitle,
    ...room.mapPoint,
  })),
];
export type SceneId =
  | "inside_cafe"
  | "outdoor_terrace"
  | "mountain_view"
  | "map"
  | MapPointId
  | (typeof topicRooms)[number]["id"]
  | (typeof villageRooms)[number]["id"];
// Additional rooms are reached by signposts in nearby scenes, not map markers.
export const topicRooms = [
  { id: "coffee_house", parent: "inside_cafe", label: "Quán cà phê", shortLabel: "Quán cà phê" },
  {
    id: "hobby_library",
    parent: "inside_cafe",
    label: "Thư viện sở thích",
    shortLabel: "Thư viện",
  },
  { id: "it_team_room", parent: "work_lounge", label: "Phòng nhóm IT", shortLabel: "Nhóm IT" },
  {
    id: "banking_office",
    parent: "project_room",
    label: "Phòng nghiệp vụ ngân hàng",
    shortLabel: "Nghiệp vụ",
  },
  {
    id: "development_lab",
    parent: "design_studio",
    label: "Phòng phát triển",
    shortLabel: "Phát triển",
  },
  {
    id: "qa_operations",
    parent: "development_lab",
    label: "Phòng QA và vận hành",
    shortLabel: "QA / Vận hành",
  },
] as const;
const landscape = {
  id: "landscape",
  depth: 0,
  zIndex: 5,
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  flip: false,
};
// The art build regenerates the three layered scenes; exploration art stays independent.
export const scenes = [
  ...config.scenes.map((scene) =>
    scene.id === "mountain_view"
      ? {
          ...scene,
          exits: [...scene.exits, { to: "map", direction: "right", label: "Đến làng Bình Nguyên" }],
        }
      : scene,
  ),
  {
    id: "map",
    settingId: "map",
    label: "Bản đồ",
    subtitle: `Chọn một trong ${mapDestinations.length} điểm để khám phá`,
    shortLabel: "Bản đồ",
    npcs: [],
    exits: [
      { to: "mountain_view", direction: "left", label: "Về hồ thông" },
      ...mapDestinations.map((point) => ({
        to: point.id,
        direction: "point",
        label: `Khám phá ${point.label}`,
      })),
    ],
    layers: [
      {
        ...landscape,
        src: "/cafe/maps/nam-bo-1995-2005/map.webp",
      },
    ],
    occluders: [],
  },
  ...mapPoints.map((point) => ({
    id: point.id,
    settingId: point.id,
    label: point.label,
    subtitle: point.subtitle,
    shortLabel: point.label,
    npcs: [],
    exits: [
      { to: "map", direction: "left", label: "Về Bình Nguyên" },
      ...(point.id === "village_homes"
        ? villageRooms.map((room) => ({ to: room.id, direction: "place", label: room.label }))
        : []),
    ],
    layers:
      point.id === "farm_fields"
        ? [
            { ...landscape, src: npcAssets.sun_king.scene },
            { ...landscape, id: "field-clouds", zIndex: 6, src: "/cafe/fields/storm/sky.webp" },
            { ...landscape, id: "field-land", zIndex: 7, src: npcAssets.sun_king.terrain },
            {
              ...landscape,
              id: "field-trees-left",
              zIndex: 28,
              src: "/cafe/fields/storm/canopy.webp",
            },
            {
              ...landscape,
              id: "field-trees-right",
              zIndex: 29,
              src: "/cafe/fields/storm/canopy.webp",
            },
          ]
        : [{ ...landscape, src: `/cafe/maps/nam-bo-1995-2005/aligned-v2/${point.id}.webp` }],
    occluders: [],
  })),
  ...villageRooms.map((room) => ({
    ...room,
    settingId: room.id,
    npcs: [...room.npcs],
    exits: [
      { to: "village_homes", direction: "passage", label: "Về khu nhà" },
      { to: "map", direction: "left", label: "Về Bình Nguyên" },
    ],
    layers: [
      {
        ...landscape,
        src: `/cafe/maps/nam-bo-1995-2005/aligned-v2/${room.id}.webp`,
      },
    ],
    occluders: [],
  })),
  ...topicRooms.map((room) => ({
    id: room.id,
    settingId: room.id,
    label: room.label,
    shortLabel: room.shortLabel,
    subtitle: "",
    npcs: [],
    exits: [
      {
        to: room.parent,
        direction: "passage",
        label: `Về ${room.parent === "inside_cafe" ? "Vườn hoa" : room.parent === "work_lounge" ? "Góc làm việc" : room.parent === "project_room" ? "Phòng dự án" : room.parent === "design_studio" ? "Studio sản phẩm" : "Phòng phát triển"}`,
      },
    ],
    layers: [{ ...landscape, src: `/cafe/topics/${room.id}.webp` }],
    occluders: [],
  })),
].map((scene) => ({
  ...scene,
  topicId: curriculum.find((topic) => topic.sceneId === scene.id)?.topicId,
  subtitle: curriculum.find((topic) => topic.sceneId === scene.id)?.shortLabel ?? scene.subtitle,
  exits: [
    ...scene.exits,
    ...topicRooms
      .filter((room) => room.parent === scene.id)
      .map((room) => ({
        to: room.id,
        direction: "passage",
        label: `Đến ${room.label}`,
      })),
    ...(scene.id === "outdoor_terrace"
      ? [{ to: "farm_fields", direction: "passage", label: "Đến Cánh đồng · Lên kế hoạch" }]
      : []),
    ...(scene.id === "farm_fields"
      ? [{ to: "outdoor_terrace", direction: "passage", label: "Về Đồi chè" }]
      : []),
  ],
  npcs:
    scene.id === "map"
      ? []
      : npcs
          .filter((npc) => npc.id !== "mr_pink" && npc.sceneId === scene.id)
          .sort(
            (a, b) =>
              ["guide", "conversation", "hybrid"].indexOf(a.role) -
              ["guide", "conversation", "hybrid"].indexOf(b.role),
          )
          .map((npc, index) => ({
            id: npc.id,
            x:
              npc.id === "gray_boo"
                ? 60
                : npc.id === "sun_king"
                  ? 76
                  : scene.id === "mountain_view"
                    ? [20, 60, 83][index]
                    : [22, 50, 78][index],
            y: scene.id === "mountain_view" ? 87.5 : scene.id === "farm_fields" ? 93 : 90,
            width: npc.id === "sun_king" ? 27 : 18,
          })),
}));
export const sceneConfig = { ...config, scenes };
export function canNavigate(from: string, to: string) {
  return scenes.find((s) => s.id === from)?.exits.some((exit) => exit.to === to) === true;
}
