import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingStoreVisit = () => (
  <CopywritingGeneratorPage
    title="到店理由文案"
    subtitle="提炼吸引顾客到店消费的核心理由"
    iconSrc="/icons/ai-copywriting-custom.webp"
    agentId="store_visit"
    placeholderText="说说你的店铺和想吸引的顾客..."
    featureCode="ai_copywriting"
    welcomeMessage="你好！我是到店理由脚本生成器，专门帮实体店设计引流内容。告诉我你的店铺类型、位置和 3-5 个真实优势，我来帮你写出让顾客想来的文案。"
  />
);

export default CopywritingStoreVisit;
