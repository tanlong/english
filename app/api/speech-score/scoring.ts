const SMALL_NUMBERS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty"];

function numberToWords(value: number) {
  if (value < 20) return SMALL_NUMBERS[value];
  const tens = TENS[Math.floor(value / 10)];
  const ones = value % 10;
  return ones ? `${tens} ${SMALL_NUMBERS[ones]}` : tens;
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/(\d{1,2}):(\d{2})/g, (_, hours: string, minutes: string) => {
      const minuteValue = Number(minutes);
      return `${numberToWords(Number(hours))}${minuteValue ? ` ${numberToWords(minuteValue)}` : ""}`;
    })
    .replace(/([a-z])(\d+)/g, (_, letter: string, digits: string) => `${letter} ${numberToWords(Number(digits))}`)
    .replace(/\b\d+\b/g, (digits) => {
      const value = Number(digits);
      return value < 60 ? numberToWords(value) : digits;
    })
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function editDistance(left: string[], right: string[]) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = left[row - 1] === right[column - 1]
        ? previous[column - 1]
        : 1 + Math.min(previous[column - 1], previous[column], current[column - 1]);
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function missingWords(target: string[], transcript: string[]) {
  const available = new Map<string, number>();
  transcript.forEach((word) => available.set(word, (available.get(word) ?? 0) + 1));
  return target.filter((word) => {
    const count = available.get(word) ?? 0;
    if (count > 0) {
      available.set(word, count - 1);
      return false;
    }
    return true;
  });
}

export function scoreTranscript(target: string, transcript: string) {
  const targetWords = normalize(target).split(" ").filter(Boolean);
  const transcriptWords = normalize(transcript).split(" ").filter(Boolean);
  const denominator = Math.max(targetWords.length, transcriptWords.length, 1);
  const score = Math.max(0, Math.round(100 * (1 - editDistance(targetWords, transcriptWords) / denominator)));
  const feedback = score >= 90
    ? "Rất sát câu mẫu! Thử nói lại với nhịp tự nhiên hơn."
    : score >= 70
      ? "Khá tốt. Nghe lại phần còn thiếu rồi thử thêm một lần."
      : "Nghe mẫu, chia câu thành cụm ngắn rồi thử lại nhé.";

  return { score, missingWords: missingWords(targetWords, transcriptWords), feedback };
}

if (scoreTranscript("I get up at 5:40.", "I get up at five forty").score !== 100) {
  throw new Error("Speech scoring self-check failed.");
}
