"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Logo } from "./logo";
import { Artwork } from "./artwork";
import { baselineLesson } from "../content/baseline";
import { newDraft, validDraft, type ContentDraft } from "../content/governance";
import type { analyzeLexicon } from "../content/lexicon";
type Document = {
  id: string;
  revision: number;
  status: string;
  draft: ContentDraft;
  issues: string[];
  analysis: ReturnType<typeof analyzeLexicon>;
};
type AdminData = {
  role: string;
  documents: Document[];
  lexicon: { version: string; count: number; approvedBy: string } | null;
  audit: {
    id: string;
    documentId: string;
    revision: number;
    actor: string;
    action: string;
    createdAt: string;
  }[];
};
export function ContentAdmin() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<AdminData | null>(null);
  const [selected, setSelected] = useState("");
  const [json, setJson] = useState(JSON.stringify(newDraft(baselineLesson), null, 2));
  const [lexicon, setLexicon] = useState("");
  const [audio, setAudio] = useState("{}");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const current = data?.documents.find((d) => d.id === selected);
  let preview: ContentDraft | null = null;
  try {
    const parsed = JSON.parse(json);
    if (validDraft(parsed)) preview = parsed;
  } catch {
    /* Keep the invalid JSON editable. */
  }
  async function request(fields?: Record<string, unknown>) {
    const response = await fetch("/api/content-admin", {
      method: fields ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(fields ? { "Content-Type": "application/json" } : {}),
      },
      ...(fields ? { body: JSON.stringify(fields) } : {}),
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.messageVi ?? "Chưa thực hiện được thao tác.");
    return result;
  }
  async function load() {
    const result = (await request()) as AdminData;
    setData(result);
    const target = result.documents.find((d) => d.id === selected) ?? result.documents[0];
    if (target) {
      setSelected(target.id);
      setJson(JSON.stringify(target.draft, null, 2));
      setAudio(JSON.stringify(target.draft.audio, null, 2));
    }
  }
  async function run(action?: string, extra: Record<string, unknown> = {}) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (action) {
        const fields: Record<string, unknown> = {
          action,
          id: selected,
          revision: current?.revision,
          ...extra,
        };
        if (action === "save" || action === "create") fields.draft = JSON.parse(json);
        if (action === "audio") fields.audio = JSON.parse(audio);
        if (action === "lexicon") fields.lexicon = JSON.parse(lexicon);
        await request(fields);
      }
      await load();
      setNotice(action ? "Đã lưu thao tác và lịch sử." : "Đã kết nối kho nội dung.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chưa thực hiện được.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="natural-admin">
      <Link href="/" aria-label="Về Natural English">
        <Logo />
      </Link>
      <header className="page-heading">
        <div>
          <span className="eyebrow">CONTENT STUDIO · ENG-BA-SRS-001</span>
          <h1>Nội dung tốt bắt đầu từ kiểm chứng.</h1>
          <p>
            Biên tập → gửi duyệt → duyệt ngôn ngữ → audio → xuất bản. Thao tác được kiểm tra quyền
            trên máy chủ.
          </p>
        </div>
      </header>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
      >
        <label htmlFor="admin-token">Khóa truy cập theo vai trò</label>
        <input
          type="password"
          id="admin-token"
          value={token}
          onChange={(e) => {
            setToken(e.target.value);
            setData(null);
          }}
          autoComplete="off"
          required
          minLength={32}
        />
        <div className="button-row">
          <Button type="submit" disabled={busy}>
            {busy ? "Đang xử lý…" : "Kết nối"}
          </Button>
          {data && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setToken("");
                setData(null);
              }}
            >
              Đăng xuất
            </Button>
          )}
        </div>
      </form>
      <p className="helper">
        Khóa chỉ giữ trong bộ nhớ của tab này. Máy chủ cần cấu hình ba khóa riêng cho Editor,
        Reviewer và Admin.
      </p>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="feedback positive" role="status">
          {notice}
        </p>
      )}
      {data && (
        <>
          <p>
            Vai trò: <strong>{data.role}</strong> · Bộ từ:{" "}
            {data.lexicon
              ? `${data.lexicon.count} lemma · ${data.lexicon.version} · ${data.lexicon.approvedBy}`
              : "Chưa có bộ từ đã duyệt"}
          </p>
          {data.role === "editor" && (
            <div className="button-row">
              <Button variant="outline" disabled={busy} onClick={() => void run("seed")}>
                Nhập bản nháp từ đặc tả
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setSelected("");
                  setJson(
                    JSON.stringify(
                      {
                        ...newDraft(baselineLesson),
                        lesson: {
                          ...baselineLesson,
                          id: "lesson-new",
                          slug: "new-lesson",
                          title: "New lesson",
                        },
                      },
                      null,
                      2,
                    ),
                  );
                }}
              >
                Tạo bài mới
              </Button>
            </div>
          )}
          <label htmlFor="content-selection">Bài đang biên tập</label>
          <select
            id="content-selection"
            value={selected}
            onChange={(e) => {
              const doc = data.documents.find((d) => d.id === e.target.value);
              setSelected(e.target.value);
              if (doc) {
                setJson(JSON.stringify(doc.draft, null, 2));
                setAudio(JSON.stringify(doc.draft.audio, null, 2));
              }
            }}
          >
            <option value="">Bài mới</option>
            {data.documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.draft.lesson.title} · r{doc.revision} · {doc.status}
              </option>
            ))}
          </select>
          <div className="natural-admin-grid">
            <section>
              <label htmlFor="content-json">Nội dung và chứng cứ (JSON)</label>
              <textarea
                id="content-json"
                value={json}
                onChange={(e) => setJson(e.target.value)}
                readOnly={data.role !== "editor"}
                spellCheck={false}
              />
              <p className="helper">
                Mỗi segment có Basic/Better/Natural song ngữ. Khai báo expansion, proper nouns, URL
                Cambridge/COCA/YouGlish và quyền ảnh. Lưu sửa sẽ tạo revision mới, hủy duyệt và
                audio của bản nháp; bản đang phục vụ người học vẫn giữ nguyên.
              </p>
              <div className="button-row">
                {data.role === "editor" && (
                  <>
                    <Button
                      disabled={busy || !preview}
                      onClick={() => void run(current ? "save" : "create")}
                    >
                      {current ? "Lưu revision mới" : "Tạo bản nháp"}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy || !current || current.status !== "draft"}
                      onClick={() => void run("submit")}
                    >
                      Gửi duyệt bản đã lưu
                    </Button>
                  </>
                )}
                {data.role === "reviewer" && (
                  <Button
                    disabled={busy || current?.status !== "review"}
                    onClick={() => void run("approve")}
                  >
                    Duyệt ngôn ngữ và ngoại lệ
                  </Button>
                )}
                {data.role === "admin" && (
                  <>
                    <Button
                      disabled={busy || current?.status !== "approved" || !!current?.issues.length}
                      onClick={() => void run("publish")}
                    >
                      Xuất bản
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy || !current}
                      onClick={() => void run("unpublish")}
                    >
                      Gỡ xuất bản
                    </Button>
                  </>
                )}
              </div>
              {preview && (
                <div className="natural-admin-preview">
                  <span className="eyebrow">PREVIEW · MOBILE 430 PX</span>
                  <h2>{preview.lesson.title}</h2>
                  <Artwork scene={preview.lesson.segments[0].scene} />
                  <p lang="en">{preview.lesson.segments[0].basic.en}</p>
                  <p lang="vi">{preview.lesson.segments[0].basic.vi}</p>
                </div>
              )}
            </section>
            <section>
              <div className="natural-admin-gates">
                <h2>Cổng kiểm duyệt · bản đã lưu</h2>
                {current ? (
                  <>
                    <p>
                      Revision {current.revision} · {current.status}
                    </p>
                    <p>
                      <strong>
                        {current.analysis.official && current.analysis.coverage !== null
                          ? `${current.analysis.coverage.toFixed(1)}% core tokens`
                          : "Chưa có tỷ lệ chính thức"}
                      </strong>
                    </p>
                    <p className="helper">
                      {current.analysis.core} core · {current.analysis.expansion} expansion ·{" "}
                      {current.analysis.excluded} proper nouns · {current.analysis.unmapped}{" "}
                      unmapped
                    </p>
                    <p className="helper">
                      {current.analysis.coreTypes} core types · {current.analysis.expansionTypes}{" "}
                      expansion types
                    </p>
                    {!!current.analysis.unmappedWords.length && (
                      <details>
                        <summary>Từ chưa map</summary>
                        <p className="helper">{current.analysis.unmappedWords.join(", ")}</p>
                      </details>
                    )}
                    <ul>
                      {current.issues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                    {!current.issues.length && (
                      <p>Đủ điều kiện kỹ thuật. Cần trạng thái Approved để xuất bản.</p>
                    )}
                  </>
                ) : (
                  <p>Chọn hoặc tạo bản nháp để kiểm tra.</p>
                )}
              </div>
              {data.role === "reviewer" && (
                <>
                  <details>
                    <summary>Nhập bộ 1.500 từ đã duyệt</summary>
                    <label htmlFor="lexicon-json">Lexicon JSON</label>
                    <textarea
                      id="lexicon-json"
                      value={lexicon}
                      onChange={(e) => setLexicon(e.target.value)}
                      placeholder={
                        '{"version":"core-v1","approvedBy":"Tên người duyệt","entries":[{"lemma":"get","forms":["gets","got","gotten"],"meaningVi":"lấy/nhận","source":"https://..."}]}'
                      }
                    />
                    <Button disabled={busy || !lexicon.trim()} onClick={() => void run("lexicon")}>
                      Xác nhận và lưu bộ từ
                    </Button>
                  </details>
                  <details>
                    <summary>Audio đúng revision đã duyệt</summary>
                    <p className="helper">
                      Sau khi duyệt câu, sinh TTS và nghe QA bên ngoài. Gắn URL HTTPS, văn bản chính
                      xác và revision cho mỗi segment/level. Chưa tự động sinh audio hàng loạt.
                    </p>
                    <label htmlFor="audio-json">Audio manifest</label>
                    <textarea
                      id="audio-json"
                      value={audio}
                      onChange={(e) => setAudio(e.target.value)}
                      placeholder={
                        '{"routine-1:basic":{"url":"https://...","text":"I wake up at 5:40.","revision":1}}'
                      }
                    />
                    <Button
                      disabled={busy || current?.status !== "approved"}
                      onClick={() => void run("audio")}
                    >
                      Xác nhận audio đã QA
                    </Button>
                  </details>
                </>
              )}
            </section>
          </div>
          <section>
            <h2>Lịch sử nội dung</h2>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Bài</th>
                    <th>Revision</th>
                    <th>Vai trò</th>
                    <th>Thao tác</th>
                    <th>Khôi phục</th>
                  </tr>
                </thead>
                <tbody>
                  {data.audit.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        {new Date(entry.createdAt).toLocaleString("vi-VN", {
                          timeZone: "Asia/Ho_Chi_Minh",
                        })}
                      </td>
                      <td>{entry.documentId}</td>
                      <td>{entry.revision}</td>
                      <td>{entry.actor}</td>
                      <td>{entry.action}</td>
                      <td>
                        {data.role === "admin" &&
                          entry.action === "publish" &&
                          entry.documentId === selected && (
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() => void run("rollback", { auditId: entry.id })}
                            >
                              Khôi phục
                            </Button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
