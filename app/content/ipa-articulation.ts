export type TonguePose =
  | "rest"
  | "high-front"
  | "near-high-front"
  | "mid-front"
  | "low-front"
  | "low-back"
  | "mid-back"
  | "high-back"
  | "near-high-back"
  | "central"
  | "open-central"
  | "rhotic"
  | "dental"
  | "alveolar-seal"
  | "alveolar-gap"
  | "post-seal"
  | "post-gap"
  | "velar-seal"
  | "velar-gap"
  | "palatal";
export type LipShape = "relaxed" | "spread" | "open" | "rounded" | "closed" | "teeth-lip";
export type Airflow = "oral" | "nasal" | "pressure" | "lateral";
export type Contact = "lips" | "teeth-lip" | "alveolar" | "postalveolar" | "velar";
export type MouthFrame = {
  label: string;
  tongue: TonguePose;
  lips: LipShape;
  airflow: Airflow;
  contact?: Contact;
};
export type IpaArticulation = { voiced: boolean; frames: MouthFrame[] };

export const tongueLabels: Record<TonguePose, string> = {
  rest: "Lưỡi thả lỏng; vị trí sẽ thay đổi theo nguyên âm đi kèm",
  "high-front": "Thân lưỡi nâng cao về phía trước",
  "near-high-front": "Lưỡi phía trước, hạ nhẹ và thả lỏng hơn /i/",
  "mid-front": "Lưỡi phía trước, ở độ cao trung bình",
  "low-front": "Lưỡi thấp về phía trước, hàm mở rộng",
  "low-back": "Lưỡi thấp và lùi về phía sau",
  "mid-back": "Phần sau lưỡi nâng ở độ cao trung bình",
  "high-back": "Phần sau lưỡi nâng cao",
  "near-high-back": "Phần sau lưỡi nâng, thả lỏng hơn /u/",
  central: "Lưỡi thả lỏng ở vùng giữa miệng",
  "open-central": "Lưỡi hạ ở vùng giữa miệng, hàm mở vừa",
  rhotic: "Một cách tạo âm r: thân lưỡi nâng và co về sau, đầu lưỡi không chạm vòm",
  dental: "Đầu lưỡi ở giữa hai hàm răng",
  "alveolar-seal": "Đầu lưỡi chạm gờ lợi phía sau răng trên",
  "alveolar-gap": "Phần trước lưỡi ở gần gờ lợi, chừa khe hẹp",
  "post-seal": "Phần trước lưỡi chặn hơi ngay sau gờ lợi",
  "post-gap": "Phần trước lưỡi lùi sau gờ lợi, chừa khe hẹp",
  "velar-seal": "Phần sau lưỡi chạm ngạc mềm",
  "velar-gap": "Phần sau lưỡi hạ khỏi ngạc mềm để nhả hơi",
  palatal: "Thân lưỡi nâng gần ngạc cứng, không chặn kín hơi",
};
export const lipLabels: Record<LipShape, string> = {
  relaxed: "Môi thả lỏng",
  spread: "Môi hơi kéo ngang",
  open: "Mở hàm, môi thả lỏng",
  rounded: "Môi tròn",
  closed: "Hai môi khép kín",
  "teeth-lip": "Răng trên chạm nhẹ môi dưới",
};
export const airflowLabels: Record<Airflow, string> = {
  oral: "Hơi đi qua miệng",
  nasal: "Hơi đi qua mũi",
  pressure: "Hơi bị chặn ở điểm tiếp xúc",
  lateral: "Hơi đi qua hai bên lưỡi",
};

