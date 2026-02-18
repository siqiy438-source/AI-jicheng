import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingStory = () => (
  <CopywritingGeneratorPage
    title="讲故事文案"
    subtitle="用叙事手法包装产品、品牌或经历"
    iconSrc="/icons/ai-copywriting-custom.webp"
    agentId="story"
    placeholderText="说说你想讲什么故事..."
    featureCode="ai_copywriting"
    welcomeMessage="你好！我是故事型脚本生成器，帮你把个人经历或客户案例变成有感染力的故事内容。你有什么故事素材想分享？比如创业经历、客户反馈、产品背后的故事都可以。"
  />
);

export default CopywritingStory;
