import { useState, useMemo } from "react";
import { FashionGeneratorPage, StyleOption } from "@/components/fashion/FashionGeneratorPage";
import {
  FASHION_MODEL_MIRROR_SELFIE_PROMPT,
  FASHION_MODEL_STANDARD_PROMPT,
  FASHION_MODEL_FACELESS_HALF_PROMPT,
  FASHION_MODEL_FACELESS_FULL_PROMPT,
  FASHION_MODEL_INDOOR_PROMPT,
  MODEL_FACE_DESCRIPTION,
  MODEL_POSE_AND_GESTURE,
  AGE_CHARACTERISTICS,
  SCENE_DESCRIPTIONS,
  type Age,
  type Scene,
} from "@/lib/fashion-prompts";
import { cn } from "@/lib/utils";

const buildModelPromptPrefix = (imageCount: number) => `STRICT MODEL RULES:
- There are ${imageCount} uploaded garment reference image${imageCount === 1 ? "" : "s"}.
- Use all uploaded garments and only the uploaded garments in the final look.
- If 1 garment is uploaded, create a single-garment styling photo only.
- If 2 garments are uploaded, create a two-piece outfit only.
- If 3 garments are uploaded, create a three-piece outfit only.
- Never invent or add extra clothing. Do not add outerwear unless an outerwear reference image is uploaded.
- Shoes, bags, jewelry, belts, and other accessories may be added only as styling accessories.
- The model must be an East Asian / Chinese woman only, with realistic East Asian features and natural East Asian skin tone.
- Do not depict Black, White, mixed-race, or other non-East-Asian model features.
- Keep the original default face identity and the original camera angle / framing style of the selected mode. Do not change the established face template or viewpoint.
- Hair can be adjusted to match the outfit style, such as a neat bun, ponytail, straight hair, or soft waves, but the face identity should remain stable.`;

// ─── Age Selector Component ───────────────────────────────────────────────────

const AGE_OPTIONS: { value: Age; label: string; hint: string; emoji: string }[] = [
  { value: "20-25", label: "20-25岁", hint: "青春活力", emoji: "🌸" },
  { value: "25-30", label: "25-30岁", hint: "年轻成熟", emoji: "✨" },
  { value: "30-35", label: "30-35岁", hint: "优雅知性", emoji: "💎" },
  { value: "35-40", label: "35-40岁", hint: "成熟魅力", emoji: "👑" },
];

