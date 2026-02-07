import { describe, expect, test } from "vitest";

import { getImageProvider, getProviderConfig } from "../../supabase/functions/ai-image/provider";

describe("ai-image provider resolution", () => {
  test("默认线路为普通线路", () => {
    expect(getImageProvider()).toBe("standard");
  });

  test("优质线路与普通线路配置明确区分", () => {
    const standard = getProviderConfig("standard");
    const premium = getProviderConfig("premium");

    expect(standard.baseUrl).toBe("https://api.bltcy.ai");
    expect(standard.pathPrefix).toBe("v1beta");
    expect(standard.model).toBe("gemini-3-pro-image-preview");
    expect(standard.apiKeyEnv).toBe("BLTCY_API_KEY");

    expect(premium.baseUrl).toBe("https://zenmux.ai/api/vertex-ai");
    expect(premium.pathPrefix).toBe("v1");
    expect(premium.model).toBe("google/gemini-3-pro-image-preview");
    expect(premium.apiKeyEnv).toBe("ZENMUX_API_KEY");
  });
});
