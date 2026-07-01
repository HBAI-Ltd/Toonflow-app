import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import u from "@/utils";
import { z } from "zod";
import { generateOpenAICompatibleVendorCode, isOpenAICompatibleBaseUrl } from "@/utils/openaiCompatibleVendor";
const router = express.Router();

function shouldFetchVendorCode(link: string): boolean {
  try {
    const url = new URL(link);
    return /\.(ts|tsx|js|txt)$/i.test(url.pathname);
  } catch {
    return false;
  }
}

export default router.post(
  "/",
  validateFields({
    link: z.string(),
  }),
  async (req, res) => {
    const { link } = req.body;
    const trimmedLink = link.trim();

    if (!trimmedLink) return res.status(400).send(error("链接不能为空"));

    if (isOpenAICompatibleBaseUrl(trimmedLink) && !shouldFetchVendorCode(trimmedLink)) {
      return res.status(200).send(success(generateOpenAICompatibleVendorCode({ baseUrl: trimmedLink })));
    }

    try {
      const text = await fetch(trimmedLink, { signal: AbortSignal.timeout(10000) }).then((response) => response.text());
      if (text.includes("exports.vendor") || text.includes("const vendor") || text.includes("vendor: VendorConfig")) {
        return res.status(200).send(success(text));
      }
      if (isOpenAICompatibleBaseUrl(trimmedLink)) {
        return res.status(200).send(success(generateOpenAICompatibleVendorCode({ baseUrl: trimmedLink })));
      }
      return res.status(400).send(error("链接返回内容不是供应商代码"));
    } catch (err) {
      if (isOpenAICompatibleBaseUrl(trimmedLink)) {
        return res.status(200).send(success(generateOpenAICompatibleVendorCode({ baseUrl: trimmedLink })));
      }
      throw err;
    }
  },
);
