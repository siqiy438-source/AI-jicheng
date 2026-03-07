import { FashionGeneratorPage, StyleOption } from "@/components/fashion/FashionGeneratorPage";
import {
  FASHION_PANTS_STUDIO_PROMPT,
  FASHION_PANTS_SCENE_PROMPT,
} from "@/lib/fashion-prompts";

const pantsStyles: StyleOption[] = [
  {
    id: "pants-studio",
    name: "简约棚拍",
    prompt: FASHION_PANTS_STUDIO_PROMPT,
    icon: "◻",
    description: "白墙灰地纯色棚拍背景，干净突出裤子版型",
  },
  {
    id: "pants-scene",
    name: "生活场景",
    prompt: FASHION_PANTS_SCENE_PROMPT,
    icon: "⌂",
    description: "楼梯、室内等真实场景，自然光有生活感",
  },
];

const buildPantsPromptPrefix = (_imageCount: number) =>
  `STRICT PANTS FRAMING RULES:
- The uploaded garment is PANTS ONLY (bottoms/trousers).
- CAMERA ANGLE: camera at chest/shoulder height (~130-150cm), tilted slightly downward (10-15 degrees). Gentle downward perspective — NOT bird's eye, NOT eye-level straight-on.
- FRAMING: frame starts at the waistband and ends at the shoes (both feet fully visible). Do NOT show belly, chest, or face.
- For staircase scenes: the model stands on the FLAT FLOOR at the bottom of the stairs. The staircase goes up behind her as background. She must NOT be standing ON the stairs.
- The pants must occupy the majority of the vertical frame.
- AUTO-ADD a top that complements the pants style — any style is fine, just ensure no exposed belly/midriff skin. The waistband should be visible at roughly 1/5 from the top of the frame.
- ZOOM IN VERY CLOSE: both legs together must fill 95%+ of the frame width. Almost zero empty space on the sides. Top edge = waistband, bottom edge = shoes just fitting in frame.
- AUTO-ADD shoes matched to pants type: denim (straight/wide/flare) → white chunky sneakers or bread shoes; casual knit wide-leg/sweatpants → fishnet shoes (mesh open-toe low heels, black or white); tailored wide-leg trousers → loafers, pointed leather shoes, or mary janes; harem/jogger/cargo pants → simple sandals or canvas shoes.
- The pants COLOR, SILHOUETTE, and WAISTBAND DETAIL must exactly match the uploaded image.
- PHOTO REALISM: Must look exactly like a real camera photograph — natural depth of field, real fabric micro-texture, no AI smoothness artifacts. The result must be indistinguishable from a real product photoshoot.
- FABRIC REALISM (critical): Denim: visible twill weave grain; seams darker than panel center (natural wash); thigh/seat fade areas; contrast topstitching clearly visible; slight fraying at hem. Knit/cotton: fine knit surface texture; soft billowing silhouette; gentle side seam curvature. Tailored: fine weave texture; sharp center seam; natural drape sheen. ALL types: diagonal crease from inner thigh; vertical center drape line; knee horizontal fold; fabric gathering at pocket; hem stacking over shoe. NEVER: uniform flat color, plastic/rubber fabric look, zero-texture smooth AI surface.
- Model: East Asian / Chinese woman, natural features. STRICTLY FORBIDDEN: both hands in pockets at the same time. Must choose one of: (1) natural walking stride — one leg forward, weight shifted, arms swinging naturally; (2) one hand holding small bag/tote strap, other hand relaxed; (3) one hand holding phone or coffee cup, other lightly in pocket; (4) one hand in pocket, other thumb hooked on belt/waistband; (5) hands loosely crossed at waist. Relaxed, lifestyle feel.
- Do NOT add outer coats, full tops, or any other clothing.`;

const FashionPants = () => {
  return (
    <FashionGeneratorPage
      title="裤子上身效果"
      subtitle="上传裤子图，生成腰到脚的模特上身效果图，突出版型和腿型"
      iconSrc="/icons/fashion-outfit-custom.webp"
      basePrompt={FASHION_PANTS_STUDIO_PROMPT}
      styleOptions={pantsStyles}
      styleSelectorVariant="cards"
      resultAlt="裤子上身效果图"
      downloadPrefix="fashion-pants"
      featureCodePrefix="ai_fashion"
      minImages={1}
      maxImages={1}
      uploadHint="只需上传裤子图片，AI 会自动配搭短上衣和鞋子。"
      emptyStateHint="上传裤子图片，选择背景风格，开始生成"
      promptPrefixBuilder={buildPantsPromptPrefix}
    />
  );
};

export default FashionPants;
