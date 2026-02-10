import { FashionGeneratorPage } from "@/components/fashion/FashionGeneratorPage";
import { FASHION_OUTFIT_PROMPT } from "@/lib/fashion-prompts";

const FashionOutfit = () => {
  return (
    <FashionGeneratorPage
      title="服装搭配"
      subtitle="上传服装图片或文件，快速生成女装搭配图"
      iconSrc="/icons/ai-drawing-custom.png"
      basePrompt={FASHION_OUTFIT_PROMPT}
      resultAlt="服装搭配图"
      downloadPrefix="fashion-outfit"
    />
  );
};

export default FashionOutfit;
