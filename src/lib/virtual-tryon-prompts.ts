import { FASHION_EXPOSURE_SAFETY_RULES_EN } from "@/lib/fashion-safety";

export type TryOnGarmentCategory = "auto" | "top" | "bottom" | "dress" | "outfit";
export type TryOnReferenceMode = "single-garment" | "multi-piece";
export type TryOnGarmentRole = "outer" | "top" | "inner" | "bottom";
export type TryOnAccessoryReplacementMode = "conservative";

export interface TryOnAccessoryOptions {
  hasShoesImage?: boolean;
  hasBagImage?: boolean;
  replacementMode?: TryOnAccessoryReplacementMode;
}

interface BuildVirtualTryOnPromptParams {
  garmentCount: number;
  category: TryOnGarmentCategory;
  referenceMode: TryOnReferenceMode;
  garmentRoles?: TryOnGarmentRole[];
  accessories?: TryOnAccessoryOptions;
  additionalNotes?: string;
}

function buildCategoryFocus(category: TryOnGarmentCategory, accessories?: TryOnAccessoryOptions): string {
  const hasShoes = accessories?.hasShoesImage ?? false;
  const hasBag = accessories?.hasBagImage ?? false;
  const keepShoesLine = hasShoes
    ? "- If a shoes reference image is provided, you may also replace only the visible shoes while preserving the original foot position, leg position, ankle angle, gait, crop, and ground contact from Image 1."
    : "- Keep the model's original shoes unchanged unless natural garment occlusion requires overlap handling.";
  const keepBagLine = hasBag
    ? "- If a bag reference image is provided, replace the original bag only when Image 1 already contains a bag or a natural carrying/contact condition. Do not change the hands, shoulders, arms, or pose to force the bag into the image."
    : "- Keep the model's original bag and visible accessories unchanged unless natural garment occlusion requires overlap handling.";

  const categoryFocus: Record<TryOnGarmentCategory, string> = {
    auto: `- Automatically determine whether the target garment is a top, bottom, or dress based on the uploaded garment reference images.
- Replace only the garment area required by that category.
- Keep every unrelated clothing piece on the model unchanged.`,
    top: `- The target garment is a TOP.
- Replace only the upper-body clothing region.
- Keep the model's original bottoms, legs, hands, and hair unchanged unless they are naturally occluding the new top.
${keepShoesLine}
${keepBagLine}`,
    bottom: `- The target garment is a BOTTOM.
- Replace only the lower-body clothing region.
- Keep the model's original top, jacket, face, hair, hands, and background unchanged unless natural occlusion requires overlap handling.
${keepShoesLine}
${keepBagLine}`,
    dress: `- The target garment is a DRESS or one-piece garment.
- Remove ALL existing clothing currently worn by the model — including any inner layers, undershirts, base layers, tank tops, or tops — before applying the new dress.
- Replace the model's entire outfit region with the uploaded dress while keeping the same person, pose, hair, hands, background, lighting, and framing.
- Keep shoes and visible accessories only if they remain naturally compatible and do not conflict with the uploaded dress.
${hasShoes ? "- If a shoes reference image is provided, replace the visible shoes with that exact pair when the shoes or feet are naturally visible in Image 1." : ""}
${hasBag ? "- If a bag reference image is provided, replace only an existing bag or a naturally supportable bag position. Never invent a forced carry pose for the bag." : ""}`,
    outfit: `- The target is a MULTI-PIECE OUTFIT built from the uploaded garment references.
- Remove ALL existing clothing currently worn by the model — including any inner layers, undershirts, base layers, tank tops, white tops, or any garment not in the uploaded references — before applying the new garments.
- Apply ONLY the uploaded garment pieces. Do not preserve or blend in any of the model's original clothing.
- Keep the same person, pose, hair, hands, body shape, background, framing, and lighting while replacing all clothing.
${hasShoes ? "- If a shoes reference image is provided, replace the original shoes only when the feet or shoes are already visible in Image 1." : ""}
${hasBag ? "- If a bag reference image is provided, replace the original bag only when Image 1 already supports a natural bag placement or carrying relationship." : ""}`,
  };

  return categoryFocus[category]
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .join("\n");
}

function buildCategoryNegative(
  category: TryOnGarmentCategory,
  accessories?: TryOnAccessoryOptions,
): string {
  const hasShoes = accessories?.hasShoesImage ?? false;

  const categoryNegative: Record<TryOnGarmentCategory, string> = {
    auto: "wrong garment category, mismatched garment type, partial garment replacement",
    top: [
      "changed pants",
      "changed skirt",
      "changed shorts",
      hasShoes ? "wrong shoes design, different shoes than reference, shoes color mismatch, wrong shoe material, wrong heel height" : "changed shoes",
    ].join(", "),
    bottom: "changed shirt, changed blouse, changed sweater, changed jacket",
    dress: "two-piece outfit, separate top and skirt, separate top and pants, original model clothing visible, original inner layer bleeding through",
    outfit: "missing garment piece, dropped uploaded outer layer, dropped uploaded bottom, merged garments into one, original model clothing preserved, original inner layer visible, original white top visible, original undershirt bleeding through, model's original clothing under new garments",
  };

  return categoryNegative[category];
}

