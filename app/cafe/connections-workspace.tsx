"use client";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  AudioLines,
  Database,
  EyeOff,
  KeyRound,
  MessageCircle,
  Mic,
  ShieldCheck,
  Volume2,
  Activity,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { SelectCombobox } from "../components/select-combobox";
import { PageHeading } from "../components/page-heading";
import { cafeRequest } from "./client";
type Connection = {
  provider: string;
  model: string;
  status: string;
  enabled: boolean;
  maskedKey: string;
  dailyRequests: number;
  userDailyRequests: number;
  timeoutMs: number;
  maxOutputTokens: number;
  retryAt: string | null;
};
type AdminData = {
  role: string;
  models: { gemini: string[]; groq: string[] };
  entitled: boolean;
  connections: Connection[];
};
type Usage = {
  usage: { provider: string; subject: string; requests: number; day: string }[];
  audit: { id: string; action: string; provider: string; actor: string; createdAt: string }[];
};
const statusLabels: Record<string, string> = {
  not_configured: "Chưa kết nối",
  draft: "Chưa kiểm tra",
  testing: "Đang kiểm tra",
  healthy: "Đã kết nối",
  degraded: "Kết nối không ổn định",
  invalid: "Khóa không hợp lệ",
  rate_limited: "Đã chạm giới hạn provider",
  disabled: "Đã tắt",
};
const subscribePlatform = () => () => {};
const noPlatform = () => false;

function ModelField({ models }: { models: readonly string[] }) {
  const [model, setModel] = useState(models[0] ?? "");
  return (
    <label>
      Model
      <SelectCombobox
        id="connection-model"
        name="model"
        label="Model"
        options={models.map((value) => ({ value, label: value }))}
        value={model}
        onValueChange={setModel}
      />
    </label>
  );
}

