export interface HangoutfitTemplate {
  id: string;
  name: string;
  description: string;
  previewSrc: string;
  sceneReferenceSrc: string;
  prompt: string;
  negativePrompt: string;
  referenceBoardMode: HangoutfitReferenceBoardMode;
}

export type HangoutfitReferenceBoardMode =
  | "garments-grid"
  | "garments-plus-scene-template";

export interface AccessoryUploadInfo {
  hasShoesImage: boolean;
  hasBagImage: boolean;
}

export interface BuildHangoutfitPromptParams {
  template: HangoutfitTemplate;
  uploadedCount: number;
  notes?: string;
  accessories?: AccessoryUploadInfo;
}

export interface BuildDefaultHangoutfitPromptParams {
  uploadedCount: number;
  notes?: string;
  accessories?: AccessoryUploadInfo;
}

export interface BuildHangoutfitWorkMetadataParams {
  line: string;
  uploadedImageCount: number;
  hasAdditionalNotes: boolean;
  selectedTemplateId: string;
  referenceBoardMode: HangoutfitReferenceBoardMode;
  hasShoesImage: boolean;
  hasBagImage: boolean;
}

function buildAccessorySection(accessories?: AccessoryUploadInfo): string {
  const hasShoes = accessories?.hasShoesImage ?? false;
  const hasBag = accessories?.hasBagImage ?? false;

  let imageIndexNote = "";
  if (hasShoes && hasBag) {
    imageIndexNote = "\n\n[IMPORTANT: Accessory Reference Images]\nYou are given additional separate reference images alongside the main garment reference board:\n- The 2nd image is a close-up photo of the SHOES to use. Reproduce this exact pair of shoes.\n- The 3rd image is a close-up photo of the BAG to use. Reproduce this exact handbag.\nThese are high-resolution accessory references. Copy them exactly.";
  } else if (hasShoes) {
    imageIndexNote = "\n\n[IMPORTANT: Accessory Reference Image]\nYou are given an additional separate reference image alongside the main garment reference board:\n- The 2nd image is a close-up photo of the SHOES to use. Reproduce this exact pair of shoes.\nThis is a high-resolution accessory reference. Copy it exactly.";
  } else if (hasBag) {
    imageIndexNote = "\n\n[IMPORTANT: Accessory Reference Image]\nYou are given an additional separate reference image alongside the main garment reference board:\n- The 2nd image is a close-up photo of the BAG to use. Reproduce this exact handbag.\nThis is a high-resolution accessory reference. Copy it exactly.";
  }

  const shoesLine = hasShoes
    ? "Use the SHOES from the separate reference image provided. Reproduce their EXACT design, color, pattern, material, heel height, and silhouette with maximum fidelity. Place them casually on a small metal stool or directly on the floor beneath the rack."
    : "Add a pair of women's shoes (heels, ballet flats, Mary Janes, or ankle boots) placed casually on a small metal stool or directly on the floor beneath the rack. Choose a style that complements the uploaded garments.";

  const bagLine = hasBag
    ? "Use the BAG from the separate reference image provided. Reproduce its EXACT design, color, material, shape, hardware (zippers, clasps, buckles), and strap style with maximum fidelity. Hang it on the rod or place it near the garments."
    : "Add a delicate women's handbag or crossbody bag hanging on the rod. Choose a style that complements the uploaded garments.";

  const fidelityReminder =
    hasShoes || hasBag
      ? "\n\n[CRITICAL: Accessory Fidelity — Highest Priority]\nThe user has provided their own accessory photos. These accessories MUST be reproduced with the SAME strict fidelity as the garments:\n- Exact color (do not change hue or saturation)\n- Exact material and texture (leather, suede, canvas, patent, snake-print, etc.)\n- Exact shape and silhouette\n- All hardware details (buckles, zippers, clasps, chains, studs)\n- Exact brand-specific design features\nDo NOT substitute, simplify, reinterpret, or replace them with a generic item. The output accessories must be visually identical to the uploaded reference photos."
      : "";

  return `[Instruction: Styling & Accessories]
This is a women's fashion display. Add small feminine accessories to complete the scene:
- ${shoesLine}
- ${bagLine}
- Include one visible editorial poster or magazine page clipped to the rod and hanging beside the garments as a premium boutique styling detail.
The clipped paper accent should be clearly visible, slightly angled, lightweight, and secondary to the garments, not a big framed artwork. Place it near the upper-right side of the garment group, similar to a boutique magazine tear sheet loosely clipped onto the display rod. Keep the scene minimal and curated: at most one bag, one pair of women's footwear, and one clipped paper accent or one restrained green plant branch. Do not add extra props beyond these.${fidelityReminder}${imageIndexNote}`;
}

