export type ImageLine = "standard" | "premium";

interface ProviderConfig {
  line: ImageLine;
  baseUrl: string;
  pathPrefix: "v1" | "v1beta";
  model: string;
  apiKeyEnv: string;
}

export const getImageProvider = (line?: string): ImageLine =>
  line === "premium" ? "premium" : "standard";

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
