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

// ─── Model characteristics constants ──────────────────────────────────────────

export const MODEL_FACE_DESCRIPTION = `【模特面部特征 - 基于参考图片统一标准】
- 脸型：标准鹅蛋脸，轮廓柔和流畅，下颌线条清晰但不尖锐
- 眼睛：细长杏仁眼，双眼皮自然，眼神温柔有神但不刻意，带有慵懒松弛感
- 鼻子：高挺秀气，鼻梁笔直，鼻尖圆润
- 嘴唇：唇形饱满自然，唇色淡粉或裸色系，嘴角微微放松
- 眉毛：自然平眉或微挑眉，眉形流畅不僵硬
- 肤色：白皙透亮的东亚肤色，肤质细腻有光泽感
- 气质：温柔知性、优雅大方，带有现代都市女性的精致感，同时散发慵懒松弛的自然状态，不是僵硬的摆拍感
- 发型：黑色或深棕色长发（披肩直发、低马尾、自然微卷等，根据服装风格选择），发丝自然飘逸不僵硬`;

export const MODEL_POSE_AND_GESTURE = `【动作与神态 - 基于15张真实参考图片分析】

【拍摄角度】（优先级：高）
- 优先使用正面平视或3/4侧面角度（占80%）
- 平视或略微仰拍（10-15度），显得亲切自然
- 避免：俯拍、极端角度、过于侧面的角度

【姿态选择】（优先级：最高 - 这是真实感的关键）
从以下姿态中选择一种，每种都有具体的细节描述：

1. 倚靠姿态（推荐 - 占20%）：
   - 自然倚靠在白墙边，身体微微倾斜
   - 一只手插在裤袋里，另一只手自然垂放
   - 重心放在墙面上，显得放松随意
   - 参考：室内艺术空间倚墙照片

2. 坐姿（强烈推荐 - 占30%）：
   - 坐在椅子上、窗边、台阶上
   - 身体略微前倾或侧坐，不是笔直坐着
   - 一只手放在腿上，另一只手可以拿包或轻触物品
   - 眼神看向窗外或镜头外，若有所思
   - 参考：窗边坐姿、椅子坐姿照片

3. 自然站姿（占40%）：
   - 身体微微倾斜，避免僵硬直立
   - 重心偏向一侧，一条腿微微弯曲
   - 不是军姿般的笔直站立
   - 参考：多数站姿照片

4. 动态姿态（占10%）：
   - 走路状态，一只脚向前迈
   - 回眸动作，身体转向一侧回头看
   - 捕捉动作的中间状态，不是静止摆拍

【视线方向】（优先级：高 - 影响自然感）
根据概率分布选择：
- 50%：直视镜头，眼神放松自然，建立眼神交流
- 40%：看向镜头外、窗外、远处，营造自然感和故事感
- 10%：低头看向地面或手中物品

【手部姿态】（优先级：最高 - 这是避免AI感的关键）
手永远在"做事情"，从以下选择1-2个具体动作：
- 一只手插在裤袋或外套袋里（最常见）
- 一只手轻轻托腮，显得思考或放松
- 双手自然拿着包包、书本、杂志、咖啡杯等道具
- 双手自然交叠在身前或腰间
- 一只手轻触项链、耳环等首饰
- 一只手轻轻拨弄头发或耳后发丝
- 一只手轻搭在肩膀、窗框、椅背上
- 严格避免：双手僵硬垂放、双手完全看不见、手部姿态不明确

【表情神态】（优先级：高）
- 微笑但不夸张：嘴角微微上扬，不是咧嘴大笑
- 眼神放松：不刻意瞪大眼睛，眼神有焦点
- 略带思考：若有所思的表情，不是空洞的凝视
- 面部放松：面部肌肉自然状态，不紧绷
- 微表情自然：眉毛、嘴角有细微的自然变化

【头发和服装细节】（真实感关键）
- 头发有自然的飘动或散落，不是完美整齐
- 衣服有真实的褶皱和垂坠感
- 面料质感真实可见

【整体氛围】
- 像是被抓拍到的自然瞬间
- "刻意的不刻意" - 看似随意但经过设计
- 生活化、有故事感
- 模特与环境有真实互动

【严格禁止】
- 僵硬的直立站姿
- 双手僵硬垂放或完全看不见手
- 过度摆拍的完美姿态
- 空洞的眼神和表情
- 过于对称的构图
- 明显的AI生成痕迹`;

export type Age = "20-25" | "25-30" | "30-35" | "35-40";
export type Scene = "indoor" | "cafe" | "bookstore" | "beach";

export const AGE_CHARACTERISTICS: Record<Age, string> = {
  "20-25": "20-25岁，青春活力，皮肤紧致透亮，眼神清澈明亮，整体散发年轻朝气，带有少女感的慵懒随性",
  "25-30": "25-30岁，年轻成熟，气质优雅自信，既有青春感又不失沉稳，自然松弛的状态",
  "30-35": "30-35岁，成熟知性，气质沉稳大方，散发职业女性的精致感，带有从容不迫的松弛感",
  "35-40": "35-40岁，优雅从容，气质成熟稳重，展现成熟女性的魅力，慵懒优雅的生活感"
};

