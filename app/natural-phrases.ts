export const naturalPhraseTranslations: Record<string, string> = {
  "usually get up around": "thường thức dậy vào khoảng",
  "stop to get some breakfast": "ghé mua đồ ăn sáng",
  "most of my job involves": "phần lớn công việc của tôi liên quan đến",
  "once he’s taken a shower": "sau khi con đã tắm xong",
  "one of my favorite times": "một trong những khoảng thời gian tôi thích nhất",
  "once he’s gotten dressed": "sau khi con đã mặc quần áo xong",
  "about five kilometers from home": "cách nhà khoảng năm ki-lô-mét",
  "design screens and user flows": "thiết kế giao diện và luồng người dùng",
  "once we’re ready": "khi chúng tôi đã sẵn sàng",
  "after dropping him off": "sau khi đưa con đến nơi",
  "on the way to work": "trên đường đi làm",
  "on my way to work": "trên đường tôi đi làm",
  "back at my desk by": "quay lại bàn làm việc trước hoặc vào lúc",
  "do my morning routine": "làm các việc buổi sáng thường lệ",
  "take a quick shower": "tắm nhanh",
  "take the elevator": "đi thang máy",
  "grab his school bag": "lấy cặp của con",
  "park my motorcycle": "gửi xe máy",
  "pack his bag": "chuẩn bị cặp cho con",
  "the night before": "từ tối hôm trước",
  "drop my son off": "đưa con đến nơi",
  "drop him off": "đưa con đến nơi",
  "dropping him off": "việc đưa con đến nơi",
  "take him to school": "đưa con đến trường",
  "arrive at the office": "đến công ty",
  "head back down": "đi xuống lại",
  "head down": "đi xuống",
  "relax for a bit": "thư giãn một chút",
  "work as a ba": "làm công việc BA",
  "my job involves": "công việc của tôi liên quan đến",
  "take a lunch break": "nghỉ ăn trưa",
  "have lunch with": "ăn trưa cùng",
  "sit around and chat": "ngồi nói chuyện phiếm",
  "wrap things up": "hoàn tất mọi việc",
  "get some breakfast": "mua hoặc ăn sáng",
  "stop for breakfast": "ghé ăn sáng",
  "have breakfast and coffee": "ăn sáng và uống cà phê",
  "boil some water": "đun một ít nước",
  "wash my face": "rửa mặt",
  "brush my teeth": "đánh răng",
  "manage a team": "quản lý một nhóm",
  "with my coworkers": "cùng đồng nghiệp",
  "before work starts": "trước khi công việc bắt đầu",
  "typical workday": "ngày làm việc điển hình",
  "first grade": "lớp một",
  "gotten dressed": "đã mặc quần áo xong",
  "usually have": "thường ăn hoặc dùng",
  "for a while": "trong một lúc",
  "pretty much": "gần như, về cơ bản",
  "finish work": "tan làm hoặc làm xong",
  "work until": "làm việc đến",
  "from there": "từ đó",
  "get up": "thức dậy, ra khỏi giường",
  "wake up": "thức dậy hoặc đánh thức",
  "head out": "bắt đầu đi, rời đi",
  "clock in": "chấm công",
  "head home": "về nhà",
  "go home": "về nhà",
};

const escapedPhrases = Object.keys(naturalPhraseTranslations)
  .sort((a, b) => b.length - a.length)
  .map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

export const naturalPhrasePattern = new RegExp(`(${escapedPhrases.join("|")})`, "gi");

const matrixCharacters = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function createMatrixFrame(target: string, revealed: number, random = Math.random) {
  return Array.from(target, (character, index) => {
    if (index < revealed || !/[\p{L}\p{N}]/u.test(character)) return character;
    return matrixCharacters[Math.floor(random() * matrixCharacters.length)];
  }).join("");
}
