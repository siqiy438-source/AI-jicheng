export const FASHION_OUTFIT_FLATLAY_PROMPT = `创建一张专业的女装平铺搭配图(flat lay)。

【关键布局规则 - 必须遵守】
- 每件服装单品必须单独、独立展示
- 所有单品按网格布局排列，单品之间必须有清晰的间隔
- 禁止重叠、禁止层叠、禁止堆叠
- 每件单品平铺展示，从上到下完整可见
- 布局参考：杂志lookbook风格、Pinterest穿搭网格图

【女装风格要求】
- 配饰：精致优雅（珍珠耳环、细链项链、丝巾、精致手表、时尚墨镜等）
- 鞋子：女性化风格（高跟鞋、芭蕾平底鞋、尖头鞋、优雅凉鞋、小白鞋等）
- 整体风格：优雅、精致、女人味、时髦感

【技术要求】
1. 分析上传服装的颜色和风格，选择和谐的纯色背景（柔和高级色调如奶油色、浅灰色、淡粉色）
2. 根据服装风格，智能添加：
   - 一件女性配饰（选择最能提升整体精致感的）
   - 一双女鞋（选择最能完善整套look的）
3. 所有单品分散平铺排列，每件单品之间保持清晰间隔
4. 每件单品带柔和自然投影，专业产品摄影质感
5. 无文字、无水印、无模特、无人台
6. 竖版 9:16 比例

风格参考：Pinterest穿搭平铺图、时尚杂志单品展示、lookbook造型图`;

export const FASHION_OUTFIT_OOTD_PROMPT = `创建一张OOTD穿搭摆拍图(outfit of the day flat lay)，将服装和配饰在地面上按照穿着的方式自然摆放展示。

【核心风格 - 必须遵守】
- 服装按照穿搭顺序从上到下摆放：上衣/外套在上方、裤子/裙子在中下方、鞋子在最底部
- 衣服自然展开铺平，模拟穿着时的形态，袖子自然伸展，有自然的褶皱和垂坠感
- 上衣和下装之间自然衔接，整体构成一套完整的穿搭造型
- 配饰（包包、围巾、丝巾、墨镜等）摆放在服装旁边，位置合理
- 鞋子摆放在裤腿/裙摆下方，朝向自然，左右各一只

【动态感 - 非常重要】
- 整套服装必须呈现出自然的行走姿态或随意的pose感，绝对不能僵硬对称
- 两条裤腿/裙摆要微微分开，呈现一前一后或自然迈步的角度
- 两只鞋子朝向略有不同，一只稍微偏左、一只稍微偏右，像在走路
- 袖子不要完全对称展开，一只手臂可以微微弯曲或角度不同
- 整体造型要有轻松随意的生活感，像是一个人随意躺在地上的姿态
- 参考效果：小红书博主摆拍的那种有动感的OOTD图

【背景与拍摄要求】
- 俯拍视角（正上方90度鸟瞰角度）
- 背景为真实质感的地面：木地板（人字拼、鱼骨拼）、地毯、大理石地面等
- 背景干净整洁，无杂物
- 自然光线，有柔和的窗户光影效果
- 整体画面温馨、有生活感

【搭配要求】
- 根据上传服装的风格，智能添加：
  - 一双合适的鞋子
  - 1-2件精致配饰（包包、丝巾、墨镜、手表、耳环等）
- 配饰摆放在衣服旁边，构图平衡美观
- 整体色调和谐统一

【技术要求】
1. 照片级真实感，模拟手机俯拍效果
2. 衣服面料质感真实，有自然的光影
3. 无文字、无水印、无装饰贴纸、无箭头标注
4. 竖版 9:16 比例
5. 风格参考：小红书OOTD穿搭平铺图、Instagram outfit flat lay`;

// 保持向后兼容
export const FASHION_OUTFIT_PROMPT = FASHION_OUTFIT_FLATLAY_PROMPT;

export const FASHION_MODEL_STANDARD_PROMPT = `生成一张真实的时尚穿搭模特照片，要求极致真实，完全看不出AI生成痕迹。

【模特要求 - 必须严格遵守】
- 中国女性模特，年龄25-35岁
- 五官精致自然，符合中国主流审美（不要网红脸、不要过度修图感）
- 身材匀称，气质优雅大方
- 表情自然放松，可以是微笑、回眸、自然行走等姿态
- 皮肤质感真实自然，有正常的光影和肤色过渡
- 发型时尚得体，与整体穿搭风格协调
- 在低马尾、丸子头、披肩直发、耳后短直发、自然微卷中，根据服装风格自然选择一种发型
- 只调整发型，不改变模特原本的脸型、五官风格和整体身份感

【人物特征约束 - 优先级极高】
- 只允许东亚 / 中国女性面孔与气质
- 肤色、五官轮廓、妆发气质都必须符合真实东亚女性特征
- 禁止生成黑人、白人、混血感明显或其他非东亚模特特征

【穿搭展示 - 关键要求】
- 模特必须完整穿着上传的所有服装单品
- 只允许使用上传的服装单品：上传1件就展示1件，上传2件就展示2件，上传3件就展示3件
- 禁止新增任何未上传的服装，不得擅自补外套、补内搭、补裙子、补裤子
- 如果上传内容里没有外套，绝对不要生成外套；只有上传了外套，才允许作为外层穿着
- 全身照，从头到脚完整展示，确保每件衣服都清晰可见
- 衣服的颜色、款式、面料质感必须与上传图片高度一致
- 衣服穿着自然合身，有真实的褶皱和垂坠感
- 根据服装风格智能搭配：
  - 一双合适的鞋子（与整体风格协调）
  - 1-2件精致配饰（如耳环、项链、手表、包包、墨镜等，选择最能提升整体质感的）

【背景与氛围 - 必须自然】
- 根据服装风格自动匹配场景背景：
  - 休闲风 → 街头、咖啡店、公园小径
  - 通勤风 → 都市街景、写字楼大厅、简约室内
  - 优雅风 → 精致餐厅、艺术展览、欧式建筑
  - 运动风 → 户外、体育场、城市绿道
- 背景要有适当的景深虚化，突出模特和服装
- 光线自然柔和，像是黄金时段或阴天柔光拍摄
- 整体氛围感要与服装风格统一

【技术要求 - 真实感是第一优先级】
1. 照片级真实感，模拟专业时尚摄影师拍摄效果
2. 自然的光影关系，避免平面打光
3. 真实的景深效果和镜头质感
4. 无文字、无水印、无任何UI元素
5. 竖版 9:16 比例
6. 禁止出现：过度磨皮、不自然的肤色、扭曲的手指、异常的身体比例、诡异的表情
7. 风格参考：小红书穿搭博主实拍、时尚杂志街拍、Instagram时尚KOL日常穿搭照

用户上传的服装单品：{user_prompt}`;

