export type ImageLine = "standard" | "premium";
export type ImageResolution = "default" | "2k" | "4k" | "speed";

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
  resolution === "4k" ? "nano-banana-2-4k" : "nano-banana-2-2k";

/** 获取高清线路的 API URL */
export const getHDApiUrl = (): string =>
  "https://api.bltcy.ai/v1/images/edits";

/** 优质线路是否走 HD 2K（premium 固定走 BLTCY images/edits 2K） */
export const isPremiumHD = (line?: string): boolean => line === "premium";

export const getProviderConfig = (line: ImageLine): ProviderConfig => {
  return {
    line,
    baseUrl: "https://api.bltcy.ai",
    pathPrefix: "v1beta",
    model: "nano-banana",
    apiKeyEnv: line === "premium" ? "BLTCY_PRO_API_KEY" : "BLTCY_API_KEY",
  };
};

/** 像素块生成专用模型 */
export const PIXEL_ART_MODEL = "nano-banana-2";

/** 极速线路专用模型 */
export const SPEED_IMAGE_MODEL = "nano-banana-2";

export const buildGenerateContentUrl = (config: ProviderConfig) =>
  `${config.baseUrl}/${config.pathPrefix}/models/${config.model}:generateContent`;
