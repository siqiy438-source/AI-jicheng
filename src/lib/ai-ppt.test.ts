import { beforeEach, describe, expect, test, vi, type Mock } from "vitest";

import { generateSlideImage } from "./ai-ppt";
import { forceRefreshToken, getAccessToken } from "./supabase";

vi.mock("./supabase", () => ({
  supabaseUrl: "https://example.supabase.co",
  supabaseAnonKey: "test-anon-key",
  getAccessToken: vi.fn(),
  forceRefreshToken: vi.fn(),
}));

describe("generateSlideImage auth retry", () => {
  beforeEach(() => {
    (getAccessToken as Mock).mockResolvedValue("expired-token");
    (forceRefreshToken as Mock).mockResolvedValue("fresh-token");
  });

  test("retries with refreshed token on 401", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, imageBase64: "data:image/png;base64,abc" }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const result = await generateSlideImage({
      description: "test",
      style: "free",
      template: "none",
      aspectRatio: "16:9",
      featureCode: "ai_ppt_image_standard",
    });

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstOptions = fetchMock.mock.calls[0][1] as RequestInit;
    const secondOptions = fetchMock.mock.calls[1][1] as RequestInit;
    const firstHeaders = firstOptions.headers as Record<string, string>;
    const secondHeaders = secondOptions.headers as Record<string, string>;

    expect(firstHeaders.Authorization).toBe("Bearer expired-token");
    expect(secondHeaders.Authorization).toBe("Bearer fresh-token");
  });
});
