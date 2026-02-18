import { CopywritingGeneratorPage } from "@/components/copywriting/CopywritingGeneratorPage";

const CopywritingProcess = () => (
  <CopywritingGeneratorPage
    title="晒过程文案"
    subtitle="展示制作、成长过程的幕后内容"
    iconSrc="/icons/ai-copywriting-custom.webp"
    agentId="process"
    placeholderText="描述你想展示的过程..."
    featureCode="ai_copywriting"
  />
);

export default CopywritingProcess;