export function buildDefaultHangoutfitPrompt({
  uploadedCount,
  notes,
  accessories,
}: BuildDefaultHangoutfitPromptParams): string {
  return `[Core Setup: Minimal Hanging Rod]
A real photograph of garments displayed on a slim, simple horizontal metal rod that spans across the frame. The rod is thin and understated — plain silver or light chrome, not thick or heavy. The garments hang on natural wooden hangers, giving a warm, authentic boutique feel.

[Instruction: Input Garment & Realism Patch]
Using the items from the input image, display them with natural gravity and relaxed drape. Show realistic fabric weight, gentle natural wrinkles, and true-to-life textile textures. The clothes should look like they were casually hung up in a real store, not perfectly arranged for a catalog.

[CRITICAL: Garment Fidelity]
Each garment MUST be an exact reproduction of the input reference image. Strictly preserve:
- The exact color, pattern, and print of each garment (do not alter hue, saturation, or pattern layout)
- The exact silhouette, cut, and style (neckline, sleeve length, hem shape, collar type)
- All design details: buttons, zippers, pockets, stitching, embroidery, logos, labels
- The exact fabric texture and material appearance (knit, woven, denim, silk, linen, etc.)
Do NOT reinterpret, simplify, or creatively modify any garment. The output garments must look identical to the input photos.

${buildAccessorySection(accessories)}

[Photography & Lighting]
Shot from a near-frontal angle with a very slight offset. Soft, even, natural diffused daylight — as if coming from a large window nearby. The lighting is flat and gentle with minimal shadows. No dramatic side lighting, no strong directional light, no visible light source. Shadows are extremely subtle and soft.

[Environment & Vibe]
Set in a cozy, minimalist clothing boutique. The background is a clean, plain off-white or light gray wall. The overall mood is warm, natural, and inviting — like a real indie fashion store, not a luxury showroom. The image should look like a casual iPhone photo taken in a well-lit shop.

[Framing & Lower Scene Refinement]
Keep the camera slightly pulled back compared with a tight close-up, while still preserving a composed boutique framing. Show a little more breathing room around the garments, but do not turn it into a wide or empty shot. The floor must be perfectly clean pure white or very light off-white — the same tone as the wall, creating a seamless, continuous white surface. No visible baseboard, no skirting, no trim of any kind. The wall simply meets the floor with a clean, invisible transition. The entire lower portion of the frame must be immaculately clean: no specks, no dust, no spots, no dirt particles, no stains, no debris, no texture noise. Pure, pristine white.

[Hard Constraints: Separation Is Mandatory]
- You receive exactly ${uploadedCount} uploaded garments.
- Display all uploaded garments in one scene on the same slim rod, each on its own wooden hanger with clear spacing.
- One garment per hanger only. Never combine two garments on one hanger.
- Do not style them as one worn outfit set; present them as separate hanging pieces only.
- Keep full length visible for each garment (no heavy crop).
- Treat every uploaded reference image as one independent garment item.
- The uploaded items may be different garment categories, or the same garment style in different colors. Preserve each one separately and exactly as shown.
- If two or more references show the same style in different colors, keep them as separate hanging pieces. Never merge them into one item and never swap colors between them.
- If only 2 garments are uploaded, generate exactly 2 hanging garments. Do not invent any third garment such as pants, skirts, or extra tops.
- If 3 garments are uploaded, generate exactly 3 hanging garments.
- Use only the uploaded garments. Do not add any extra clothing item that was not uploaded.
- Each garment must be shown as fully and clearly as possible: complete silhouette, neckline, sleeves, hem, closures, pockets, trims, labels, embroidery, and other visible details.
- Prioritize garment fidelity over styling creativity. When uncertain, copy the uploaded garment details conservatively instead of inventing missing parts.
- The shoes and bag in the scene are styling props only and do NOT count as uploaded garments.
- Generate exactly one final image only.

${notes?.trim() ? `[Additional Notes]\n${notes.trim()}` : ""}`;
}