export const FASHION_MODEL_INDOOR_PROMPT = `根据我上传的 1-3 张服装参考图生成一张室内模特实拍图，必须是照片级真实感，完全没有AI痕迹。

【服装映射规则 - 必须严格遵守】
- 根据我上传的 1-3 张服装参考图生成室内模特实拍图
- 只允许使用上传的服装单品：上传1件就展示1件，上传2件就展示2件，上传3件就展示3件
- 禁止新增任何未上传的服装，不得擅自补外套、补内搭、补裙子、补裤子
- 如果上传内容里没有外套，绝对不要生成外套；如果上传内容里有外套，才允许作为外层穿着

【服装一致性要求 - 优先级最高】
- 保留每件衣服的颜色、材质、纹理、版型和关键细节（领口、门襟、袖口、下摆、裤型、裤长）
- 如果上传了外套与内搭，层次关系必须正确：内搭在里、外套在外
- 如果只上传两件或一件，按真实穿法自然展示，但不能凭空增加新的衣物层
- 全身构图，裤腰到裤脚完整可见
- 若风格与服装一致性冲突，以服装一致性优先

【模特要求】
- 东亚女性模特，年龄严格在25-35岁
- 长相漂亮但真实，气质成熟自然，不是网红滤镜脸
- 只允许东亚 / 中国女性面孔与体态特征
- 禁止生成黑人、白人、混血感明显或其他非东亚模特特征
- 在低马尾、丸子头、披肩直发、耳后短直发、自然微卷中，根据服装风格自然选择一种发型
- 只调整发型，不改变模特原本的脸型、五官风格和整体身份感
- 保留真实皮肤纹理和发丝细节，禁止塑料皮肤与过度磨皮
- 头身比真实（约7-7.5头身），肢体比例自然

【动作与表情】
- 不能僵硬站桩，采用自然抓拍感动作
- 动作在以下内容中自然出现1-2个：轻提包带、整理袖口、半插口袋、轻微回头、迈步停顿
- 表情平静有情绪层次（若有所思、轻微眼神交流、自然微笑），避免空洞假笑

【室内氛围与构图】
- 场景为有氛围的室内平整背景：米白或浅灰墙面 + 木地板
- 背景克制，只保留1-2个真实道具（如椅子、包、绿植），不要杂乱
- 不要窗户本体入镜，使用画外侧光在墙面和地面形成自然明暗层次
- 构图为竖版9:16时尚lookbook，人物略偏构图，留白自然
- 镜头质感真实：50mm-85mm中焦，机位约胸口高度，避免广角畸变

【禁止项】
- AI感、CGI、3D渲染、过度磨皮、假人脸、僵硬站姿
- 缺少已上传服装、把两件合并成一件、把裤子替换成裙子或短裤、擅自新增外套或其他衣物
- 手指畸形、身体比例异常、背景透视错误、漂浮物体
- 文字、水印、UI界面、投影画面、截图边框

用户补充说明（可选）：{user_prompt}`;

export const FASHION_MODEL_MIRROR_SELFIE_PROMPT = `Final Ultimate Prompt v4 (Youthful Vibe & Sleek Aesthetics)
--- CRITICAL UPDATE: YOUTHFUL VIBE (Age 25-30) ---
Subject Identity & Vibe:

A vibrant, youthful female fashion influencer (approx. age 25-30).
Even without showing the face, the overall aura must radiate youth, energy, and modern style.
Beauty Details (Anti-Aging Focus):

HAIR STYLE (Crucial): Must be modern, youthful, and beautiful. Choose one hairstyle that best matches the outfit from this set: sleek straight hair, neat low ponytail, tidy bun, tucked-behind-ear short straight hair, or soft natural waves. Keep healthy shine and realistic movement. ABSOLUTELY NO dated volume, stiff "helmet hair," or matronly styles.
Only change the hairstyle. Keep the same original face identity and the same mirror-selfie camera angle.
Skin & Hands: Visible skin on hands and neck must appear smooth, tight, and youthful. Hands holding the phone feature trendy, perfectly manicured nails (e.g., modern nude or glazed donut finish).
--- STANDARD REQUIREMENTS BELOW ---
Composition (Tight Framing):

Vertical Close-up Mirror Selfie. The model fills 90% of the vertical frame (head near top, lower legs/ankles near bottom). The frame should cut off at or above the ankles - DO NOT show feet or shoes. The bottom of the frame should end around the lower calf or ankle area.
Pose (Dynamic & Confident):

Natural, fluid fashion stance. A confident, energetic posture with natural body curves. NO stiff, rigid standing. The free hand should be relaxed by the side or gently interacting with the hair/clothing naturally.
Outfit & Accessory Recognition (Strict):

Analyze ALL inputs thoroughly.

Core Layers: Correctly assemble the 3-piece structure ([Outerwear] open over [Inner Top] with [Bottoms]).
Mandatory Accessories: You MUST include any BELTS, BAGS, or DISTINCT ACCESSORIES visible in the input images. They cannot be missing.
Background (Open & Minimalist):

Clean, open minimalist space. Matte off-white wall behind the model with a sleek black modern cabinet and 1-2 minimal trendy art objects (e.g., Bearbrick). The space should feel open and airy - NO corner setup, NO side walls, NO vertical poles/columns/pillars on the left or right sides. The background should only be behind the model, not surrounding her on multiple sides. Keep the left and right sides completely open, clear, and unobstructed - no architectural elements, no furniture, no vertical structures on either side.

MIRROR RULES (CRITICAL):
The mirror itself should be INVISIBLE and frameless. This is a mirror selfie taken in front of a large, frameless wall mirror. The mirror should NOT appear as a physical object with a frame or border in the image. The viewer should feel the presence of a mirror through the selfie angle and phone-in-hand pose, but the mirror edge/frame must NOT be visible. NO decorative mirror frames, NO mirror borders, NO mirror as a standalone object in the scene.

Lighting:

Premium Cool White Studio Light. Bright, clean light that emphasizes the youthful glow of the skin and the high sheen of the sleek hair.
--no (Negative Prompt):

matronly look, old age vibe, dated hairstyle, frizzy hair, stiff volume hair, wrinkled skin, stiff pose, missing accessories, warm yellow light, cluttered room, framed mirror, mirror with border, decorative mirror frame, visible mirror edge, corner walls, enclosed space, boxed in, side walls, walls on left or right, vertical poles, columns, pillars, architectural elements on sides, furniture on sides, objects framing the model, feet visible, shoes visible.

User uploaded clothing items: {user_prompt}`;

