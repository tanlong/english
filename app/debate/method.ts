export const stanceLabels = {
  undecided: "Chọn sau",
  agree: "Đồng ý",
  disagree: "Không đồng ý",
  partly_agree: "Đồng ý một phần",
} as const;
export type DebateStance = keyof typeof stanceLabels;
export function isDebateStance(value: unknown): value is DebateStance {
  return typeof value === "string" && Object.hasOwn(stanceLabels, value);
}

export const precSteps = [
  { key: "P", name: "Point", label: "Quan điểm", starter: "I think ", meaning: "Tôi nghĩ rằng…" },
  { key: "R", name: "Reason", label: "Lý do", starter: "Because ", meaning: "Bởi vì…" },
  { key: "E", name: "Example", label: "Ví dụ", starter: "For example, ", meaning: "Ví dụ như…" },
  {
    key: "C",
    name: "Conclusion",
    label: "Kết luận",
    starter: "That's why I think ",
    meaning: "Đó là lý do tôi nghĩ…",
  },
] as const;

export const debatePhrases: Record<string, string> = {
  "I think": "Tôi nghĩ…",
  "I agree with you": "Tôi đồng ý với bạn.",
  "I don't think so": "Tôi không nghĩ vậy.",
  "I see your point, but": "Tôi hiểu ý bạn, nhưng…",
  "What I mean is": "Ý tôi là…",
  "The main reason is": "Lý do chính là…",
  "For example": "Ví dụ…",
  "On the other hand": "Mặt khác…",
  "Why do you think so": "Tại sao bạn nghĩ vậy?",
  "So, I believe": "Vì vậy, tôi tin rằng…",
  "That's why I think": "Đó là lý do tôi nghĩ…",
  "I understand your point, but I think": "Tôi hiểu ý bạn, nhưng tôi nghĩ…",
};

export const practiceTopics = [
  {
    id: "online-learning",
    label: "Học online tốt hơn học trên lớp",
    content:
      "Is online learning better than learning at school? Some students like online learning because they can study at home and save travel time. Others prefer learning at school because they can talk to teachers directly. For example, they can ask for help right away when they do not understand something. Both choices may suit different learners.",
  },
  {
    id: "school-phones",
    label: "Học sinh nên được dùng điện thoại ở trường",
    content:
      "Should students use phones at school? Phones can help students look up new words or find information for a lesson. Some students may also use phones to play games during class. One possible rule is to allow phones only when the teacher asks students to use them for learning. Students can discuss whether this rule is fair and useful.",
  },
  {
    id: "everyday-ai",
    label: "AI giúp cuộc sống tốt hơn",
    content:
      "Does AI make everyday life better? People can use AI to draft a message or practice English. For example, a learner can ask AI for a short conversation and then check the words. AI answers can contain mistakes, so people still need to check important information. We can discuss when AI is helpful and when we should ask another person for help.",
  },
  {
    id: "money",
    label: "Tiền là điều quan trọng nhất",
    content:
      "Is money the most important thing in life? Money helps people pay for food, a home, and education. Some people put money first because they want to feel safe. Others believe health, family, and free time matter more. For example, a person might choose a job with less pay to spend more time with family. Different people may choose different priorities.",
  },
] as const;
