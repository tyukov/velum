import { describe, expect, it } from "vitest";
import { resolvePrice } from "../src/lib/pricing";

describe("resolvePrice", () => {
  it("разница до 50 ₸ — меньшая цена", () => {
    expect(resolvePrice(3280, 3300)).toBe(3280);
    expect(resolvePrice(3115, 3075)).toBe(3075);
  });

  it("разница ровно 50 ₸ — ещё меньшая цена", () => {
    expect(resolvePrice(3000, 3050)).toBe(3000);
  });

  it("разница больше 50 ₸ — большая минус 20 ₸", () => {
    expect(resolvePrice(3185, 3300)).toBe(3280);
    expect(resolvePrice(3300, 3185)).toBe(3280);
  });

  it("товар только у одного поставщика", () => {
    expect(resolvePrice(3300, undefined)).toBe(3300);
    expect(resolvePrice(undefined, 3075)).toBe(3075);
    expect(resolvePrice(undefined, undefined)).toBeUndefined();
  });
});
