import { upgradeExamples } from "./lesson-01-source.ts";
export type PhraseLevel = "basic" | "better" | "natural";
export type LessonSegment = {
  id: string;
  scene: "morning" | "school" | "breakfast" | "office" | "home";
  prompt: string;
  basic: { en: string; vi: string };
  better: { en: string; vi: string };
  natural: { en: string; vi: string };
};
export type BaselineLesson = {
  id: string;
  slug: string;
  title: string;
  description: string;
  topic: "everyday" | "workplace" | "communication";
  week: number;
  revision: number;
  segments: LessonSegment[];
  wisdom?: {
    ideaEn: string;
    ideaVi: string;
    situation: string;
    dialogue: { role: string; en: string; vi: string }[];
    chapter: string;
    textSource: string;
    academicSource: string;
    interpretation: string;
  };
};
const translations = [
  [
    "Tôi thức dậy lúc 5 giờ 40.",
    "Tôi thường thức dậy vào khoảng 5 giờ 40.",
    "Tôi thường ra khỏi giường vào khoảng 5 giờ 40.",
  ],
  ["Chúng tôi rời nhà.", "Chúng tôi cùng nhau rời nhà.", "Chúng tôi cùng nhau lên đường."],
  [
    "Tôi đưa con trai đến trường.",
    "Tôi đưa con đến trường bằng xe máy.",
    "Tôi đưa con đến trường rồi đi tiếp.",
  ],
  [
    "Tôi mua đồ ăn sáng.",
    "Tôi dừng lại ăn sáng trên đường đi làm.",
    "Tôi dừng lại mua chút đồ ăn sáng trên đường đi làm.",
  ],
  [
    "Tôi ăn trưa với đồng nghiệp.",
    "Tôi ăn trưa với đồng nghiệp vào buổi trưa.",
    "Tôi nghỉ ăn trưa cùng đồng nghiệp vào buổi trưa.",
  ],
  [
    "Tôi kết thúc công việc lúc 5 giờ 30.",
    "Tôi kết thúc công việc lúc 5 giờ 30 rồi về nhà.",
    "Tôi thu xếp xong công việc khoảng 5 giờ 30 rồi về nhà.",
  ],
];
const scenes: LessonSegment["scene"][] = [
  "morning",
  "home",
  "school",
  "breakfast",
  "office",
  "home",
];
const prompts = [
  "What time do you get up?",
  "When do you leave home?",
  "How do you get to school or work?",
  "What do you do for breakfast?",
  "Who do you have lunch with?",
  "What do you do after work?",
];
// Reference content is deliberately a preview until the editorial gates are passed.
export const baselineLesson: BaselineLesson = {
  id: "lesson-001",
  slug: "my-daily-routine",
  title: "My Daily Routine",
  description: "Kể về một ngày của bạn, từ buổi sáng đến lúc về nhà.",
  topic: "everyday",
  week: 1,
  revision: 1,
  segments: upgradeExamples.map((versions, i) => ({
    id: `routine-${i + 1}`,
    scene: scenes[i],
    prompt: prompts[i],
    basic: { en: versions[0], vi: translations[i][0] },
    better: { en: versions[1], vi: translations[i][1] },
    natural: { en: versions[2], vi: translations[i][2] },
  })),
};
export const wisdomPreview: BaselineLesson = {
  id: "aw-001",
  slug: "listen-before-you-answer",
  title: "Listen before you answer",
  description: "Bình tĩnh hỏi để hiểu khi đồng nghiệp chưa đồng ý.",
  topic: "communication",
  week: 14,
  revision: 1,
  wisdom: {
    ideaEn: "You don't have to answer right away. Listen first.",
    ideaVi: "Bạn không nhất thiết phải trả lời ngay. Hãy lắng nghe trước.",
    situation:
      "Đồng nghiệp thấy đề xuất giao diện của bạn chưa rõ ràng. Bạn muốn hiểu thêm trước khi giải thích.",
    dialogue: [
      {
        role: "Coworker",
        en: "I don't think this screen is clear.",
        vi: "Tôi thấy màn hình này chưa rõ ràng.",
      },
      {
        role: "You",
        en: "I see. Can you tell me what is not clear?",
        vi: "Tôi hiểu. Bạn có thể nói rõ chỗ nào chưa rõ không?",
      },
      {
        role: "Coworker",
        en: "The next step is hard to find.",
        vi: "Khó tìm thấy bước tiếp theo.",
      },
      {
        role: "You",
        en: "Thanks. Let's look at it together.",
        vi: "Cảm ơn. Chúng ta cùng xem lại nhé.",
      },
    ],
    chapter: "Chưa xác định — chờ người biên tập đối chiếu",
    textSource: "",
    academicSource: "",
    interpretation:
      "Diễn giải/ứng dụng hiện đại theo chủ đề; không phải trích dẫn hoặc bản dịch trực tiếp của Lão Tử.",
  },
  segments: [
    {
      id: "listen-first",
      scene: "office",
      prompt: "Your coworker says the screen is not clear. What would you say?",
      basic: {
        en: "I see. Can you tell me what is not clear?",
        vi: "Tôi hiểu. Bạn có thể nói rõ chỗ nào chưa rõ không?",
      },
      better: {
        en: "I see. Can you show me which part is not clear?",
        vi: "Tôi hiểu. Bạn có thể chỉ cho tôi phần nào chưa rõ không?",
      },
      natural: {
        en: "I see what you mean. Let's take a look together.",
        vi: "Tôi hiểu ý bạn. Chúng ta cùng xem lại nhé.",
      },
    },
  ],
};
export const previewLessons = [baselineLesson, wisdomPreview];
export function cardId(lesson: BaselineLesson, segment: LessonSegment) {
  return `${lesson.id}:r${lesson.revision}:${segment.id}`;
}