export function buildDefaultHangoutfitNegativePrompt(
  uploadedCount: number,
  accessories?: AccessoryUploadInfo,
): string {
  const hasBottoms = uploadedCount === 3;
  const hasShoes = accessories?.hasShoesImage ?? false;
  const hasBag = accessories?.hasBagImage ?? false;

  const accessoryNegatives: string[] = [];
  if (hasShoes) {
    accessoryNegatives.push("wrong shoes design", "different shoes than reference", "shoes color mismatch");
  }
  if (hasBag) {
    accessoryNegatives.push("wrong bag design", "different bag than reference", "bag color mismatch");
  }

  return `[Crucial Removal]
studio equipment, light stands, softboxes, lighting gear, umbrella reflector, cables, behind the scenes elements, visible edge of softbox in frame, messy environment, cluttered background, dirty lower wall, stained baseboard, messy floor, dusty floor edge, clutter at bottom of frame, plant pot clutter.

[Lighting Control]
harsh shadows, dramatic side lighting, cinematic lighting, strong directional light, deep shadows, high contrast lighting, studio flash, HDR effect, specular highlights on metal, glossy reflections.

[Quality Control]
cropped garments, partial view, missing hem, missing sleeves, missing collar details, wrong buttons, wrong zipper, wrong pockets, wrong labels, wrong embroidery, flat lay, low quality, blurry, distorted fabric, CGI artifacts, CGI rendering, plastic texture, overly sharp, over-processed, merged garments, layered on same hanger, one complete worn outfit look, two garments fused together, color mixing between garments, same-style garments merged into one, too many props, overly busy composition, invented pants, invented skirt, invented extra garment${hasBottoms ? "" : ", three garments when only two were uploaded"}, camera too near, tight crop, garments too large in frame, wide empty foreground, cheap lower-frame styling, missing clipped editorial poster, oversized framed wall art, giant poster, readable poster text, gibberish poster text, cheap curved baseboard, bulky rounded skirting, PVC baseboard trim, plastic baseboard, thick white baseboard, visible baseboard molding, dirty floor, floor specks, dust particles, floor debris, floor stains, textured dirty floor, gray floor${accessoryNegatives.length > 0 ? `, ${accessoryNegatives.join(", ")}` : ""}.`;
}

const COMMON_PROMPT_INTRO_BASE = `A real photograph of garments displayed on a slim, simple horizontal metal rod that spans across the frame. The rod is thin and understated — plain silver or light chrome, not thick or heavy. The garments hang on natural wooden hangers, giving a warm, authentic boutique feel.

[Input Garment & Realism Patch]
Using the uploaded garments from the reference board, display them with natural gravity and relaxed drape. Show realistic fabric weight, gentle natural wrinkles, and true-to-life textile textures. The clothes should look like they were casually hung up in a real store, not perfectly arranged for a catalog.

[CRITICAL: Garment Fidelity]
Each garment MUST be an exact reproduction of the garment references. Strictly preserve:
- The exact color, pattern, and print of each garment (do not alter hue, saturation, or pattern layout)
- The exact silhouette, cut, and style (neckline, sleeve length, hem shape, collar type)
- All design details: buttons, zippers, pockets, stitching, embroidery, logos, labels
- The exact fabric texture and material appearance (knit, woven, denim, silk, linen, etc.)
Do NOT reinterpret, simplify, or creatively modify any garment. The output garments must look identical to the garment reference photos.

[Garment Drape & Softness - Highest Priority]
- The garments must feel like real cloth, not cardboard or paper cutouts
- Show clear natural gravity: fabric should hang downward with believable weight from the hanger points
- Add soft irregular folds, relaxed drape lines, and slight volume where fabric naturally falls away from the body
- Tops should have gentle shoulder collapse and subtle underarm drop, not a flat geometric spread
- Hems should have tiny natural curvature and fabric thickness, never ruler-straight like a stiff board
- Sleeves should taper and hang with soft folds, not stick out like hollow tubes
- Denim should feel heavier with realistic vertical drag and mild stacking, while blouses and lighter fabrics should feel softer and more fluid
- Preserve structure where the real garment is tailored, but even structured garments must still show thickness, weight, and 3D fabric body
- Avoid the appearance of a flattened front panel pasted onto the scene`;

