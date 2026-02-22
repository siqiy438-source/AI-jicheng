import type { OutfitCombination, OutfitRecommendResult } from "./outfit-recommend";

type OutfitAnchorType = "inner_top" | "outerwear" | "bottom" | "dress" | "unknown";

interface StyleMethodology {
  name: string;
  keywords: string[];
  vibe: string;
  silhouette: string;
  color: string;
  material: string;
  pattern: string;
  accessory: string;
  layeringFormula: string;
  scene: string;
  avoid: string;
}

interface MainStyleTaxonomy {
  mainStyle: string;
  defaultGenes: [string, string];
  keywords: string[];
}

export interface NormalizedStyleProfile {
  mainStyle: string;
  styleGene: string;
  displayLabel: string;
  rankedStyles: string[];
}

const MAIN_STYLE_TAXONOMY: MainStyleTaxonomy[] = [
  {
    mainStyle: "韩系休闲",
    defaultGenes: ["自然型", "少女型"],
    keywords: ["韩系", "休闲", "慵懒", "学院", "甜酷", "街头韩", "清冷韩"],
  },
  {
    mainStyle: "都市极简",
    defaultGenes: ["知性型", "少年型"],
    keywords: ["极简", "都市", "简约", "通勤", "干练", "线条感", "less is more"],
  },
  {
    mainStyle: "老钱风",
    defaultGenes: ["知性型", "优雅型"],
    keywords: ["老钱", "old money", "轻奢", "贵气", "经典", "低调奢华", "学院贵族"],
  },
  {
    mainStyle: "新中式",
    defaultGenes: ["知性型", "优雅型"],
    keywords: ["新中式", "中式", "国风", "东方", "汉元素", "中式改良"],
  },
  {
    mainStyle: "法式慵懒",
    defaultGenes: ["自然型", "优雅型"],
    keywords: ["法式", "慵懒", "法式松弛", "复古法", "轻法式", "巴黎感"],
  },
  {
    mainStyle: "温柔淑女",
    defaultGenes: ["优雅型", "少女型"],
    keywords: ["淑女", "温柔", "优雅", "轻熟", "气质", "柔美", "甜美优雅"],
  },
];