const REFERENCE_MODE_FOCUS: Record<TryOnReferenceMode, string> = {
  "single-garment": `- Treat the uploaded garment references as the SAME garment shown from different views or detail angles.
- Use Image 2 as the primary garment view.
- Use the remaining garment images only to recover missing angles or details.
- Do not split the garment into multiple clothing items.`,
  "multi-piece": `- Treat each uploaded garment reference image as an INDEPENDENT garment piece that must appear in the final outfit.
- Use every uploaded garment exactly once in the final result.
- Do not merge two uploaded garments into one invented item.
- Every uploaded garment must stay visibly present in the final image, even if some pieces are only partially visible because of realistic layering.
- Do not silently drop any uploaded garment piece.`,
};

function getEffectiveCategory(category: TryOnGarmentCategory, referenceMode: TryOnReferenceMode): TryOnGarmentCategory {
  if (referenceMode === "multi-piece" && category === "auto") {
    return "outfit";
  }

  return category;
}

function buildAccessoryReferenceLines(garmentCount: number, accessories?: TryOnAccessoryOptions): string {
  const hasShoes = accessories?.hasShoesImage ?? false;
  const hasBag = accessories?.hasBagImage ?? false;
  const lines: string[] = [];
  let nextImageIndex = garmentCount + 2;

  if (hasShoes) {
    lines.push(`- Image ${nextImageIndex} is the SHOES reference image. Use it only to replace the visible shoes when Image 1 naturally shows shoes or feet.`);
    nextImageIndex += 1;
  }

  if (hasBag) {
    lines.push(`- Image ${nextImageIndex} is the BAG reference image. Use it only to replace an existing bag or a naturally supported bag position from Image 1.`);
  }

  return lines.join("\n");
}

function buildAccessoryRules(accessories?: TryOnAccessoryOptions): string {
  const hasShoes = accessories?.hasShoesImage ?? false;
  const hasBag = accessories?.hasBagImage ?? false;

  if (!hasShoes && !hasBag) {
    return "";
  }

  const lines = [
    "ACCESSORY SYNC RULES:",
  ];

  if (hasShoes) {
    lines.push("- If a SHOES reference image is provided, replace only the shoes that are already visible on the model in Image 1.");
    lines.push("- Preserve the exact foot position, leg position, ankle angle, stride, crop, and ground contact from Image 1 while changing the shoes.");
    lines.push("- If the feet or shoes are fully out of frame or fully hidden, do not invent new visible shoes.");
    lines.push("- The uploaded shoes must keep the same complete design language as the reference photo: same silhouette, proportions, toe shape, sole thickness, heel height, material, color blocking, trim, and hardware.");
  }

  if (hasBag) {
    lines.push("- If a BAG reference image is provided, replace only an existing bag or a naturally supportable bag position already implied by Image 1.");
    lines.push("- Do not change the hands, arm angle, shoulder angle, body pose, or framing to force the bag into the image.");
    lines.push("- If Image 1 has no bag and no natural carrying/contact condition, do not invent a new bag.");
    lines.push("- The uploaded bag must keep the same complete design language as the reference photo: same shape, proportions, strap or handle structure, panel construction, pockets, zippers, hardware, and material finish.");
  }

  lines.push("- Do not add any extra accessories beyond the uploaded shoes or uploaded bag.");
  lines.push("- Do not restyle, simplify, beautify, reinterpret, or swap the uploaded shoes or bag into a similar-looking item.");

  return `\n${lines.join("\n")}`;
}

