import { describe, expect, it } from "vitest";
import { formatPhone, isCompletePhone } from "../src/lib/phone";

/** Имитирует посимвольный ввод в поле с маской */
const type = (chars: string) => [...chars].reduce((value, ch) => formatPhone(value + ch), "+7 (");

describe("formatPhone", () => {
  it.each([
    ["87011234567", "+7 (701) 123-45-67"],
    ["7011234567", "+7 (701) 123-45-67"],
    ["7771234567", "+7 (777) 123-45-67"],
  ])("посимвольный ввод %s", (input, expected) => {
    expect(type(input)).toBe(expected);
  });

  it.each([
    ["87011234567", "+7 (701) 123-45-67"],
    ["+77011234567", "+7 (701) 123-45-67"],
    ["8 (701) 123-45-67", "+7 (701) 123-45-67"],
    ["+7 (701) 123-45-67", "+7 (701) 123-45-67"],
  ])("вставка %s", (input, expected) => {
    expect(formatPhone(input)).toBe(expected);
  });

  it("обрезает лишние цифры", () => {
    expect(formatPhone("+7 (701) 123-45-6789")).toBe("+7 (701) 123-45-67");
  });

  it("неполный номер", () => {
    expect(formatPhone("+7 (70")).toBe("+7 (70");
  });
});

describe("isCompletePhone", () => {
  it("полный номер", () => expect(isCompletePhone("+7 (701) 123-45-67")).toBe(true));
  it("неполный номер", () => expect(isCompletePhone("+7 (701) 123")).toBe(false));
});
