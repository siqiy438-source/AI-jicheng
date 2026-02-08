-- 添加"女装搭配模特图"风格
-- 执行方式：在 Supabase Dashboard > SQL Editor 中运行此脚本

INSERT INTO prompts (id, name, icon, prompt, description, category, is_active)
VALUES (
  'outfit-model',
  '女装搭配模特图',
  '👗',
  'Create a professional flat-lay fashion outfit image in elegant layered style.

【LAYOUT - CRITICAL - Follow the reference image style exactly】
- Jacket/Outerwear: Open and spread wide at the TOP, showing inner lining if any
- Inner top/T-shirt: Positioned UNDER the jacket, centered, partially visible
- Pants: Laid BELOW, with the waistband slightly tucked under the inner top
- Shoes: ONE pair placed at the bottom corner, angled naturally
- Accessory: Add ONE small accessory (watch, bracelet, or sunglasses) near the shoes

【COMPOSITION STYLE】
- Items should OVERLAP naturally like a styled flat-lay, NOT separated in a grid
- Create visual depth with layering: outer > inner > bottom
- Overall aesthetic: Pinterest outfit inspo, fashion blogger style, Instagram flatlay

【COLOR & BACKGROUND】
- Analyze uploaded clothing colors and choose a harmonious SOLID background
- Background options: warm beige, soft cream, light gray, or muted blush
- The background should complement the clothing palette

【TECHNICAL REQUIREMENTS】
1. Based on the uploaded clothing style, intelligently ADD:
   - ONE pair of matching shoes (sneakers, loafers, heels - whatever fits the vibe)
   - ONE small accessory that elevates the look
2. Soft natural shadows for depth and dimension
3. Professional product photography quality, clean and polished
4. NO text, NO watermarks, NO models, NO mannequins
5. Vertical 9:16 aspect ratio

User uploaded clothing items: {user_prompt}',
  '层叠式平铺搭配图，自动添加鞋子和配饰，类似小红书/Pinterest风格',
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
SELECT id, name, icon, description FROM prompts WHERE id = 'outfit-model';
