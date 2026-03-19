export const FASHION_EXPOSURE_SAFETY_RULES_EN = `EXPOSURE SAFETY RULES:
- Natural fashion skin exposure such as waist, arms, shoulders, partial back, or legs is allowed when it is part of a real garment design.
- Do not generate nudity or near-nudity.
- Sensitive body parts including nipples, areola, underbust, butt crack, genital area, and pubic area must remain fully covered by opaque clothing.
- Do not make garments transparent enough to reveal private parts.
- Do not reduce the outfit into symbolic strips, tape, or minimal coverings. The result must remain a legitimate wearable fashion look.`;

export const FASHION_EXPOSURE_SAFETY_RULES_ZH = `【露肤安全约束】
- 允许正常时装露肤与设计感裁剪，例如露腰、露肩、露手臂、露背一部分或露腿。
- 禁止生成裸体、近似裸体或只有象征性遮挡的效果。
- 胸部敏感部位、臀部敏感部位、裆部和其他私密部位必须被真实且不透明的服装完整覆盖。
- 不得把服装改成会透出私密部位的透明效果。
- 最终效果必须是可正常穿着的时装造型，不能是裸体化的人体。`;

const DISALLOWED_EXPOSURE_PATTERNS: RegExp[] = [
  /(全裸|裸体|赤裸|一丝不挂|不着寸缕)/i,
  /(露点|乳头|乳晕|胸部敏感部位)/i,
  /(下体|私处|阴部|裆部裸露|生殖器)/i,
  /(臀沟|屁股蛋|臀部敏感部位)/i,
  /(topless|bottomless|nude|nudity|near[- ]?nude|nipple|areola|genital|pubic|butt crack)/i,
];

export function findExposurePolicyViolation(text: string): string | null {
  const normalized = text.trim();
  if (!normalized) return null;

  for (const pattern of DISALLOWED_EXPOSURE_PATTERNS) {
    if (pattern.test(normalized)) {
      return "支持正常露肤和设计感裁剪，但不支持裸体化或敏感部位裸露的要求，请调整补充说明后再试。";
    }
  }

  return null;
}
