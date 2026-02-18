import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingTopic = () => (
  <CopywritingGeneratorPage
    title="选题引擎"
    subtitle="批量生成有吸引力的内容选题灵感"
    iconSrc="/icons/ai-copywriting-custom.webp"
    agentId="topic"
    placeholderText="说说你的行业和想要的选题方向..."
    featureCode="ai_copywriting"
  />
);

export default CopywritingTopic;
