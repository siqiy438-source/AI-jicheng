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
    expect(defaultPrompt).toContain("The lower part of the wall and floor should feel neat, premium, and visually quiet");
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
    expect(editorialPromptTwo).toContain("One hanging handbag anchor on the left side of the rod area");
    expect(editorialPromptTwo).toContain("One slightly tilted clipped editorial magazine page near the upper-right rod area");
    expect(editorialPromptTwo).toContain("One small round pedestal table in the lower-left area");
    expect(editorialPromptTwo).toContain("One pair of women's shoes placed on or around the round table");
    expect(editorialPromptTwo).toContain("If 2 garments are uploaded, show exactly 2 garments hanging on the rod");
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
    expect(editorialNegativePrompt).toContain("missing hanging handbag anchor");
    expect(editorialNegativePrompt).toContain("missing clipped editorial magazine page");
    expect(editorialNegativePrompt).toContain("missing round pedestal table");
    expect(editorialNegativePrompt).toContain("missing women's shoes on the table");
    expect(editorialNegativePrompt).toContain("missing jewelry bust");
    expect(editorialNegativePrompt).toContain("human model");
    expect(editorialNegativePrompt).toContain("visible shelves full of merchandise");
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
