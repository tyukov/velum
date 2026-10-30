import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "../src/lib/turnstile";

const reply = (body: unknown) => vi.fn(async () => new Response(JSON.stringify(body)));

describe("verifyTurnstile", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("без токена — отказ, Cloudflare не вызывается", async () => {
    const fetch = reply({ success: true });
    vi.stubGlobal("fetch", fetch);
    expect(await verifyTurnstile("secret", "")).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("Cloudflare подтвердил — пропускаем", async () => {
    vi.stubGlobal("fetch", reply({ success: true }));
    expect(await verifyTurnstile("secret", "token", "1.2.3.4")).toBe(true);
  });

  it("Cloudflare отклонил — отказ", async () => {
    vi.stubGlobal("fetch", reply({ success: false, "error-codes": ["invalid-input-response"] }));
    expect(await verifyTurnstile("secret", "token")).toBe(false);
  });

  it("Cloudflare недоступен — пропускаем, чтобы не терять заявки", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await verifyTurnstile("secret", "token")).toBe(true);
  });
});
