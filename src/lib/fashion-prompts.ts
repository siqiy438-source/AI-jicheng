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

【穿搭展示 - 关键要求】
- 模特必须完整穿着上传的所有服装单品
- 画面必须展示：外套/上衣 + 内搭 + 裤子/裙子，三者缺一不可
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

export const FASHION_MODEL_MIRROR_SELFIE_PROMPT = `Final Ultimate Prompt v4 (Youthful Vibe & Sleek Aesthetics)
--- CRITICAL UPDATE: YOUTHFUL VIBE (Age 25-30) ---
Subject Identity & Vibe:

A vibrant, youthful female fashion influencer (approx. age 25-30).
Even without showing the face, the overall aura must radiate youth, energy, and modern style.
Beauty Details (Anti-Aging Focus):

HAIR STYLE (Crucial): Must be modern, youthful, and incredibly sleek. Long, dark, ultra-silky straight hair with liquid-like shine and healthy movement (referencing the sleekness in image 2). ABSOLUTELY NO dated volume, stiff "helmet hair," or matronly styles. It should look effortlessly cool.
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
