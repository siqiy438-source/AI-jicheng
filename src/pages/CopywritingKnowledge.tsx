import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingKnowledge = () => (
  <CopywritingGeneratorPage
    title="教知识文案"
    subtitle="把专业知识转化为通俗易懂的科普内容"
    iconSrc="/icons/ai-copywriting-custom.webp"
    agentId="knowledge"
    placeholderText="说说你的行业和想教的知识..."
    featureCode="ai_copywriting"
    welcomeMessage="你好！我是教知识脚本生成器。在帮你写脚本之前，我想先聊聊你的情况——你是做什么行业的？想教用户什么知识？这样我才能帮你写出真正让人「学到了」的内容。"
  />
);

export default CopywritingKnowledge;
