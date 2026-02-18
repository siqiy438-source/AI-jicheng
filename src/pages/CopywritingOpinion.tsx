import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingOpinion = () => (
  <CopywritingGeneratorPage
    title="讲观点文案"
    subtitle="输出有态度、有说服力的观点内容"
    iconSrc="/icons/ai-copywriting-custom.webp"
    agentId="opinion"
    placeholderText="说说你想表达的观点..."
    featureCode="ai_copywriting"
    welcomeMessage="你好！我是观点型脚本生成器，帮你把一个立场写成有说服力、有传播力的内容。你想聊什么话题？站哪边？大胆说出来！"
  />
);

export default CopywritingOpinion;
