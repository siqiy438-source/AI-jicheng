import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingProcess = () => (
  <CopywritingGeneratorPage
    title="晒过程文案"
    subtitle="展示制作、成长过程的幕后内容"
    iconSrc="/icons/copywriting-process.png"
    agentId="process"
    placeholderText="把你想展示的事件/过程发给我..."
    featureCode="ai_copywriting"
    welcomeMessage="你好！把你想展示的事件或过程发给我，我来帮你写成一篇完整的短视频脚本。比如：'带大家看看我们后厨'、'收到差评后怎么处理的'、'一件衣服上架要经过哪些步骤'。"
  />
);

export default CopywritingProcess;
