import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingOpinion = () => (
  <CopywritingGeneratorPage
    title="讲观点文案"
    subtitle="输出有态度、有说服力的观点内容"
    iconSrc="/icons/ai-copywriting-custom.webp"
    agentId="opinion"
    placeholderText="说说你想聊的话题和你的立场..."
    featureCode="ai_copywriting"
    welcomeMessage="你好！我是观点型脚本生成器。在帮你写脚本之前，我想先聊聊——你想聊什么话题？站哪边？有什么想吐槽的？大胆说出来，我帮你把立场写成有传播力的内容。"
  />
);

export default CopywritingOpinion;
