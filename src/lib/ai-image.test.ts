import { beforeEach, describe, expect, test, vi, type Mock } from "vitest";

import { generateImage } from "./ai-image";
import { supabase, supabaseAnonKey } from "./supabase";

vi.mock("./supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
  supabaseAnonKey: "test-anon-key",
  supabaseUrl: "https://example.supabase.co",
}));

describe("generateImage auth headers", () => {
  beforeEach(() => {
    (supabase.auth.getSession as Mock).mockResolvedValue({
      data: { session: null },
    });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        imageBase64: "data:image/png;base64,abc",
      }),
    }));
  });

  test("anonymous requests include apikey and Authorization", async () => {
    await generateImage({ prompt: "test", line: "standard" });

    const fetchMock = fetch as Mock;
    const [, options] = fetchMock.mock.calls[0];
    const headers = options.headers as Record<string, string>;

    expect(headers.apikey).toBe(supabaseAnonKey);
    expect(headers.Authorization).toBe(`Bearer ${supabaseAnonKey}`);
  });
});