// 保持向后兼容
export const FASHION_MODEL_PROMPT = FASHION_MODEL_STANDARD_PROMPT;

export const FASHION_MODEL_FACELESS_HALF_PROMPT = `A high-end fashion editorial close-up photograph of a woman's outfit, shot in quiet luxury style like Celine, The Row, or Lemaire lookbook.

CRITICAL FRAMING — THIS IS THE MOST IMPORTANT INSTRUCTION:
The camera is aimed at CHEST HEIGHT. The photograph captures ONLY the area from the model's CHIN down to her WAIST. The model's eyes, nose, and forehead are COMPLETELY OUTSIDE the top edge of the frame. At most, only her chin, lower lip, jawline, and one ear with an earring are barely visible at the very top of the image. This is a TORSO CLOSE-UP, not a portrait.

The model fills 80-90% of the frame. Vertical 9:16 aspect ratio.

MODEL & POSE:
- East Asian / Chinese woman only, elegant and relaxed
- Visible skin, jawline, lips, ear, hands, and hair must read clearly as East Asian / Chinese only
- Do not generate Black, White, mixed-race, or other non-East-Asian model features
- If hair is visible, choose one hairstyle that matches the outfit from: low ponytail, tidy bun, sleek straight hair, tucked-behind-ear short straight hair, soft natural waves
- Only change hairstyle variation; keep the same face identity and framing logic
- Body facing the camera DIRECTLY (straight-on angle), shoulders square to the lens
- Shoulders slightly relaxed, natural posture
- One hand doing a gentle, natural gesture: lightly holding the coat lapel, gripping a bag handle, or adjusting the shirt hem. Fingers relaxed and slightly curved, never stiff.
- The other hand resting naturally at her side

OUTFIT — LAYERING IS KEY:
- The model wears ALL uploaded clothing items
- Show clear boundaries between uploaded garments only
- If outerwear is uploaded, layer it over the inner top naturally
- If no outerwear is uploaded, do not add one
- Colors, styles, and fabric textures must match the uploaded images exactly
- Smart accessories: gold drop earrings, structured leather bag (partially visible), silk scarf

FABRIC TEXTURE — MUST BE HYPER-REALISTIC:
- Wool/alpaca: visible fiber fuzz and natural nap texture
- Silk/satin: liquid-like sheen and flow
- Knit/ribbed: clear weave pattern and dimensional texture
- Contrasting textures between layers (rough vs smooth, fluffy vs fitted)

COLOR & MOOD:
- Low saturation, earth tones only (brown, camel, grey, cream, olive, charcoal)
- Quiet luxury atmosphere: restrained, effortless, understated
- Maximum 3-4 color hues per outfit

LIGHTING: Soft diffused light, no hard shadows. Slightly directional from upper left. Neutral-warm color temperature. Light reveals micro-textures of fabrics.

BACKGROUND: Clean white or light grey wall. Zero props, zero decoration. Pure canvas.

NO: eyes, nose, full face, stiff fingers, deformed hands, over-smoothed skin, plastic-looking fabrics, bright saturated colors, cluttered background, full body shot, extra clothing, invented outerwear, non-East-Asian identity

User uploaded clothing items: {user_prompt}`;

