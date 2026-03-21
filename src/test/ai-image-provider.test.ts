import { describe, expect, test } from "vitest";

import {
  FLASH_IMAGE_MODEL,
  NORMAL_IMAGE_MODEL,
  SPEED_IMAGE_MODEL,
  TWO_K_IMAGE_MODEL,
  getHDModel,
  getImageProvider,
  getProviderConfig,
} from "../../supabase/functions/ai-image/provider";

describe("ai-image provider resolution", () => {
  test("默认线路为普通线路", () => {
    expect(getImageProvider()).toBe("standard");
  });

  test("优质线路与普通线路配置明确区分", () => {
    const standard = getProviderConfig("standard");
    const premium = getProviderConfig("premium");

    expect(standard.baseUrl).toBe("https://api.bltcy.ai");
    expect(standard.pathPrefix).toBe("v1beta");
    expect(standard.model).toBe(NORMAL_IMAGE_MODEL);
    expect(standard.apiKeyEnv).toBe("BLTCY_API_KEY");

    expect(premium.baseUrl).toBe("https://api.bltcy.ai");
    expect(premium.pathPrefix).toBe("v1beta");
    expect(premium.model).toBe(NORMAL_IMAGE_MODEL);
    expect(premium.apiKeyEnv).toBe("ZENMUX_API_KEY");
  });

  test("极速线路使用 BLTCY 兼容别名，2K 使用专用高清模型", () => {
    expect(SPEED_IMAGE_MODEL).toBe(FLASH_IMAGE_MODEL);
    expect(getHDModel("2k")).toBe(TWO_K_IMAGE_MODEL);
  });
});