function buildReferenceFidelityLock(accessories?: TryOnAccessoryOptions): string {
  const hasShoes = accessories?.hasShoesImage ?? false;
  const hasBag = accessories?.hasBagImage ?? false;

  const lines = [
    "REFERENCE FIDELITY LOCK - NON-NEGOTIABLE:",
    "- The uploaded reference images are the single source of truth for what the final items must look like.",
    "- The final garments must keep the same complete item identity as the uploaded images: same silhouette, proportions, length, structure, paneling, neckline, collar, sleeves, hem, waistband, closure construction, pockets, seams, trim, print placement, texture, and color.",
    "- What the uploaded item looks like is exactly what the final item must look like. Do not redesign it, beautify it, sharpen it into a different style, or replace it with a similar item.",
    "- Do NOT change the item into a different style, different cut, different version, different season, different fit, or different design variant.",
    "- Do NOT simplify visible details. Do NOT remove parts. Do NOT merge parts. Do NOT change the style logic of the item.",
    "- Preserve item completeness as much as the locked framing allows. Do not silently drop major parts of the uploaded item or replace a complete uploaded item with a partial or simplified version.",
    "- If some part of the final item is naturally hidden by pose, crop, layering, or occlusion, the visible part must still clearly belong to the exact same uploaded item and not a modified version.",
    "- If a reference photo is slightly folded, angled, cropped, or partially occluded, recover missing parts conservatively from the same item only. Never invent a new style or unsupported design detail.",
  ];

  if (hasShoes) {
    lines.push("- For uploaded shoes: do not change toe shape, sole height, heel height, opening shape, strap layout, decorative details, material, or color blocking.");
  }

  if (hasBag) {
    lines.push("- For uploaded bags: do not change bag shape, size impression, strap/handle type, flap construction, zipper placement, pocket layout, hardware, quilting, stitching, or material.");
  }

  return lines.join("\n");
}

export function buildVirtualTryOnPrompt({
  garmentCount,
  category,
  referenceMode,
  garmentRoles,
  accessories,
  additionalNotes,
}: BuildVirtualTryOnPromptParams): string {
  const effectiveCategory = getEffectiveCategory(category, referenceMode);
  const hasExplicitPieceRoles = referenceMode === "multi-piece" && garmentRoles?.length === garmentCount && garmentCount > 1;
  const accessoryReferenceLines = buildAccessoryReferenceLines(garmentCount, accessories);

  const garmentReferenceLine = hasExplicitPieceRoles
    ? garmentRoles
      .map((role, index) => `- Image ${index + 2} is the ${role.toUpperCase()} garment reference image.`)
      .join("\n") + `\n- The final result must contain exactly these ${garmentCount} uploaded garments, each used once only.`
    : garmentCount === 1
    ? "- Image 2 is the garment reference image."
    : referenceMode === "single-garment"
      ? `- Images 2-${garmentCount + 1} are ${garmentCount} reference views of the SAME garment. Image 2 is the primary view. The remaining images are supporting detail views.`
      : `- Images 2-${garmentCount + 1} are ${garmentCount} DIFFERENT garment pieces that must all be worn together in the final outfit.`;

  const layeringRules = hasExplicitPieceRoles
    ? `
EXPLICIT PIECE MAPPING RULES:
- Respect the exact garment role assigned to each uploaded image.
- OUTER = outermost layer such as jacket, cardigan, coat, shirt-jacket, or vest.
- TOP = main visible upper-body garment.
- INNER = inner/base layer that stays underneath outer or top layers when physically natural.
- BOTTOM = lower-body garment such as pants, skirt, or shorts.
- Do not add, invent, or hallucinate any extra clothing item that is not in the uploaded garment references, including jackets, cardigans, undershirts, overshirts, belts, skirt layers, or extra pants layers. The model's original clothing in Image 1 must be completely replaced — do not preserve any of it.
- Do not turn the uploaded top and bottom into a dress, jumpsuit, romper, or any fused one-piece garment.
- Do not duplicate either uploaded garment.
- Output exactly the uploaded ${garmentCount} garments only, with no extra invented clothing item.`
    : referenceMode === "multi-piece"
    ? `
LAYERING RULES:
- If multiple upper-body garments are uploaded, treat them as distinct layers, not alternatives.
- Preserve inner-layer visibility wherever physically natural: neckline, collar edge, sleeve opening, cuff, hem edge, placket edge, or lace trim should remain visible when appropriate.
- If one uploaded top is sleeveless, cropped, open-front, sheer, lace, or vest-like and another uploaded top is a base layer, the base layer must stay underneath and still be visibly present.
- When multiple uploaded garments belong to the upper body, prefer this layering priority: earlier uploaded garment = outer or hero layer, later uploaded thin or fitted garment = inner or base layer, unless the garment structure clearly implies the opposite.
- If a bottom garment is uploaded, it must remain a separate bottom piece and must not be fused into a dress or jumpsuit.
- Never collapse an uploaded inner top into the outer garment's print or texture.`
    : "";

  return `You are an elite fashion retoucher and virtual try-on art director.

Create one single photorealistic edited image.

IMAGE INPUT ORDER:
- Image 1 is the original model photo. This is the locked base image.
${garmentReferenceLine}
${accessoryReferenceLines ? `${accessoryReferenceLines}\n` : ""}

PRIMARY GOAL:
- Keep the exact same model identity, face, hairstyle, expression, skin tone, body proportions, hands, pose, camera angle, crop, lighting, shadows, background, props, and scene from Image 1.
- Replace only the clothing area needed for the try-on task.
- The final result must look like the original photo was edited, not newly regenerated from scratch.

STRICT PRESERVATION RULES:
- Do not change the model's face.
- Do not change the background.
- Do not change the pose, gesture, hand position, or body angle.
- Do not change the framing, zoom, perspective, lens feel, or composition.
- Do not add or remove people, props, furniture, text, or scenery. Do not add or remove unrelated accessories beyond the explicitly uploaded shoes or bag rules below.
- Keep natural occlusion relationships: if hair, arms, hands, or accessories overlap the clothing area, preserve those overlaps realistically.
- Preserve the original limb positions and body silhouette from Image 1, and warp the garments to that pose instead of altering the pose to fit the garments.

GARMENT MAPPING RULES:
${REFERENCE_MODE_FOCUS[referenceMode]}
${buildCategoryFocus(effectiveCategory, accessories)}
- Reproduce the uploaded garment faithfully: silhouette, neckline, collar, sleeve length, hem shape, waistline, closures, pockets, stitching, print placement, trim, texture, and color must match the garment reference images.
- Use Image 2 as the primary source for silhouette and main color whenever there is ambiguity.
- If the reference mode is single-garment, use the extra garment reference images only to recover missing angles or details such as collar shape, cuffs, hem, back view, print placement, or fabric texture.
- If the reference mode is multi-piece, assign each garment image to a different real clothing layer or clothing item.
- If the garment reference images conflict, resolve conservatively instead of inventing unsupported details.
- Do not invent details that are not supported by the garment reference images.
${buildReferenceFidelityLock(accessories)}
${layeringRules}
${buildAccessoryRules(accessories)}

REALISM RULES:
- The new garment must follow the model's exact pose and body geometry from Image 1.
- Garment fitting must adapt to the locked pose from Image 1; never change the arm angle, leg angle, torso direction, or hand placement to accommodate the new clothes.
- Add realistic folds, tension, drape, seams, and shadows so the garment looks naturally worn in the original photo.
- Match the lighting and color temperature of Image 1 exactly.
- Preserve all visible skin, hair strands, fingers, and background edges cleanly.

${FASHION_EXPOSURE_SAFETY_RULES_EN}

OUTPUT RULES:
- Output one final edited fashion photograph only.
- No collage, no split screen, no before/after layout, no extra panels.
- No text, watermark, logo, UI, frame, or graphic overlay.

${additionalNotes?.trim() ? `USER NOTES:\n- ${additionalNotes.trim()}` : ""}`;
}

