import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingStoreVisit = () => (
  <CopywritingGeneratorPage
    title="到店理由文案"
    subtitle="提炼吸引顾客到店消费的核心理由"
    iconSrc="/icons/copywriting-store-visit.png"
    agentId="store_visit"
    placeholderText="说说你的店铺类型和真实优势..."
    featureCode="ai_copywriting"
    welcomeMessage="你好！我是到店理由脚本生成器。在帮你写引流内容之前，我想先了解你的店——你是开什么店的？在哪里？有什么真实的优势？这样我才能帮你设计出让顾客真正想来的理由。"
  />
);

export default CopywritingStoreVisit;
