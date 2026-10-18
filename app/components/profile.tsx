"use client";
import { Checkbox } from "./ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Card } from "@/app/components/ui/card";
import { useState } from "react";
import { ArrowRight, Download, ShieldCheck, X } from "lucide-react";
import { roles, type Role } from "../content/curriculum";
import { dateKey, type Profile } from "../learning/progress";
import type { LearningStore } from "../learning/use-learning";
import { downloadFile } from "@/lib/download";
import { stopAudio } from "../audio/client";
import { Artwork } from "./artwork";
import { Logo } from "./logo";
import { PageHeading } from "./page-heading";
import { ComboboxField } from "./select-combobox";
import { PersonalizationPanel } from "./personalization-panel";
const goalOptions = [
  { value: "both", label: "Đời sống & công việc" },
  { value: "everyday", label: "Ưu tiên đời sống" },
  { value: "workplace", label: "Ưu tiên công việc" },
];
const confidenceOptions = [
  { value: "new", label: "Mình muốn bắt đầu từ nền tảng" },
  { value: "some", label: "Biết một ít, muốn nghe và nói tốt hơn" },
  { value: "comfortable", label: "Khá tự tin, muốn ứng biến tự nhiên" },
];
const roleOptions = roles.map(({ id, label }) => ({ value: id, label }));
export function ProfileForm({
  initial,
  onSave,
  buttonLabel,
}: {
  initial?: Profile;
  onSave: (p: Profile) => void;
  buttonLabel: string;
}) {
  const [profile, setProfile] = useState<Profile>(
    initial ?? {
      name: "Bạn",
      role: "general",
      goal: "both",
      confidence: "new",
      largeText: false,
      mic: false,
    },
  );
  return (
    <form
      className="profile-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...profile, name: profile.name.trim() || "Bạn" });
      }}
    >
      <label className="field">
        Mình nên gọi bạn là gì?
        <Input
          required
          maxLength={60}
          value={profile.name}
          autoComplete="given-name"
          onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
        />
      </label>
      <ComboboxField
        id="profile-role"
        label="Vai trò / ngữ cảnh công việc"
        options={roleOptions}
        value={profile.role}
        onValueChange={(role) => setProfile((p) => ({ ...p, role: role as Role }))}
      />
      <ComboboxField
        id="profile-goal"
        label="Bạn muốn dùng tiếng Anh ở đâu?"
        options={goalOptions}
        value={profile.goal}
        onValueChange={(goal) => setProfile((p) => ({ ...p, goal: goal as Profile["goal"] }))}
      />
      <ComboboxField
        id="profile-confidence"
        label="Mức tự tin hiện tại"
        options={confidenceOptions}
        value={profile.confidence}
        onValueChange={(confidence) =>
          setProfile((p) => ({ ...p, confidence: confidence as Profile["confidence"] }))
        }
        hint="Chọn mức gần nhất với cảm nhận của bạn."
      />
      <label className="check-field">
        <Checkbox
          checked={profile.mic}
          onCheckedChange={(checked) => setProfile((p) => ({ ...p, mic: checked }))}
        />
        Ưu tiên luyện nói với micro (xin quyền khi sử dụng)
      </label>
      <label className="check-field">
        <Checkbox
          checked={profile.largeText}
          onCheckedChange={(checked) => setProfile((p) => ({ ...p, largeText: checked }))}
        />
        Chữ lớn, dễ đọc hơn
      </label>
      <Button type="submit" variant="default">
        {buttonLabel}
        <ArrowRight aria-hidden="true" size={18} />
      </Button>
    </form>
  );
}
export function Onboarding({
  store,
  onComplete,
}: {
  store: LearningStore;
  onComplete: () => void;
}) {
  return (
    <main className="onboarding">
      <div className="onboarding-art">
        <Artwork scene="office" priority />
        <div className="onboarding-art-copy">
          <Logo />
          <span className="eyebrow">A LITTLE EVERY DAY. A LOT MORE CONFIDENCE.</span>
          <h1>
            Tiếng Anh cho
            <br />
            cuộc sống của bạn.
          </h1>
          <p>
            Nhìn tình huống. Nghe để hiểu.
            <br />
            Nói bằng lời của mình.
          </p>
          <span className="onboarding-facts">3 bước · khoảng 12 phút · đời sống & công việc</span>
        </div>
      </div>
      <div className="onboarding-content">
        <div>
          <Badge>BẮT ĐẦU TỪ ĐÂY</Badge>
          <h2>Sẵn sàng cho buổi học đầu tiên?</h2>
          <p>Chọn ngữ cảnh để bài luyện gần với những cuộc trò chuyện bạn cần.</p>
          <ProfileForm
            buttonLabel="Vào không gian học"
            onSave={(p) => {
              store.saveProfile(p);
              onComplete();
            }}
          />
          <Button
            onClick={() => {
              store.saveProfile({
                name: "Bạn",
                role: "general",
                goal: "both",
                confidence: "new",
                largeText: false,
                mic: false,
              });
              onComplete();
            }}
            variant="link"
          >
            Bắt đầu nhanh, thiết lập sau
          </Button>
          <p className="helper">
            Lưu trong trình duyệt và database của ứng dụng, không cần tài khoản. Bộ đề đánh giá đầu
            vào độc lập đang chờ biên tập; chưa gán trình độ từ lựa chọn này.
          </p>
          {store.storageError && (
            <p role="alert" className="field-error">
              {store.storageError}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
export function SettingsPanel({ store }: { store: LearningStore }) {
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  function exportData() {
    downloadFile(
      JSON.stringify({ ...store.state, personalization: store.personalization }, null, 2),
      `natural-english-${dateKey()}.json`,
    );
  }
  return (
    <>
      <PageHeading
        eyebrow="HỒ SƠ & TÙY CHỌN"
        title="Cài đặt không gian học"
        text="Điều chỉnh ngữ cảnh, cách học và dữ liệu của bạn trên thiết bị này."
      />
      <div className="settings-grid">
        <Card className="settings-panel" render={<section />}>
          <h2>Hồ sơ học tập</h2>
          <ProfileForm
            initial={store.state.profile!}
            buttonLabel="Lưu thay đổi"
            onSave={(p) => {
              store.saveProfile(p);
              setSaved(true);
            }}
          />
          {saved && (
            <p className="feedback positive" role="status">
              Đã lưu hồ sơ và tùy chọn học tập.
            </p>
          )}
        </Card>
        <div>
          <PersonalizationPanel store={store} />
          <Card className="settings-panel" render={<section />}>
            <span className="feature-icon blue">
              <ShieldCheck aria-hidden="true" size={22} />
            </span>
            <h2>Dữ liệu thuộc về bạn</h2>
            <p>
              Hồ sơ, kết quả học và bộ nhớ được lưu vào database của ứng dụng, gắn với trình duyệt
              này. Tiến độ cũng được giữ trong trình duyệt để dùng khi mất kết nối. Chưa có đồng bộ
              tài khoản giữa các thiết bị.
            </p>
            <p>
              Bản ghi âm chỉ tồn tại trong phiên luyện, được xóa khi rời chặng. Chỉ gửi đến OpenAI
              khi bạn đồng ý nhận diện lời nói. Ứng dụng không lưu lại bản ghi âm.
            </p>
            <Button onClick={exportData} variant="outline">
              <Download aria-hidden="true" size={18} />
              Xuất bản sao tiến độ
            </Button>
            {store.recoveryData && (
              <Button
                onClick={() => {
                  downloadFile(store.recoveryData!, "natural-english-recovery.txt", "text/plain");
                }}
                variant="link"
              >
                Tải bản sao dữ liệu chưa đọc được
              </Button>
            )}
          </Card>
          <Card className="settings-panel" render={<section />}>
            <h2>Bắt đầu lại trên thiết bị</h2>
            <p>
              Xóa hồ sơ, bài viết, tiến độ, bộ nhớ và câu mẫu riêng của trình duyệt này trong ứng
              dụng. Các tài liệu và nội dung nguồn vẫn được giữ.
            </p>
            {!confirmReset ? (
              <Button onClick={() => setConfirmReset(true)} variant="destructive">
                Xóa dữ liệu học tập…
              </Button>
            ) : (
              <div className="feedback">
                <p>
                  Xác nhận xóa dữ liệu học, bộ nhớ và câu mẫu của trình duyệt này trong cả database
                  và trình duyệt? Hãy xuất bản sao trước nếu cần giữ lại.
                </p>
                <div className="button-row">
                  <Button
                    onClick={async () => {
                      stopAudio();
                      try {
                        await store.resetLearning();
                      } catch {
                        /* The shared sync error remains visible. */
                      }
                    }}
                    variant="destructive"
                  >
                    Xóa toàn bộ dữ liệu v2
                  </Button>
                  <Button onClick={() => setConfirmReset(false)} variant="outline">
                    <X aria-hidden="true" size={16} />
                    Hủy
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
