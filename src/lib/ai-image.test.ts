import { beforeEach, describe, expect, test, vi, type Mock } from "vitest";

import { generateImage } from "./ai-image";
import { getAccessToken, supabaseAnonKey } from "./supabase";

vi.mock("./supabase", () => ({
  getAccessToken: vi.fn(),
  forceRefreshToken: vi.fn(),
  supabaseAnonKey: "test-anon-key",
  supabaseUrl: "https://example.supabase.co",
}));

describe("generateImage auth headers", () => {
  beforeEach(() => {
    (getAccessToken as Mock).mockResolvedValue("user-access-token");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        imageBase64: "data:image/png;base64,abc",
      }),
    }));
  });

  test("authenticated requests include apikey and user bearer token", async () => {
    await generateImage({ prompt: "test", line: "standard", featureCode: "ai_image_standard" });

    const fetchMock = fetch as Mock;
    const [, options] = fetchMock.mock.calls[0];
    const headers = options.headers as Record<string, string>;

    expect(headers.apikey).toBe(supabaseAnonKey);
    expect(headers.Authorization).toBe("Bearer user-access-token");
  });
});
