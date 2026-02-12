import { FashionGeneratorPage, StyleOption } from "@/components/fashion/FashionGeneratorPage";
import { FASHION_MODEL_MIRROR_SELFIE_PROMPT, FASHION_MODEL_STANDARD_PROMPT } from "@/lib/fashion-prompts";

const modelStyles: StyleOption[] = [
  {
    id: "mirror-selfie",
    name: "对镜自拍",
    prompt: FASHION_MODEL_MIRROR_SELFIE_PROMPT,
    icon: "🤳",
    description: "手机挡脸的镜前全身自拍，日常博主同款氛围",
  },
  {
    id: "standard-model",
    name: "标准模特图",
    prompt: FASHION_MODEL_STANDARD_PROMPT,
    icon: "🧍",
    description: "常规时尚模特上身图，适合通用服装展示",
  },
];

const FashionModelOutfit = () => {
  return (
    <FashionGeneratorPage
      title="镜前模特生成"
      subtitle="上传服装图片，支持对镜自拍与标准模特图两种风格"
      iconSrc="/icons/fashion-model-custom.webp"
      basePrompt={FASHION_MODEL_MIRROR_SELFIE_PROMPT}
      styleOptions={modelStyles}
      resultAlt="模特生成图"
      downloadPrefix="fashion-model-outfit"
    />
  );
};

export default FashionModelOutfit;