const AgeSelector = ({
  value,
  onChange,
}: {
  value: Age;
  onChange: (v: Age) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = AGE_OPTIONS.find(opt => opt.value === value);

  return (
    <div>
      <p className="text-sm font-medium mb-2">选择模特年龄</p>
      <div className="space-y-2">
        {/* Selected option display */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-orange-400 bg-orange-50 text-left transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg leading-none">{selectedOption?.emoji}</span>
            <div>
              <p className="text-sm font-medium text-orange-700">{selectedOption?.label}</p>
              <p className="text-xs text-muted-foreground">{selectedOption?.hint}</p>
            </div>
          </div>
          <svg
            className={cn("w-4 h-4 text-orange-700 transition-transform flex-shrink-0", isOpen && "rotate-180")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown options */}
        {isOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AGE_OPTIONS.map((opt) => {
              const active = value === opt.value;
              if (active) return null; // Don't show selected option in dropdown
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-transparent hover:border-orange-200 hover:bg-orange-50/40 active:scale-[0.98] text-left transition-all duration-200"
                >
                  <span className="text-base sm:text-lg leading-none">{opt.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{opt.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{opt.hint}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Scene Selector Component ─────────────────────────────────────────────────

const SCENE_OPTIONS: { value: Scene; label: string; hint: string; emoji: string }[] = [
  { value: "indoor", label: "室内", hint: "简约中性背景", emoji: "🏠" },
  { value: "cafe", label: "咖啡店", hint: "温馨休闲氛围", emoji: "☕" },
  { value: "bookstore", label: "书店", hint: "文艺知性背景", emoji: "📚" },
  { value: "beach", label: "海边", hint: "清新自然风光", emoji: "🌊" },
];

const SceneSelector = ({
  value,
  onChange,
}: {
  value: Scene;
  onChange: (v: Scene) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = SCENE_OPTIONS.find(opt => opt.value === value);

  return (
    <div>
      <p className="text-sm font-medium mb-2">选择拍摄场景</p>
      <div className="space-y-2">
        {/* Selected option display */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-orange-400 bg-orange-50 text-left transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl leading-none">{selectedOption?.emoji}</span>
            <div>
              <p className="text-sm font-medium text-orange-700">{selectedOption?.label}</p>
              <p className="text-xs text-muted-foreground">{selectedOption?.hint}</p>
            </div>
          </div>
          <svg
            className={cn("w-4 h-4 text-orange-700 transition-transform flex-shrink-0", isOpen && "rotate-180")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown options */}
        {isOpen && (
          <div className="grid grid-cols-3 gap-2">
            {SCENE_OPTIONS.map((opt) => {
              const active = value === opt.value;
              if (active) return null; // Don't show selected option in dropdown
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-1 px-2 py-3 rounded-xl border border-border bg-transparent hover:border-orange-200 hover:bg-orange-50/40 active:scale-[0.98] text-center transition-all duration-200 min-h-[80px]"
                >
                  <span className="text-2xl sm:text-3xl leading-none">{opt.emoji}</span>
                  <p className="text-xs font-medium leading-tight">{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{opt.hint}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const FashionModelOutfit = () => {
  const [age, setAge] = useState<Age>("25-30");
  const [scene, setScene] = useState<Scene>("cafe");
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);

  // Build dynamic prompt for standard model style
  const buildStandardModelPrompt = (ageValue: Age, sceneValue: Scene): string => {
    const ageChar = AGE_CHARACTERISTICS[ageValue];
    const sceneDesc = SCENE_DESCRIPTIONS[sceneValue];

    return FASHION_MODEL_STANDARD_PROMPT
      .replace('{age}', ageValue)
      .replace('{age_characteristics}', ageChar)
      .replace('{model_face_description}', MODEL_FACE_DESCRIPTION)
      .replace('{model_pose_and_gesture}', MODEL_POSE_AND_GESTURE)
      .replace('{scene_description}', sceneDesc);
  };

  // Dynamically build modelStyles with updated standard model prompt
  const modelStyles: StyleOption[] = useMemo(() => [
    {
      id: "mirror-selfie",
      name: "对镜自拍",
      prompt: FASHION_MODEL_MIRROR_SELFIE_PROMPT,
      iconSrc: "/icons/model-selfie-vintage.png",
      description: "手机挡脸的镜前全身自拍，日常博主同款氛围",
    },
    {
      id: "standard-model",
      name: "标准模特图",
      prompt: buildStandardModelPrompt(age, scene),
      iconSrc: "/icons/model-standard-vintage.png",
      description: "常规时尚模特上身图，适合通用服装展示",
    },
    {
      id: "faceless-half",
      name: "氛围半身图",
      prompt: FASHION_MODEL_FACELESS_HALF_PROMPT,
      icon: "✦",
      description: "不露脸半身图，展示叠穿层次与整体搭配氛围",
    },
    {
      id: "faceless-full",
      name: "氛围近景图",
      prompt: FASHION_MODEL_FACELESS_FULL_PROMPT,
      icon: "◈",
      description: "1.5倍焦距特写，怼近拍面料质感和细节，衣服填满画面",
    },
    {
      id: "indoor-model",
      name: "室内模特图",
      prompt: FASHION_MODEL_INDOOR_PROMPT,
      icon: "⌂",
      description: "平整室内背景+自然抓拍动作，强调整体上身和真实氛围",
    },
  ], [age, scene]);

  // Show age/scene selectors only for standard model style
  const showSelectors = selectedStyleId === "standard-model";

  return (
    <FashionGeneratorPage
      title="模特生成"
      subtitle="上传服装图片，支持五种风格：自拍、模特、氛围半身、氛围近景、室内模特"
      iconSrc="/icons/fashion-model-custom.webp"
      basePrompt={FASHION_MODEL_MIRROR_SELFIE_PROMPT}
      styleOptions={modelStyles}
      styleSelectorVariant="cards"
      resultAlt="模特生成图"
      downloadPrefix="fashion-model-outfit"
      featureCodePrefix="ai_fashion"
      maxImages={3}
      uploadHint="上传服装参考图后，可根据不同风格生成更自然的模特上身效果。"
      emptyStateHint="先上传服装照片，再添加补充说明（可选）开始创作"
      promptPrefixBuilder={buildModelPromptPrefix}
      onStyleChange={(styleId) => setSelectedStyleId(styleId)}
      extraCardContent={
        showSelectors ? (
          <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-border">
            <AgeSelector value={age} onChange={setAge} />
            <SceneSelector value={scene} onChange={setScene} />
          </div>
        ) : null
      }
    />
  );
};

export default FashionModelOutfit;