export const FASHION_MODEL_FACELESS_FULL_PROMPT = `An EXTREME CLOSE-UP fashion editorial photograph zooming into a woman's outfit details and fabric textures. Shot with an 85mm portrait lens at close range, like a luxury brand lookbook detail shot. Quiet luxury style inspired by Celine, The Row, Lemaire.

CRITICAL FRAMING — THIS IS THE MOST IMPORTANT INSTRUCTION:
This is shot at 1.5x zoom compared to a normal half-body shot. The camera is very close to the model, approximately 0.5 meters away, aimed directly at the CHEST and STOMACH area. The frame captures ONLY from the model's NECK/COLLARBONE area down to her HIP/UPPER THIGH. The model's face is COMPLETELY OUTSIDE the frame — at most, only the very bottom of her chin is barely visible at the top edge. The clothing and fabric FILL the entire frame, occupying 90-95% of the image. There is very little background visible — the outfit dominates everything.

Think of this as a FABRIC DETAIL SHOT on a living body, not a portrait. The viewer should feel like they can reach out and touch the fabric.

Vertical 9:16 aspect ratio.

MODEL & POSE:
- East Asian / Chinese woman only, body facing the camera DIRECTLY (straight-on angle), shoulders square to the lens
- Visible chin, neck, hands, skin tone, and hair must read clearly as East Asian / Chinese only
- Do not generate Black, White, mixed-race, or other non-East-Asian model features
- If hair is visible, choose one hairstyle that matches the outfit from: low ponytail, tidy bun, sleek straight hair, tucked-behind-ear short straight hair, soft natural waves
- Only change hairstyle variation; keep the same face identity and framing logic
- Natural, relaxed posture — not stiff or posed
- One hand doing a natural gesture close to the body: gripping a bag handle at waist level, holding the coat lapel, or adjusting a sleeve cuff
- Fingers relaxed, slightly curved
- Candid moment feeling

OUTFIT — TEXTURE IS THE HERO:
- The model wears ALL uploaded clothing items
- Use only the uploaded garments; do not add extra clothing layers
- Because the framing is so tight, every fabric detail is magnified:
  - Individual wool/alpaca fibers visible on the coat surface
  - Silk shirt's liquid sheen catching the light
  - Knit ribbing texture with clear dimensional ridges
  - Sleeve cuff details, button details, seam details all visible
- Layering boundaries ultra-clear: you can see exactly where one uploaded garment ends and another begins
- If outerwear is not uploaded, do not invent any coat or jacket layer
- Colors, styles must match uploaded images exactly
- Accessories visible in tight frame: bag handle with silk scarf, earring at frame edge, sleeve label/tag details

COLOR & MOOD:
- Low saturation earth tones (brown, camel, grey, cream, olive, charcoal)
- Quiet luxury: the tight framing itself communicates confidence in fabric quality

LIGHTING: Soft diffused light with subtle directionality from upper-left. The light must reveal MICRO-TEXTURES: every fiber, every weave, every sheen. Neutral-warm temperature. Gentle shadows in fabric folds create dimensionality.

BACKGROUND: Minimal — only small slivers of white or light grey wall visible at the edges. The outfit fills almost the entire frame.

NO: eyes, nose, face, full body, wide framing, distant camera, knees, legs, feet, shoes, stiff fingers, plastic fabrics, bright colors, cluttered background, flat lighting, extra clothing, invented outerwear, non-East-Asian identity

User uploaded clothing items: {user_prompt}`;

export const FASHION_PANTS_STUDIO_PROMPT = `生成一张极致照片级真实感的裤子上身效果图，风格对标韩国精品服装品牌棚拍产品图。必须完全像真人实拍，不能有任何AI生成痕迹。

【参考风格】
对标参考：韩国/中国女装品牌官网产品主图风格——极简灰色棚拍背景、修身短上衣露出腰腹、方头渔网鞋、整体干净利落、模特不露脸。

【拍摄视角与构图 - 最高优先级】
- 相机在腰部/髋部高度（约75-90cm），镜头轻微向上仰拍或完全水平，绝对不要从高处向下俯拍
- 画面从裤子腰头/抽绳位置开始，向上露出约5-8cm的短上衣下摆和腰腹（含少量裸露腰部皮肤）
- 画面底部：两只鞋完整入画，鞋底贴近画面底边
- 不能出现胸部以上或脸
- 两条裤腿填满画面横向85-90%，两侧留少量留白，不要像商品图那样两边完全无留白

【上衣 - 必须是修身短款】
- 上衣必须是修身贴身款式：紧身长袖圆领打底衫（白色/黑色/米色）或无袖修身背心
- 上衣长度在腰头以上约2-4cm，仅露出肚脐上方一小段皮肤（约2-3cm的皮肤区域，不要露太多腰腹）
- 画面顶部切在胸部以下、腰部以上，绝对不能出现胸部或肩膀
- 禁止宽松上衣、卫衣、外套、过长遮住腰头的上衣

【鞋子 - 精准搭配】
- 牛仔裤（直筒/阔腿/微喇）→ 白色简约帆布鞋（Converse/Veja风格，纤薄底）或白色低帮踝靴，休闲街头感
- 休闲针织宽腿裤/卫裤/运动感裤子 → 白色或奶油色芭蕾平底鞋、圆头细带平底鞋，柔软轻盈女性感
- 西装阔腿裤/直筒西裤 → 裸色或黑色细跟高跟鞋、尖头细跟踝靴或玛丽珍高跟鞋
- 哈伦裤/束脚裤/工装裤 → 细带凉鞋、芭蕾平底鞋或简约尖头单鞋
- 严禁老爹鞋、厚底运动鞋、渔网鞋等中性/男性化鞋款

【模特与姿态】
- 东亚/中国女性，不露脸（画面切在腰腹位置），腿型修长纤细
- 手型丰富多样，从以下选择一种（禁止每次都用同一种手型）：
  · 双手自然垂放身侧，完全不入画或仅手腕隐约可见
  · 一手插入侧口袋至指关节处，只露出一两根手指关节在口袋边缘，另一手垂放不入画
  · 双手轻插口袋，仅露出大拇指或一两个指节在口袋外，手掌完全隐藏在口袋内
  · 一手自然搭在腰头位置（拇指轻扣腰头），另一手自然下垂
  · 双手轻交叠放在腰前，仅指尖隐约可见
- 严禁：双手完全明显地插在口袋里（手掌全部可见的那种）、双手叉腰、手势夸张

【背景与光线】
- 背景：浅灰色哑光背景墙 + 浅灰色光滑地板（颜色比墙面略深一个色调）
- 光线：均匀柔和的棚拍补光，轻微正面主光源，左右有少量辅光填充阴影
- 整体色调：低饱和度，干净清冷感

【裤子面料真实感 - 关键】
- 颜色、廓形、腰头/抽绳/腰带设计必须与上传图片高度一致
- 裤腿略长，裤脚在鞋面上方形成自然轻微堆叠
- 必须有自然褶皱：大腿内侧/裆部斜向折痕、竖向中轴垂坠线、口袋拉扯感
- 面料纹理（根据类型）：
  · 针织/卫裤：表面细腻针织纹理、面料微微鼓胀有厚度感、侧缝有弧度
  · 牛仔：斜纹编织纹路、接缝处深色线迹、自然水洗渐变
  · 西装布：细腻纺织纹理、中缝压线笔直、面料有自然光泽
- 禁止：颜色过度均匀平整、面料像塑料、无纹理的光滑AI感
- 无文字、无水印`;

