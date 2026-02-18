import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingKnowledge = () => (
  <CopywritingGeneratorPage
    title="教知识文案"
    subtitle="把专业知识转化为通俗易懂的科普内容"
    iconSrc="/icons/ai-copywriting-custom.webp"
    agentId="knowledge"
    placeholderText="说说你想科普什么知识..."
    featureCode="ai_copywriting"
    welcomeMessage="你好！我是教知识脚本生成器，擅长把专业知识变成用户爱看、易懂、愿意收藏的科普内容。告诉我你想教什么知识，目标人群是谁？"
  />
);

export default CopywritingKnowledge;
