import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingProcess = () => (
  <CopywritingGeneratorPage
    title="晒过程文案"
    subtitle="展示制作、成长过程的幕后内容"
    iconSrc="/icons/ai-copywriting-custom.webp"
    agentId="process"
    placeholderText="说说你的行业和想展示的过程..."
    featureCode="ai_copywriting"
    welcomeMessage="你好！我是晒过程脚本生成器。在帮你写脚本之前，我想先了解你的情况——你是做什么行业的？想展示什么过程？这样我才能帮你把幕后拆解成有看点的内容。"
  />
);

export default CopywritingProcess;