export const FASHION_PANTS_WOMEN_SIDE_PREFIX = `A luxury fashion editorial CLOSE-UP SIDE DETAIL photograph of the uploaded pants worn on a real female model. Shot like a Celine or Toteme lookbook fabric detail — cinematic, premium, hyper-real texture.

ABSOLUTELY FORBIDDEN — INSTANT FAIL if any of these appear:
× Clothes on a hanger, hook, or rack
× Mannequin or dress form
× Flat lay or product-on-surface shot
× Store interior background or retail environment
× Any text, watermark, logo, or UI element
× Fabric that looks smooth, flat, plastic, or AI-generated
This MUST be a real living human body wearing the pants — fabric shaped by gravity and a real body underneath.

SHOT TYPE: CLOSE-UP side-detail shot — NOT a full-body shot. The camera is very close. Frame covers from the waistband down to the knee or mid-calf only. The leg fills 80-90% of the frame width. This is a detail shot, not a head-to-toe portrait.

CAMERA: 85mm lens at hip-to-thigh height (~70-85cm), aimed directly at the side of the leg. Very close to subject. Shallow depth of field — the fabric surface is the sharp focal plane, background is soft bokeh.

MODEL: East Asian / Chinese woman. Natural weight-bearing stance — one leg slightly forward, creating gentle knee bend and natural fabric tension. Do NOT show the face. The body is turned sideways (90 degrees) to the camera.

TOP: Only the waistband and a sliver of top fabric should be visible at the upper frame edge. Do not show the torso — this is a pants detail shot.

SHOES: Only the very tip may appear at bottom frame edge if the shot goes that low. Feminine style appropriate to pants type.

BACKGROUND: Pure soft bokeh — off-white or warm light grey. No identifiable surfaces. The fabric is everything.

WHAT TO SHOW IN SHARP DETAIL FROM THE SIDE:
· Side seam: the seam line running from hip to hem — must show actual stitching, thread, and seam allowance folded to one side
· Side pocket (if present): the exact pocket opening edge, topstitching, depth, and fabric layer visible from the side
· Fabric cross-section: the way the fabric panels meet at the seam — showing fabric weight and structure
· Natural side-profile leg shape: slight inward curve at knee, outward curve at calf — no straight cylinder

FABRIC TEXTURE AND DRAPE — THIS IS THE MOST IMPORTANT PART:
The fabric MUST look like it is hanging under real gravity on a real human leg. It must NOT look flat, pressed, or AI-smooth.
· Denim: diagonal twill weave grain clearly visible from side; natural vertical gravity folds running down the leg length; slight horizontal stress crease at the knee from bending; subtle horizontal compression folds where fabric gathers at the inner thigh; thread structure visible at seams
· Tailored/wool: soft vertical drape folds falling from the hip; fabric catches light differently on fold ridges vs. valleys; side crease if present is dimensional not flat; natural slight sway of fabric bottom hem
· Knit/jersey: fabric gently billows and falls; soft organic folds; slight stretch across the hip creating tension lines; no sharp creases but gentle flowing curves
· Cotton/linen: soft crumple lines and gravity folds; fabric is matte and slightly rumpled, not ironed-flat

LIGHTING: Soft directional light from slightly in front of the model (front-side lighting), creating gentle shadows in the fabric fold valleys that reveal the three-dimensional texture. The fabric must have visible highlight-to-shadow gradation that proves it is not flat. No harsh shadows, no flat even lighting.

PHOTO REALISM: Shot quality equivalent to luxury brand detail photography. The viewer must be able to mentally feel the fabric weight and texture just by looking at the image.`;

export const FASHION_PANTS_WOMEN_HIP_PREFIX = `A luxury fashion editorial CLOSE-UP DETAIL photograph of the rear hip and waistband area of the uploaded pants, worn on a real female model. Shot like a Celine, The Row, or Massimo Dutti lookbook detail page — cinematic, premium, hyper-real fabric texture.

ABSOLUTELY FORBIDDEN — INSTANT FAIL if any of these appear:
× Clothes on a hanger, hook, rack, or clip
× Mannequin or dress form
× Flat lay or product-on-surface shot
× Store interior, retail background, or fitting room
× Any text, watermark, price tag, or store label
This MUST be worn on a real living human body — fabric shaped by a real body underneath.

SHOT TYPE: Extreme close-up of the rear hip/waistband zone. Camera positioned BEHIND the model, angled slightly to one side (30-45 degrees off center-back). The pants are BEING WORN — fabric stretched naturally over real body curves.

CAMERA: 85mm macro-ish lens at hip height (~90cm). Very close to the subject — the back waistband and one back pocket fill 80-90% of the frame. Shallow depth of field — fabric surface is razor sharp, background melts into soft bokeh.

MODEL: East Asian / Chinese woman. Natural standing posture with a slight weight shift to one hip — this creates a natural curve and subtle fabric tension across the seat. Do NOT reveal the face or feet. Only the rear hip/waist area is in frame.

FRAMING (strict): Top edge = just above the waistband. Bottom edge = mid-thigh. Left/right = slight crop of the hip on one side. The back pocket and waistband must dominate the composition.

WHAT TO SHOW IN EXTREME DETAIL:
· Back waistband: exact fabric texture, width, elasticated gather or structured band, belt loops (exact stitch and width), any button/rivet/hardware (metal or plastic, showing surface finish)
· Back pocket(s): full shape — patch / welt / flap; every topstitch line crisp and dimensional; contrast thread color matching the uploaded garment exactly; corner bartacks visible; any flap button or snap
· Seat/hip fabric: how the fabric conforms to and stretches over the body — natural tension radiating diagonally from the seat; seat fade or highlight on denim; smooth drape on tailored fabric; gentle compression on knit
· Rear center seam: stitch alignment, seam allowance curvature, any reinforcement

FABRIC TEXTURE (this is the hero — make it hyperrealistic):
· Tailored/wool: individual weave threads visible under close inspection; subtle sheen shift as fabric curves over the body; sharp crease from center back seam
· Denim: diagonal twill weave grain; whisker/fade lines across seat; contrast topstitching with individual thread twist visible; slight surface nap on washed denim
· Knit/jersey: fine rib or jersey texture; fabric slightly stretched at seat showing knit structure; soft matte surface
· Cotton/canvas: canvas weave or twill visible; slight texture variation at seam edges

BACKGROUND: Pure blurred bokeh — soft off-white or light grey. Completely out of focus. No identifiable location. The fabric IS the image.

LIGHTING: Soft, directional beauty light from slightly above and to one side. Creates gentle shadow under the waistband and pocket flap, defining their three-dimensionality. Subtle highlight catches on any raised stitching or hardware. Film-like, warm-neutral color temperature. No blown-out highlights, no flat shadow.

PHOTO REALISM: This should look like it was shot by a luxury brand's in-house photographer. The viewer should feel they can reach out and touch the fabric. Every stitch visible. Every fiber present.`;

