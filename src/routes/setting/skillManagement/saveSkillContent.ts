import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import isPathInside from "is-path-inside";
import u from "@/utils";
import p from "path";
import * as fs from "fs";
import { t, getLocale, canonicalSkillPath, localizedSkillPath, skillPathLocale } from "@/i18n";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    path: z.string(),
    content: z.string(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { path, content } = req.body;
    const skillsRoot = u.getPath(["skills"]);
    const filePath = p.join(skillsRoot, path);
    if (!isPathInside(filePath, skillsRoot)) {
      return res.status(400).send(error(t("setting.skillManagement.saveSkillContent.invalidPath", {}, locale)));
    }

    // Path client gửi lên có thể mang hậu tố locale tường minh (foo.vi.md). Nếu request
    // hiện tại đã chuyển sang locale khác (ví dụ người dùng đổi ngôn ngữ toàn cục sau khi
    // mở form sửa) thì path đó đã "cũ" — không được phép resolve/redirect sang locale
    // khác, kẻo ghi đè nhầm lên bản gốc hoặc sidecar của một locale không liên quan.
    const pathLocale = skillPathLocale(filePath);
    if (pathLocale !== null && pathLocale !== locale) {
      return res.status(400).send(error(t("setting.skillManagement.pathLocaleMismatch", {}, locale)));
    }

    // Client có thể gửi lên path base hoặc path sidecar (đường dẫn getSkillList vừa trả
    // về) -> quy về bản gốc để xác định skill này có thật hay không, tránh việc tự suy ra
    // sidecar-của-sidecar (foo.vi.vi.md) nếu lỡ nhận nhầm một sidecar làm bản gốc.
    const canonicalPath = canonicalSkillPath(filePath);

    // Sự tồn tại được kiểm tra trên bản gốc, không phải trên path client gửi lên: dưới
    // locale en/vi, sidecar hợp lệ có thể (và thường là) CHƯA tồn tại — đó chính là lần
    // đầu tạo bản dịch, không phải lỗi. Bản gốc mới là thứ định danh "skill này có tồn tại
    // không"; nó luôn phải có sẵn (đây là nguyên bản zh do upstream cung cấp).
    if (!fs.existsSync(canonicalPath)) {
      return res.status(400).send(error(t("setting.skillManagement.saveSkillContent.fileNotFound", {}, locale)));
    }

    // Quy tắc ghi (giống editVisualManual/editDirectorlManual): nếu bản gốc tồn tại thì đó
    // là nguyên bản upstream cần bảo vệ -> ghi vào sidecar riêng cho locale, không bao giờ
    // đụng vào bản gốc khi locale khác zh. localizedSkillPath trả về chính bản gốc khi
    // locale là zh, nên hành vi zh giữ nguyên như trước.
    const targetPath = fs.existsSync(canonicalPath) ? localizedSkillPath(canonicalPath, locale) : canonicalPath;
    if (!isPathInside(targetPath, skillsRoot)) {
      return res.status(400).send(error(t("setting.skillManagement.saveSkillContent.invalidPath", {}, locale)));
    }

    const raw = await fs.promises.writeFile(targetPath, content, "utf-8");

    res.status(200).send(success(raw));
  },
);
