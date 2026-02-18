import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingStory = () => (
  <CopywritingGeneratorPage
    title="讲故事文案"
    subtitle="用叙事手法包装产品、品牌或经历"
    iconSrc="/icons/copywriting-story.png"
    agentId="story"
    placeholderText="把你想讲的故事/经历发给我..."
    featureCode="ai_copywriting"
    welcomeMessage="你好！把你想讲的故事或经历发给我，我来帮你写成一篇完整的短视频脚本。不用整理，像聊天一样说出来就行。比如：'我从负债300万到开了3家店'、'帮客户做策划5天卖了9吨货'。"
  />
);

export default CopywritingStory;