export function ConnectionsWorkspace() {
  const [token, setToken] = useState("");
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [configure, setConfigure] = useState<"gemini" | "groq" | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [capability, setCapability] = useState<{ textAi: boolean } | null>(null);
  const [remove, setRemove] = useState<string | null>(null);
  const speech = useSyncExternalStore(
    subscribePlatform,
    () => "speechSynthesis" in window,
    noPlatform,
  );
  const recognition = useSyncExternalStore(
    subscribePlatform,
    () => "SpeechRecognition" in window || "webkitSpeechRecognition" in window,
    noPlatform,
  );
  useEffect(() => {
    void cafeRequest<{ textAi: boolean }>("/api/advanced/capabilities")
      .then(setCapability)
      .catch(() => setError("Chưa đọc được trạng thái kết nối."));
    return () => window.speechSynthesis?.cancel();
  }, []);
  async function loadAdmin() {
    const data = await cafeRequest<AdminData>("/api/advanced/connections", undefined, "GET", token);
    const currentUsage = await cafeRequest<Usage>("/api/advanced/usage", undefined, "GET", token);
    setAdmin(data);
    setUsage(currentUsage);
  }
  async function perform(id: string, action: () => Promise<void>) {
    if (busy) return;
    setBusy(id);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa thực hiện được. Hãy thử lại.");
    } finally {
      setBusy("");
    }
  }
  function action(provider: string, kind: "test" | "activate" | "disable" | "remove") {
    void perform(`${provider}-${kind}`, async () => {
      const result = await cafeRequest<Connection>(
        `/api/advanced/connections/${provider}${kind === "remove" ? "" : `/${kind}`}`,
        kind === "remove" ? undefined : {},
        kind === "remove" ? "DELETE" : "POST",
        token,
      );
      await loadAdmin();
      setRemove(null);
      setNotice(
        kind === "test"
          ? `${provider}: ${statusLabels[result.status] || result.status}. Kiểm tra thành công chưa tự bật AI.`
          : "Đã cập nhật kết nối.",
      );
      setCapability(await cafeRequest("/api/advanced/capabilities"));
    });
  }
  return (
    <div className="cafe-connections-page">
      <Link className="cafe-back-link" href="/english/cafe">
        <ArrowLeft size={16} />
        Trở lại café
      </Link>
      <PageHeading
        eyebrow="FREE FIRST · ADVANCED KHI BẠN CẦN"
        title="Nâng cấp khả năng học"
        text="Kết nối thêm khả năng trò chuyện và giọng nói. Bài luyện theo kịch bản luôn có sẵn để bạn bắt đầu."
      />
      <div className="cafe-capability-banner">
        <div className="cafe-capability-mark">
          <MessageCircle size={26} aria-hidden="true" />
        </div>
        <div>
          <strong>
            {capability?.textAi ? "Advanced ready" : "Free · Bài luyện theo kịch bản"}
          </strong>
          <p>
            {capability?.textAi
              ? "AI đã được quản trị viên kết nối. Bạn chọn có dùng AI khi bắt đầu mỗi cuộc trò chuyện."
              : "Bạn có thể vào quán, luyện câu và lưu flashcard mà không cần cấu hình provider."}
          </p>
        </div>
      </div>
      <div className="cafe-privacy-panel">
        <ShieldCheck size={22} />
        <div>
          <h2>Quyền riêng tư & quyền quản trị</h2>
          <p>
            Bạn đang xem danh sách khả năng. Chỉ owner/admin mới được sửa kết nối dùng chung. API
            key được mã hóa ở máy chủ; trình duyệt chỉ nhận trạng thái và khóa đã che.
          </p>
          <p>
            Khi chọn dùng AI, nội dung bạn gửi sẽ tới nhà cung cấp được cấu hình. Free tier có thể
            có điều khoản sử dụng dữ liệu riêng. Micro chỉ được dùng sau khi bạn đồng ý; café hiện
            ưu tiên nhập chữ.
          </p>
        </div>
      </div>
      {!admin && (
        <details className="cafe-admin-access">
          <summary>
            <KeyRound size={17} />
            Dành cho owner/admin
          </summary>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void perform("unlock", loadAdmin);
            }}
          >
            <label htmlFor="cafe-admin-token">
              Khóa truy cập quản trị
              <input
                id="cafe-admin-token"
                type="password"
                autoComplete="off"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </label>
            <Button type="submit" disabled={!!busy || !token.trim()}>
              Mở quyền quản trị
            </Button>
          </form>
          <small>
            Khóa truy cập chỉ được giữ trong bộ nhớ của trang. Liên hệ người vận hành để được cấp
            quyền.
          </small>
        </details>
      )}
      {admin && (
        <div className="cafe-admin-toolbar">
          <span>
            Vai trò: <strong>{admin.role}</strong> ·{" "}
            {admin.entitled ? "Được phép bật AI" : "Người vận hành chưa cho phép bật AI"}
          </span>
          <Button
            variant="outline"
            onClick={() => {
              setAdmin(null);
              setToken("");
              setUsage(null);
              setConfigure(null);
            }}
          >
            Đóng quyền quản trị
          </Button>
        </div>
      )}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="cafe-connection-notice" role="status">
          {notice}
        </p>
      )}
      <section className="cafe-connector-grid" aria-label="Danh sách kết nối">
        {(["gemini", "groq"] as const).map((provider) => {
          const c = admin?.connections.find((c) => c.provider === provider);
          return (
            <article className="cafe-connector-card" key={provider}>
              <div className="cafe-connector-icon">
                <MessageCircle size={24} />
              </div>
              <div className="cafe-connector-heading">
                <h2>AI Conversation · {provider === "gemini" ? "Gemini" : "Groq"}</h2>
                <span className="cafe-connection-status" data-status={c?.status}>
                  {admin
                    ? statusLabels[c?.status || "not_configured"]
                    : "Cấu hình bởi quản trị viên"}
                </span>
              </div>
              <p>
                Trò chuyện linh hoạt theo chủ đề và trình độ. Cần API key hợp lệ và giới hạn sử
                dụng; bài mẫu là phương án dự phòng.
              </p>
              {c && (
                <p className="cafe-connection-meta">
                  <EyeOff size={16} />
                  {c.maskedKey} · {c.model} · {c.enabled ? "Đang dùng mặc định" : "Chưa bật"}
                </p>
              )}
              {c?.retryAt && (
                <p className="cafe-draft-note">
                  Thử lại sau{" "}
                  {new Date(c.retryAt).toLocaleTimeString("vi-VN", {
                    timeZone: "Asia/Ho_Chi_Minh",
                  })}
                  .
                </p>
              )}
              {admin ? (
                <>
                  <div className="cafe-actions">
                    <Button
                      variant="outline"
                      disabled={!!busy}
                      onClick={() => setConfigure(provider)}
                    >
                      {c ? "Đổi cấu hình / xoay khóa" : "Cấu hình"}
                    </Button>
                    {c && (
                      <>
                        <Button
                          variant="outline"
                          disabled={!!busy}
                          onClick={() => action(provider, "test")}
                        >
                          {busy === `${provider}-test` ? "Đang kiểm tra…" : "Kiểm tra kết nối"}
                        </Button>
                        <Button
                          variant="outline"
                          disabled={
                            !!busy || (!c.enabled && (c.status !== "healthy" || !admin.entitled))
                          }
                          onClick={() => action(provider, c.enabled ? "disable" : "activate")}
                        >
                          {c.enabled ? "Tắt" : "Đặt mặc định"}
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={!!busy}
                          onClick={() => setRemove(provider)}
                        >
                          Xóa kết nối
                        </Button>
                      </>
                    )}
                  </div>
                  {c && (
                    <small>
                      Kiểm tra sẽ gửi một prompt ngắn và tính vào giới hạn sử dụng bạn đặt; provider
                      có thể tính phí theo tài khoản của bạn.
                    </small>
                  )}
                  {remove === provider && (
                    <div className="cafe-remove-confirm">
                      <p>Xóa khóa đã lưu và ngừng sử dụng kết nối này?</p>
                      <Button
                        variant="destructive"
                        disabled={!!busy}
                        onClick={() => action(provider, "remove")}
                      >
                        Xác nhận xóa
                      </Button>
                      <Button variant="ghost" onClick={() => setRemove(null)}>
                        Hủy
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <small>Liên hệ owner/admin nếu bạn muốn mở khả năng này.</small>
              )}
            </article>
          );
        })}
        <article className="cafe-connector-card">
          <div className="cafe-connector-icon">
            <Volume2 size={24} />
          </div>
          <h2>Text-to-Speech</h2>
          <span className="cafe-connection-status">
            {speech ? "Browser only · Sẵn sàng" : "Chưa hỗ trợ ở trình duyệt này"}
          </span>
          <p>
            Đọc câu bằng giọng en-US trên thiết bị. Không cần API key; chất lượng giọng phụ thuộc
            trình duyệt. Nếu không có giọng đọc, bạn vẫn xem được câu.
          </p>
          <Button
            variant="outline"
            disabled={!speech}
            onClick={() => {
              window.speechSynthesis.cancel();
              const line = new SpeechSynthesisUtterance(
                "Welcome to our café. What would you like to drink?",
              );
              line.lang = "en-US";
              line.onerror = () =>
                setError("Thiết bị chưa phát được giọng đọc. Hãy tiếp tục bằng chữ.");
              window.speechSynthesis.speak(line);
            }}
          >
            <AudioLines size={16} />
            Nghe thử trên thiết bị
          </Button>
          <small>
            NPC dùng Gemini-TTS khi máy chủ đã cấu hình. Giọng AI tạo khi bấm nghe và lưu để dùng
            lại; nút trên chỉ thử giọng thiết bị dự phòng.
          </small>
        </article>
        <article className="cafe-connector-card">
          <div className="cafe-connector-icon">
            <Mic size={24} />
          </div>
          <h2>Speech-to-Text</h2>
          <span className="cafe-connection-status">
            {recognition ? "Trình duyệt có hỗ trợ · P1" : "Chưa hỗ trợ ở trình duyệt này"}
          </span>
          <p>
            Bạn có thể thu âm câu trả lời để tự nghe lại ngay trong phiên; bản ghi chỉ nằm trên
            thiết bị và không tự gửi đi. Nhận diện giọng nói thuộc giai đoạn P1.
          </p>
          <small>STT provider/self-host có thể được bổ sung khi triển khai voice.</small>
        </article>
        <article className="cafe-connector-card">
          <div className="cafe-connector-icon">
            <Database size={24} />
          </div>
          <h2>Data / Auth</h2>
          <span className="cafe-connection-status">
            {capability ? "Hồ sơ trên thiết bị · Database máy chủ" : "Chưa kiểm tra được database"}
          </span>
          <p>
            Hội thoại và thẻ gắn với cookie hồ sơ của thiết bị này. Đăng nhập tài khoản và đồng bộ
            đa thiết bị chưa được tích hợp.
          </p>
          <small>
            Kết nối database được người vận hành thiết lập qua môi trường máy chủ. Trang này không
            nhận database URL.
          </small>
        </article>
        <article className="cafe-connector-card">
          <div className="cafe-connector-icon">
            <Activity size={24} />
          </div>
          <h2>Optional Monitoring</h2>
          <span className="cafe-connection-status">Đã tắt · Core vẫn hoạt động</span>
          <p>
            Nhật ký cấu hình và bộ đếm lượt gọi được giữ trên máy chủ. Không gửi transcript, âm
            thanh hay khóa đến dịch vụ theo dõi bên ngoài.
          </p>
        </article>
      </section>
      {admin && configure && (
        <section className="cafe-connection-form" aria-labelledby="cafe-config-title">
          <h2 id="cafe-config-title">Cấu hình {configure}</h2>
          {!admin.models[configure].length ? (
            <p>
              Chưa có model trong danh sách cho phép trên máy chủ. Người vận hành cần cấu hình CAFE_
              {configure.toUpperCase()}_MODELS trước.
            </p>
          ) : (
            <form
              key={configure}
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data = new FormData(form);
                const credential = String(data.get("credential"));
                void perform("save", async () => {
                  await cafeRequest(
                    `/api/advanced/connections/${configure}`,
                    {
                      provider: configure,
                      model: data.get("model"),
                      credential,
                      dailyRequests: Number(data.get("dailyRequests")),
                      userDailyRequests: Number(data.get("userDailyRequests")),
                      timeoutMs: Number(data.get("timeoutMs")),
                      maxOutputTokens: Number(data.get("maxOutputTokens")),
                    },
                    "PUT",
                    token,
                  );
                  form.reset();
                  setConfigure(null);
                  await loadAdmin();
                  setNotice("Đã lưu khóa được mã hóa. Kiểm tra kết nối trước khi bật.");
                });
              }}
            >
              <div className="cafe-config-fields">
                <ModelField models={admin.models[configure]} />
                <label>
                  Provider API key
                  <input
                    name="credential"
                    type="password"
                    autoComplete="new-password"
                    required
                    maxLength={500}
                  />
                </label>
                <label>
                  Giới hạn lượt / ngày của tenant
                  <input name="dailyRequests" type="number" min={1} max={100000} required />
                </label>
                <label>
                  Giới hạn lượt / người / ngày
                  <input name="userDailyRequests" type="number" min={1} max={100000} required />
                </label>
                <label>
                  Thời gian chờ tối đa (ms)
                  <input
                    name="timeoutMs"
                    type="number"
                    min={1000}
                    max={30000}
                    defaultValue={12000}
                    required
                  />
                </label>
                <label>
                  Token đầu ra tối đa / lượt
                  <input
                    name="maxOutputTokens"
                    type="number"
                    min={256}
                    max={4096}
                    defaultValue={1024}
                    required
                  />
                </label>
              </div>
              <p className="cafe-draft-note">
                Đây là giới hạn nội bộ do bạn đặt, không phải quota hay giá của nhà cung cấp. Bộ đếm
                theo ngày UTC bao gồm lượt kiểm tra. Khóa mới sẽ tắt kết nối cho đến khi kiểm tra
                lại.
              </p>
              <div className="cafe-actions">
                <Button type="submit" disabled={!!busy}>
                  Lưu khóa được mã hóa
                </Button>
                <Button type="button" variant="outline" onClick={() => setConfigure(null)}>
                  Hủy
                </Button>
              </div>
            </form>
          )}
        </section>
      )}
      {admin && usage && (
        <section className="cafe-usage">
          <h2>Sử dụng hôm nay · UTC</h2>
          {usage.usage
            .filter((u) => u.subject === "tenant")
            .map((u) => (
              <p key={u.provider}>
                {u.provider}: <strong>{u.requests}</strong> lượt gọi đã đặt chỗ / thử nghiệm.
              </p>
            ))}
          {!usage.usage.length && <p>Chưa có lượt gọi provider.</p>}
          <details>
            <summary>Nhật ký quản trị</summary>
            <ul>
              {usage.audit.map((a) => (
                <li key={a.id}>
                  {a.provider} · {a.action} · {a.actor} ·{" "}
                  {new Date(a.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
                </li>
              ))}
            </ul>
          </details>
        </section>
      )}
    </div>
  );
}
