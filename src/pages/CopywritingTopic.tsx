import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingTopic = () => (
  <CopywritingGeneratorPage
    title="选题引擎"
    subtitle="批量生成有吸引力的内容选题灵感"
    iconSrc="/icons/ai-copywriting-custom.webp"
    agentId="topic"
    placeholderText="说说你的行业和想要的选题方向..."
    featureCode="ai_copywriting"
    welcomeMessage="你好！我是你的选题引擎，专门帮你找到能火的内容选题。告诉我你的行业、目标人群和产品，我会帮你批量生成高流量选题方案。你最近在做什么类型的内容？"
  />
);

export default CopywritingTopic;
