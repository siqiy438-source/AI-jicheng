import { useState, useRef, useEffect } from "react";
import { FashionGeneratorPage, StyleOption } from "@/components/fashion/FashionGeneratorPage";
import { ChevronDown } from "lucide-react";
import {
  FASHION_PANTS_STUDIO_PROMPT,
  FASHION_PANTS_SCENE_PROMPT,
  FASHION_PANTS_MEN_STUDIO_PROMPT,
  FASHION_PANTS_MEN_SCENE_PROMPT,
  FASHION_PANTS_WOMEN_SIDE_PREFIX,
  FASHION_PANTS_WOMEN_HIP_PREFIX,
  FASHION_PANTS_MEN_SIDE_PREFIX,
  FASHION_PANTS_MEN_HIP_PREFIX,
  PANTS_TYPE_SILHOUETTE_PROMPTS,
  PANTS_FABRIC_REALISM_PROMPT,
  type PantsType,
} from "@/lib/fashion-prompts";
import { cn } from "@/lib/utils";

type Gender = "female" | "male";
type ViewAngle = "front" | "side" | "hip";

// ─── Style options per gender ────────────────────────────────────────────────

const womenPantsStyles: StyleOption[] = [
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

const menPantsStyles: StyleOption[] = [
  {
    id: "pants-men-studio",
    name: "简约棚拍",
    prompt: FASHION_PANTS_MEN_STUDIO_PROMPT,
    icon: "◻",
    description: "白墙灰地纯色棚拍背景，干净突出裤子版型",
  },
  {
    id: "pants-men-scene",
    name: "生活场景",
    prompt: FASHION_PANTS_MEN_SCENE_PROMPT,
    icon: "⌂",
    description: "楼梯、室内等真实场景，自然光有生活感",
  },
];

// ─── Prompt prefix builders ───────────────────────────────────────────────────

const buildWomenFrontPrefix = (_imageCount: number) =>
  `REFERENCE STYLE: Korean / Chinese women's fashion brand official product photography. Clean minimal gray studio. Fitted crop top exposing a small strip of midriff. Square-toe fishnet shoes. Model does not show face. Legs long and slim. Pants are the hero.

STRICT PANTS FRAMING RULES:
- The uploaded garment is PANTS ONLY (bottoms/trousers).
- CAMERA ANGLE: camera at waist/hip height (~75-90cm), perfectly level or very slightly upward tilt. DO NOT shoot downward from above — the camera must be low, at or below the waistband level.
- FRAMING: top edge of frame = 5-8cm above the waistband, showing the bottom hem of a fitted crop top and a narrow strip of bare midriff skin (approx 3-6cm). Bottom edge = both shoes fully in frame, soles near the bottom edge. Do NOT show chest, shoulders, or face.
- LEGS: both legs fill 85-90% of the frame width. Small amount of neutral background visible on both sides.

TOP — MUST BE A FITTED CROP STYLE:
- Auto-add a slim, tight-fitting crop top: long-sleeve round-neck fitted jersey (white, black, or cream) OR sleeveless fitted tank
- Length: ends 2-4cm above the waistband — exposing ONLY a small strip of bare skin just above the navel (approx 2-3cm). Do NOT show too much belly. The frame top edge cuts off just below the bust/chest — no chest or shoulders visible.
- FORBIDDEN: loose tops, hoodies, oversized shirts, anything that covers the waistband

SHOES — match pants style precisely. STRICTLY FEMININE only — NO fishnet shoes, NO dad shoes, NO chunky platform sneakers, NO masculine athletic shoes:
- Denim (straight/wide/flare) → white slim canvas sneakers (Converse/Veja style, thin flat sole) or white low-top ankle boots — casual and streetwear-appropriate
- Casual knit wide-leg / sweatpants / joggers → white or cream ballet flats or round-toe ribbon flats — soft and light
- Tailored wide-leg / trousers → nude or black slim-heel pumps or pointed kitten-heel ankle boots
- Cargo / harem / jogger → strappy sandals, ballet flats, or simple pointed-toe slip-ons

PANTS COLOR, SILHOUETTE, WAISTBAND/DRAWSTRING DETAIL must exactly match the uploaded image.

BACKGROUND: matte light gray wall + smooth light gray floor (floor slightly darker than wall). Clean, no props, no furniture, no clutter. Evenly lit with soft fill light.

PHOTO REALISM: indistinguishable from a real Korean brand product photoshoot. Natural depth of field, low saturation color grading.

FABRIC REALISM (critical — NO flat AI look):
- Knit/jersey pants: fine knit surface texture visible; fabric gently billows with volume; soft natural gravity folds hanging from hip to hem; side seam curves slightly inward
- Denim: diagonal twill grain visible; contrast topstitching; natural wash gradient; slight crease at inner thigh
- Tailored: fine weave under gentle tension; vertical center drape line; natural sheen
- ALL types: vertical gravity drape folds from hip to hem; slight horizontal compression crease at inner thigh; pocket tension; hem resting softly on shoe
- FORBIDDEN: fabric that looks flat, plastic, rubber, or uniformly smooth with zero texture

Model: East Asian / Chinese woman, slim, tall. Natural relaxed stance. Do NOT show face (frame cuts at waist/lower torso level).

HAND POSES — vary naturally, choose ONE of these (do NOT default to obvious hands-in-pockets every time):
- Both arms hang naturally at sides — hands barely visible or completely outside the frame
- One hand partially slipped into side pocket with ONLY 1-2 knuckles or fingertips visible at the pocket opening edge; the rest of the hand is hidden inside the pocket; other arm hangs naturally
- Both thumbs lightly hooked over the waistband, fingers resting against the pants exterior — minimal, relaxed
- One hand rests lightly at the hip/waistband with just the thumb visible; other arm hangs straight
- Fingertips of one hand barely peek out from a pocket; wrist and palm completely hidden; other arm natural

STRICTLY FORBIDDEN hand poses:
× Both full hands clearly visible and stuffed into pockets (palms showing)
× Arms crossed over chest
× Hands on hips (akimbo)
× Any exaggerated or posed-looking hand gesture`;

const buildMenFrontPrefix = (_imageCount: number) =>
  `STRICT PANTS FRAMING RULES (MEN'S):
- The uploaded garment is MEN'S PANTS ONLY (bottoms/trousers).
- CAMERA ANGLE: camera at chest/shoulder height (~150-165cm), tilted slightly downward (10-15 degrees). Gentle downward perspective — NOT bird's eye, NOT eye-level straight-on.
- FRAMING: frame starts at the waistband and ends at the shoes (both feet fully visible). Do NOT show belly, chest, or face.
- For staircase scenes: the model stands on the FLAT FLOOR at the bottom of the stairs. The staircase goes up behind him as background. He must NOT be standing ON the stairs.
- The pants must occupy the majority of the vertical frame.
- AUTO-ADD a men's top that complements the pants style — any style is fine (t-shirt, sweatshirt, button-up shirt), just ensure no exposed belly/midriff skin. The waistband should be visible at roughly 1/5 from the top of the frame.
- ZOOM IN VERY CLOSE: both legs together must fill 95%+ of the frame width. Almost zero empty space on the sides. Top edge = waistband, bottom edge = shoes just fitting in frame.
- AUTO-ADD men's shoes matched to pants type: denim jeans → white chunky sneakers, Air Force 1, or Old Skool canvas; casual sweatpants/joggers → athletic sneakers (Nike/Adidas style) or chunky dad shoes; tailored trousers → black or dark brown derby shoes, loafers, or oxford shoes; cargo/workwear pants → martin boots, low work boots, or canvas shoes.
- The pants COLOR, SILHOUETTE, and WAISTBAND DETAIL must exactly match the uploaded image.
- PHOTO REALISM: Must look exactly like a real camera photograph — natural depth of field, real fabric micro-texture, no AI smoothness artifacts. The result must be indistinguishable from a real product photoshoot.
- FABRIC REALISM (critical): Denim: visible twill weave grain; seams darker than panel center (natural wash); thigh/seat fade areas; contrast topstitching clearly visible; slight fraying at hem. Knit/cotton: fine knit surface texture; soft billowing silhouette; gentle side seam curvature. Tailored: fine weave texture; sharp center seam; natural drape sheen. ALL types: diagonal crease from inner thigh; vertical center drape line; knee horizontal fold; fabric gathering at pocket; hem stacking over shoe. NEVER: uniform flat color, plastic/rubber fabric look, zero-texture smooth AI surface.
- Model: East Asian / Chinese man, natural features, masculine build. STRICTLY FORBIDDEN: both hands in pockets at the same time. Must choose one of: (1) natural walking stride — one leg forward, weight shifted, arms swinging naturally; (2) one hand holding bag/tote strap, other hand relaxed; (3) one hand holding phone, other lightly in pocket; (4) one hand in pocket, other thumb hooked on belt/waistband; (5) hands loosely crossed at waist. Relaxed, lifestyle feel.
- Do NOT add outer coats, full tops, or any other clothing.`;

// ─── View angle config ────────────────────────────────────────────────────────

type ViewOption = {
  value: ViewAngle;
  label: string;
  hint: string;
  icon: string;
};

const VIEW_OPTIONS: ViewOption[] = [
  { value: "front", label: "正面上身", hint: "腰到脚完整展示", icon: "⬜" },
  { value: "side",  label: "侧面图",   hint: "侧缝廓形展示",   icon: "◧" },
  { value: "hip",   label: "臀围细节", hint: "后口袋/腰头工艺", icon: "🔍" },
];

// subtitle copy per view angle
const VIEW_SUBTITLES: Record<ViewAngle, string> = {
  front: "上传裤子图，生成腰到脚的模特上身效果图，突出版型和腿型",
  side:  "上传裤子图，生成侧面廓形效果图，展示裤腿侧缝线和版型轮廓",
  hip:   "上传裤子图，生成臀围细节特写，突出后口袋工艺和腰头细节",
};

// ─── Pants type selector ──────────────────────────────────────────────────────

const PANTS_TYPE_OPTIONS: { value: PantsType; label: string; hint: string }[] = [
  { value: "banana",   label: "香蕉裤", hint: "弧形内收" },
  { value: "wide-leg", label: "阔腿裤", hint: "垂直直筒" },
  { value: "straight", label: "直筒裤", hint: "笔直等宽" },
  { value: "cropped",  label: "九分裤", hint: "露出脚踝" },
  { value: "bootcut",  label: "微喇裤", hint: "膝下微扩" },
  { value: "barrel",   label: "弯刀裤", hint: "两头窄中间鼓" },
];

const PantsTypeSelector = ({
  value,
  onChange,
}: {
  value: PantsType | null;
  onChange: (v: PantsType | null) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selected = PANTS_TYPE_OPTIONS.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <p className="text-xs text-muted-foreground mb-2">裤型（可选）</p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between gap-1.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
          selected
            ? "border-orange-200 bg-orange-50/80 hover:bg-orange-100"
            : "border-border bg-transparent hover:border-orange-200 hover:bg-orange-50/40"
        )}
      >
        <div className="min-w-0 flex-1">
          {selected ? (
            <>
              <p className="text-sm font-medium text-orange-700 leading-tight truncate">{selected.label}</p>
              <p className="text-xs text-muted-foreground leading-tight truncate">{selected.hint}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground leading-tight truncate">未选择</p>
              <p className="text-xs text-muted-foreground leading-tight truncate hidden sm:block">AI 自动识别</p>
            </>
          )}
        </div>
        <ChevronDown className={cn("w-4 h-4 flex-shrink-0 transition-transform duration-200", selected ? "text-orange-600" : "text-muted-foreground", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-lg py-1 z-20 min-w-[180px] w-max max-w-[calc(100vw-2rem)] dropdown-panel">
          {/* 清除选项 */}
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            className={cn(
              "w-full flex items-start gap-2.5 px-3 py-3 md:py-2.5 hover:bg-secondary/50 active:bg-secondary transition-colors text-left touch-target",
              !value && "bg-orange-50"
            )}
          >
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-medium", !value ? "text-orange-700" : "text-foreground")}>
                自动识别
              </p>
              <p className="text-xs text-muted-foreground">AI 根据图片自动判断</p>
            </div>
          </button>

          <div className="border-t border-border/50 my-1" />

          {PANTS_TYPE_OPTIONS.map((opt) => {
            const active = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn(
                  "w-full flex items-start gap-2.5 px-3 py-3 md:py-2.5 hover:bg-secondary/50 active:bg-secondary transition-colors text-left touch-target",
                  active && "bg-orange-50"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-medium", active ? "text-orange-700" : "text-foreground")}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{opt.hint}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── UI Components ────────────────────────────────────────────────────────────

const GENDER_OPTIONS: { value: Gender; label: string; emoji: string; hint: string }[] = [
  { value: "female", label: "女裤", emoji: "👩", hint: "女款模特上身" },
  { value: "male",   label: "男裤", emoji: "👨", hint: "男款模特上身" },
];

const GenderToggle = ({
  value,
  onChange,
}: {
  value: Gender;
  onChange: (v: Gender) => void;
}) => (
  <div>
    <p className="text-xs text-muted-foreground mb-2">选择模特性别</p>
    <div className="flex gap-2">
      {GENDER_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all duration-200 flex-1",
              active
                ? "border-orange-400 bg-orange-50 shadow-sm"
                : "border-border bg-transparent hover:border-orange-200 hover:bg-orange-50/40"
            )}
          >
            <span className="text-base leading-none">{opt.emoji}</span>
            <div>
              <p className={cn("text-sm font-medium leading-tight", active ? "text-orange-700" : "text-foreground")}>
                {opt.label}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{opt.hint}</p>
            </div>
            {active && (
              <span className="ml-auto w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

const ViewAngleSelector = ({
  value,
  onChange,
}: {
  value: ViewAngle;
  onChange: (v: ViewAngle) => void;
}) => (
  <div>
    <p className="text-xs text-muted-foreground mb-2">拍摄视角</p>
    <div className="flex gap-2">
      {VIEW_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex flex-col gap-0.5 px-2.5 py-2 rounded-xl border text-left transition-all duration-200 flex-1",
              active
                ? "border-orange-400 bg-orange-50 shadow-sm"
                : "border-border bg-transparent hover:border-orange-200 hover:bg-orange-50/40"
            )}
          >
            <p className={cn("text-xs font-medium leading-tight", active ? "text-orange-700" : "text-foreground")}>
              {opt.label}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">{opt.hint}</p>
          </button>
        );
      })}
    </div>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const FashionPants = () => {
  const [gender, setGender] = useState<Gender>("female");
  const [viewAngle, setViewAngle] = useState<ViewAngle>("front");
  const [pantsType, setPantsType] = useState<PantsType | null>(null);

  const styleOptions = gender === "female" ? womenPantsStyles : menPantsStyles;
  const basePrompt = gender === "female" ? FASHION_PANTS_STUDIO_PROMPT : FASHION_PANTS_MEN_STUDIO_PROMPT;

  const buildBasePrefix = (): string => {
    if (viewAngle === "side") {
      return gender === "female" ? FASHION_PANTS_WOMEN_SIDE_PREFIX : FASHION_PANTS_MEN_SIDE_PREFIX;
    }
    if (viewAngle === "hip") {
      return gender === "female" ? FASHION_PANTS_WOMEN_HIP_PREFIX : FASHION_PANTS_MEN_HIP_PREFIX;
    }
    return gender === "female" ? buildWomenFrontPrefix(1) : buildMenFrontPrefix(1);
  };

  const promptPrefixBuilder = (_imageCount: number): string => {
    const basePrefix = buildBasePrefix();
    if (!pantsType) return `${PANTS_FABRIC_REALISM_PROMPT}\n\n${basePrefix}`;
    const silhouetteSpec = PANTS_TYPE_SILHOUETTE_PROMPTS[pantsType];
    return `${silhouetteSpec}\n\n${PANTS_FABRIC_REALISM_PROMPT}\n\n${basePrefix}`;
  };

  // Side/hip views don't have meaningful background style variations, so hide
  // the style selector for those to avoid confusing the user.
  // Also, for side/hip views we leave basePrompt empty so the promptPrefixBuilder
  // provides the COMPLETE framing instructions without conflicting front-view rules
  // from the studio/scene prompts being appended after.
  const activeStyleOptions = viewAngle === "front" ? styleOptions : undefined;
  const activeBasePrompt = viewAngle === "front" ? basePrompt : "";

  return (
    <FashionGeneratorPage
      key={`${gender}-${viewAngle}`}
      title="裤子上身效果"
      subtitle={VIEW_SUBTITLES[viewAngle]}
      iconSrc="/icons/fashion-pants-custom.png"
      basePrompt={activeBasePrompt}
      styleOptions={activeStyleOptions}
      styleSelectorVariant="cards"
      resultAlt="裤子上身效果图"
      downloadPrefix="fashion-pants"
      featureCodePrefix="ai_fashion"
      minImages={1}
      maxImages={1}
      uploadHint="只需上传裤子图片，AI 会自动配搭上衣和鞋子。"
      emptyStateHint="上传裤子图片，选择拍摄视角，开始生成"
      promptPrefixBuilder={promptPrefixBuilder}
      extraCardContent={
        <div className="flex flex-col gap-3">
          <GenderToggle value={gender} onChange={setGender} />
          <ViewAngleSelector value={viewAngle} onChange={setViewAngle} />
        </div>
      }
      styleAreaSiblingContent={
        <PantsTypeSelector value={pantsType} onChange={setPantsType} />
      }
    />
  );
};

export default FashionPants;
