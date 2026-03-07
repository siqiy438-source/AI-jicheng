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

Vertical Close-up Mirror Selfie. The model fills 90% of the vertical frame (head near top, feet near bottom).
Pose (Dynamic & Confident):

Natural, fluid fashion stance. A confident, energetic posture with natural body curves. NO stiff, rigid standing. The free hand should be relaxed by the side or gently interacting with the hair/clothing naturally.
Outfit & Accessory Recognition (Strict):

Analyze ALL inputs thoroughly.

Core Layers: Correctly assemble the 3-piece structure ([Outerwear] open over [Inner Top] with [Bottoms]).
Mandatory Accessories: You MUST include any BELTS, BAGS, or DISTINCT ACCESSORIES visible in the input images. They cannot be missing.
Background (Simplified Luxury):

Clean, minimalist high-end corner. Matte off-white wall. Sleek black modern cabinet behind with 1-2 minimal trendy art objects (e.g., Bearbrick).
Lighting:

Premium Cool White Studio Light. Bright, clean light that emphasizes the youthful glow of the skin and the high sheen of the sleek hair.
--no (Negative Prompt):

matronly look, old age vibe, dated hairstyle, frizzy hair, stiff volume hair, wrinkled skin, stiff pose, missing accessories, warm yellow light, cluttered room.

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

export const FASHION_PANTS_STUDIO_PROMPT = `生成一张极致照片级真实感的裤子上身效果图，必须看起来完全像真人实拍照片，不能有任何AI生成痕迹。用真实相机拍摄的质感、自然景深、真实面料微观纹理。

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
- 根据裤子类型精准搭配鞋子：
  · 牛仔裤（直筒/阔腿/微喇）→ 白色厚底运动鞋、小白鞋或面包鞋，鞋型圆润有分量感
  · 休闲针织宽腿裤/卫裤/运动感裤子 → 渔网鞋（镂空网面方头/圆头低跟鞋），黑色或白色
  · 西装阔腿裤/直筒西裤 → 黑色或棕色乐福鞋、尖头皮鞋或玛丽珍鞋
  · 哈伦裤/束脚裤/工装裤 → 简约凉鞋、一字带拖鞋或低帮帆布鞋

【模特与姿态】
- 东亚/中国女性，不露脸
- 严禁使用"双手同时插口袋"的动作，必须从以下动作中选择：
  · 走路迈步姿态：一腿向前迈出，重心偏移，手臂随步态自然摆动
  · 一手持小包/托特包包带，另一手自然垂放
  · 一手拿手机或咖啡杯，另一手轻插口袋或垂放
  · 一手插口袋，另一手拇指轻扣皮带/腰头
  · 双手交叠自然放在腰前
- 腿型修长，姿态放松有生活感

【背景与光线 - 棚拍风格】
- 纯白或浅灰色背景墙，灰色水泥地/抛光地板
- 柔和均匀的棚拍补光，无强烈阴影
- 整体干净清爽，突出裤子本身

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
- 根据裤子类型精准搭配鞋子：
  · 牛仔裤（直筒/阔腿/微喇）→ 白色厚底运动鞋、小白鞋或面包鞋，鞋型圆润有分量感
  · 休闲针织宽腿裤/卫裤/运动感裤子 → 渔网鞋（镂空网面方头/圆头低跟鞋），黑色或白色
  · 西装阔腿裤/直筒西裤 → 黑色或棕色乐福鞋、尖头皮鞋或玛丽珍鞋
  · 哈伦裤/束脚裤/工装裤 → 简约凉鞋、一字带拖鞋或低帮帆布鞋

【模特与姿态】
- 东亚/中国女性，不露脸
- 严禁使用"双手同时插口袋"的动作，必须从以下动作中选择：
  · 走路迈步姿态：一腿向前迈出，重心偏移，手臂随步态自然摆动
  · 一手持小包/托特包包带，另一手自然垂放
  · 一手拿手机或咖啡杯，另一手轻插口袋或垂放
  · 一手插口袋，另一手拇指轻扣皮带/腰头
  · 双手交叠自然放在腰前
- 腿型修长，姿态放松有生活感

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