export const FASHION_PANTS_MEN_SIDE_PREFIX = `A luxury fashion editorial CLOSE-UP SIDE DETAIL photograph of the uploaded pants worn on a real male model. Shot like a COS or Massimo Dutti men's lookbook fabric detail — cinematic, premium, hyper-real texture.

ABSOLUTELY FORBIDDEN — INSTANT FAIL if any of these appear:
× Clothes on a hanger, hook, or rack
× Mannequin or dress form
× Flat lay or product-on-surface shot
× Store interior background or retail environment
× Any text, watermark, logo, or UI element
× Fabric that looks smooth, flat, plastic, or AI-generated
This MUST be a real living human body wearing the pants — fabric shaped by gravity and a real body underneath.

SHOT TYPE: CLOSE-UP side-detail shot — NOT a full-body shot. The camera is very close. Frame covers from the waistband down to the knee or mid-calf only. The leg fills 80-90% of the frame width. This is a detail shot, not a head-to-toe portrait.

CAMERA: 85mm lens at hip-to-thigh height (~80-95cm), aimed directly at the side of the leg. Very close to subject. Shallow depth of field — the fabric surface is the sharp focal plane, background is soft bokeh.

MODEL: East Asian / Chinese man. Natural weight-bearing stance — one leg slightly forward or weight shifted, creating gentle knee bend and natural fabric tension. Do NOT show the face. Body turned sideways (90 degrees) to the camera.

TOP: Only the waistband and a sliver of top fabric visible at the upper frame edge. This is a pants detail shot — do not show the torso.

SHOES: Only the very tip may appear at bottom frame edge. Men's style appropriate to pants type.

BACKGROUND: Pure soft bokeh — off-white or cool light grey. No identifiable surfaces. The fabric is everything.

WHAT TO SHOW IN SHARP DETAIL FROM THE SIDE:
· Side seam: running from hip to hem — actual stitching, thread, and seam allowance folded to one side
· Side pocket (if present): exact pocket opening edge, topstitching, fabric layer visible from the side
· Fabric cross-section: how fabric panels meet at the seam — showing fabric weight and structure
· Natural side-profile leg shape: slight inward curve at knee, slight taper or flare at calf

FABRIC TEXTURE AND DRAPE — THIS IS THE MOST IMPORTANT PART:
The fabric MUST look like it is hanging under real gravity on a real male leg. It must NOT look flat, pressed, or AI-smooth.
· Denim: diagonal twill weave grain clearly visible from side; vertical gravity folds running down the leg; horizontal stress crease at the knee; slight compression folds at inner thigh; thread structure visible at seams
· Tailored/wool: soft vertical drape folds falling from hip; fabric catches light differently on ridges vs. valleys; side crease is dimensional; natural sway of hem
· Workwear/cargo: heavier fabric with more structured fold lines; panel seams visible with slight raised edge; fabric stiffness creates angular folds at knee
· Knit: gentle flowing curves; slight stretch tension visible across the thigh; soft billowing at lower leg

LIGHTING: Soft directional light from slightly in front of the model, creating gentle shadows in fabric fold valleys that reveal three-dimensional texture. Visible highlight-to-shadow gradation proves the fabric is not flat. Film-like, slightly cool-neutral tone.

PHOTO REALISM: Luxury menswear brand detail photography quality. Viewer must be able to mentally feel the fabric weight and texture.`;

export const FASHION_PANTS_MEN_HIP_PREFIX = `A luxury fashion editorial CLOSE-UP DETAIL photograph of the rear hip and waistband area of the uploaded pants, worn on a real male model. Shot like a COS or Massimo Dutti men's lookbook detail — cinematic, premium, hyper-real fabric texture.

ABSOLUTELY FORBIDDEN — INSTANT FAIL if any of these appear:
× Clothes on a hanger, hook, rack, or clip
× Mannequin or dress form
× Flat lay or product-on-surface shot
× Store interior, retail background, or fitting room
× Any text, watermark, price tag, or label
This MUST be worn on a real living human body — fabric shaped by a real body underneath.

SHOT TYPE: Extreme close-up of the rear hip/waistband zone. Camera positioned BEHIND the model, angled slightly to one side (30-45 degrees off center-back). The pants are BEING WORN.

CAMERA: 85mm lens at hip height (~100cm). Very close — back waistband and one back pocket fill 80-90% of the frame. Shallow depth of field, fabric surface razor sharp.

MODEL: East Asian / Chinese man. Natural standing posture with slight weight shift — creates natural fabric tension. Do NOT reveal face or feet. Only the rear hip/waist area is in frame.

FRAMING: Top edge = just above waistband. Bottom edge = mid-thigh. The back pocket and waistband dominate the composition.

WHAT TO SHOW IN EXTREME DETAIL:
· Back waistband: exact fabric, width, belt loops (stitch and width), any interior label or brand tag peeking above
· Back pocket(s): full shape — patch / welt / jetted; every topstitch line crisp; contrast thread matching the uploaded garment; bartack corners; any button or hardware
· Seat/hip fabric: natural tension of fabric over a real male body; seat crease pattern; denim fade at seat if applicable; structured drape on tailored fabric
· Rear center seam: stitch quality, alignment, any reinforced stitching

FABRIC TEXTURE (hero element):
· Denim: diagonal twill grain; seat whiskers/fade; contrast topstitching with individual thread twist visible
· Tailored/wool: weave threads visible; subtle sheen; sharp back crease from center seam
· Workwear/canvas: heavy canvas weave; reinforced seam allowance visible; any rivets or hardware in crisp detail
· Knit/jersey: structure visible under fabric tension; soft matte surface

BACKGROUND: Pure blurred bokeh — off-white or light grey. Completely out of focus. No identifiable location.

LIGHTING: Soft directional beauty light from slightly above and to one side. Shadow defines waistband and pocket depth. Highlight catches on raised stitching and metal hardware. Warm-neutral film tone.

PHOTO REALISM: Luxury brand in-house photographer quality. Every stitch, every fiber, every weave thread present and sharp.`;