export function buildVirtualTryOnNegativePrompt(
  category: TryOnGarmentCategory,
  referenceMode: TryOnReferenceMode,
  accessories?: TryOnAccessoryOptions,
): string {
  const effectiveCategory = getEffectiveCategory(category, referenceMode);
  const hasBag = accessories?.hasBagImage ?? false;
  const hasShoes = accessories?.hasShoesImage ?? false;

  const accessoryNegatives = [
    hasBag ? "wrong bag design, different bag than reference, bag color mismatch, wrong bag material, wrong bag hardware, invented second bag" : "bag",
    hasShoes ? "wrong shoes design, different shoes than reference, shoes color mismatch, wrong shoe material, wrong heel height, invented extra pair of shoes" : "",
  ].filter(Boolean);

  return [
    "different face",
    "different person",
    "face changed",
    "new hairstyle",
    "changed pose",
    "changed hands",
    "changed background",
    "different camera angle",
    "different crop",
    "different lighting",
    "different body shape",
    "different limb position",
    "changed leg position",
    "changed arm position",
    "extra clothing",
    "invented accessories",
    "nudity",
    "near-nudity",
    "topless",
    "bottomless",
    "exposed nipples",
    "exposed areola",
    "exposed underbust",
    "exposed genital area",
    "exposed pubic area",
    "butt crack",
    "see-through private parts",
    "transparent private parts",
    "bare skin replacing clothing",
    "hat",
    "sunglasses",
    ...accessoryNegatives,
    "jewelry",
    "collage",
    "split screen",
    "multiple panels",
    "flat lay",
    "hanger",
    "mannequin",
    "illustration",
    "3d render",
    "cgi",
    "plastic skin",
    "deformed hands",
    "extra fingers",
    "warped arms",
    "broken background",
    "blurry face",
    "low detail garment",
    "wrong print placement",
    "wrong collar",
    "wrong sleeve length",
    "wrong hem",
    "wrong color",
    referenceMode === "multi-piece" ? "missing garment, missing inner layer, missing undershirt, extra third garment, extra fourth garment, single-layer top when multiple tops were uploaded, fused outfit" : "split one garment into multiple pieces",
    buildCategoryNegative(effectiveCategory, accessories),
  ].join(", ");
}
