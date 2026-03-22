import { describe, expect, test } from "vitest";

import { buildFashionBreakdownPrompt } from "./fashion-prompts";

describe("buildFashionBreakdownPrompt", () => {
  test("3:4 模式包含竖版左右分栏约束", () => {
    const prompt = buildFashionBreakdownPrompt("3:4");

    expect(prompt).toContain("3:4 portrait frame");
    expect(prompt).toContain("vertical split layout");
    expect(prompt).toContain("pure white background");
    expect(prompt).toContain("absolutely no text");
  });

  test("4:3 模式保持左右分栏而不是上下布局", () => {
    const prompt = buildFashionBreakdownPrompt("4:3");

    expect(prompt).toContain("4:3 landscape frame");
    expect(prompt).toContain("left-right split layout inside the 4:3 frame");
    expect(prompt).toContain("Do not switch to a top-bottom layout");
    expect(prompt).toContain("Shoes, but ONLY when they are clearly visible");
  });

  test("用户补充说明会追加且不会覆盖硬规则", () => {
    const prompt = buildFashionBreakdownPrompt("3:4", "右侧更克制一点");

    expect(prompt).toContain("Additional user notes (secondary priority only");
    expect(prompt).toContain("右侧更克制一点");
    expect(prompt).toContain("Do NOT hallucinate, invent, or add any item");
    expect(prompt).toContain("absolutely no text");
  });
});