export const SCENE_DESCRIPTIONS: Record<Scene, string> = {
  indoor: "室内场景：简约中性背景，纯色墙面或极简室内，突出服装本身",
  cafe: `咖啡店场景 - 真实生活感拍摄：
- 拍摄角度：使用侧面或3/4侧面角度拍摄，不要正面直视镜头，像是朋友在旁边随手拍的角度
- 环境：真实的咖啡店室内，温暖的木质元素（木地板、木桌椅、木质墙面或装饰、木质窗框）
- 背景细节：背景简洁但有层次，可以有木质展示柜、咖啡机、桌椅等真实道具，但不要有其他人物（避免AI生成假的背景人物）
- 光线（关键 - 最高优先级）：必须是柔和的散射光，整体画面不能过亮，像是阴天的柔和光线或室内的散射光，避免强烈的直射光、高光过曝、刺眼的光线，窗户区域不能过曝，画面整体色调应该是柔和的中低调
- 模特位置和姿态（推荐窗边坐姿）：
  · 优先选择：坐在窗边木椅上或窗台边，身体侧向镜头，看向窗外，非常放松自然，像是在发呆或欣赏窗外风景
  · 其他选择：站在展示柜旁、靠在木质吧台边，但坐姿更自然
  · 手部可以轻轻搭在窗框上、拿着咖啡杯、或自然放在腿上
- 氛围：像是朋友随手拍的生活照，不是摆拍感，整体色调温暖柔和（奶油色、木色、暖白色为主），光线柔和不刺眼
- 禁止：正面直视镜头、背景有其他人物、光线过亮、过度打光、过于干净完美的背景、没有生活气息的空荡场景、僵硬的摆拍姿势`,
  bookstore: `书店场景 - 文艺生活感拍摄：
- 拍摄角度：使用侧面或3/4侧面角度拍摄，模特可以在翻书或看书，不要正面直视镜头
- 环境：真实的书店室内，木质书架从地面延伸到天花板，书籍自然陈列
- 背景细节：背景简洁但有层次，书架上书籍排列自然，可能有绿植、阅读灯、木质梯子等真实道具，但不要有其他人物
- 光线：柔和的阅读灯光混合自然光，不要过亮，营造温暖知性氛围
- 模特位置：可以站在书架旁翻书、靠在书架边、或坐在书店角落的椅子上，身体侧向镜头，姿态放松自然
- 氛围：像是在书店偶遇拍下的自然瞬间，整体色调温暖文艺（木色、米色、暖黄色为主），光线柔和不刺眼
- 禁止：正面直视镜头、背景有其他人物、光线过亮、空荡荡的书架、过于整齐的摆拍、僵硬的站姿、缺少生活气息`,
  beach: `海边场景 - 自然清新感拍摄：
- 拍摄角度：使用侧面或3/4侧面角度拍摄，模特可以看向海面或远处，不要正面直视镜头
- 环境：真实的海滨风光，沙滩、海浪、蓝天白云
- 背景细节：远处有海浪拍打、沙滩上有自然的脚印或贝壳，背景简洁自然，不要有其他人物
- 光线：自然的海边光线，柔和不刺眼，不要过亮，有海风吹拂的感觉
- 模特位置：可以站在沙滩上、坐在沙滩上、或走在海边，身体侧向镜头，姿态自然放松，头发被海风吹动
- 氛围：像是海边度假时的随手拍，整体色调清新明亮（蓝色、白色、米色为主），光线柔和自然
- 禁止：正面直视镜头、背景有其他人物、光线过亮、过于完美的摆拍、僵硬的站姿、缺少海边自然元素`
};