function buildReferenceBoardMapping(accessories?: AccessoryUploadInfo): string {
  const hasShoes = accessories?.hasShoesImage ?? false;
  const hasBag = accessories?.hasBagImage ?? false;

  let accessoryImageNote = "";
  if (hasShoes && hasBag) {
    accessoryImageNote = `\n\n[IMPORTANT: Separate Accessory Reference Images]\nIn addition to the reference board (1st image), you are given two more separate high-resolution images:\n- 2nd image: the exact SHOES to use in the scene. Reproduce them faithfully.\n- 3rd image: the exact BAG to use in the scene. Reproduce it faithfully.\nThese separate images show the accessories in full detail. Use them as the primary fidelity source for shoes and bag.`;
  } else if (hasShoes) {
    accessoryImageNote = `\n\n[IMPORTANT: Separate Accessory Reference Image]\nIn addition to the reference board (1st image), you are given one more separate high-resolution image:\n- 2nd image: the exact SHOES to use in the scene. Reproduce them faithfully.\nThis separate image shows the shoes in full detail. Use it as the primary fidelity source for shoes.`;
  } else if (hasBag) {
    accessoryImageNote = `\n\n[IMPORTANT: Separate Accessory Reference Image]\nIn addition to the reference board (1st image), you are given one more separate high-resolution image:\n- 2nd image: the exact BAG to use in the scene. Reproduce it faithfully.\nThis separate image shows the bag in full detail. Use it as the primary fidelity source for the bag.`;
  }

  return `[Reference Board Mapping]
You are given one split reference board (the 1st image):
- LEFT panel: uploaded garment references only. Each numbered tile is one independent garment item.
- RIGHT panel: the target boutique scene template only.
- Copy garment identity, color, details, and fabric ONLY from the LEFT panel.
- Copy scene layout, wall/floor design, camera angle, lighting, furniture, props, and atmosphere ONLY from the RIGHT panel.
- The RIGHT panel may contain placeholder hanging guides. These are scene guides only and must NOT remain in the final image.
- Keep the boutique scene from the RIGHT panel, but replace any placeholder hanging guides with the uploaded garments from the LEFT panel.
- The numbered markers, panel borders, and any guide graphics in the reference board are instruction aids only and must NEVER appear in the final image.${accessoryImageNote}`;
}

function buildTemplateStylingSection(accessories?: AccessoryUploadInfo): string {
  const hasShoes = accessories?.hasShoesImage ?? false;
  const hasBag = accessories?.hasBagImage ?? false;

  const shoesLine = hasShoes
    ? "- The user has provided a separate high-resolution SHOES reference image. Use that EXACT pair of shoes in the scene. Reproduce their exact design, color, pattern, material, heel height, and silhouette. Place them in the natural template position for shoes."
    : "- If the scene needs shoes, choose at most one pair of shoes that match the uploaded garments in style, color mood, and season.";

  const bagLine = hasBag
    ? "- The user has provided a separate high-resolution BAG reference image. Use that EXACT handbag in the scene. Reproduce its exact design, color, material, shape, hardware (zippers, clasps, buckles), and strap style. Place it in the natural template position for a bag."
    : "- If the scene needs a handbag, choose at most one handbag that matches the uploaded garments in style, color mood, and season.";

  const fidelityReminder =
    hasShoes || hasBag
      ? "\n- [CRITICAL: Accessory Fidelity — Highest Priority] The user-provided accessory references MUST be reproduced with the SAME strict fidelity as the garments: exact color, material, texture, shape, hardware, and brand-specific design. Do NOT substitute, reinterpret, or replace them with a generic item."
      : "- The bag and shoes do NOT need to match the template reference exactly.";

  return `[Styling & Accessories]
This is a women's fashion display.
${shoesLine}
${bagLine}
${fidelityReminder}
- Include one visible clipped editorial poster or magazine page hanging beside the garments as a premium boutique styling accent.
- The paper accent should be lightly clipped to the rod or hanger area, slightly angled, visually refined, clearly secondary to the garments, and preferably positioned near the upper-right side of the composition.
- Treat the poster as atmosphere only, not as fidelity content. Do not try to reproduce exact text or exact cover art from any reference.
- Prioritize a coherent boutique styling result over copying accessory shapes or colors (except for user-uploaded accessories which must be faithful).
- Keep the scene curated and restrained. Do not add extra props beyond the template cues.`;
}

