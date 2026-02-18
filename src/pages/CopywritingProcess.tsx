import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingProcess = () => (
  <CopywritingGeneratorPage
    title="晒过程文案"
    subtitle="展示制作、成长过程的幕后内容"
    iconSrc="/icons/ai-copywriting-custom.webp"
    agentId="process"
    placeholderText="描述你想展示的过程..."
    featureCode="ai_copywriting"
    welcomeMessage="你好！我是晒过程脚本生成器，擅长把工作幕后拆解成有看点的内容。你想展示什么过程？比如产品制作、打包发货、店铺日常都可以聊聊。"
  />
);

export default CopywritingProcess;
