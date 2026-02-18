import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingKnowledge = () => (
  <CopywritingGeneratorPage
    title="教知识文案"
    subtitle="把专业知识转化为通俗易懂的科普内容"
    iconSrc="/icons/ai-copywriting-custom.webp"
    agentId="knowledge"
    placeholderText="说说你想科普什么知识..."
    featureCode="ai_copywriting"
  />
);

export default CopywritingKnowledge;