function buildCommonPromptIntro(accessories?: AccessoryUploadInfo): string {
  return `${COMMON_PROMPT_INTRO_BASE}

${buildReferenceBoardMapping(accessories)}

${buildTemplateStylingSection(accessories)}

[Output Goal]
Create a boutique-ready hanging display photo that looks like it was shot in a real clothing store with an iPhone or mirrorless camera, not in a CGI studio.`;
}

const buildCommonConstraints = (uploadedCount: number) => `[Hard Constraints: Separation Is Mandatory]
- You receive exactly ${uploadedCount} uploaded garments.
- Display all uploaded garments in one scene on the same slim rod, each on its own wooden hanger with clear spacing.
- The final image must contain exactly ${uploadedCount} visible hangers total, matching the uploaded garment count one-to-one.
- No empty hanger, no extra hanger, no spare hanger, no decorative hanger, no doubled hanger.
- One garment per hanger only. Never combine two garments on one hanger.
- Do not style them as one worn outfit set; present them as separate hanging pieces only.
- Keep full length visible for each garment (no heavy crop).
- Treat every uploaded reference tile as one independent garment item.
- The uploaded items may be different garment categories, or the same garment style in different colors. Preserve each one separately and exactly as shown.
- If two or more references show the same style in different colors, keep them as separate hanging pieces. Never merge them into one item and never swap colors between them.
- If only 2 garments are uploaded, generate exactly 2 hanging garments. Do not invent any third garment such as pants, skirts, or extra tops.
- If 3 garments are uploaded, generate exactly 3 hanging garments.
- Use only the uploaded garments. Do not add any extra clothing item that was not uploaded.
- Each garment must be shown as fully and clearly as possible: complete silhouette, neckline, sleeves, hem, closures, pockets, trims, labels, embroidery, and other visible details.
- Prioritize garment fidelity over styling creativity. When uncertain, copy the uploaded garment details conservatively instead of inventing missing parts.
- The shoes and bag in the scene are styling props only and do NOT count as uploaded garments.
- Generate exactly one final image only.`;

const COMMON_NEGATIVE_PROMPT = `[Crucial Removal]
studio equipment, light stands, softboxes, lighting gear, umbrella reflector, cables, behind the scenes elements, visible edge of softbox in frame, messy environment, cluttered background, mannequins, people, store staff, mirror selfies.

[Lighting Control]
harsh shadows, dramatic side lighting, cinematic lighting, strong directional light, deep shadows, high contrast lighting, studio flash, HDR effect, specular highlights on metal, glossy reflections.

[Quality Control]
cropped garments, partial view, missing hem, missing sleeves, missing collar details, wrong buttons, wrong zipper, wrong pockets, wrong labels, wrong embroidery, flat lay, low quality, blurry, distorted fabric, CGI artifacts, CGI rendering, plastic texture, overly sharp, over-processed, merged garments, layered on same hanger, one complete worn outfit look, two garments fused together, color mixing between garments, same-style garments merged into one, too many props, overcrowded retail store, packed clothing rails, shelving full of merchandise, signage, missing clipped editorial poster, oversized poster, giant framed artwork, watermarks, readable text, gibberish letters, invented extra furniture, invented extra garments, paper-flat clothing, cardboard clothing, stiff fabric sheet, flat front panel, zero drape, frozen folds, hollow tube sleeves, ruler-straight hem, pasted-on garment look, extra empty hangers, spare hangers, decorative hangers, more hangers than garments, cheap curved baseboard, bulky rounded skirting, PVC baseboard trim, plastic baseboard, thick white baseboard, visible baseboard molding, dirty floor, floor specks, dust particles, floor debris, floor stains, textured dirty floor, speckled floor`;

