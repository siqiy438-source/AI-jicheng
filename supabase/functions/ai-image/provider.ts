export type ImageLine = "standard" | "premium";
export type ImageResolution = "default" | "2k" | "4k" | "speed";

export const NORMAL_IMAGE_MODEL = "nano-banana-2";
export const FLASH_IMAGE_MODEL = "gemini-3.1-flash-image-preview";
export const TWO_K_IMAGE_MODEL = "gemini-3.1-flash-image-preview-2k";
export const FOUR_K_IMAGE_MODEL = "gemini-3.1-flash-image-preview-4k";

/** 灵犀Pro（ZenMux）专用模型 */
export const ZENMUX_PRO_IMAGE_MODEL = "google/gemini-3.1-flash-image-preview";

/** 获取灵犀Pro（ZenMux）generateContent API URL */
export const getZenMuxImageUrl = (): string =>
  `https://zenmux.ai/api/vertex-ai/v1/models/${ZENMUX_PRO_IMAGE_MODEL}:generateContent`;

interface ProviderConfig {
  line: ImageLine;
  baseUrl: string;
  pathPrefix: "v1" | "v1beta";
  model: string;
  apiKeyEnv: string;
}

export const getImageProvider = (line?: string): ImageLine =>
  line === "premium" ? "premium" : "standard";

/** 判断是否使用高清线路（2K/4K 走独立的 images/edits 接口） */
export const isHDResolution = (resolution?: string): boolean =>
  resolution === "2k" || resolution === "4k";

/** 获取高清线路的模型名 */
export const getHDModel = (resolution: string): string =>
  resolution === "4k" ? FOUR_K_IMAGE_MODEL : TWO_K_IMAGE_MODEL;

/** 获取高清线路的 API URL */
export const getHDApiUrl = (): string =>
  "https://api.bltcy.ai/v1/images/edits";

/** 优质线路是否走 HD 2K（已废弃，premium 现在走 ZenMux 专属分支） */
export const isPremiumHD = (line?: string): boolean => line === "premium";

export const getProviderConfig = (line: ImageLine): ProviderConfig => {
  return {
    line,
    baseUrl: "https://api.bltcy.ai",
    pathPrefix: "v1beta",
    model: NORMAL_IMAGE_MODEL,
    apiKeyEnv: line === "premium" ? "ZENMUX_API_KEY" : "BLTCY_API_KEY",
  };
};

/** 像素块生成专用模型 */
export const PIXEL_ART_MODEL = NORMAL_IMAGE_MODEL;

/** 极速线路专用模型 */
export const SPEED_IMAGE_MODEL = FLASH_IMAGE_MODEL;

export const buildGenerateContentUrl = (config: ProviderConfig) =>
  `${config.baseUrl}/${config.pathPrefix}/models/${config.model}:generateContent`;
