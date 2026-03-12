export type TryOnGarmentCategory = "auto" | "top" | "bottom" | "dress" | "outfit";
export type TryOnReferenceMode = "single-garment" | "multi-piece";
export type TryOnGarmentRole = "outer" | "top" | "inner" | "bottom";

interface BuildVirtualTryOnPromptParams {
  garmentCount: number;
  category: TryOnGarmentCategory;
  referenceMode: TryOnReferenceMode;
  garmentRoles?: TryOnGarmentRole[];
  additionalNotes?: string;
}

const CATEGORY_FOCUS: Record<TryOnGarmentCategory, string> = {
  auto: `- Automatically determine whether the target garment is a top, bottom, or dress based on the uploaded garment reference images.
- Replace only the garment area required by that category.
- Keep every unrelated clothing piece on the model unchanged.`,
  top: `- The target garment is a TOP.
- Replace only the upper-body clothing region.
- Keep the model's original bottoms, shoes, legs, hands, hair, and accessories unchanged unless they are naturally occluding the new top.`,
  bottom: `- The target garment is a BOTTOM.
- Replace only the lower-body clothing region.
- Keep the model's original top, jacket, face, hair, hands, shoes, and background unchanged unless natural occlusion requires overlap handling.`,
  dress: `- The target garment is a DRESS or one-piece garment.
- Replace the model's existing main outfit with the uploaded dress while keeping the same person, pose, hair, hands, background, lighting, and framing.
- Keep shoes and visible accessories only if they remain naturally compatible and do not conflict with the uploaded dress.`,
  outfit: `- The target is a MULTI-PIECE OUTFIT built from the uploaded garment references.
- Replace every relevant clothing region needed to wear all uploaded garment pieces together.
- Keep the same person, pose, hair, hands, body shape, background, framing, and lighting while changing only the clothes.`,
};

const CATEGORY_NEGATIVE: Record<TryOnGarmentCategory, string> = {
  auto: "wrong garment category, mismatched garment type, partial garment replacement",
  top: "changed pants, changed skirt, changed shorts, changed shoes",
  bottom: "changed shirt, changed blouse, changed sweater, changed jacket",
  dress: "two-piece outfit, separate top and skirt, separate top and pants",
  outfit: "missing garment piece, dropped inner layer, dropped outer layer, dropped bottom, merged garments into one",
};

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

export function buildVirtualTryOnPrompt({
  garmentCount,
  category,
  referenceMode,
  garmentRoles,
  additionalNotes,
}: BuildVirtualTryOnPromptParams): string {
  const effectiveCategory = getEffectiveCategory(category, referenceMode);
  const hasExplicitPieceRoles = referenceMode === "multi-piece" && garmentRoles?.length === garmentCount && garmentCount > 1;

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
- Do not add, invent, or hallucinate any third clothing item such as a jacket, cardigan, undershirt, overshirt, belt, skirt layer, or extra pants layer unless it is already visibly present in Image 1 and remains outside the replaced clothing regions.
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

PRIMARY GOAL:
- Keep the exact same model identity, face, hairstyle, expression, skin tone, body proportions, hands, pose, camera angle, crop, lighting, shadows, background, props, and scene from Image 1.
- Replace only the clothing area needed for the try-on task.
- The final result must look like the original photo was edited, not newly regenerated from scratch.

STRICT PRESERVATION RULES:
- Do not change the model's face.
- Do not change the background.
- Do not change the pose, gesture, hand position, or body angle.
- Do not change the framing, zoom, perspective, lens feel, or composition.
- Do not add or remove people, props, accessories, furniture, text, or scenery.
- Keep natural occlusion relationships: if hair, arms, hands, or accessories overlap the clothing area, preserve those overlaps realistically.
- Preserve the original limb positions and body silhouette from Image 1, and warp the garments to that pose instead of altering the pose to fit the garments.

GARMENT MAPPING RULES:
${REFERENCE_MODE_FOCUS[referenceMode]}
${CATEGORY_FOCUS[effectiveCategory]}
- Reproduce the uploaded garment faithfully: silhouette, neckline, collar, sleeve length, hem shape, waistline, closures, pockets, stitching, print placement, trim, texture, and color must match the garment reference images.
- Use Image 2 as the primary source for silhouette and main color whenever there is ambiguity.
- If the reference mode is single-garment, use the extra garment reference images only to recover missing angles or details such as collar shape, cuffs, hem, back view, print placement, or fabric texture.
- If the reference mode is multi-piece, assign each garment image to a different real clothing layer or clothing item.
- If the garment reference images conflict, resolve conservatively instead of inventing unsupported details.
- Do not invent details that are not supported by the garment reference images.
${layeringRules}

REALISM RULES:
- The new garment must follow the model's exact pose and body geometry from Image 1.
- Garment fitting must adapt to the locked pose from Image 1; never change the arm angle, leg angle, torso direction, or hand placement to accommodate the new clothes.
- Add realistic folds, tension, drape, seams, and shadows so the garment looks naturally worn in the original photo.
- Match the lighting and color temperature of Image 1 exactly.
- Preserve all visible skin, hair strands, fingers, and background edges cleanly.

OUTPUT RULES:
- Output one final edited fashion photograph only.
- No collage, no split screen, no before/after layout, no extra panels.
- No text, watermark, logo, UI, frame, or graphic overlay.

${additionalNotes?.trim() ? `USER NOTES:\n- ${additionalNotes.trim()}` : ""}`;
}

export function buildVirtualTryOnNegativePrompt(category: TryOnGarmentCategory, referenceMode: TryOnReferenceMode): string {
  const effectiveCategory = getEffectiveCategory(category, referenceMode);

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
    "hat",
    "sunglasses",
    "bag",
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
    CATEGORY_NEGATIVE[effectiveCategory],
  ].join(", ");
}