export const FASHION_MODEL_STANDARD_PROMPT = `生成一张真实的时尚穿搭模特照片，要求极致真实，完全看不出AI生成痕迹。

【模特要求 - 必须严格遵守】
- 中国女性模特，年龄{age}岁，{age_characteristics}
- {model_face_description}
- 身材匀称，气质优雅大方
- 皮肤质感真实自然，有正常的光影和肤色过渡

{model_pose_and_gesture}

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
- {scene_description}
- 背景要有适当的景深虚化，突出模特和服装，但虚化不要过度（避免背景完全模糊或虚化不自然）
- 光线柔和自然，不要过亮或刺眼，像是阴天柔光或室内自然光，避免过度明亮的光线
- 整体氛围感要与服装风格统一

【技术要求 - 真实感是第一优先级】
1. 照片级真实感，必须像是用手机或相机在真实场景中拍摄的照片，不能有任何AI生成的痕迹

【光线控制 - 最高优先级】
- 整体光线必须柔和，画面不能过亮，像是阴天的散射光或室内的柔和自然光
- 避免强烈的直射光、高光过曝、刺眼的光线
- 画面整体色调应该是柔和的中低调，不是明亮的高调
- 窗户区域不能过曝，要保留细节
- 光影对比要柔和，不是强烈的明暗对比

2. 光影效果必须真实（关键 - 这是避免AI感的核心）：
   - **光线强度控制（最重要）**：整体光线必须柔和，不能过亮或刺眼，像是阴天的散射光或室内的柔和自然光，避免强烈的直射光和高光过曝，画面整体色调应该是柔和的中低调，不是明亮的高调
   - **背景墙面必须有明显的光影层次和色温变化**：墙面不能是均匀的纯色，靠近光源的区域（如窗户附近）应该是白色/冷色调，远离光源的区域应该是米色/暖色调，墙面要有自然的明暗过渡和光影渐变
   - **模特必须在墙上投下清晰可见的阴影**：阴影的方向、形状、深浅要符合光源位置，但阴影要柔和不刺眼，不能没有阴影或阴影太弱
   - **光源方向必须明确但柔和**：整个画面的光线要有统一的方向性（如从右侧窗户照进来），但光线要柔和，不是强烈的直射光
   - 如果有窗户，窗户区域不能过曝，光线要在地面和墙面形成柔和的投影，不是强烈的光斑
   - 墙面要有真实的质感和细微的不完美（不是完美的纯色墙）
   - 避免：背景墙面均匀纯色、没有光影层次、模特没有阴影、光线过强过亮、高光过曝、强烈的明暗对比、像是抠图合成的平面感、墙面过于完美

3. 景深虚化必须真实（关键）：
   - 使用真实的镜头虚化效果（bokeh），不是简单的高斯模糊
   - 前景清晰，背景适度虚化，虚化程度符合真实镜头特性（50mm-85mm镜头，f/1.8-f/2.8光圈）
   - **虚化不要过度**：背景不能完全模糊成一片，要保留一定的细节和层次
   - 不同距离的背景元素虚化程度不同，有层次感
   - 背景光源形成自然的圆形或多边形光斑（bokeh balls），但不要过度明显
   - 主体与背景的边缘过渡自然柔和，不是生硬的抠图边缘
   - 避免：过度虚化、背景完全模糊、不自然的模糊、边缘发光、明显的抠图感

4. 环境细节必须真实可信：
   - 背景不能是空荡荡的纯色墙面，要有真实的空间感和层次
   - 可以有适当的环境元素（但不要过度复杂），重点是营造真实的空间氛围
   - 背景要有前景、中景、远景的层次感，不是平面的

5. 模特的姿态和表情必须自然放松，像是被抓拍到的瞬间，不是摆拍

6. 整体画面要有生活气息和氛围感，不是棚拍的完美感

7. 无文字、无水印、无任何UI元素

8. 竖版 9:16 比例

9. 禁止出现：过度磨皮、不自然的肤色、扭曲的手指、异常的身体比例、诡异的表情、僵硬的站姿、空荡荡的纯色背景、背景墙面光影均匀、模特没有阴影、背景有其他人物、光线过亮过强、高光过曝、窗户过曝、强烈的明暗对比、背景虚化过度、过于完美的对称构图、明显的AI生成痕迹、抠图感、边缘发光

10. 风格参考：小红书穿搭博主实拍、时尚杂志街拍、Instagram时尚KOL日常穿搭照 - 强调真实生活感而非棚拍感，模拟真实相机拍摄效果

用户上传的服装单品：{user_prompt}`;

export const FASHION_MODEL_INDOOR_PROMPT = `根据我上传的 1-3 张服装参考图生成一张室内模特实拍图，必须是照片级真实感，完全没有AI痕迹。

【服装映射规则 - 必须严格遵守】
- 根据我上传的 1-3 张服装参考图生成室内模特实拍图
- 只允许使用上传的服装单品：上传1件就展示1件，上传2件就展示2件，上传3件就展示3件
- 禁止新增任何未上传的服装，不得擅自补外套、补内搭、补裙子、补裤子
- 如果上传内容里没有外套，绝对不要生成外套；如果上传内容里有外套，才允许作为外层穿着

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

// ─── Pants type silhouette specs (injected at top of prompt prefix) ───────────

export type PantsType = "banana" | "wide-leg" | "straight" | "cropped" | "bootcut" | "barrel";

export const PANTS_FABRIC_REALISM_PROMPT = `━━━ FABRIC & PHOTO REALISM — APPLIES TO ALL PANTS TYPES ━━━
The final image must look like a real product photograph taken in a studio or on location — NOT like an AI rendering.

