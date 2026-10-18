import Image from "next/image";
import morning from "../../img/flashcard-wake-up-16x9.png";
import school from "../../img/flashcard-school-drop-off-16x9.png";
import breakfast from "../../img/flashcard-breakfast-16x9.png";
import office from "../../img/flashcard-work-as-ba-16x9.png";
import home from "../../img/flashcard-head-home-16x9.png";
const artwork = { morning, school, breakfast, office, home };
const descriptions = {
  morning: "Một người trưởng thành bắt đầu buổi sáng trong căn phòng tràn ánh nắng.",
  school: "Người bố đưa con đến trường.",
  breakfast: "Mua đồ ăn sáng trên đường đi làm.",
  office: "Một người trưởng thành làm việc tại văn phòng hiện đại.",
  home: "Người đi làm trên đường về nhà.",
};
export type Art = keyof typeof artwork;
export function Artwork({
  scene = "office",
  priority = false,
  className = "",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 70vw, 700px",
}: {
  scene?: Art;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  return (
    <Image
      className={`artwork ${className}`}
      src={artwork[scene]}
      alt={descriptions[scene]}
      sizes={sizes}
      priority={priority}
    />
  );
}