export const HANGOUTFIT_TEMPLATES: HangoutfitTemplate[] = [
  {
    id: "default",
    name: "默认背景",
    description: "极简白墙挂拍，干净利落，重点突出服装。",
    previewSrc: "/hangoutfit/default-template.svg",
    sceneReferenceSrc: "/hangoutfit/default-template.svg",
    referenceBoardMode: "garments-grid",
    prompt: `[Template Scene: Minimal Boutique Default]
Set the scene as a cozy, minimalist clothing boutique corner with a clean pure white wall and a pure white floor — wall and floor are the same white tone, creating one continuous seamless white surface. No baseboard, no skirting, no trim. The floor is immaculately clean with zero specks, dust, or debris. Keep the composition airy and uncluttered.

[Template Props]
- One slim silver hanging rod across the frame
- Natural wooden hangers
- At most one elegant women's handbag selected to match the garments
- At most one pair of women's shoes or ankle boots selected to match the garments
- One visible clipped editorial poster or magazine page beside the garments, attached lightly with a small clip for a premium boutique accent
- Optionally one tiny clipped postcard or one restrained green plant branch at the edge

[Photography & Lighting]
Shot from a left-front three-quarter angle, about 30-45 degrees toward the right side of the rack, with a balanced mid-shot framing. Show some wall and floor breathing room, but do not pull back so far that the scene feels empty. Keep the garments visually important without making them feel oversized in frame. Soft, even, natural diffused daylight with a neutral-to-cool white balance. The lighting is bright and clean with minimal shadows. No yellow cast, no warm tungsten tint, no dramatic side lighting, no strong directional light, no visible light source.

[Environment & Vibe]
Warm, natural, inviting, and realistic — like a real indie fashion store, not a luxury showroom. The image should feel like a casual but tasteful phone photo taken in a well-lit shop.`,
    negativePrompt: `oversized furniture, loud decor, colorful signage, busy shop displays, visible shelving, checkout counter, oversized plant pots, green chair, branch installation, straight-on frontal view, symmetrical head-on shot, yellow wall, warm yellow cast, beige wall tint, cheap curved baseboard, bulky rounded skirting, PVC baseboard, plastic baseboard molding, thick white baseboard`,
  },
  {
    id: "boutique-olive",
    name: "秋冬买手店",
    description: "白墙、银色挂杆、枝干花艺与软装摆件，偏秋冬买手店陈列。",
    previewSrc: "/hangoutfit/boutique-olive-template.svg",
    sceneReferenceSrc: "/hangoutfit/boutique-olive-template.svg",
    referenceBoardMode: "garments-plus-scene-template",
    prompt: `[Template Scene: Olive Boutique Editorial]
Recreate the right-side boutique template scene with high fidelity:
- Clean matte white wall with only a faint cool-gray tonal variation
- Pure white or very light off-white floor — same tone as the wall, creating a seamless continuous white surface with no visible baseboard or skirting
- The floor must be immaculately clean: no specks, no dust spots, no debris, no texture noise
- One slim silver/chrome horizontal rod across the upper-middle composition, seen from a left-front three-quarter view so the rod recedes slightly toward the right
- Use only the exact number of wooden hangers needed for the uploaded garments in the final result
- One refined floral styling corner on the right side instead of a chair
- A tall arrangement of bare branches and one pale birch-like trunk behind the styling corner
- Add one understated premium floral/decor element near the lower-right area, such as a ceramic floor vase, a low floral arrangement, or a small sculptural decor piece with a boutique feel

[Template Styling Rules]
- Preserve the calm fall/winter boutique atmosphere with low-saturation olive, cream, black, charcoal, and restrained brown accents
- Keep the garments themselves faithful to their original colors and slightly brighter in exposure than a moody editorial shot; do not darken or mute the clothing unnaturally
- Keep the scene balanced with open negative space and a refined, buy-side showroom feel
- The floral styling corner and branch installation are important anchors and must stay visible
- One clipped editorial poster or magazine page near the upper-right rod area is also an important anchor and should remain visible
- The camera should look across the display from the left side, not straight on
- Use a balanced mid-shot rather than an extreme close-up or a distant wide shot
- The rod should stretch almost the full width of the frame, with clear breathing room around the garments
- Let the garments occupy a moderate, pleasing amount of the frame so the image feels composed and boutique-like
- The right-side decor should sit partially near the edge, not centered, and should feel elegant rather than bulky or cheap
- Keep the floor visible, but not overly dominant; avoid large empty areas
- Floor space should remain quiet but not vacant, with the floral/decor grouping visually anchoring the lower-right corner
- Place the optional bag and shoes relatively close to the garment group so the styling reads as one curated composition
- Add one clipped editorial poster or magazine page near the rod as a subtle boutique styling detail to reduce empty wall space without stealing focus
- You may add one structured handbag and/or one pair of simple shoes if they suit the outfit, but choose them freely based on the clothing rather than copying a specific bag or boot from the template
- Do not add store shelves, price tags, product stacks, wall art, or other retail clutter
- Do not generate wall text or handwriting

[Photography & Lighting]
Boutique phone-photo perspective from the left front at roughly 45 degrees, with a balanced medium framing. Use bright soft diffused daylight, a clean bright white wall, very gentle shadows, subtle depth, and realistic ambient indoor lighting. Lift the exposure slightly so the scene feels airy and premium rather than moody or dim. Preserve the uploaded garments' original colors while making the overall scene a touch brighter and cleaner. Keep the overall color temperature neutral or slightly cool. No dramatic contrast, no crushed blacks, no muddy shadows, and no yellow color cast.

    [Visual Goal]
The final result should feel like a premium seasonal boutique display: quiet, editorial, realistic, highly composed, and slightly brighter/cleaner than a moody autumn editorial, while still looking like a real store photo rather than a studio set.`,
    negativePrompt: `missing floral styling corner, missing bare branches, missing birch-like trunk, missing clipped editorial poster, crowded showroom, mirrored wall, visible racks full of inventory, fashion model, mannequin torso, bright commercial signage, handwriting on the wall, unreadable text, hard spotlight, luxury marble showroom, purple tones, saturated colors, copying the exact same handbag from the template, copying the exact same boots from the template, straight-on frontal view, symmetrical head-on shot, yellow wall, warm yellow cast, beige wall tint, cheap plastic chair, chunky casual chair, oversized chair, too much empty floor, empty foreground void, wide vacant floor area, office chair, dining chair, stool, gaming chair, extreme close-up framing, camera too near, garments too large in frame, tight crop, camera too far away, distant wide shot, tiny garments in frame, bag and shoes scattered too far away, underexposed scene, dim lighting, moody darkness, crushed blacks, muddy shadows, gray dingy wall, dulled garment colors, extra empty hangers, spare hangers, decorative hangers, more hangers than garments, cheap curved baseboard, bulky rounded skirting, PVC baseboard, plastic baseboard molding`,
  },
  {
    id: "editorial-round-table",
    name: "杂志圆台陈列",
    description: "杂志页、圆台与包鞋点缀，画面更完整，更有精品店陈列感。",
    previewSrc: "/hangoutfit/editorial-round-table-template.svg",
    sceneReferenceSrc: "/hangoutfit/editorial-round-table-template.svg",
    referenceBoardMode: "garments-plus-scene-template",
    prompt: `[Template Scene: Editorial Round Table Boutique]
Recreate the right-side boutique template scene with high fidelity:
- A warm off-white matte wall with a subtle creamy tone and a pure white or very light off-white floor — same tone as the wall, creating a seamless continuous surface with no visible baseboard, no skirting, no trim. The floor must be immaculately clean with zero specks or debris
- One slim silver horizontal rod spanning almost the full width of the composition across the upper section
- Use only the exact number of wooden hangers needed for the uploaded garments in the final result
- One hanging handbag anchor on the left side of the rod area, visually separate from the garments
- One slightly tilted clipped editorial magazine page near the upper-right rod area
- One small round pedestal table in the lower-left area with a refined top surface
- One pair of women's shoes placed on or around the round table
- One dark sculptural jewelry bust or small accessory display near the round table as a subtle boutique styling detail

[Template Styling Rules]
- Preserve the clean, calm, realistic boutique mood from the template image
- Keep the wall bright and warm, not gray, not yellow, and not dramatic
- The handbag anchor on the left, the clipped editorial page on the right, and the round table with shoes at the lower-left are mandatory scene anchors and must remain visible
- The garments are always the hero, but the scene should still feel like a fully composed store display rather than a blank wall
- Keep the handbag as a scene prop only. It must not be replaced by an uploaded garment and it must not count as one of the uploaded clothing items
- Keep the shoes and jewelry display compact and elegant; they should support the composition without becoming the main subject
- Do not add shelves full of inventory, mannequin forms, store signage, or oversized decorative furniture
- Maintain a balanced boutique composition with clear breathing room around the garments
- Keep the overall styling premium, restrained, and phone-photo realistic rather than luxury showroom glossy

[Garment Count Mapping]
- If 2 garments are uploaded, show exactly 2 garments hanging on the rod
- If 3 garments are uploaded, show exactly 3 garments hanging on the rod
- The uploaded garments must appear as separate hanging pieces on the same rod with visible spacing
- Do not invent a fourth garment
- Do not omit any uploaded garment
- Do not merge two garments into one
- The handbag, shoes, round table, magazine page, and jewelry display are props only and do not count toward garment count

[Photography & Lighting]
Shoot from a near-frontal boutique phone-photo angle with only a very slight offset. Keep the framing balanced and moderately pulled back so the full hanging garments, the left handbag anchor, the upper-right clipped editorial page, and the lower-left round table styling can all be read in one composition. Use soft, even natural indoor daylight with a clean bright exposure, minimal shadows, and realistic gentle depth. No dramatic spotlight, no hard shadow, no moody darkness, and no yellow tungsten cast.

[Visual Goal]
The final result should feel like a tasteful boutique display directly inspired by the template image: warm, airy, realistic, neatly styled, and highly suitable for product presentation while still looking like a real in-store photo.`,
    negativePrompt: `missing hanging handbag anchor, handbag replaced by garment, missing clipped editorial magazine page, missing round pedestal table, missing women's shoes on the table, missing jewelry bust, large empty wall, luxury showroom gloss, busy department store, visible shelves full of merchandise, stacked product boxes, mannequin body, human model, retail signage, cashier desk, oversized furniture, giant decor sculpture, floor mirror, sofa, armchair, bench, stool as main prop, bag and shoes too far from the garment group, round table moved to the center, garments not hanging on the rod, garment count mismatch, extra fourth garment, invented outerwear not uploaded, empty hangers, spare hangers, harsh yellow lighting, dim scene, moody darkness, dramatic spotlight, camera too close, distant wide shot, cheap curved baseboard, bulky rounded skirting, PVC baseboard, plastic baseboard molding`,
  },
];

