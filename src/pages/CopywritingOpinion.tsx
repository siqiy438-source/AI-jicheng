import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingOpinion = () => (
  <CopywritingGeneratorPage
    title="讲观点文案"
    subtitle="输出有态度、有说服力的观点内容"
    iconSrc="/icons/ai-copywriting-custom.webp"
    agentId="opinion"
    placeholderText="把你想讲的选题/观点发给我..."
    featureCode="ai_copywriting"
    welcomeMessage="你好！把你想讲的选题或观点发给我，我来帮你写成一篇完整的短视频脚本。比如：'买衣服不要只看价格，要看版型'、'实体店卖得贵就该倒闭'。"
  />
);

export default CopywritingOpinion;
