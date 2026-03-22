import { describe, expect, test } from "vitest";

import {
  DEFAULT_DETAIL_FOCUS_OPTIONS,
  getFallbackDetailFocusOptions,
  parseDetailFocusOptionsContent,
} from "./fashion-detail-focus";

describe("fashion-detail-focus parser", () => {
  test("正常 JSON 可以解析出候选项", () => {
    const result = parseDetailFocusOptionsContent(`{
      "itemType": "短款牛仔外套",
      "summary": "门襟和口袋最值得拍。",
      "suggestions": [
        {
          "id": "structure-collar",
          "category": "structure",
          "title": "领口与门襟结构",
          "instruction": "拍领口与门襟结构",
          "reason": "最能说明版型。",
          "priority": 90
        }
      ]
    }`);

    expect(result.itemType).toBe("短款牛仔外套");
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].category).toBe("structure");
  });

  test("markdown 包裹的 JSON 也能解析", () => {
    const result = parseDetailFocusOptionsContent(`\`\`\`json
    {
      "itemType": "高腰阔腿裤",
      "summary": "腰头和裤脚值得拍。",
      "suggestions": [
        {
          "id": "feature-waist",
          "category": "feature",
          "title": "腰头细节",
          "instruction": "拍腰头细节",
          "reason": "适合说明裤型。",
          "priority": 88
        }
      ]
    }
    \`\`\``);

    expect(result.itemType).toBe("高腰阔腿裤");
    expect(result.suggestions[0].title).toBe("腰头细节");
  });

  test("JSON 截断时会尝试修复", () => {
    const result = parseDetailFocusOptionsContent(`{
      "itemType": "西装外套",
      "summary": "门襟和走线适合拍",
      "suggestions": [
        {
          "id": "craft-stitching",
          "category": "craft",
          "title": "走线工艺",
          "instruction": "拍走线工艺",
          "reason": "能体现做工",
          "priority": 80
        }
      ]`);

    expect(result.itemType).toBe("西装外套");
    expect(result.suggestions[0].category).toBe("craft");
  });

  test("fallback 会返回默认候选池", () => {
    const fallback = getFallbackDetailFocusOptions();

    expect(fallback.suggestions).toHaveLength(DEFAULT_DETAIL_FOCUS_OPTIONS.length);
    expect(fallback.summary).toContain("通用");
  });
});