export function getHangoutfitTemplateById(templateId: string): HangoutfitTemplate | undefined {
  return HANGOUTFIT_TEMPLATES.find((template) => template.id === templateId);
}

export function buildHangoutfitPrompt({
  template,
  uploadedCount,
  notes,
  accessories,
}: BuildHangoutfitPromptParams): string {
  const sections = [
    `[Core Setup: Boutique Hanging Display]`,
    buildCommonPromptIntro(accessories),
    template.prompt,
    buildCommonConstraints(uploadedCount),
  ];

  if (notes?.trim()) {
    sections.push(`[Additional Notes]\n${notes.trim()}`);
  }

  return sections.join("\n\n");
}

export function buildHangoutfitNegativePrompt(
  template: HangoutfitTemplate,
  uploadedCount: number,
  accessories?: AccessoryUploadInfo,
): string {
  const conditional =
    uploadedCount === 2
      ? "three garments when only two were uploaded"
      : "two garments when three were uploaded, fewer garments than uploaded";

  const hasShoes = accessories?.hasShoesImage ?? false;
  const hasBag = accessories?.hasBagImage ?? false;
  const accessoryNegatives: string[] = [];
  if (hasShoes) {
    accessoryNegatives.push("wrong shoes design", "different shoes than reference", "shoes color mismatch");
  }
  if (hasBag) {
    accessoryNegatives.push("wrong bag design", "different bag than reference", "bag color mismatch");
  }

  return `${COMMON_NEGATIVE_PROMPT}, ${conditional}, ${template.negativePrompt}${accessoryNegatives.length > 0 ? `, ${accessoryNegatives.join(", ")}` : ""}`;
}

export function buildHangoutfitWorkMetadata({
  line,
  uploadedImageCount,
  hasAdditionalNotes,
  selectedTemplateId,
  referenceBoardMode,
  hasShoesImage,
  hasBagImage,
}: BuildHangoutfitWorkMetadataParams) {
  return {
    line,
    hasAdditionalNotes,
    uploadedImageCount,
    selectedTemplateId,
    referenceBoardMode,
    hasShoesImage,
    hasBagImage,
  };
}
