import { curriculum, roleScenarios, communicationScenes, type Role } from "./curriculum.ts";
export type PracticeLesson = {
  id: string;
  title: string;
  situation: string;
  goal: string;
  followup: string;
  lines: { speaker: string; en: string; vi: string }[];
  question: string;
  choices: string[];
  correct: number;
  target: string;
  targetVi: string;
  grammar: { en: string; vi: string };
  principle: string;
  transfer: string;
  writing: string;
  chunks: string[];
  art: "morning" | "school" | "breakfast" | "office" | "home";
  communication: (typeof communicationScenes)[number];
};
const mornings = [
  {
    title: "A fresh start",
    grammar: {
      en: "I usually get up early. I get breakfast on the way to work.",
      vi: "Tôi thường dậy sớm. Tôi mua đồ ăn sáng trên đường đi làm.",
    },
    situation: "Hai đồng nghiệp kể về buổi sáng trước giờ làm.",
    goal: "Kể ngắn gọn buổi sáng của bạn và hỏi thăm buổi sáng của người kia.",
    followup: "What would you like to know about my morning?",
    en: [
      "What do you do before work?",
      "I usually get up early and grab breakfast on my way to work.",
    ],
    vi: [
      "Bạn làm gì trước khi đi làm?",
      "Tôi thường dậy sớm rồi ghé mua đồ ăn sáng trên đường đi làm.",
    ],
    choices: ["Mua đồ ăn sáng trên đường đi làm", "Ăn sáng sau giờ làm", "Không ăn sáng"],
    target: "I grab breakfast on my way to work.",
    targetVi: "Tôi ghé mua đồ ăn sáng trên đường đi làm.",
    transfer: "What changes in your routine on weekends?",
    chunks: ["usually get up", "grab breakfast", "on my way to work"],
    art: "morning",
  },
  {
    title: "Getting ready together",
    situation: "Một người bố kể về việc chuẩn bị cho con vào buổi sáng.",
    goal: "Kể cách bạn chuẩn bị đi làm hoặc đi học, kể cả khi sống một mình.",
    followup: "What helps you get ready on a busy morning?",
    en: [
      "Do you pack your son's bag in the morning?",
      "No, I pack it the night before. In the morning, I help him get dressed.",
    ],
    vi: [
      "Bạn chuẩn bị cặp cho con vào buổi sáng à?",
      "Không, tôi chuẩn bị tối hôm trước. Buổi sáng, tôi giúp con mặc quần áo.",
    ],
    choices: ["Chuẩn bị cặp từ tối hôm trước", "Chuẩn bị cặp trên xe", "Chuẩn bị cặp tại trường"],
    target: "I pack his bag the night before.",
    targetVi: "Tôi chuẩn bị cặp cho con từ tối hôm trước.",
    transfer: "What would you do if you woke up late?",
    chunks: ["the night before", "get dressed", "help him"],
    art: "morning",
  },
  {
    title: "The school run",
    situation: "Hai người trao đổi cách đưa con đến trường.",
    goal: "Nói cách bạn đi làm hoặc đưa người thân đi học, rồi hỏi lại người kia.",
    followup: "What would you like to ask me about my commute?",
    en: [
      "Who takes your son to school?",
      "I usually drop him off on my motorcycle. My wife takes him when I'm busy.",
    ],
    vi: [
      "Ai đưa con trai bạn đến trường?",
      "Tôi thường đưa con đi bằng xe máy. Vợ tôi đưa con khi tôi bận.",
    ],
    choices: ["Vợ đưa con khi người bố bận", "Con luôn tự đi bộ", "Đồng nghiệp đưa con"],
    target: "I usually drop my son off at school.",
    targetVi: "Tôi thường đưa con trai đến trường.",
    transfer: "How would you get to work if your motorcycle broke down?",
    chunks: ["drop him off", "when I'm busy", "takes him"],
    art: "school",
  },
  {
    title: "Breakfast on the go",
    situation: "Đồng nghiệp rủ nhau ăn sáng trước giờ làm.",
    goal: "Rủ đi ăn sáng và chọn phương án khác khi món bạn muốn đã hết.",
    followup: "Where would you like to go for breakfast together?",
    en: [
      "Do you have time for breakfast?",
      "Just a few minutes. Let's grab something on the way to the office.",
    ],
    vi: [
      "Bạn có thời gian ăn sáng không?",
      "Chỉ vài phút thôi. Mình mua gì đó trên đường đến văn phòng nhé.",
    ],
    choices: ["Mua nhanh đồ ăn trên đường", "Dành cả buổi sáng nấu ăn", "Đợi đến tối mới ăn"],
    target: "Let's grab something on the way to the office.",
    targetVi: "Mình ghé mua gì đó trên đường đến văn phòng nhé.",
    transfer: "What would you order if the café was out of your favorite food?",
    chunks: ["a few minutes", "grab something", "on the way to"],
    art: "breakfast",
  },
  {
    title: "Before the workday",
    situation: "Một đồng nghiệp mới hỏi về đầu ngày làm việc.",
    goal: "Kể việc đầu tiên bạn làm tại chỗ làm và bắt chuyện với đồng nghiệp mới.",
    followup: "What would you ask a new coworker to help them feel welcome?",
    en: [
      "What do you do when you get to the office?",
      "I clock in and get some coffee. Then I check what I need to do first.",
    ],
    vi: [
      "Bạn làm gì khi đến văn phòng?",
      "Tôi chấm công và mua cà phê. Sau đó tôi xem việc nào cần làm trước.",
    ],
    choices: [
      "Chấm công, uống cà phê rồi xem công việc",
      "Về nhà ngay",
      "Đi ăn trưa trước khi chấm công",
    ],
    target: "I check what I need to do first.",
    targetVi: "Tôi xem việc nào cần làm trước.",
    transfer: "How would you welcome a new coworker on their first day?",
    chunks: ["clock in", "get some coffee", "need to do first"],
    art: "office",
  },
  {
    title: "A change of plan",
    situation: "Một ngày có thay đổi; nghe và xác định thứ tự hành động.",
    goal: "Giải thích một thay đổi trong kế hoạch và thống nhất việc làm tiếp theo.",
    followup: "What would you say if we needed to change our plans today?",
    en: [
      "Are you heading straight home today?",
      "Not today. I need to pick up my son first. Then we'll get dinner on the way home.",
    ],
    vi: [
      "Hôm nay bạn về thẳng nhà à?",
      "Hôm nay thì không. Tôi cần đón con trước. Sau đó chúng tôi mua đồ ăn tối trên đường về.",
    ],
    choices: ["Đón con rồi mua đồ ăn tối", "Mua đồ ăn rồi đi làm", "Về nhà trước rồi mới đón con"],
    target: "I need to pick up my son first.",
    targetVi: "Tôi cần đón con trai trước.",
    transfer: "Tell me about a day when your usual routine changed.",
    chunks: ["pick up", "on the way home", "heading straight home"],
    art: "home",
  },
] as const;
export function getPracticeLesson(
  week: number,
  day: number,
  role: Role,
  learnerName = "Bạn",
): PracticeLesson {
  const module = curriculum[week - 1] ?? curriculum[0];
  const communication = communicationScenes[module.month - 1];
  const id = `w${module.week}-d${day}-${role}-v1`;
  if (week === 1) {
    const m = mornings[day - 1] ?? mornings[0];
    return {
      id,
      title: m.title,
      principle: module.principle,
      situation: m.situation,
      goal: m.goal,
      followup: m.followup,
      lines: m.en.map((en, i) => ({
        speaker: i === 0 ? "Bạn hội thoại" : learnerName,
        en,
        vi: m.vi[i],
      })),
      question: "Ý nào đúng với điều bạn vừa nghe?",
      choices: [...m.choices],
      correct: 0,
      target: m.target,
      targetVi: m.targetVi,
      grammar: "grammar" in m ? m.grammar : { en: m.en[1], vi: m.vi[1] },
      transfer: m.transfer,
      writing: "Viết 1–3 câu kể buổi sáng thực tế của bạn. Dùng một cụm vừa học.",
      chunks: [...m.chunks],
      art: m.art,
      communication,
    };
  }
  const scenario = roleScenarios[role];
  const work = module.workplace && role !== "general";
  const lines = work ? [scenario.opening, scenario.model] : [module.opening, module.reply];
  const [target, targetVi] = work ? scenario.short : module.short;
  const choices = [
    lines[1],
    work
      ? "Everything is finished, and there is nothing left to discuss."
      : "I'm sorry, I can't talk about that right now.",
    "Let's talk about something else instead.",
  ];
  const shift = (week + day) % 3;
  const rotated = [...choices.slice(shift), ...choices.slice(0, shift)];
  return {
    id,
    title: work ? scenario.title : module.title,
    principle: module.principle,
    situation: work
      ? `Tình huống luyện tập trong đội IT ngân hàng giả định. ${scenario.goal}`
      : `Hội thoại luyện tập chủ đề ${module.vi.toLocaleLowerCase("vi")}.`,
    goal: work
      ? scenario.goal
      : `Trao đổi về ${module.vi.toLocaleLowerCase("vi")} bằng thông tin của bạn và hỏi tiếp một câu.`,
    followup: work
      ? "What would you ask to agree on the next step?"
      : "What would you like to ask me about this?",
    lines: lines.map((en, i) => ({
      speaker: i === 0 ? "Bạn hội thoại" : learnerName,
      en,
      vi: (work ? scenario.meanings : module.meanings)[i],
    })),
    question: "Người thứ hai đã phản hồi thế nào?",
    choices: rotated,
    correct: rotated.indexOf(lines[1]),
    target,
    targetVi,
    grammar: { en: lines[1], vi: (work ? scenario.meanings : module.meanings)[1] },
    transfer: work ? (day % 2 ? scenario.followup : scenario.alternative) : module.followup,
    writing: `Viết 1–3 câu về ${module.vi.toLocaleLowerCase("vi")}. Thêm một chi tiết của riêng bạn.`,
    chunks: work
      ? scenario.chunks
      : [
          target.replace(/[.!?]+$/, ""),
          module.followup.split(" ").slice(0, 4).join(" "),
          "Could you tell me more?",
        ],
    art: work ? "office" : week <= 4 ? "home" : week <= 8 ? "breakfast" : "office",
    communication,
  };
}
