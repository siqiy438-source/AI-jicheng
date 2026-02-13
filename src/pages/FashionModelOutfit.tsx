import { FashionGeneratorPage, StyleOption } from "@/components/fashion/FashionGeneratorPage";
import {
  FASHION_MODEL_MIRROR_SELFIE_PROMPT,
  FASHION_MODEL_STANDARD_PROMPT,
  FASHION_MODEL_FACELESS_HALF_PROMPT,
  FASHION_MODEL_FACELESS_FULL_PROMPT,
  FASHION_MODEL_INDOOR_PROMPT,
} from "@/lib/fashion-prompts";

const modelStyles: StyleOption[] = [
  {
    id: "mirror-selfie",
    name: "对镜自拍",
    prompt: FASHION_MODEL_MIRROR_SELFIE_PROMPT,
    iconSrc: "/icons/model-selfie-vintage.png",
    description: "手机挡脸的镜前全身自拍，日常博主同款氛围",
  },
  {
    id: "standard-model",
    name: "标准模特图",
    prompt: FASHION_MODEL_STANDARD_PROMPT,
    iconSrc: "/icons/model-standard-vintage.png",
    description: "常规时尚模特上身图，适合通用服装展示",
  },
  {
    id: "faceless-half",
    name: "氛围半身图",
    prompt: FASHION_MODEL_FACELESS_HALF_PROMPT,
    icon: "✦",
    description: "不露脸半身图，展示叠穿层次与整体搭配氛围",
  },
  {
    id: "faceless-full",
    name: "氛围近景图",
    prompt: FASHION_MODEL_FACELESS_FULL_PROMPT,
    icon: "◈",
    description: "1.5倍焦距特写，怼近拍面料质感和细节，衣服填满画面",
  },
  {
    id: "indoor-model",
    name: "室内模特图",
    prompt: FASHION_MODEL_INDOOR_PROMPT,
    icon: "⌂",
    description: "平整室内背景+自然抓拍动作，强调三件单品完整上身和真实氛围",
  },
];

const FashionModelOutfit = () => {
  return (
    <FashionGeneratorPage
      title="模特生成"
      subtitle="上传服装图片，支持五种风格：自拍、模特、氛围半身、氛围近景、室内模特"
      iconSrc="/icons/fashion-model-custom.webp"
      basePrompt={FASHION_MODEL_MIRROR_SELFIE_PROMPT}
      styleOptions={modelStyles}
      styleSelectorVariant="cards"
      resultAlt="模特生成图"
      downloadPrefix="fashion-model-outfit"
    />
  );
};

export default FashionModelOutfit;