const STYLE_METHODS: StyleMethodology[] = [
  {
    name: "韩系休闲",
    keywords: ["韩系", "休闲", "慵懒", "少女", "甜酷", "学院"],
    vibe: "Relaxed, layered, youthful, effortless city casual.",
    silhouette: "H-shape, slightly loose, natural drape, no rigid fit.",
    color: "Neutral + low-saturation accents, clean layering contrast.",
    material: "Comfort-first cotton, knit, soft suiting, light texture mix.",
    pattern: "Minimal logo/stripes/simple geometric details only.",
    accessory: "Simple earring, shoulder bag/tote, cap or lightweight scarf.",
    layeringFormula: "inner + outer + bottom + shoes + one functional accessory",
    scene: "Urban cafe street, commuting, weekend city walk.",
    avoid: "No over-formal business styling, no heavy dramatic accessories.",
  },
  {
    name: "都市极简",
    keywords: ["极简", "都市", "简约", "通勤", "知性", "干练"],
    vibe: "Less-is-more, sharp and calm, premium clean-city minimalism.",
    silhouette: "Straight H/T silhouettes with clear lines and clean structure.",
    color: "Low-saturation neutral base: black, white, gray, camel, navy.",
    material: "High-quality natural materials with subtle texture contrast.",
    pattern: "No heavy print, only restrained geometric/stripe if needed.",
    accessory: "Architectural bag, minimal jewelry, pointed shoes/loafers.",
    layeringFormula: "clean base layer + structured outer + straight bottom",
    scene: "Gallery, modern office, quiet luxury indoor space.",
    avoid: "No cute decorative overload, no noisy color blocks.",
  },
  {
    name: "老钱风",
    keywords: ["老钱", "Old Money", "轻奢", "贵气", "学院贵族", "经典"],
    vibe: "Understated luxury, heritage calmness, high-quality restraint.",
    silhouette: "Tailored but comfortable, straight and slightly relaxed fit.",
    color: "Ivory, camel, navy, brown, charcoal, low-saturation tones.",
    material: "Natural premium textures: wool, cashmere, linen, silk blends.",
    pattern: "Very restrained stripe/check texture, avoid bold statement print.",
    accessory: "Pearl or fine metal details, leather bag, slim belt/watch.",
    layeringFormula: "premium inner + tailored outer + classic bottom + leather accessory",
    scene: "Quiet upscale interior, club-like neutral setting.",
    avoid: "No flashy logo, no streetwear chaos, no overexposed neon colors.",
  },
  {
    name: "新中式",
    keywords: ["新中式", "中式", "国风", "东方", "中国风"],
    vibe: "Modern East aesthetic: restrained, elegant, contemporary heritage.",
    silhouette: "Straight or softly structured silhouettes, light layering rhythm.",
    color: "Neutral base with one Chinese-classic accent tone if needed.",
    material: "Natural fabrics with texture depth: silk-like, linen-like, cotton blend.",
    pattern: "Subtle oriental motifs only, keep modern and minimal.",
    accessory: "Refined oriental-inspired detail pieces, no costume drama styling.",
    layeringFormula: "modern base + one East-aesthetic layer + clean lower silhouette",
    scene: "Modern Chinese interior, tea-space, textured clean background.",
    avoid: "No theatrical costume look, no heavy opera-style makeup props.",
  },
  {
    name: "法式慵懒",
    keywords: ["法式", "慵懒", "巴黎", "复古法", "轻法式"],
    vibe: "Relaxed French chic, soft elegance with effortless drape.",
    silhouette: "H/X balance, relaxed shoulder line, soft waist emphasis.",
    color: "Low-saturation cream, beige, mocha, olive and muted navy accents.",
    material: "Soft knit, textured cotton, drapey woven fabrics, subtle luster.",
    pattern: "Small floral, fine stripe, restrained vintage motifs only.",
    accessory: "Light gold jewelry, compact leather bag, low-heel or ballet shoes.",
    layeringFormula: "soft inner + light outer + clean bottom + delicate accessory",
    scene: "Daylight cafe, old-city street corner, refined warm interior.",
    avoid: "No exaggerated court-style costume details, no aggressive contrast.",
  },
  {
    name: "温柔淑女",
    keywords: ["淑女", "温柔", "优雅", "法式", "知性", "轻熟", "气质"],
    vibe: "Soft, refined, feminine, approachable elegance.",
    silhouette: "X/H balance, clean waist hint, smooth proportion and line.",
    color: "Soft palette with one depth anchor (light + deep pairing).",
    material: "Soft-touch knit, refined chiffon/satin-like blend, light drape.",
    pattern: "Small-scale pattern only, avoid large loud motifs.",
    accessory: "Delicate jewelry, compact bag, refined low-heel shoes.",
    layeringFormula: "soft inner + elegant outer + clean bottom + delicate accessories",
    scene: "Soft daylight interior, refined cafe or boutique-like corner.",
    avoid: "No hard street style clashes, no aggressive contrast styling.",
  },
];

const GENE_KEYWORDS: Array<{ gene: string; keywords: string[] }> = [
  { gene: "自然型", keywords: ["自然", "慵懒", "松弛", "休闲", "随性"] },
  { gene: "优雅型", keywords: ["优雅", "淑女", "法式", "精致", "贵气", "高级"] },
  { gene: "知性型", keywords: ["知性", "通勤", "职场", "干练", "理性"] },
  { gene: "少女型", keywords: ["少女", "甜", "可爱", "学院", "俏皮"] },
  { gene: "少年型", keywords: ["少年", "中性", "利落", "直线", "极简"] },
  { gene: "性感型", keywords: ["性感", "曲线", "修身", "妩媚"] },
];

const normalizeCategory = (category: string) => category.replace(/\s+/g, "").toLowerCase();

const countKeywordHits = (text: string, keywords: string[]) =>
  keywords.reduce((score, keyword) => (text.includes(keyword.toLowerCase()) ? score + 1 : score), 0);

const extractStyleGenes = (text: string, fallback: [string, string]): [string, string] => {
  const scored = GENE_KEYWORDS.map((item) => ({
    gene: item.gene,
    score: countKeywordHits(text, item.keywords),
  })).sort((a, b) => b.score - a.score);

  const picked = scored.filter((item) => item.score > 0).slice(0, 2).map((item) => item.gene);
  if (picked.length >= 2) return [picked[0], picked[1]];
  if (picked.length === 1) return [picked[0], fallback[1] === picked[0] ? fallback[0] : fallback[1]];
  return fallback;
};

