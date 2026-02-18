import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingStory = () => (
  <CopywritingGeneratorPage
    title="讲故事文案"
    subtitle="用叙事手法包装产品、品牌或经历"
    iconSrc="/icons/ai-copywriting-custom.webp"
    agentId="story"
    placeholderText="说说你想讲什么故事..."
    featureCode="ai_copywriting"
  />
);

export default CopywritingStory;