export const FASHION_PANTS_MEN_STUDIO_PROMPT = `生成一张极致照片级真实感的男款裤子上身效果图，必须看起来完全像真人实拍照片，不能有任何AI生成痕迹。用真实相机拍摄的质感、自然景深、真实面料微观纹理。

【拍摄视角与构图 - 最高优先级】
- 相机极近拍摄，两条裤腿合并宽度填满画面横向95%以上，两侧几乎没有留白
- 相机在胸部高度，镜头轻微向下俯视（约10-15度）
- 画面顶部：腰头/裤腰位置，仅露出腰头上方少量上衣下摆
- 画面底部：两只鞋刚好完整入画，鞋底贴近画面底边
- 绝对不能出现腹部以上、胸部或脸
- 竖版 9:16 比例

【上衣与鞋子 - 自动配搭】
- 画面顶部露出少量上衣下摆，上衣风格与裤子搭配协调即可，不限定款式
- 腰头（裤腰）在画面顶部约1/5处清晰可见，上衣不露皮肤
- 根据裤子类型精准搭配男款鞋子：
  · 牛仔裤（直筒/微锥/宽松）→ 白色厚底运动鞋、Air Force 1 或 Old Skool 帆布鞋
  · 休闲运动裤/卫裤 → 黑色或白色运动鞋（Nike/Adidas 款式感）或厚底老爹鞋
  · 西装/直筒西裤 → 黑色或深棕色皮质德比鞋、乐福鞋或尖头皮鞋
  · 工装裤/束脚裤/多口袋裤 → 马丁靴、低帮工装靴或厚底帆布鞋

【模特与姿态】
- 东亚/中国男性，不露脸
- 体型匀称，腿型修长，姿态自然放松
- 严禁使用"双手同时插口袋"的动作，必须从以下动作中选择：
  · 走路迈步姿态：一腿向前迈出，重心偏移，手臂随步态自然摆动
  · 一手持包/手提袋包带，另一手自然垂放
  · 一手拿手机，另一手轻插口袋或垂放
  · 一手插口袋，另一手拇指轻扣皮带/腰头
  · 双手交叠自然放在腰前

【背景与光线 - 棚拍风格】
- 纯白或浅灰色背景墙，灰色水泥地/抛光地板
- 柔和均匀的棚拍补光，无强烈阴影
- 整体干净清爽，突出裤子本身

【裤子面料真实感 - 关键要求】
- 裤子颜色、廓形、腰头设计必须与上传图片高度一致
- 裤腿略长，裤脚堆叠在鞋面形成自然横向堆褶（拖地感）
- 必须有的自然褶皱：大腿内侧/裆部斜向辐射折痕、竖向中轴垂坠线、膝盖处横向轻微折痕、口袋拉扯聚拢感
- 面料微观纹理（根据裤子类型）：
  · 牛仔：清晰可见的斜纹织物编织纹路；接缝处颜色比中央面料深1-2色；大腿/臀部有自然水洗磨白区域；弧形缝线和对比色线迹清晰可见；裤脚有轻微毛边磨损感
  · 棉/针织休闲裤：表面有细腻针织纹理；面料柔软鼓胀；侧缝处有轻微面料弧度
  · 西装裤：面料表面有细腻纺织纹理；中缝压线笔直清晰；面料有自然光泽感和悬垂弧度
- 禁止：颜色过度均匀平整、面料像塑料/橡皮、无任何纹理的光滑AI感、过于对称完美的假质感
- 无文字、无水印`;

export const FASHION_PANTS_MEN_SCENE_PROMPT = `生成一张极致照片级真实感的男款裤子上身效果图，必须看起来完全像真人实拍照片，不能有任何AI生成痕迹。用真实相机拍摄的质感、自然景深（背景楼梯轻微虚化）、真实面料微观纹理。

【拍摄视角与构图 - 最高优先级】
- 相机极近拍摄，两条裤腿合并宽度填满画面横向95%以上，两侧几乎没有留白
- 相机在胸部高度，镜头轻微向下俯视（约10-15度）
- 画面顶部：腰头/裤腰位置，仅露出腰头上方少量上衣下摆
- 画面底部：两只鞋刚好完整入画，鞋底贴近画面底边
- 绝对不能出现腹部以上、胸部或脸
- 竖版 9:16 比例

【上衣与鞋子 - 自动配搭】
- 画面顶部露出少量上衣下摆，上衣风格与裤子搭配协调即可，不限定款式
- 腰头（裤腰）在画面顶部约1/5处清晰可见，上衣不露皮肤
- 根据裤子类型精准搭配男款鞋子：
  · 牛仔裤（直筒/微锥/宽松）→ 白色厚底运动鞋、Air Force 1 或 Old Skool 帆布鞋
  · 休闲运动裤/卫裤 → 黑色或白色运动鞋（Nike/Adidas 款式感）或厚底老爹鞋
  · 西装/直筒西裤 → 黑色或深棕色皮质德比鞋、乐福鞋或尖头皮鞋
  · 工装裤/束脚裤/多口袋裤 → 马丁靴、低帮工装靴或厚底帆布鞋

【模特与姿态】
- 东亚/中国男性，不露脸
- 体型匀称，腿型修长，姿态自然放松
- 严禁使用"双手同时插口袋"的动作，必须从以下动作中选择：
  · 走路迈步姿态：一腿向前迈出，重心偏移，手臂随步态自然摆动
  · 一手持包/手提袋包带，另一手自然垂放
  · 一手拿手机，另一手轻插口袋或垂放
  · 一手插口袋，另一手拇指轻扣皮带/腰头
  · 双手交叠自然放在腰前

【背景与光线 - 楼梯场景】
- 模特站在楼梯底部的平地上，不能站在台阶上
- 背景是室内木质楼梯：深棕色木踏板楼梯从模特身后从左至右斜向上方延伸，楼梯作为背景衬托
- 地面为浅灰色地毯或浅色地砖（平地，模特站在上面）
- 右侧有白色墙面，墙边有玻璃窗透入自然光，光线柔和温暖
- 整体氛围温馨有质感，像真实住宅/精品店室内拍摄
- 背景楼梯清晰可见但不喧宾夺主，保持裤子为画面焦点

【裤子面料真实感 - 关键要求】
- 裤子颜色、廓形、腰头设计必须与上传图片高度一致
- 裤腿略长，裤脚堆叠在鞋面形成自然横向堆褶（拖地感）
- 必须有的自然褶皱：大腿内侧/裆部斜向辐射折痕、竖向中轴垂坠线、膝盖处横向轻微折痕、口袋拉扯聚拢感
- 面料微观纹理（根据裤子类型）：
  · 牛仔：清晰可见的斜纹织物编织纹路；接缝处颜色比中央面料深1-2色；大腿/臀部有自然水洗磨白区域；弧形缝线和对比色线迹清晰可见；裤脚有轻微毛边磨损感
  · 棉/针织休闲裤：表面有细腻针织纹理；面料柔软鼓胀；侧缝处有轻微面料弧度
  · 西装裤：面料表面有细腻纺织纹理；中缝压线笔直清晰；面料有自然光泽感和悬垂弧度
- 禁止：颜色过度均匀平整、面料像塑料/橡皮、无任何纹理的光滑AI感、过于对称完美的假质感
- 无文字、无水印`;

