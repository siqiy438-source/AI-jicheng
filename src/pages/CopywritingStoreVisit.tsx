import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingStoreVisit = () => (
  <CopywritingGeneratorPage
    title="到店理由文案"
    subtitle="提炼吸引顾客到店消费的核心理由"
    iconSrc="/icons/ai-copywriting-custom.webp"
    agentId="store_visit"
    placeholderText="说说你的店铺和想吸引的顾客..."
    featureCode="ai_copywriting"
  />
);

export default CopywritingStoreVisit;
