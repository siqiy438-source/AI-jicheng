import { FashionGeneratorPage, StyleOption } from "@/components/fashion/FashionGeneratorPage";
import { FASHION_OUTFIT_FLATLAY_PROMPT, FASHION_OUTFIT_OOTD_PROMPT } from "@/lib/fashion-prompts";

const outfitStyles: StyleOption[] = [
  { id: "flatlay", name: "平铺展示", prompt: FASHION_OUTFIT_FLATLAY_PROMPT, icon: "🧩" },
  { id: "ootd", name: "人形摆拍", prompt: FASHION_OUTFIT_OOTD_PROMPT, icon: "👤" },
];

const FashionOutfit = () => {
  return (
    <FashionGeneratorPage
      title="服装搭配"
      subtitle="上传服装图片或文件，快速生成女装搭配图"
      iconSrc="/icons/fashion-outfit-custom.png"
      basePrompt={FASHION_OUTFIT_FLATLAY_PROMPT}
      styleOptions={outfitStyles}
      resultAlt="服装搭配图"
      downloadPrefix="fashion-outfit"
    />
  );
};

export default FashionOutfit;