FABRIC MUST LOOK REAL:
- The fabric must show its actual material texture: denim has visible weave grain, canvas has matte surface, silk has subtle sheen, knit has ribbed structure, cotton has soft slight surface fuzz, leather has grain and reflection. Do NOT render any fabric as a flat, uniform, perfectly smooth surface.
- Natural wrinkles and stress creases MUST be present at joint areas (crotch, behind knee, ankle), matching real-world physics of how that fabric bends and drapes under gravity.
- Fabric color must show realistic variation — lighter where fabric is raised and catches light, darker in fold recesses and shaded areas. Do NOT use flat uniform color fill.
- Seams, topstitching, and pocket edges must be clearly visible as construction details with slight fabric tension around them.
- If the fabric is washed, worn, or treated (e.g. stonewash denim, distressed), those surface marks must be realistic and varied — not repeated patterns or obvious AI textures.

PHOTO MUST LOOK REAL:
- Lighting must create natural shadows and fabric depth — do NOT use flat, even lighting that makes everything look CG.
- The garment must have weight and gravity — heavy fabrics (denim, wool, canvas) pull downward and create tension; light fabrics (chiffon, silk) float and drape softly.
- Small imperfections are welcome and realistic: slight asymmetry in drape, natural variation in fabric thickness, minor crease shadows — these all make the photo look authentic.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

