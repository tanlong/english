import { AudioButton } from "./audio-button";
import { Button } from "./ui/button";
import { Volume2 } from "lucide-react";
import type { SpokenVersions as Versions } from "../speaking/feedback";
import type { TtsRequest } from "../audio/client";

export function SpokenVersions({
  versions,
  translation = true,
  voice = "nova",
  onSpeak,
  disabled = false,
}: {
  versions: Versions;
  translation?: boolean;
  voice?: TtsRequest["voice"];
  onSpeak?: (text: string) => void;
  disabled?: boolean;
}) {
  const grammar = versions.grammar ?? versions.full;
  return (
    <div className="spoken-versions my-4 grid min-w-0 gap-5">
      {(["short", "full"] as const).map((key) => {
        const label = key === "short" ? "Bản ngắn gọn" : "Bản đầy đủ";
        const { en, vi } = versions[key];
        return (
          <div key={key} className="min-w-0">
            <table className="w-full table-fixed text-base leading-relaxed">
              <caption className="mb-2 text-left font-semibold text-foreground">{label}</caption>
              <thead>
                <tr>
                  <th scope="col">Cách nói</th>
                  {translation && <th scope="col">Nghĩa tiếng Việt</th>}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td lang="en" className="align-top wrap-anywhere">
                    {en}
                  </td>
                  {translation && (
                    <td lang="vi" className="align-top wrap-anywhere text-muted-foreground">
                      {vi}
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
            {onSpeak ? (
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={() => onSpeak(en)}
              >
                <Volume2 aria-hidden="true" size={18} /> Nghe {label.toLocaleLowerCase("vi")}
              </Button>
            ) : (
              <AudioButton
                text={en}
                voice={voice}
                label={`Nghe ${label.toLocaleLowerCase("vi")}`}
                variant="outline"
                disabled={disabled}
              />
            )}
          </div>
        );
      })}
      <details className="model-answer">
        <summary className="min-h-11 cursor-pointer py-3">Xem bản đúng ngữ pháp</summary>
        <p className="helper">
          Hai bản hội thoại phía trên cũng đúng ngữ pháp. Bản này giữ cách diễn đạt ban đầu và chỉ
          sửa lỗi khi cần.
        </p>
        <table className="w-full table-fixed text-base leading-relaxed">
          <caption className="mb-2 text-left font-semibold text-foreground">
            Bản đúng ngữ pháp
          </caption>
          <thead>
            <tr>
              <th scope="col">Câu đúng ngữ pháp</th>
              {translation && <th scope="col">Nghĩa tiếng Việt</th>}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td lang="en" className="align-top wrap-anywhere">
                {grammar.en}
              </td>
              {translation && (
                <td lang="vi" className="align-top wrap-anywhere text-muted-foreground">
                  {grammar.vi}
                </td>
              )}
            </tr>
          </tbody>
        </table>
        {onSpeak ? (
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => onSpeak(grammar.en)}
          >
            <Volume2 aria-hidden="true" size={18} />
            Nghe bản đúng ngữ pháp
          </Button>
        ) : (
          <AudioButton
            text={grammar.en}
            voice={voice}
            label="Nghe bản đúng ngữ pháp"
            variant="outline"
            disabled={disabled}
          />
        )}
      </details>
    </div>
  );
}