const vowel = (tongue: TonguePose, lips: LipShape): IpaArticulation => ({
  voiced: true,
  frames: [{ label: "Giữ âm", tongue, lips, airflow: "oral" }],
});
const glide = (start: IpaArticulation, end: IpaArticulation): IpaArticulation => ({
  voiced: true,
  frames: [
    { ...start.frames[0], label: "Bắt đầu" },
    { ...end.frames[0], label: "Kết thúc" },
  ],
});
const consonant = (
  voiced: boolean,
  tongue: TonguePose,
  lips: LipShape,
  airflow: Airflow = "oral",
  contact?: Contact,
): IpaArticulation => ({
  voiced,
  frames: [{ label: "Giữ âm", tongue, lips, airflow, ...(contact ? { contact } : {}) }],
});
const stop = (
  voiced: boolean,
  tongue: TonguePose,
  contact: Contact,
  release: TonguePose = "rest",
): IpaArticulation => ({
  voiced,
  frames: [
    {
      label: "Chặn hơi",
      tongue,
      lips: contact === "lips" ? "closed" : contact === "postalveolar" ? "rounded" : "relaxed",
      airflow: "pressure",
      contact,
    },
    {
      label: "Nhả hơi",
      tongue: release,
      lips: contact === "postalveolar" ? "rounded" : "relaxed",
      airflow: "oral",
    },
  ],
});
const highFront = vowel("high-front", "spread");
const nearFront = vowel("near-high-front", "relaxed");
const midFront = vowel("mid-front", "relaxed");
const lowFront = vowel("low-front", "open");
const lowBack = vowel("low-back", "open");
const midBack = vowel("mid-back", "rounded");
const highBack = vowel("high-back", "rounded");
const nearBack = vowel("near-high-back", "rounded");
const central = vowel("central", "relaxed");

// One schematic per teaching entry; paired consonants share place, not voicing.
// Primary reference: https://soundsofspeech.uiowa.edu/ (American English articulations).
export const ipaArticulations: Record<string, IpaArticulation> = {
  i: highFront,
  ih: nearFront,
  eh: midFront,
  ae: lowFront,
  ah: lowBack,
  aw: midBack,
  uh: nearBack,
  u: highBack,
  strut: vowel("open-central", "relaxed"),
  schwa: central,
  er: vowel("rhotic", "rounded"),
  "uk-lot": vowel("low-back", "rounded"),
  ay: glide(midFront, nearFront),
  eye: glide(lowFront, nearFront),
  oy: glide(midBack, nearFront),
  ow: glide(lowFront, nearBack),
  oh: glide(midBack, nearBack),
  "uk-near": glide(nearFront, central),
  "uk-square": glide(midFront, central),
  "uk-cure": glide(nearBack, central),
  p: stop(false, "rest", "lips"),
  b: stop(true, "rest", "lips"),
  t: stop(false, "alveolar-seal", "alveolar", "alveolar-gap"),
  d: stop(true, "alveolar-seal", "alveolar", "alveolar-gap"),
  k: stop(false, "velar-seal", "velar", "velar-gap"),
  g: stop(true, "velar-seal", "velar", "velar-gap"),
  f: consonant(false, "rest", "teeth-lip", "oral", "teeth-lip"),
  v: consonant(true, "rest", "teeth-lip", "oral", "teeth-lip"),
  th: consonant(false, "dental", "relaxed"),
  dh: consonant(true, "dental", "relaxed"),
  s: consonant(false, "alveolar-gap", "spread"),
  z: consonant(true, "alveolar-gap", "spread"),
  sh: consonant(false, "post-gap", "rounded"),
  zh: consonant(true, "post-gap", "rounded"),
  h: consonant(false, "rest", "relaxed"),
  ch: stop(false, "post-seal", "postalveolar", "post-gap"),
  j: stop(true, "post-seal", "postalveolar", "post-gap"),
  m: consonant(true, "rest", "closed", "nasal", "lips"),
  n: consonant(true, "alveolar-seal", "relaxed", "nasal", "alveolar"),
  ng: consonant(true, "velar-seal", "relaxed", "nasal", "velar"),
  l: consonant(true, "alveolar-seal", "relaxed", "lateral", "alveolar"),
  r: consonant(true, "rhotic", "rounded"),
  w: consonant(true, "high-back", "rounded"),
  y: consonant(true, "palatal", "spread"),
};
