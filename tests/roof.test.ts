import { describe, expect, it } from "vitest";
import { roofArea, screws, sheetArea, trims } from "../src/lib/roof";

describe("roofArea", () => {
  it("площадь в плане со свесами, делённая на косинус наклона", () => {
    // (10 + 1) × (8 + 1) = 99 м² в плане; cos 30° ≈ 0,866
    expect(roofArea(10, 8, "mid")).toBe(114.3);
    expect(roofArea(10, 8, "steep")).toBe(140);
  });
});

describe("sheetArea", () => {
  it("запас по типу крыши, округление вверх", () => {
    expect(sheetArea(100, "single")).toBe(105);
    expect(sheetArea(100, "gable")).toBe(110);
    expect(sheetArea(100, "hip")).toBe(120);
    expect(sheetArea(100, "complex")).toBe(125);
    expect(sheetArea(114.3, "gable")).toBe(126);
  });
});

describe("trims", () => {
  it("двускатная: конёк по длине, торцы по четырём скатам, карниз с двух сторон", () => {
    // Дом 10 × 8, со свесами 11 × 9; длина ската 4,5 / cos 30° ≈ 5,2 м
    expect(trims(10, 8, "gable", "mid")).toEqual({ ridge: 11, gable: 21, eave: 22 });
  });

  it("односкатная: без конька", () => {
    expect(trims(10, 8, "single", "low")).toEqual({ gable: 20, eave: 11 });
  });

  it("вальмовая и сложная — считает менеджер", () => {
    expect(trims(10, 8, "hip", "mid")).toBeNull();
    expect(trims(10, 8, "complex", "mid")).toBeNull();
  });
});

describe("screws", () => {
  it("8 саморезов на м², округление до упаковки 50 шт", () => {
    expect(screws(110)).toBe(900);
    expect(screws(126)).toBe(1050);
  });
});