export const PANTS_TYPE_SILHOUETTE_PROMPTS: Record<PantsType, string> = {

  banana: `━━━ PANTS TYPE — USER OVERRIDE — HIGHEST PRIORITY ━━━
The user has explicitly selected: BANANA PANTS (香蕉裤).
You MUST render the silhouette EXACTLY as described below.
This overrides any visual inference you may draw from the reference image.

SILHOUETTE: Banana Pants — smooth inward-tapering arc from hip all the way to the ankle.
Visual analogy: viewed from the side, the leg traces the gentle downward curve of a banana — widest at the hip, continuously curving inward toward the ankle.

SECTION-BY-SECTION SHAPE (waist → ankle):
- Waist/waistband: snug and fitted at the natural waist or high hip; the waistband hugs the body cleanly
- Hip: moderately fitted — fabric ease of approximately 3–5cm over the actual hip measurement; neither roomy nor tight; the hip is the widest point of the leg
- Thigh: slightly narrower than the hip — approximately 2–3cm less circumference than the hip; the inward taper begins immediately below the hip; the thigh already reads as slimmer than the hip
- Knee: the pivotal narrowing point — approximately 4–6cm narrower in circumference than the thigh; the fabric clearly pinches inward at the knee; this is where the banana curve bends most noticeably
- Below knee to ankle: continuous and progressive narrowing — the leg keeps getting narrower all the way down without any outward flare or pause; there is no reversal of the taper at any point
- Ankle/hem: narrow fitted cuff — the hem circumference is approximately 60–70% of the thigh circumference; it hugs close to the ankle; the ankle opening is visibly much narrower than the thigh

SIDE SEAM BEHAVIOR: the side seam traces a smooth, gently curving arc that bows INWARD from the hip all the way to the ankle. It is NOT a straight vertical line. It is NOT a barrel-shaped outward bow. The arc is fluid and continuous — like the inner edge of a banana curve — no kinks, no reversals, just a single smooth inward sweep.

FROM THE FRONT VIEW: both legs show a smooth, flowing taper — clearly wider at the thigh, visibly narrowing through the knee, and noticeably slim at the ankle. The outer edges of both legs form gentle inward-curving lines. The silhouette reads as a soft tapering column or elongated teardrop, never a rectangle or cylinder.

FROM THE SIDE VIEW: the leg silhouette traces a natural downward banana-curve — the front edge of the leg is roughly vertical, while the back edge of the leg curves gently inward from hip toward the ankle, forming the characteristic banana shape.

FABRIC DRAPE: the fabric follows the body closely throughout; gravity pulls the side seam inward at each section, reinforcing the arc. The fabric does not pool at the ankle — it terminates cleanly in a slim cuff. The overall impression is of a sleek, elongating silhouette.

STRICTLY FORBIDDEN — if any of these appear, the output is WRONG:
× Barrel shape (widest at knee or mid-thigh, narrow at top and bottom)
× Wide or flared hem at the ankle
× Straight cylindrical leg with uniform width hip-to-ankle
× Any outward flare below the knee
× Extremely roomy thigh with no visible taper
× Pants that look like wide-leg, straight-leg, or bootcut
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,

  "wide-leg": `━━━ PANTS TYPE — USER OVERRIDE — HIGHEST PRIORITY ━━━
The user has explicitly selected: WIDE-LEG PANTS (阔腿裤).
You MUST render the silhouette EXACTLY as described below.
This overrides any visual inference you may draw from the reference image.

SILHOUETTE: Wide-Leg Pants — each leg is a large, broad column of fabric that drapes away from the body under its own weight. The fabric is heavy, relaxed, and billowing — the legs swing slightly with movement and create generous volume at every section. The overall shape is unmistakably WIDE, not a tube.
Visual analogy: imagine two wide curtain panels hanging from the hips — each leg is so wide that it completely hides the leg shape inside. Another reference: the classic Japanese street-style wide-leg denim that is obviously baggy from hip all the way to the hem, with the fabric pooling softly over the shoe. The thigh is the widest reference point but the hem is almost equally wide. The pant legs create a strong rectangular silhouette from the front — wide at the top, and equally wide or nearly so at the bottom.

QUANTITATIVE WIDTH — MUST BE FOLLOWED EXACTLY:
- Each leg panel, measured flat: 48–58cm wide — these are extremely wide legs, noticeably wider than standard wide-leg jeans
- Thigh circumference: actual thigh + 30–38cm of ease — massively roomy; the thigh area looks like a wide tube with no body shape visible whatsoever; there is a huge air gap between the fabric and the leg
- Hip circumference: actual hip + 15–18cm of ease
- Knee circumference: equal to thigh — the full extreme width is maintained from hip all the way to the knee; the leg does NOT narrow at the knee
- Hem circumference: equal to or no more than 3cm narrower than the knee — the hem is almost as wide as the knee; the lower leg reads as a wide, open column
- The combined width of both legs fills 92–98% of the frame width — the pant legs nearly touch the frame edge on both sides; barely any background visible
- The visible width must come from the pant panels themselves, not from a wide stance or split-leg pose

FABRIC TEXTURE — CRITICAL FOR REALISM (if fabric is denim):
This is real denim fabric shot in a photo studio — NOT a smooth AI-generated surface. Every part of the fabric surface must look tangible and physical:
- Macro-level: visible diagonal twill weave structure across the entire fabric — you can see the individual yarn interlacing pattern, especially on the outer thigh and lower leg where light hits directly
- Color variation: a clear gradient from faded light blue at the thigh front and seat, to medium blue across the knee area, to deeper blue-grey in the fold recesses and side panels — the color is NEVER flat or uniform across any section
- Whisker marks: natural horizontal creasing radiating from the upper inner thigh/crotch area — organic, not symmetrical, like real worn denim
- Knee creases: horizontal stress lines behind and below the knee where the fabric naturally folds when walking — multiple small parallel lines, NOT a single smooth curve
- Fabric weight visible in the hang: the fabric sags and pulls slightly under its own weight, creating micro-tension lines along the vertical grain, especially visible on the lower leg
- Topstitching: contrast-colored stitching (warm white or golden yellow thread) clearly visible along all seam lines with natural thread texture
- Hem edge: the hem shows slight fraying, wear, or a clean folded edge with a shadow line where it folds over the shoe
- Side panel depth: the side panels are slightly darker than the front face due to less light exposure — this 3D tonal difference makes the leg look round and real, not flat

FABRIC BEHAVIOR:
- Below the hip, the fabric hangs away from the body with a clean, composed vertical drape; the thigh shape is not visible
- At the knee: natural horizontal drape folds and crease lines where the fabric gathers — these should look like real wear creases, NOT smooth curves
- At the ankle and floor: the hem opening stays broad and relaxed; it falls over the shoe with visible stacking and soft pooling — approximately 2 to 4 layered folds; the stacked hem shows natural crease shadows and fabric depth
- The fabric has natural three-dimensional drape — viewed from the side, the leg has volume and depth, not a flat panel
- The outer side seams sit clearly away from the actual leg line; there is visible empty air space between the model's leg and the inside of the pant leg
- Even when the model stands straight, the pant leg still reads wide from upper thigh to hem; the width must remain visible without relying on pose

SECTION-BY-SECTION SHAPE (waist → floor):
- Waist/waistband: the only fitted point — snug and high-waisted; clear contrast with the wide leg below
- Hip: roomy — 12–15cm ease; the silhouette reads as noticeably wide
- Thigh: wider than the hip; fabric hangs away from the thigh; leg shape not visible
- Knee: same width as thigh; soft natural drape folds visible; clean appearance
- Below knee to hem: broad and continuous with near-equal width; only the slightest inward taper is allowed; the lower leg should still look generous and fluid, ending in a softly pooled hem rather than a clean cropped tube
- Hem: FULL-LENGTH; visibly wide at the opening; covers the top of the shoe and creates 2–4 soft stacked folds; ankle fully hidden

POSE REQUIREMENT — CRITICAL:
- The model should stand in a natural balanced stance, feet only slightly apart, with no exaggerated step-out pose
- Do NOT create the illusion of width by forcing the feet far apart or by pushing one knee outward
- The pants must still look unmistakably wide-leg if the feet were moved closer together
- The crotch opening and the distance between the two legs should look natural; the garment width must come from the side seams and panel width, not from pose manipulation

SIDE SEAM BEHAVIOR: the side seam hangs straight down under gravity from the hip, finishing at a point far outside the actual leg — the outer edge of each pant leg is clearly several centimeters beyond the outer edge of the hip. The overall silhouette from the front looks like a wide rectangle, NOT a fitted tube. The fabric has three-dimensional volume and depth — it is NOT flat or pressed against the body.

FROM THE FRONT VIEW: the pants form two broad rectangular columns from waist to floor; the outer edge of each leg extends clearly beyond the hip line, creating an obvious wide silhouette; the lower leg is as broad as the upper leg; the hem gathers softly over the shoe in 2–4 visible stacked folds; there is clear background visible on the far outer sides of both legs; the overall width of the pants is the dominant visual feature of the outfit.

FROM THE SIDE VIEW: the fabric hangs away from the leg with generous depth; the hem breaks over the shoe and shows a soft pooled stack — you can see the pant leg is thick with fabric, not pressed flat against the ankle.

STRICTLY FORBIDDEN — if any of these appear, the output is WRONG:
× Pants that look like straight-leg or slim-leg — the legs must be clearly and noticeably wider
× Thigh area that looks fitted or body-conforming
× Completely flat hem with no stacking at all — the pants should have a floor-grazing pooled break over the shoe
× Excessive fabric piling or chaotic bunching at the hem — soft stacking is correct, but a messy heap at the ankle is WRONG
× Palazzo-style extreme volume — the pants should look like wide-leg jeans, NOT a divided skirt
× Cropped or ankle-length hem — the ankle must be fully covered
× Hem that is noticeably narrowed or pinched in at the ankle — the hem must remain broad like a normal wide-leg pant
× Width created mainly by the model standing with feet very far apart — the pants themselves must be wide
× Straight-leg pants shown in a split stance to fake a wide-leg silhouette
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,

  straight: `━━━ PANTS TYPE — USER OVERRIDE — HIGHEST PRIORITY ━━━
The user has explicitly selected: STRAIGHT-LEG PANTS (直筒裤).
You MUST render the silhouette EXACTLY as described below.
This overrides any visual inference you may draw from the reference image.

SILHOUETTE: Straight-Leg Pants — a perfectly vertical line from thigh to floor; every section has exactly identical width.
Visual analogy: the leg silhouette is a clean, precise rectangle — like a ruler standing upright from thigh to floor. There is not a single point where it gets wider or narrower.

SECTION-BY-SECTION SHAPE (waist → floor):
- Waist/waistband: fitted at the natural waist, snug without excess ease
- Hip: close-fitting — approximately 2–3cm ease over the actual hip measurement; no dramatic roominess; the hip is trim and clean
- Thigh: fitted and trim — approximately 3–5cm ease over actual thigh circumference; this measurement sets the baseline width for the ENTIRE leg — every section below must match this width exactly
- Knee: EXACTLY the same width as the thigh — zero narrowing, zero widening; the transition from thigh to knee is completely invisible; measured flat, the knee panel is identical to the thigh panel
- Below knee: EXACTLY the same width as the knee — the leg continues in a perfect straight column; no change whatsoever in any direction
- Hem: EXACTLY the same width as the knee and below-knee — the leg terminates at the same width it started; no flare, no taper, no deviation

LENGTH — CRITICAL: These are FULL-LENGTH floor-grazing pants. The hem must reach all the way to the floor level. The fabric lightly stacks or rests on top of the shoe. The ankle is fully covered inside the pant leg. There is NO exposed ankle skin. The straight column of fabric reaches the ground cleanly.

SIDE SEAM BEHAVIOR: an absolutely straight vertical line — the seam runs perfectly parallel to the body's center axis from hip all the way down to the floor-level hem. There is no arc, no curve, no inward bow, no outward bow, no deviation of any kind. If you drew a ruler alongside the side seam, it would match perfectly. This perfect vertical line is the defining visual signature of straight-leg pants.

FROM THE FRONT VIEW: both legs form clean, identical rectangular columns from waist all the way to the floor; the left edge and the right edge of each leg are perfectly parallel vertical lines; the overall silhouette is two neat rectangles from waist to ground; the hem rests on or just above the shoe.

FROM THE SIDE VIEW: an equally straight vertical line reaching the floor; no widening or narrowing visible from any angle; the leg looks identical whether viewed from front, side, or back.

FABRIC DRAPE: moderate, clean drape — the fabric hangs in a straight column all the way to the floor; a subtle vertical center crease line may be present; natural thigh and knee wrinkles form horizontally but do not change the overall straight silhouette; the hem lightly touches or stacks on the shoe.

STRICTLY FORBIDDEN — if any of these appear, the output is WRONG:
× Any taper from thigh toward ankle (banana pants shape)
× Any flare or widening below the knee (bootcut/micro-flare shape)
× Any outward bulge at knee or mid-thigh (barrel shape)
× Any inward or outward curve in the side seam
× Wide-leg volume or dramatically roomy thigh
× Cropped or ankle-length hemline — the hem MUST reach the floor and fully cover the ankle
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,

  cropped: `━━━ PANTS TYPE — USER OVERRIDE — HIGHEST PRIORITY ━━━
The user has explicitly selected: CROPPED PANTS / NINE-FEN LENGTH (九分裤).
You MUST render the LENGTH EXACTLY as described below.
This overrides any visual inference you may draw from the reference image.

SILHOUETTE: Cropped Pants — the defining feature is SHORT LENGTH; the hem ends visibly above the ankle, exposing the ankle skin.
The body of the pants follows a straight-leg silhouette (fitted and uniform from hip to the cropped hem).

LENGTH SPECIFICATION — THIS IS THE SINGLE MOST IMPORTANT ELEMENT:
- The pants are approximately 10–15cm shorter than full-length pants
- The hem must terminate 2–5cm ABOVE the ankle bone — clearly and visibly above the ankle joint
- The ankle bone is FULLY VISIBLE, uncovered, and exposed to view
- A strip of bare ankle skin is clearly visible between the hem edge and the top of the shoe
- The shoe itself is clearly visible in the frame below the hem
- There is an obvious visual gap between the hem of the pants and the top of the shoe
- The exposed ankle is the unmistakable visual signature of nine-fen length — it must be prominent

SECTION-BY-SECTION SHAPE (waist → cropped hem):
- Waist/waistband: fitted at the natural waist
- Hip: close-fitting — approximately 2–3cm ease
- Thigh: fitted and straight — 3–5cm ease; sets the uniform width for the rest of the leg
- Knee: same width as thigh — straight-leg proportions; no narrowing or widening
- Below knee to cropped hem: same uniform width maintained all the way to the clean cut-off point
- Hem edge: a clean, straight horizontal cut; the hem sits at approximately mid-ankle height, clearly above the ankle bone

FROM THE FRONT VIEW: the pants appear visibly shorter than normal full-length pants; a clear strip of bare ankle skin is prominently visible between the hem and the shoe; both ankles are fully exposed; this ankle exposure is THE visual signature of nine-fen cropped length.

SHOES: the shoes must be clearly and fully visible — the entire shoe top, the ankle area, and a portion of the lower calf are all exposed and visible. Feminine ankle-exposing styles (pointed flats, ankle-strap sandals, loafers, kitten heels) complement this length.

STRICTLY FORBIDDEN — if any of these appear, the output is WRONG:
× Pants that reach all the way to the floor or touch the shoe top
× Pants that stack or pool on the shoe
× Any length that hides the ankle bone
× Full-length pants silhouette — the ankle MUST be visibly exposed
× Dramatic flare or barrel shape below the knee
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,

  bootcut: `━━━ PANTS TYPE — USER OVERRIDE — HIGHEST PRIORITY ━━━
The user has explicitly selected: MICRO-FLARE / BOOTCUT PANTS (微喇裤).
You MUST render the silhouette EXACTLY as described below.
This overrides any visual inference you may draw from the reference image.

SILHOUETTE: Micro-Flare Pants — slim from hip to knee, then a small graceful flare opens below the knee.
Visual analogy: the upper leg is slim and converging, then below the knee an elegant gentle opening appears — like a subtle bell that only begins to ring near the floor.

SECTION-BY-SECTION SHAPE (waist → hem):
- Waist/waistband: high waist, snugly fitted at the waistline — the waistline hugs the body tightly; the waist is the narrowest point
- Hip: close-fitting with a gentle curve — approximately 2–3cm ease; the hip reads as clearly shaped and defined, not boxy
- Thigh: slim and fitted — only 2–3cm ease over actual thigh measurement; the thigh reads as close to the leg; visibly slender from the front
- Knee: the NARROWEST point of the entire leg — approximately 1–2cm narrower in circumference than the thigh; the leg visibly PINCHES IN slightly at the knee; the knee is the tightest point before the flare opens; this slight pinching at the knee is an important visual detail
- Transition point: approximately 2–3cm BELOW the knee, the fabric begins to open outward; this is the exact location where the flare starts
- Below-knee flare: from the 2–3cm point below the knee, the fabric gradually and smoothly widens all the way down to the hem; the widening is continuous and smooth — not abrupt, not sudden
- Hem: approximately 3–6cm wider in circumference than the knee — the hem is noticeably wider than the narrowest knee point; the hem has a gentle opening
- Flare angle: subtle and elegant — approximately 5–15 degrees outward from vertical; this is a MICRO-flare, NOT a dramatic full-flare or bell-bottom; if you compare the thigh to the hem, the hem is only slightly wider; the flare is restrained and graceful

SIDE SEAM BEHAVIOR: the seam runs straight and slim from the hip down to the knee. At the knee transition point (approximately 2–3cm below the knee), the seam begins to curve gently outward in a smooth arc that widens toward the hem. Both side seams flare outward symmetrically.

FROM THE FRONT VIEW: the upper leg (thigh to knee) shows two slightly converging lines that narrow toward the knee; below the knee, both outer seam edges diverge outward in a smooth gentle flare; the overall leg shape reads as a slim upper portion with an elegant subtle A-line only in the lower section; the contrast between the slim upper leg and the gentle flare below the knee is clearly visible.

FROM THE SIDE VIEW: the leg is slim and close-fitting from hip to knee, then a graceful gentle flare opens from just below the knee to the hem; both the front and back seams flare outward symmetrically; the flare is visible but subtle.

FABRIC DRAPE: the fabric hugs the thigh and knee closely with minimal excess; below the knee, the flare creates gentle, flowing movement; the hem has a slight swinging drape when in motion; the flare gives a sense of elegance without volume.

STRICTLY FORBIDDEN — if any of these appear, the output is WRONG:
× Perfectly straight leg with no flare at the hem (straight-leg silhouette)
× Wide-leg or dramatically wide flare (too much volume — should be micro only)
× Barrel shape (widest at knee, narrowing both above and below)
× Banana taper (continuously narrowing from thigh to ankle — opposite of flare)
× Flare that begins at the thigh or hip rather than below the knee
× Narrow fitted ankle — the hem must be wider than the knee, not narrower
× Bell-bottom or exaggerated 70s flare — the angle must stay within 5–15 degrees
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,

  barrel: `━━━ PANTS TYPE — USER OVERRIDE — HIGHEST PRIORITY ━━━
The user has explicitly selected: BARREL PANTS (弯刀裤).
You MUST render the silhouette EXACTLY as described below.
This overrides any visual inference you may draw from the reference image.

SILHOUETTE: Barrel Pants — narrow at the top AND narrow at the bottom, with maximum width at the KNEE; the leg bows outward in the middle.
Visual analogy: the leg silhouette forms a parenthesis "( )" shape — both the hip (top) and the ankle area (bottom) are narrower than the knee (middle); like a barrel or a bowed leg; like two crescent moons placed back to back.

SECTION-BY-SECTION SHAPE (waist → floor):
- Waist/waistband: high waist, cinched and snug — the waistband fits close to the body; the waist is a narrow, fitted anchor point
- Hip: slightly roomy — approximately 5–8cm ease over actual hip measurement; the silhouette widens slightly but noticeably from the waist down through the hip
- Thigh: WIDER than the hip — the thigh circumference is approximately 3–5cm LARGER than the hip circumference; the leg actively expands outward from the hip through the thigh; the side seam visibly pushes outward as it travels down from the hip
- Knee: the WIDEST point of the entire leg — approximately 4–6cm LARGER in circumference than the thigh measurement; this is the maximum outward bulge of the barrel shape; both side seams are at their furthest outward extent at the knee; the knee visually reads as the widest part of the leg
- Below knee: the fabric begins to NARROW INWARD — progressively tapering from the knee downward; the side seam curves back inward toward the hem
- Hem: the hem opening is 6–10cm NARROWER than the knee circumference — noticeably narrower than the knee; however, these are FULL-LENGTH FLOOR-GRAZING pants — the hem still reaches all the way down to the floor or rests on top of the shoe despite the narrower opening

LENGTH — CRITICAL: These are FULL-LENGTH floor-grazing pants. The narrowing below the knee describes the SHAPE of the silhouette, NOT a shorter length. The pants are long enough that the hem reaches the floor or drapes over the shoe. The ankle bone is fully covered by the fabric. There is NO exposed ankle skin. The barrel shape (wide at knee, narrower at hem) applies to the silhouette cross-section, while the hem still grazes the floor.

SIDE SEAM BEHAVIOR: an outward-convex CURVED ARC — the seam curves OUTWARD from the waist, progressively expanding through the hip and thigh, reaching maximum outward displacement at the knee, then curves BACK INWARD from the knee all the way down to the floor-level hem. The full seam traces a smooth C-curve (or mirrored reversed-C on the other side). This outward bowing of the side seam is the defining visual feature of barrel pants and must be clearly prominent.

FROM THE FRONT VIEW: both legs show a visible outward bulge at the knee area; the silhouette widens noticeably from hip to knee, then tapers back inward from the knee all the way down to the floor-level hem; the overall leg shape reads like a rounded oval or parenthesis "()" when both legs are together; the widest visual width of the entire garment occurs at the knee, NOT at the hip, NOT at the hem; the hem rests on or near the floor.

FROM THE SIDE VIEW: the leg profile shows a clear outward bow — the leg curves away from the body through the thigh and knee area, then curves back inward at the lower calf; the hem reaches floor level.

FABRIC DRAPE: the fabric is structured enough to hold the barrel shape; horizontal tension folds may radiate outward from the knee area; the knee section is taut and rounded; the lower leg fabric tapers inward but has sufficient length to reach the floor; the hem may lightly stack on the shoe.

STRICTLY FORBIDDEN — if any of these appear, the output is WRONG:
× Straight leg with uniform width from hip to hem (the barrel bulge at knee MUST be visible)
× Wide-leg silhouette where the hem is as wide as or wider than the knee
× Narrow thigh expanding to a wide flare at the hem (micro-flare shape — opposite of barrel)
× Banana taper (continuously narrowing — barrel MUST widen outward toward the knee first)
× Hip as the widest point — the knee MUST be wider than the hip
× Any silhouette where the knee is NOT the single widest point of the entire leg
× Cropped or ankle-length hemline — the hem MUST reach the floor despite the narrower barrel opening
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
};

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
