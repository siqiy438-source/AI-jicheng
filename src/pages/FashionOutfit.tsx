import { FashionGeneratorPage, StyleOption } from "@/components/fashion/FashionGeneratorPage";
import { FASHION_OUTFIT_FLATLAY_PROMPT, FASHION_OUTFIT_OOTD_PROMPT } from "@/lib/fashion-prompts";

const outfitStyles: StyleOption[] = [
  {
    id: "flatlay",
    name: "平铺展示",
    prompt: FASHION_OUTFIT_FLATLAY_PROMPT,
    iconSrc: "/icons/outfit-flatlay-vintage.png",
    description: "杂志感单品平铺，适合展示服装细节和面料质感",
  },
  {
    id: "ootd",
    name: "人形摆拍",
    prompt: FASHION_OUTFIT_OOTD_PROMPT,
    iconSrc: "/icons/outfit-ootd-vintage.png",
    description: "模拟穿着姿态的人形摆盘，适合日常穿搭氛围图",
  },
];

const FashionOutfit = () => {
  return (
    <FashionGeneratorPage
      title="平铺/摆拍生成"
      subtitle="上传服装图片或文件，快速生成平铺与人形摆拍效果"
      iconSrc="/icons/fashion-outfit-custom.webp"
      basePrompt={FASHION_OUTFIT_FLATLAY_PROMPT}
      styleOptions={outfitStyles}
      resultAlt="平铺摆拍效果图"
      downloadPrefix="fashion-outfit"
      featureCodePrefix="ai_flatlay"
    />
  );
};

export default FashionOutfit;
