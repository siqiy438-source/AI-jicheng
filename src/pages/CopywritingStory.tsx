import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingStory = () => (
  <CopywritingGeneratorPage
    title="讲故事文案"
    subtitle="用叙事手法包装产品、品牌或经历"
    iconSrc="/icons/ai-copywriting-custom.webp"
    agentId="story"
    placeholderText="说说你的行业和想讲的经历..."
    featureCode="ai_copywriting"
    welcomeMessage="你好！我是故事型脚本生成器。在帮你写脚本之前，我想先听听你的经历——你是做什么行业的？有什么故事想讲？不用整理，像聊天一样说出来就行。"
  />
);

export default CopywritingStory;
