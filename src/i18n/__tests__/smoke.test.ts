import { describe, it, expect } from "vitest";
import getPath from "@/utils/getPath";

describe("hạ tầng test", () => {
  it("phân giải được alias @/", () => {
    expect(typeof getPath).toBe("function");
  });
});
