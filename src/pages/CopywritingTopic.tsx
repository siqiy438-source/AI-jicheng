import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingTopic = () => (
  <CopywritingGeneratorPage
    title="选题引擎"
    subtitle="批量生成有吸引力的内容选题灵感"
    iconSrc="/icons/copywriting-topic.png"
    agentId="topic"
    placeholderText="说说你的行业和想要的选题方向..."
    featureCode="ai_copywriting"
    welcomeMessage="你好！我是你的选题引擎。在帮你出选题之前，我想先聊聊你的情况——你是做什么行业的？目标客户是谁？这样我才能给你真正合适的选题方案。"
  />
);

export default CopywritingTopic;
