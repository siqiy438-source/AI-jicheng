import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingOpinion = () => (
  <CopywritingGeneratorPage
    title="讲观点文案"
    subtitle="输出有态度、有说服力的观点内容"
    iconSrc="/icons/ai-copywriting-custom.webp"
    agentId="opinion"
    placeholderText="说说你想表达的观点..."
    featureCode="ai_copywriting"
  />
);

export default CopywritingOpinion;
