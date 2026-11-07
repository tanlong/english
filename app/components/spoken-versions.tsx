import { AudioButton } from "./audio-button";
import { Button } from "./ui/button";
import { Volume2 } from "lucide-react";
import type { SpokenVersions as Versions } from "../speaking/feedback";
import type { TtsRequest } from "../audio/client";

function BilingualText({ en, vi, translation }: { en: string; vi: string; translation: boolean }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="mt-1 text-xs font-bold text-primary">
          EN
        </span>
        <p
          lang="en"
          className="m-0 min-w-0 text-base font-medium leading-relaxed wrap-anywhere text-foreground"
        >
          {en}
        </p>
      </div>
      {translation && (
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="mt-1 text-xs font-bold text-muted-foreground">
            VI
          </span>
          <p
            lang="vi"
            className="m-0 min-w-0 text-sm leading-relaxed wrap-anywhere text-muted-foreground"
          >
            {vi}
          </p>
        </div>
      )}
    </div>
  );
}

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
    <div className="spoken-versions my-4 grid min-w-0 gap-4">
      {(["short", "full"] as const).map((key) => {
        const label = key === "short" ? "Bản ngắn gọn" : "Bản đầy đủ";
        const { en, vi } = versions[key];
        return (
          <section
            key={key}
            aria-label={label}
            className="min-w-0 rounded-xl border border-border bg-background p-4"
          >
            <h4 className="mb-3 text-sm font-semibold text-foreground">{label}</h4>
            <BilingualText en={en} vi={vi} translation={translation} />
            <div className="mt-4">
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
          </section>
        );
      })}
      <details className="border-t border-border pt-2">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-foreground">
          Xem bản đúng ngữ pháp
        </summary>
        <p className="helper mb-4">
          Hai bản hội thoại phía trên cũng đúng ngữ pháp. Bản này giữ cách diễn đạt ban đầu và chỉ
          sửa lỗi khi cần.
        </p>
        <section
          aria-label="Bản đúng ngữ pháp"
          className="min-w-0 rounded-xl border border-border bg-background p-4"
        >
          <h4 className="mb-3 text-sm font-semibold text-foreground">Bản đúng ngữ pháp</h4>
          <BilingualText en={grammar.en} vi={grammar.vi} translation={translation} />
          <div className="mt-4">
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
          </div>
        </section>
      </details>
    </div>
  );
}
