export type Level = "A1" | "A2" | "B1";
export type NpcState =
  "idle" | "notice" | "ambient_01" | "listening" | "thinking" | "talking" | "error";
export type CafeReply = {
  replyEn: string;
  explanationVi: string;
  sourceMode: "scripted" | "ai";
  correction: null | {
    userSaid: string;
    basicEn: string;
    naturalEn: string;
    explanationVi: string;
  };
  hints: { basic: string; better: string; natural: string };
  npcEmotion: "neutral" | "happy" | "curious" | "encouraging" | "thinking";
  fallbackReason?: string;
};

// Draft role-play material: never presented as editorially published lessons or IPA.
export const npcs = [
  {
    id: "cloud_daisy",
    name: "Cloud Daisy",
    sceneId: "inside_cafe",
    color: "#c47657",
    kind: "cat",
    description: "Một ly cà phê, một câu chuyện nhỏ.",
    topics: ["ordering", "greetings"],
  },
  {
    id: "ollie_owl",
    name: "Ollie Owl",
    sceneId: "inside_cafe",
    color: "#ab8159",
    kind: "owl",
    description: "Bạn đồng hành trong những ngày bận rộn.",
    topics: ["daily_life", "work"],
  },
  {
    id: "mimi_bunny",
    name: "Mimi Bunny",
    sceneId: "inside_cafe",
    color: "#cf8e9d",
    kind: "bunny",
    description: "Sách, âm nhạc và những điều bạn thích.",
    topics: ["hobbies"],
  },
  {
    id: "astro_bean",
    name: "Astro Bean",
    sceneId: "outdoor_terrace",
    color: "#8b93bf",
    kind: "astronaut",
    description: "Cùng tò mò về bầu trời và các vì sao.",
    topics: ["space"],
  },
  {
    id: "bear_explorer",
    name: "Bear Explorer",
    sceneId: "outdoor_terrace",
    color: "#83966b",
    kind: "bear",
    description: "Kể nhau nghe về một chuyến đi.",
    topics: ["travel"],
  },
  {
    id: "gray_boo",
    name: "Gray Boo",
    sceneId: "mountain_view",
    color: "#8cabac",
    kind: "alien",
    description: "Một người bạn tưởng tượng giữa thung lũng.",
    topics: ["aliens", "nature"],
  },
  {
    id: "mr_pink",
    name: "Mr. Pink",
    sceneId: "outdoor_terrace",
    color: "#d9568a",
    kind: "bird",
    description: "Người bạn dẫn đường tới các góc luyện tập đang ẩn khỏi menu.",
    topics: [],
  },
] as const;
export type NpcId = (typeof npcs)[number]["id"];
export function findNpc(id: unknown) {
  const canonical = id === "may" ? "cloud_daisy" : id === "deo_explorer" ? "bear_explorer" : id;
  return npcs.find((npc) => npc.id === canonical);
}
const guideNpcIds: readonly NpcId[] = ["mr_pink"];
export function isGuideNpc(id: NpcId) {
  return guideNpcIds.includes(id);
}
export type Topic = {
  label: string;
  greeting: string;
  questions: [string, string, string];
  hints: CafeReply["hints"];
  explanationVi: string;
};
export const topics: Record<string, Topic> = {
  ordering: {
    label: "Gọi cà phê",
    greeting: "Hi! Welcome to our café. What would you like to drink?",
    questions: [
      "Would you like it hot or iced?",
      "Would you like anything to eat?",
      "Is that for here or to go?",
    ],
    hints: {
      basic: "I want a coffee, please.",
      better: "I'd like an iced coffee, please.",
      natural: "Could I get an iced coffee to go?",
    },
    explanationVi:
      "I'd like… và Could I get… là hai cách lịch sự để gọi món. To go nghĩa là mang đi.",
  },
  greetings: {
    label: "Làm quen",
    greeting: "Hi, I'm Cloud Daisy. How's your day going?",
    questions: [
      "What's your name?",
      "Is this your first time here?",
      "What do you like about this café?",
    ],
    hints: {
      basic: "My day is good.",
      better: "It's going well, thanks.",
      natural: "Pretty good, thanks! How about you?",
    },
    explanationVi: "How about you? giúp hỏi lại tự nhiên khi làm quen.",
  },
  daily_life: {
    label: "Một ngày của bạn",
    greeting: "Hey! What do you usually do in the morning?",
    questions: [
      "What time do you usually get up?",
      "What do you have for breakfast?",
      "What do you do after work?",
    ],
    hints: {
      basic: "I eat breakfast.",
      better: "I usually have breakfast before work.",
      natural: "I usually grab some breakfast on the way to work.",
    },
    explanationVi:
      "Usually nói về thói quen. Grab some breakfast là ăn sáng nhanh; on the way to work là trên đường đi làm. Mẫu tham khảo từ Lesson 01.",
  },
  work: {
    label: "Công việc",
    greeting: "Nice to meet you! What do you do for work?",
    questions: [
      "What do you enjoy about your work?",
      "When do you start work?",
      "How do you relax after work?",
    ],
    hints: {
      basic: "I am a developer.",
      better: "I work as a developer.",
      natural: "I'm a developer. I mostly build web apps.",
    },
    explanationVi: "I work as… giới thiệu công việc. Hãy thay ví dụ bằng thông tin thật của bạn.",
  },
  hobbies: {
    label: "Sở thích",
    greeting: "Hi! What do you like doing in your free time?",
    questions: [
      "How often do you do that?",
      "Do you prefer doing that alone or with friends?",
      "Is there a new hobby you'd like to try?",
    ],
    hints: {
      basic: "I like reading.",
      better: "I enjoy reading in my free time.",
      natural: "I'm really into books. They help me unwind.",
    },
    explanationVi: "Be into… nghĩa là rất thích điều gì. Unwind là thư giãn sau lúc bận rộn.",
  },
  space: {
    label: "Vũ trụ",
    greeting: "Look at the sky! Would you like to travel into space?",
    questions: [
      "What would you take on a space trip?",
      "Would you rather visit the Moon or Mars?",
      "What would you like to learn about the stars?",
    ],
    hints: {
      basic: "I want to see the Moon.",
      better: "I'd like to visit the Moon someday.",
      natural: "If I could, I'd love to see Earth from the Moon.",
    },
    explanationVi: "Đây là tình huống tưởng tượng. I'd love to… thể hiện điều rất muốn làm.",
  },
  travel: {
    label: "Du lịch",
    greeting: "Hello, fellow traveler! Where would you like to go next?",
    questions: [
      "How would you get there?",
      "What would you like to do there?",
      "Do you prefer mountains or the beach?",
    ],
    hints: {
      basic: "I want to visit Da Lat.",
      better: "I'd like to spend a weekend in Da Lat.",
      natural: "I'm thinking of heading to Da Lat for a weekend.",
    },
    explanationVi: "I'm thinking of + V-ing dùng để nói một dự định đang cân nhắc.",
  },
  aliens: {
    label: "Bạn ngoài hành tinh",
    greeting: "Let's imagine I'm visiting Earth! What should I try first?",
    questions: [
      "How would you describe coffee to a visitor?",
      "What is special about your hometown?",
      "Where should we explore together?",
    ],
    hints: {
      basic: "Try some coffee.",
      better: "You should try Vietnamese coffee.",
      natural: "You've got to try the coffee here!",
    },
    explanationVi:
      "Gray Boo là nhân vật giả tưởng. You've got to try… là cách thân mật để gợi ý nên thử gì.",
  },
  nature: {
    label: "Thiên nhiên",
    greeting: "What a view! What can you see in the valley?",
    questions: [
      "What do you like about being outdoors?",
      "What is the weather like today?",
      "Where do you go when you need a quiet moment?",
    ],
    hints: {
      basic: "I see trees.",
      better: "I can see pine trees in the valley.",
      natural: "Look at all those pine trees! It's so peaceful here.",
    },
    explanationVi: "I can see… mô tả cảnh trước mắt. Peaceful nghĩa là yên bình.",
  },
};

export function scriptedReply(
  topicId: string,
  level: string,
  index: number,
  text: string,
): CafeReply {
  const topic = topics[topicId];
  const question = topic.questions[index % topic.questions.length];
  const followUp =
    level === "B1" && index % 3 === 2 ? "Tell me a little more about your choice." : question;
  const offTopic = /^(help|i don'?t know|không biết|hint)[.!?\s]*$/i.test(text);
  return {
    replyEn: offTopic
      ? `You can try: "${level === "A1" ? topic.hints.basic : topic.hints.better}"`
      : followUp,
    explanationVi: topic.explanationVi,
    hints: topic.hints,
    correction: null,
    sourceMode: "scripted",
    npcEmotion: "encouraging",
  };
}

export type CafeTurnView = {
  id: string;
  clientMessageId: string;
  userText: string;
  reply: CafeReply | null;
};
export type CafeSummary = {
  learnerSentences: string[];
  noteVi: string;
  phrases: { id: string; english: string; vietnamese: string }[];
  turns: number;
};
export type CafeSession = {
  id: string;
  npcId: NpcId;
  topicId: string;
  level: Level;
  status: string;
  mode: "ai" | "scripted";
  greeting: string;
  turns: CafeTurnView[];
  summary: CafeSummary | null;
};
