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

export const FASHION_MODEL_FACELESS_HALF_PROMPT = `生成一张高端时尚品牌风格的无脸半身穿搭照片，呈现"静奢"(quiet luxury)杂志内页质感。

【裁切与构图 — 最关键，必须严格遵守】
- 画面上边界：裁切到下巴/下唇位置，下唇和下巴可见，但鼻子、眼睛绝对不能出现
- 画面下边界：到腰线或大腿中部位置
- 耳朵可以露出（用于展示耳饰）
- 模特填满画面 75-85% 的空间
- 竖版 9:16 比例

【模特姿态】
- 中国女性，身材匀称，气质从容
- 身体朝向：15°-45° 的 3/4 侧转，绝对不要正面直对镜头
- 肩膀微微放松前倾，呈现自然松弛的体态，不要挺胸抬头的僵硬站姿
- 皮肤质感真实自然（手部、颈部、下巴）

【手部动作 — 极其重要】
必须有一只手在做一个自然、轻柔的动作，从以下选择一个最适合当前穿搭的：
- 轻捏外套或衬衫的领口/翻领（拇指和食指轻轻捏住，其余手指自然弯曲）
- 手握包袋的提手或肩带
- 轻拉衣摆或调整腰间的塞法
- 手指轻触锁骨处的项链
另一只手自然垂放或轻搭在身侧。
手指必须放松、微微弯曲，绝不能僵直张开。指甲干净自然。
整体感觉是"被抓拍到的瞬间"，不是刻意摆拍。

【穿搭展示 — 层次是核心】
- 模特必须完整穿着上传的所有服装单品
- 必须呈现 3 层以上的叠穿层次，每层之间边界清晰，不能融合成一件
- 领口形成 V 字形层叠：外层领口 > 中层领口 > 内层领口，逐层内收
- 如果有衬衫，袖口应从外套袖口中自然露出 1-3cm
- 衣服的颜色、款式、面料质感必须与上传图片高度一致
- 衣服穿着自然合身，有真实的褶皱和垂坠感
- 根据服装风格智能搭配 1-2 件精致配饰：
  - 金属质感耳饰（金色水滴形、珍珠耳环等）
  - 结构感皮质手袋（只露出局部，手提或肩背）
  - 丝巾（系在包带上或搭在肩上）

【面料质感 — 必须极致真实】
- 每件衣服的面料质感必须在画面中清晰可辨：
  - 毛呢/羊驼毛：可见的纤维毛绒感，表面有自然的绒毛纹理
  - 丝绸/缎面：液态般的光泽和流动感
  - 针织/罗纹：清晰的编织纹理和凹凸感
  - 棉质：自然的褶皱和哑光质感
- 不同层次的面料之间必须有明显的质感对比（粗糙vs光滑、蓬松vs贴身）

【色调与氛围】
- 整体色调低饱和度，大地色系为主（棕、驼、灰、米白、橄榄绿、炭灰）
- 黑色用炭灰色替代，白色用奶油色/米色替代
- 整套穿搭控制在 3-4 个色相以内
- quiet luxury 氛围：克制、从容、不张扬

【光线】
- 柔和的漫射光，无任何硬阴影
- 光源从左上方或正前方偏左，在衣服褶皱处形成微妙的明暗过渡
- 色温中性偏暖
- 光线要能揭示面料的微观质感

【背景】
- 纯净的白色或浅灰色墙面，无任何道具和装饰
- 零环境信息，背景是纯粹的"画布"
- 无文字、无水印、无任何 UI 元素

【禁止出现】
眼睛、鼻子、完整面部、僵硬的手指、变形的手部、过度磨皮、不自然的肤色、AI 感的塑料质感面料、过于鲜艳的颜色、杂乱的背景、正面直对镜头的站姿

风格参考：Celine/The Row/Lemaire 品牌 lookbook、小红书高端穿搭博主无脸半身图、时尚杂志 editorial crop

用户上传的服装单品：{user_prompt}`;

export const FASHION_MODEL_FACELESS_FULL_PROMPT = `生成一张高端时尚品牌风格的无脸氛围穿搭照片，景别比纯半身稍宽，展示上半身完整层次的同时露出部分下装，营造从容的"静奢"氛围感。

【裁切与构图 — 最关键，必须严格遵守】
- 画面上边界：裁切到下巴或颈部位置，下巴可见，但眼睛和鼻子绝对不能出现
- 画面下边界：到大腿中部位置，只露出下装（裤子/裙子）的上半部分即可，绝对不要拍到膝盖以下，不需要露出鞋子和脚
- 这是一个"近景偏中景"的构图，不是全身照，模特身体填满画面 80-90% 的空间
- 竖版 9:16 比例
- 关键：景别要近，要有"贴近感"，像是站在模特面前 1 米的距离拍摄

【模特姿态】
- 中国女性，身材匀称，气质从容
- 身体朝向：15°-45° 的 3/4 侧转，绝对不要正面直对镜头
- 肩膀放松，整体呈现自然松弛的体态
- 可以有轻微的身体扭转，增加动态感
- 皮肤质感真实自然

【手部动作 — 极其重要】
必须有一只手在做一个自然、轻柔的动作：
- 手握包袋的提手或肩带（包在身侧或身前，只露出局部）
- 轻捏外套或衬衫的领口/翻领
- 轻拉衣摆或调整腰间的塞法
- 一只手自然垂放在身侧
手指必须放松、微微弯曲，绝不能僵直张开。
整体感觉是"被抓拍到的瞬间"，不是刻意摆拍。

【穿搭展示 — 层次与氛围并重】
- 模特必须完整穿着上传的所有服装单品
- 上半身叠穿层次清晰，每层之间边界分明
- 下装（裤子/裙子）只需露出腰部到大腿的部分，展示上下衔接关系即可
- 衣服的颜色、款式、面料质感必须与上传图片高度一致
- 衣服穿着自然合身，有真实的褶皱和垂坠感
- 根据服装风格智能搭配 1-2 件精致配饰：
  - 金属质感耳饰（金色水滴形、珍珠耳环等）
  - 结构感皮质手袋（只露出局部）
  - 丝巾（系在包带上或搭在肩上）

【面料质感 — 必须极致真实】
- 每件衣服的面料质感必须在画面中清晰可辨
- 因为景别近，面料的微观纹理要更加突出：纤维感、编织纹理、光泽变化
- 不同层次的面料之间必须有明显的质感对比

【色调与氛围】
- 整体色调低饱和度，大地色系为主（棕、驼、灰、米白、橄榄绿、炭灰）
- quiet luxury 氛围：克制、从容、不张扬
- 整套穿搭控制在 3-4 个色相以内

【光线】
- 柔和的漫射光，无任何硬阴影
- 光源从左上方或正前方偏左，在衣服褶皱处形成微妙的明暗过渡
- 色温中性偏暖
- 光线要能揭示面料的微观质感

【背景】
- 纯净的白色或浅灰色或暖米色墙面，无任何道具和装饰
- 零环境信息，背景是纯粹的"画布"
- 无文字、无水印、无任何 UI 元素

【禁止出现】
眼睛、鼻子、完整面部、膝盖以下的腿部、鞋子、脚、全身远景构图、僵硬的手指、变形的手部、过度磨皮、AI 塑料感面料、鲜艳颜色、杂乱背景、正面直对镜头的站姿

风格参考：Celine/The Row/Lemaire 品牌 lookbook、小红书高端穿搭博主无脸氛围图、时尚杂志 editorial crop

用户上传的服装单品：{user_prompt}`;
