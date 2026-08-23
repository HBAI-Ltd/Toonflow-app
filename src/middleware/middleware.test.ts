import { describe, it, expect, vi } from "vitest";
import { z } from "zod";

vi.mock("@/i18n", async () => {
  const actual = await vi.importActual<typeof import("@/i18n")>("@/i18n");
  return {
    ...actual,
    getLocale: vi.fn().mockRejectedValue(new Error("o_setting lookup failed")),
  };
});

import { validateFields } from "./middleware";

function makeRes() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { status, json } as unknown as { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
}

describe("validateFields — getLocale lookup failure does not fail the request closed", () => {
  it("still validates and calls next() when the request is valid", async () => {
    const middleware = validateFields({ name: z.string() });
    const req = { body: { name: "ok" }, headers: {} } as any;
    const res = makeRes();
    const next = vi.fn();

    await middleware(req, res as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("falls back to the default (English) locale message on validation failure", async () => {
    const middleware = validateFields({ name: z.string() });
    const req = { body: { name: 123 }, headers: {} } as any;
    const res = makeRes();
    const next = vi.fn();

    await middleware(req, res as any, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    const payload = res.json.mock.calls[0][0];
    expect(payload.message).toBe("Invalid parameters");
  });
});
