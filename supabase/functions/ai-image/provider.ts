export type ImageLine = "standard" | "premium";
export type ImageResolution = "default" | "2k" | "4k";

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

export const getProviderConfig = (line: ImageLine): ProviderConfig => {
  if (line === "premium") {
    return {
      line,
      baseUrl: "https://zenmux.ai/api/vertex-ai",
      pathPrefix: "v1",
      model: "google/gemini-3-pro-image-preview",
      apiKeyEnv: "ZENMUX_API_KEY",
    };
  }

  return {
    line,
    baseUrl: "https://api.bltcy.ai",
    pathPrefix: "v1beta",
    model: "gemini-3-pro-image-preview",
    apiKeyEnv: "BLTCY_API_KEY",
  };
};

export const buildGenerateContentUrl = (config: ProviderConfig) =>
  `${config.baseUrl}/${config.pathPrefix}/models/${config.model}:generateContent`;
