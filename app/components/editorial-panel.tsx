"use client";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";

import { ShieldCheck } from "lucide-react";
import { createSessionPlan } from "../learning/session-plan";
import { PageHeading } from "./page-heading";
import { draftEditorial, publicationIssues } from "../content/editorial";
export function EditorialPanel() {
  const issues = publicationIssues(draftEditorial);
  const ledger = createSessionPlan().ledger;
  return (
    <>
      <PageHeading
        eyebrow="CONTENT QUALITY"
        title="Rõ nguồn. Đúng trạng thái. Có kiểm chứng."
        text="ENG-BA-SRS-001 là nguồn yêu cầu. Các bài luyện được gắn nhãn nháp cho đến khi qua đầy đủ cổng biên tập."
      />
      <div className="notice warning">
        <ShieldCheck aria-hidden="true" size={22} />
        <p>
          Chưa xuất bản giáo trình chính thức. Vietnam Spoken Core là seed-only; chưa có xác nhận độ
          phủ 95%, audio, bộ đề độc lập và quyền tái bản hình ảnh.
        </p>
      </div>
      <div className="settings-grid">
        <Card className="settings-panel" render={<section />}>
          <h2>Cổng xuất bản · practice-v1</h2>
          <ol className="editorial-issues">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ol>
          <Button disabled variant="default">
            Xuất bản · đang bị chặn
          </Button>
          <p className="helper">
            Đây là màn hình kiểm tra chỉ đọc. Chưa có CMS tài khoản, quyền biên tập hoặc nút tự phê
            duyệt.
          </p>
        </Card>
        <Card className="settings-panel" render={<section />}>
          <h2>Phân bổ đã kiểm tra</h2>
          <table>
            <tbody>
              {Object.entries({
                "Tổng phút dự kiến": ledger.total,
                "Nghe–nói": ledger.listeningSpeaking,
                "Chọn câu áp dụng / ghi chú tùy chọn": ledger.readingWriting,
              }).map(([label, n]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>
                    <strong>{n} phút</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>Chuỗi biên tập nội dung</h3>
          <p>
            Draft → Cambridge / COCA / YouGlish → lexicon đã duyệt → minh họa → audio → bảo vệ đề
            kiểm tra → xuất bản.
          </p>
          <p>Sửa câu tiếng Anh sẽ hủy phê duyệt IPA, độ phủ và audio của phiên bản trước.</p>
        </Card>
      </div>
    </>
  );
}