export const resolveOutfitStyleProfile = (result: OutfitRecommendResult): NormalizedStyleProfile => {
  const textPool = [
    result.inputAnalysis.style,
    result.productProfile?.styleTags || "",
    ...result.combinations.map((combo) => `${combo.name} ${combo.theme} ${combo.matchingLogic || ""}`),
  ]
    .join(" ")
    .toLowerCase();

  const scoredStyles = MAIN_STYLE_TAXONOMY.map((item) => ({
    ...item,
    score: countKeywordHits(textPool, item.keywords),
  })).sort((a, b) => b.score - a.score);

  const main = scoredStyles[0]?.score > 0 ? scoredStyles[0] : MAIN_STYLE_TAXONOMY[1];
  const styleGenes = extractStyleGenes(textPool, main.defaultGenes);
  const styleGene = `${styleGenes[0]}+${styleGenes[1]}`;

  const rankedStyles = [
    main.mainStyle,
    ...scoredStyles.map((item) => item.mainStyle).filter((style) => style !== main.mainStyle),
  ];

  return {
    mainStyle: main.mainStyle,
    styleGene,
    displayLabel: `${main.mainStyle}｜${styleGene}`,
    rankedStyles,
  };
};

export const applyStyleProfileToResult = (
  result: OutfitRecommendResult,
  profile: NormalizedStyleProfile,
): OutfitRecommendResult => {
  if (!result.productProfile) return result;
  return {
    ...result,
    productProfile: {
      ...result.productProfile,
      styleTags: profile.displayLabel,
    },
  };
};

const inferAnchorType = (itemType: string): OutfitAnchorType => {
  const normalized = normalizeCategory(itemType);

  if (
    /内搭|打底|背心|吊带|衬衫|t恤|针织衫|毛衣|上衣|blouse|shirt|top/.test(normalized)
  ) {
    return "inner_top";
  }

  if (/外套|西装|风衣|大衣|夹克|开衫|coat|jacket|blazer/.test(normalized)) {
    return "outerwear";
  }

  if (/裤|裙|下装|牛仔|半身裙|短裤|pants|trousers|skirt/.test(normalized)) {
    return "bottom";
  }

  if (/连衣裙|裙装|dress/.test(normalized)) {
    return "dress";
  }

  return "unknown";
};

const getStructureRules = (anchorType: OutfitAnchorType): string[] => {
  if (anchorType === "inner_top") {
    return [
      "Uploaded item is INNER TOP. You MUST add a clearly visible OUTERWEAR layer.",
      "Final look must contain: inner top + outerwear + bottom + shoes + bag/accessory.",
      "Outerwear must be visible from shoulder/chest to at least hip area.",
    ];
  }

  if (anchorType === "outerwear") {
    return [
      "Uploaded item is OUTERWEAR. You MUST add inner top and bottom.",
      "Final look must contain: outerwear + inner top + bottom + shoes + bag/accessory.",
      "Inner top must be visible at neckline/chest/cuff or hem for clear layering.",
    ];
  }

  if (anchorType === "bottom") {
    return [
      "Uploaded item is BOTTOM. You MUST add complete top styling.",
      "Final look must contain: top layer(s) + bottom + shoes + bag/accessory.",
      "If style requires layering, add a lightweight outer layer.",
    ];
  }

  if (anchorType === "dress") {
    return [
      "Uploaded item is DRESS. Keep dress as visual core.",
      "Add shoes + bag/accessory, and optional outerwear based on style.",
      "Do not hide dress silhouette with oversized unrelated layers.",
    ];
  }

  return [
    "Treat uploaded item as core garment and build a complete styled outfit.",
    "Final look must include visible top-bottom structure or full-dress equivalent.",
    "Avoid single-piece unfinished styling.",
  ];
};

const buildCombinationBlock = (combo: OutfitCombination | undefined) => {
  if (!combo) return "No additional combination details provided.";

  const itemLines = combo.items
    .map((item) => `- ${item.category}: ${item.description} (${item.colorSuggestion})`)
    .join("\n");

  return [
    `Combination Name: ${combo.name}`,
    `Theme: ${combo.theme}`,
    combo.targetBody ? `Target Body: ${combo.targetBody}` : "",
    combo.matchingLogic ? `Matching Logic: ${combo.matchingLogic}` : "",
    "Suggested Additional Pieces:",
    itemLines || "- No extra pieces listed.",
  ]
    .filter(Boolean)
    .join("\n");
};

const resolveStyleMethod = (styleTag: string): StyleMethodology => {
  const lower = styleTag.toLowerCase();
  return (
    STYLE_METHODS.find((method) =>
      method.keywords.some((keyword) => lower.includes(keyword.toLowerCase())),
    ) || STYLE_METHODS[1]
  );
};