export const FASHION_PANTS_SCENE_PROMPT = `生成一张极致照片级真实感的裤子上身效果图，必须看起来完全像真人实拍照片，不能有任何AI生成痕迹。用真实相机拍摄的质感、自然景深（背景楼梯轻微虚化）、真实面料微观纹理。

【拍摄视角与构图 - 最高优先级】
- 相机极近拍摄，两条裤腿合并宽度填满画面横向95%以上，两侧几乎没有留白
- 相机在胸部高度，镜头轻微向下俯视（约10-15度）
- 画面顶部：腰头/裤腰位置，仅露出腰头上方少量上衣下摆
- 画面底部：两只鞋刚好完整入画，鞋底贴近画面底边
- 绝对不能出现腹部以上、胸部或脸
- 竖版 9:16 比例

【上衣与鞋子 - 自动配搭】
- 画面顶部露出少量上衣下摆，上衣风格与裤子搭配协调即可，不限定款式
- 腰头（裤腰）在画面顶部约1/5处清晰可见，上衣不露皮肤
- 根据裤子类型精准搭配女性化鞋子（严禁老爹鞋、厚重运动鞋等男性化鞋款）：
  · 牛仔裤（直筒/阔腿/微喇）→ 白色简约帆布鞋（Converse/Veja 风格，鞋底纤薄）、白色低帮板鞋或黑白色低帮踝靴，休闲有街头感，与牛仔风格搭调
  · 休闲针织宽腿裤/卫裤/运动感裤子 → 白色或奶油色芭蕾鞋、圆头细带平底鞋，柔软轻盈女性感
  · 西装阔腿裤/直筒西裤 → 黑色或裸色细跟高跟鞋、尖头细跟踝靴或玛丽珍高跟鞋
  · 哈伦裤/束脚裤/工装裤 → 细带凉鞋、芭蕾平底鞋或简约尖头单鞋

【模特与姿态】
- 东亚/中国女性，不露脸，腿型修长纤细
- 严禁使用"双手同时插口袋"的动作，必须从以下动作中选择：
  · 走路迈步姿态：一腿向前迈出，重心偏移，手臂随步态自然摆动
  · 一手持小包/托特包包带，另一手自然垂放
  · 一手拿手机或咖啡杯，另一手轻插口袋或垂放
  · 一手插口袋，另一手拇指轻扣皮带/腰头
  · 双手交叠自然放在腰前
- 姿态放松优雅，有女性生活感

【背景与光线 - 楼梯场景】
- 模特站在楼梯底部的平地上，不能站在台阶上
- 背景是室内木质楼梯：深棕色木踏板楼梯从模特身后从左至右斜向上方延伸，楼梯作为背景衬托
- 地面为浅灰色地毯或浅色地砖（平地，模特站在上面）
- 右侧有白色墙面，墙边有玻璃窗透入自然光，光线柔和温暖
- 整体氛围温馨有质感，像真实住宅/精品店室内拍摄
- 背景楼梯清晰可见但不喧宾夺主，保持裤子为画面焦点

【裤子面料真实感 - 关键要求】
- 裤子颜色、廓形、腰头设计必须与上传图片高度一致
- 裤腿略长，裤脚堆叠在鞋面形成自然横向堆褶（拖地感）
- 必须有的自然褶皱：大腿内侧/裆部斜向辐射折痕、竖向中轴垂坠线、膝盖处横向轻微折痕、口袋拉扯聚拢感
- 面料微观纹理（根据裤子类型）：
  · 牛仔：清晰可见的斜纹织物编织纹路；接缝处颜色比中央面料深1-2色（自然洗白效果）；大腿/臀部有自然水洗磨白区域；弧形缝线和对比色线迹清晰可见；裤脚有轻微毛边磨损感
  · 棉/针织休闲裤：表面有细腻针织纹理；面料柔软鼓胀；侧缝处有轻微面料弧度
  · 西装阔腿裤：面料表面有细腻纺织纹理；中缝压线笔直清晰；面料有自然光泽感和悬垂弧度
- 禁止：颜色过度均匀平整、面料像塑料/橡皮、无任何纹理的光滑AI感、过于对称完美的假质感
- 无文字、无水印`;
