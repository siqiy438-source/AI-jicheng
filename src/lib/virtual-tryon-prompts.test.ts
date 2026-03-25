import { describe, expect, test } from "vitest";

import {
  buildVirtualTryOnNegativePrompt,
  buildVirtualTryOnPrompt,
} from "./virtual-tryon-prompts";

describe("virtual try-on accessory prompts", () => {
  test("无鞋包时不注入配饰替换规则", () => {
    const prompt = buildVirtualTryOnPrompt({
      garmentCount: 2,
      category: "outfit",
      referenceMode: "multi-piece",
      garmentRoles: ["top", "bottom"],
    });
    const negativePrompt = buildVirtualTryOnNegativePrompt("outfit", "multi-piece");

    expect(prompt).not.toContain("SHOES reference image");
    expect(prompt).not.toContain("BAG reference image");
    expect(prompt).not.toContain("ACCESSORY SYNC RULES");
    expect(prompt).toContain("REFERENCE FIDELITY LOCK - NON-NEGOTIABLE");
    expect(prompt).toContain("The uploaded reference images are the single source of truth");
    expect(prompt).toContain("What the uploaded item looks like is exactly what the final item must look like.");
    expect(prompt).toContain("Do NOT change the item into a different style");
    expect(negativePrompt).toMatch(/(?:^|, )bag(?:,|$)/);
    expect(negativePrompt).not.toContain("wrong bag design");
  });

  test("上传鞋子后会声明鞋图顺序并改写鞋子负向规则", () => {
    const prompt = buildVirtualTryOnPrompt({
      garmentCount: 2,
      category: "outfit",
      referenceMode: "multi-piece",
      garmentRoles: ["top", "bottom"],
      accessories: {
        hasShoesImage: true,
        replacementMode: "conservative",
      },
    });
    const negativePrompt = buildVirtualTryOnNegativePrompt("top", "single-garment", {
      hasShoesImage: true,
      replacementMode: "conservative",
    });

    expect(prompt).toContain("Image 4 is the SHOES reference image");
    expect(prompt).toContain("Preserve the exact foot position, leg position, ankle angle, stride, crop, and ground contact from Image 1 while changing the shoes.");
    expect(prompt).toContain("For uploaded shoes: do not change toe shape, sole height, heel height");
    expect(negativePrompt).toContain("wrong shoes design");
    expect(negativePrompt).not.toContain("changed shoes");
  });

  test("上传鞋子和包包后会同时声明图片顺序并保留保守换包约束", () => {
    const prompt = buildVirtualTryOnPrompt({
      garmentCount: 3,
      category: "outfit",
      referenceMode: "multi-piece",
      garmentRoles: ["top", "bottom", "outer"],
      accessories: {
        hasShoesImage: true,
        hasBagImage: true,
        replacementMode: "conservative",
      },
    });
    const negativePrompt = buildVirtualTryOnNegativePrompt("outfit", "multi-piece", {
      hasShoesImage: true,
      hasBagImage: true,
      replacementMode: "conservative",
    });

    expect(prompt).toContain("Image 5 is the SHOES reference image");
    expect(prompt).toContain("Image 6 is the BAG reference image");
    expect(prompt).toContain("If Image 1 has no bag and no natural carrying/contact condition, do not invent a new bag.");
    expect(prompt).toContain("For uploaded bags: do not change bag shape, size impression, strap/handle type");
    expect(prompt).toContain("Do not restyle, simplify, beautify, reinterpret, or swap the uploaded shoes or bag into a similar-looking item.");
    expect(negativePrompt).toContain("wrong bag design");
    expect(negativePrompt).toContain("wrong shoes design");
    expect(negativePrompt).not.toMatch(/(?:^|, )bag(?:,|$)/);
  });
});
