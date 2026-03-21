import { describe, expect, test } from "vitest";

import {
  buildDefaultHangoutfitNegativePrompt,
  buildDefaultHangoutfitPrompt,
  buildHangoutfitNegativePrompt,
  buildHangoutfitPrompt,
  buildHangoutfitWorkMetadata,
  getHangoutfitTemplateById,
  HANGOUTFIT_TEMPLATES,
} from "./hangoutfit";

describe("hangoutfit templates", () => {
  test("默认背景保留原始挂搭 prompt 语义", () => {
    const defaultPrompt = buildDefaultHangoutfitPrompt({
      uploadedCount: 2,
      notes: "更偏轻熟通勤",
    });
    const defaultNegativePrompt = buildDefaultHangoutfitNegativePrompt(2);

    expect(defaultPrompt).toContain("[Core Setup: Minimal Hanging Rod]");
    expect(defaultPrompt).toContain("Shot from a near-frontal angle with a very slight offset.");
    expect(defaultPrompt).toContain("The image should look like a casual iPhone photo taken in a well-lit shop.");
    expect(defaultPrompt).toContain("Include one visible editorial poster or magazine page clipped to the rod and hanging beside the garments");
    expect(defaultPrompt).toContain("Place it near the upper-right side of the garment group");
    expect(defaultPrompt).toContain("[Framing & Lower Scene Refinement]");
    expect(defaultPrompt).toContain("Keep the camera slightly pulled back compared with a tight close-up");
    expect(defaultPrompt).toContain("The entire lower portion of the frame must be immaculately clean");
    expect(defaultPrompt).toContain("[Additional Notes]\n更偏轻熟通勤");
    expect(defaultNegativePrompt).toContain("invented extra garment");
    expect(defaultNegativePrompt).toContain("three garments when only two were uploaded");
    expect(defaultNegativePrompt).toContain("dirty lower wall");
    expect(defaultNegativePrompt).toContain("camera too near");
    expect(defaultNegativePrompt).toContain("missing clipped editorial poster");
    expect(defaultNegativePrompt).toContain("oversized framed wall art");
  });

  test("模板列表包含新增的参考图同款场景", () => {
    expect(HANGOUTFIT_TEMPLATES.map((template) => template.id)).toEqual([
      "default",
      "boutique-olive",
      "editorial-round-table",
    ]);
  });

  test("不同模板生成不同的 prompt", () => {
    const defaultTemplate = getHangoutfitTemplateById("default");
    const boutiqueTemplate = getHangoutfitTemplateById("boutique-olive");
    const editorialTemplate = getHangoutfitTemplateById("editorial-round-table");

    expect(defaultTemplate).toBeDefined();
    expect(boutiqueTemplate).toBeDefined();
    expect(editorialTemplate).toBeDefined();

    const defaultPrompt = buildHangoutfitPrompt({
      template: defaultTemplate!,
      uploadedCount: 2,
      notes: "更偏通勤",
    });
    const boutiquePrompt = buildHangoutfitPrompt({
      template: boutiqueTemplate!,
      uploadedCount: 3,
    });
    const editorialPromptTwo = buildHangoutfitPrompt({
      template: editorialTemplate!,
      uploadedCount: 2,
    });
    const editorialPromptThree = buildHangoutfitPrompt({
      template: editorialTemplate!,
      uploadedCount: 3,
    });

    expect(defaultPrompt).toContain("Minimal Boutique Default");
    expect(defaultPrompt).toContain("[Additional Notes]\n更偏通勤");
    expect(defaultPrompt).toContain("One visible clipped editorial poster or magazine page beside the garments");
    expect(boutiquePrompt).toContain("refined floral styling corner");
    expect(boutiquePrompt).toContain("bare branches");
    expect(boutiquePrompt).toContain("You receive exactly 3 uploaded garments.");
    expect(boutiquePrompt).toContain("The final image must contain exactly 3 visible hangers total");
    expect(boutiquePrompt).toContain("The bag and shoes do NOT need to match the template reference exactly.");
    expect(boutiquePrompt).toContain("Include one visible clipped editorial poster or magazine page hanging beside the garments");
    expect(boutiquePrompt).toContain("One clipped editorial poster or magazine page near the upper-right rod area is also an important anchor");
    expect(boutiquePrompt).toContain("left front at roughly 45 degrees");
    expect(boutiquePrompt).toContain("Clean matte white wall");
    expect(boutiquePrompt).toContain("Lift the exposure slightly so the scene feels airy and premium rather than moody or dim");
    expect(boutiquePrompt).toContain("Preserve the uploaded garments' original colors while making the overall scene a touch brighter and cleaner");
    expect(boutiquePrompt).toContain("The garments must feel like real cloth, not cardboard or paper cutouts");
    expect(editorialPromptTwo).toContain("Editorial Round Table Boutique");
    expect(editorialPromptTwo).toContain("pale French-limestone / travertine-style tile floor");
    expect(editorialPromptTwo).toContain("natural aged stone tiles in mixed rectangular sizes");
    expect(editorialPromptTwo).toContain("classic staggered modular pattern");
    expect(editorialPromptTwo).toContain("visible fossil-like pores");
    expect(editorialPromptTwo).toContain("softly chalky matte depth");
    expect(editorialPromptTwo).toContain("wall texture must be visibly readable, not just implied");
    expect(editorialPromptTwo).toContain("delicate trowel movement");
    expect(editorialPromptTwo).toContain("The rod should feel positioned near a window side of the boutique");
    expect(editorialPromptTwo).toContain("One premium handbag anchor hanging directly from the left side of the rod, visually separate from the garments, with roughly three-quarters of the bag visible in frame");
    expect(editorialPromptTwo).toContain("One slightly tilted clipped editorial magazine page near the upper-right rod area, but pulled a bit inward toward the center");
    expect(editorialPromptTwo).toContain("One small round pedestal table in the lower-left area");
    expect(editorialPromptTwo).toContain("One pair of women's shoes placed on or around the round table, shifted slightly inward toward the center");
    expect(editorialPromptTwo).toContain("If 2 garments are uploaded, show exactly 2 garments hanging on the rod");
    expect(editorialPromptTwo).toContain("[Additional Garment Constraints]");
    expect(editorialPromptTwo).toContain("There must be a visible natural light-and-shadow atmosphere in the final image");
    expect(editorialPromptTwo).toContain("reduce obvious wrinkles, fold marks, hanger dents, bubbling, and seam puckering as much as possible");
    expect(editorialPromptTwo).toContain("keep the real weave, jacquard grain, denim grain, thickness, gloss level, and tactile material character");
    expect(editorialPromptTwo).toContain("real window-adjacent ambient light in a boutique");
    expect(editorialPromptTwo).toContain("allow a subtle natural brightness falloff and very gentle directional shading");
    expect(editorialPromptTwo).toContain("not a deliberate studio lighting setup or lightbox setup");
    expect(editorialPromptTwo).toContain("near-frontal eye-level boutique phone-photo angle");
    expect(editorialPromptTwo).toContain("approximately 8x tighter than the previous medium framing");
    expect(editorialPromptTwo).toContain("aiming for an ultra-tight close-up display composition");
    expect(editorialPromptTwo).toContain("The top and pants must dominate the image and take up almost all of the frame");
    expect(editorialPromptTwo).toContain("Reduce empty wall and empty floor to the bare minimum, but keep one clearly readable strip of floor at the bottom of frame");
    expect(editorialPromptTwo).toContain("The composition should feel compressed, enlarged, and visually packed");
    expect(editorialPromptTwo).toContain("let the garments hang very large in frame");
    expect(editorialPromptTwo).toContain("keep one readable wall patch near the garments");
    expect(editorialPromptTwo).toContain("Pull the clipped editorial page slightly inward toward the center");
    expect(editorialPromptTwo).toContain("Do not use a top-down angle, upward-looking angle, or dramatic perspective distortion");
    expect(editorialPromptTwo).toContain("window-frame light and shadow shapes fall naturally across the garments, wall, and floor in one continuous flow");
    expect(editorialPromptTwo).toContain("The light should travel naturally from wall to floor with a smooth transition");
    expect(editorialPromptTwo).toContain("soft-edged, semi-diffused, lightly broken up, and physically plausible");
    expect(editorialPromptTwo).toContain("Keep the overall white balance around 3500K");
    expect(editorialPromptTwo).toContain("The handbag must hang directly from the metal rod itself on the far-left side");
    expect(editorialPromptTwo).toContain("Show only about three-quarters of the handbag in frame");
    expect(editorialPromptTwo).toContain("Never hang the bag on a clothing hanger");
    expect(editorialPromptTwo).toContain("The metal rod must remain one single continuous horizontal line behind the whole display");
    expect(editorialPromptTwo).toContain("The rod must remain visibly extended to the left of the handbag as one connected uninterrupted rod segment");
    expect(editorialPromptTwo).toContain("quietly luxurious");
    expect(editorialPromptThree).toContain("If 3 garments are uploaded, show exactly 3 garments hanging on the rod");
    expect(editorialPromptThree).toContain("The handbag, shoes, round table, magazine page, and jewelry display are props only");
  });

  test("负向 prompt 会带上模板约束和件数约束", () => {
    const boutiqueTemplate = getHangoutfitTemplateById("boutique-olive");
    const editorialTemplate = getHangoutfitTemplateById("editorial-round-table");
    expect(boutiqueTemplate).toBeDefined();
    expect(editorialTemplate).toBeDefined();

    const negativePrompt = buildHangoutfitNegativePrompt(boutiqueTemplate!, 2);
    const editorialNegativePrompt = buildHangoutfitNegativePrompt(editorialTemplate!, 3);

    expect(negativePrompt).toContain("three garments when only two were uploaded");
    expect(negativePrompt).toContain("missing floral styling corner");
    expect(negativePrompt).toContain("copying the exact same handbag from the template");
    expect(negativePrompt).toContain("straight-on frontal view");
    expect(negativePrompt).toContain("paper-flat clothing");
    expect(negativePrompt).toContain("extra empty hangers");
    expect(negativePrompt).toContain("missing clipped editorial poster");
    expect(negativePrompt).toContain("underexposed scene");
    expect(negativePrompt).toContain("oversized poster");
    expect(editorialNegativePrompt).toContain("two garments when three were uploaded, fewer garments than uploaded");
    expect(editorialNegativePrompt).toContain("missing premium handbag anchor on the left side of the rod");
    expect(editorialNegativePrompt).toContain("handbag hanging on clothing hanger");
    expect(editorialNegativePrompt).toContain("handbag placed on round table");
    expect(editorialNegativePrompt).toContain("cropped left rod segment");
    expect(editorialNegativePrompt).toContain("broken rod");
    expect(editorialNegativePrompt).toContain("rod ending at handbag");
    expect(editorialNegativePrompt).toContain("missing clipped editorial magazine page");
    expect(editorialNegativePrompt).toContain("missing round pedestal table");
    expect(editorialNegativePrompt).toContain("missing women's shoes on the table");
    expect(editorialNegativePrompt).toContain("missing jewelry bust");
    expect(editorialNegativePrompt).toContain("human model");
    expect(editorialNegativePrompt).toContain("visible shelves full of merchandise");
    expect(editorialNegativePrompt).toContain("over-lit studio effect");
    expect(editorialNegativePrompt).toContain("flat studio lighting");
    expect(editorialNegativePrompt).toContain("fully even wall lighting");
    expect(editorialNegativePrompt).toContain("wrong color temperature");
    expect(editorialNegativePrompt).toContain("orange tungsten cast");
    expect(editorialNegativePrompt).toContain("top-down angle");
    expect(editorialNegativePrompt).toContain("low-angle shot");
    expect(editorialNegativePrompt).toContain("too much empty wall");
    expect(editorialNegativePrompt).toContain("garments too small in frame");
    expect(editorialNegativePrompt).toContain("camera too far away");
    expect(editorialNegativePrompt).toContain("medium-wide composition");
    expect(editorialNegativePrompt).toContain("editorial page too far to the right edge");
    expect(editorialNegativePrompt).toContain("overly pulled-back framing");
    expect(editorialNegativePrompt).toContain("too much floor showing");
    expect(editorialNegativePrompt).toContain("no readable floor strip");
    expect(editorialNegativePrompt).toContain("no readable wall texture patch");
    expect(editorialNegativePrompt).toContain("microcement texture not visible");
    expect(editorialNegativePrompt).toContain("limestone texture not visible");
    expect(editorialNegativePrompt).toContain("entire handbag fully centered in frame");
    expect(editorialNegativePrompt).toContain("shoes pushed too far outward");
    expect(editorialNegativePrompt).toContain("weak stone texture");
    expect(editorialNegativePrompt).toContain("generous blank margins");
    expect(editorialNegativePrompt).toContain("zoomed-out look");
    expect(editorialNegativePrompt).toContain("wide border around garments");
    expect(editorialNegativePrompt).toContain("clothes not filling frame");
    expect(editorialNegativePrompt).toContain("seamless white floor");
    expect(editorialNegativePrompt).toContain("cheap ceramic tiles");
    expect(editorialNegativePrompt).toContain("polished porcelain tiles");
    expect(editorialNegativePrompt).toContain("high-gloss stone floor");
    expect(editorialNegativePrompt).toContain("hard sunbeam streaks");
    expect(editorialNegativePrompt).toContain("sharp window shadow bars");
    expect(editorialNegativePrompt).toContain("hard-edged geometric shadows");
    expect(editorialNegativePrompt).toContain("theatrical projection lighting");
    expect(editorialNegativePrompt).toContain("obvious wrinkles");
    expect(editorialNegativePrompt).toContain("hanger dents");
    expect(editorialNegativePrompt).toContain("texture loss");
    expect(editorialNegativePrompt).toContain("over-smoothed fabric");
  });

  test("保存 metadata 时会记录选中的模板", () => {
    expect(
      buildHangoutfitWorkMetadata({
        line: "speed",
        uploadedImageCount: 3,
        hasAdditionalNotes: true,
        selectedTemplateId: "boutique-olive",
        referenceBoardMode: "garments-plus-scene-template",
      }),
    ).toEqual({
      line: "speed",
      uploadedImageCount: 3,
      hasAdditionalNotes: true,
      selectedTemplateId: "boutique-olive",
      referenceBoardMode: "garments-plus-scene-template",
      detectedRoles: undefined,
      userProvidedBag: undefined,
      userProvidedShoes: undefined,
    });
  });
});
