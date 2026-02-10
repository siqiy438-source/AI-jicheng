import { FashionGeneratorPage } from "@/components/fashion/FashionGeneratorPage";
import { FASHION_MODEL_PROMPT } from "@/lib/fashion-prompts";

const FashionModelOutfit = () => {
  return (
    <FashionGeneratorPage
      title="服装模特搭配"
      subtitle="上传服装图片或文件，快速生成模特上身效果"
      iconSrc="/icons/ai-drawing-custom.png"
      basePrompt={FASHION_MODEL_PROMPT}
      resultAlt="服装模特搭配图"
      downloadPrefix="fashion-model-outfit"
    />
  );
};

export default FashionModelOutfit;
