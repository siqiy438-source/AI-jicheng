import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingKnowledge = () => (
  <CopywritingGeneratorPage
    title="教知识文案"
    subtitle="把专业知识转化为通俗易懂的科普内容"
    iconSrc="/icons/ai-copywriting-custom.webp"
    agentId="knowledge"
    placeholderText="把你想教的知识点发给我..."
    featureCode="ai_copywriting"
    welcomeMessage="你好！把你想教的知识点发给我，我来帮你写成一篇完整的短视频脚本。比如：'3个识别面膜成分的方法'、'怎么选到不起球的毛衣'、'新手开车最容易犯的3个错误'。"
  />
);

export default CopywritingKnowledge;