const buildFiveElementsBlock = (method: StyleMethodology) => {
  return [
    "FIVE-ELEMENTS STYLING METHODOLOGY (must follow):",
    `1) Silhouette: ${method.silhouette}`,
    `2) Color: ${method.color}`,
    `3) Material: ${method.material}`,
    `4) Pattern: ${method.pattern}`,
    `5) Accessory: ${method.accessory}`,
    `Layering formula: ${method.layeringFormula}`,
    `Scene direction: ${method.scene}`,
  ].join("\n");
};

const buildClosedLoopChecks = (anchorType: OutfitAnchorType) => {
  return [
    "CLOSED-LOOP OUTFIT CHECKLIST:",
    "A) Style theme is consistent across silhouette, color, material, pattern, accessory.",
    "B) Layering is complete and practical, not a single unfinished piece.",
    "C) Proportion is balanced (visual rhythm, contrast, and harmony).",
    "D) Uploaded core garment remains unchanged in key details.",
    anchorType === "inner_top"
      ? "E) Inner-top upload requires visible outerwear. This is mandatory."
      : "E) Outfit structure must be complete for the detected item type.",
  ].join("\n");
};

export const extractOutfitStyleTags = (result: OutfitRecommendResult): string[] => {
  const profile = resolveOutfitStyleProfile(result);
  const ranked = profile.rankedStyles.filter(Boolean);
  const unique = Array.from(new Set(ranked));
  return unique.length > 0 ? unique : MAIN_STYLE_TAXONOMY.map((item) => item.mainStyle);
};

export const buildOutfitModelPrompt = (
  result: OutfitRecommendResult,
  selectedStyleTag: string,
): string => {
  const matchedCombo = result.combinations.find((combo) =>
    `${combo.name} ${combo.theme} ${combo.targetBody || ""}`.includes(selectedStyleTag),
  ) || result.combinations[0];

  const item = result.inputAnalysis;
  const anchorType = inferAnchorType(item.itemType || "");
  const structureRules = getStructureRules(anchorType);
  const styleMethod = resolveStyleMethod(selectedStyleTag);
  const combinationBlock = buildCombinationBlock(matchedCombo);
  const fiveElementsBlock = buildFiveElementsBlock(styleMethod);
  const closedLoopChecks = buildClosedLoopChecks(anchorType);

  return `Generate one photorealistic female fashion model photo for e-commerce styling reference.

PRIMARY GOAL:
Use the uploaded garment image as the non-negotiable core piece, and build a COMPLETE outfit in "${selectedStyleTag}".

STRICT GARMENT CONSISTENCY (HIGHEST PRIORITY):
1. Keep uploaded garment exactly consistent in color, hue, material, silhouette, pattern, length, and key detail positions.
2. Do not redesign, recolor, simplify, or replace the uploaded garment.
3. Keep exactly one copy of the uploaded garment.
4. If style preference conflicts with garment consistency, garment consistency wins.

MANDATORY OUTFIT STRUCTURE RULES:
${structureRules.map((rule, i) => `${i + 1}. ${rule}`).join("\n")}

STYLE METHOD PROFILE:
- Method family: ${styleMethod.name}
- Style vibe keywords: ${styleMethod.vibe}
- Avoid direction: ${styleMethod.avoid}

${fiveElementsBlock}

MODEL + PHOTOGRAPHY REQUIREMENTS:
- East Asian female model, around 25-35 years old.
- Full-body framing, natural posture, realistic skin and body proportion.
- Real camera look, no CGI, no illustration, no AI artifact.
- Vertical 9:16 ratio, commercial ready.

INPUT ITEM PROFILE:
- Item type: ${item.itemType}
- Item color: ${item.color}
- Item material: ${item.material}
- Item silhouette: ${item.silhouette || "not specified"}
- Item style profile: ${item.style}

COMBINATION GUIDANCE (from styling analysis):
${combinationBlock}

${closedLoopChecks}

OUTPUT RULES:
- Return exactly one final image.
- No text, watermark, collage, UI, or split panel.
- Show clear and complete styled look, not unfinished outfit.`;
};

export const buildOutfitModelNegativePrompt = (result: OutfitRecommendResult): string => {
  const anchorType = inferAnchorType(result.inputAnalysis.itemType || "");
  const base = [
    "low quality, illustration, cartoon, CGI, plastic skin, deformed hands",
    "missing core garment, changed garment color, changed garment fabric",
    "partial cropped body, no shoes, unfinished outfit",
  ];

  if (anchorType === "inner_top") {
    base.push("single top without outerwear, missing jacket/cardigan/blazer layer");
  }

  if (anchorType === "outerwear") {
    base.push("outerwear worn without visible inner top layer");
  }

  return base.join(", ");
};
