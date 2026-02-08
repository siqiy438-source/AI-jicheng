-- 添加"手绘风格"海报提示词
-- 执行方式：在 Supabase Dashboard > SQL Editor 中运行此脚本

INSERT INTO prompts (id, name, icon, prompt, description, category, is_active)
VALUES (
  'sketch',
  '手绘风格',
  '🖌️',
  'Create a hand-drawn style poster illustration.

【STYLE - Hand-drawn Journal Aesthetic】
- Hand-drawn illustration style, like a cute travel journal or planner
- Clean sketch aesthetic with soft pastel colors
- Doodle icons and decorative elements
- Whimsical hand-lettering for titles and text
- Cozy, warm illustration style
- White or light cream background

【COMPOSITION】
- Clear visual hierarchy with main title at top
- Organized sections with cute dividers
- Small illustrated icons and doodles scattered throughout
- Balance between text areas and illustrations
- Easy to read layout

【TECHNICAL REQUIREMENTS】
1. Soft, harmonious color palette (pastels preferred)
2. Clean lines, not messy or over-sketched
3. Include relevant illustrated elements based on the topic
4. Professional but approachable hand-drawn look
5. NO photorealistic elements
6. NO AI-generated perfection - keep it warm and human

User request: {user_prompt}',
  '手绘插画海报，手账风格，适合旅游攻略、美食推荐等内容',
  'drawing',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  prompt = EXCLUDED.prompt,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- 验证插入结果
SELECT id, name, icon, description FROM prompts WHERE id = 'sketch';
