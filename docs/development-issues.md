# 能力评估智能体首版 Demo 开发任务拆分

> 当前状态：本文档记录首版 legacy 静态 `demo/` 的历史 issue 拆分。当前主演示入口已迁移到 `agent/capability-assessment/app/`；新版 Vue/Vite 迁移状态见 `docs/frontend-rewrite-issues.md`，当前未完成项见根目录 `DEVELOPMENT_ISSUES.md`。

本文档将 `demo-requirements.md` 拆成可独立领取、可独立验收的开发任务。当前没有配置外部 issue tracker，因此先以本地 issue 文档形式沉淀。

## ISSUE-01：搭建独立 Demo 页面骨架

**Type**: AFK

**Blocked by**: None - can start immediately

**What to build**

搭建能力评估智能体首版 Demo 的独立页面骨架，不接入现有 `career` 前后端。页面需要包含默认用户信息、输入区、结果区、RAG 占位区和 JSON 输出区，让后续任务可以逐步填充能力评估逻辑。

**Acceptance criteria**

- [x] 页面显示默认用户 `demo_user_001`。
- [x] 页面包含简历/经历文本输入区、固定问答区、自评问卷区、岗位/JD 输入区。
- [x] 页面包含用户能力雷达图区域、能力明细区域、RAG 占位区域、JSON 输出区域。
- [x] 页面明确标注首版为独立 Demo，不接入现有登录和后端 API。
- [x] 页面在本地可以打开并完成基础展示。

## ISSUE-02：实现统一能力维度与 Demo 状态模型

**Type**: AFK

**Blocked by**: ISSUE-01

**What to build**

将 8 个统一能力维度固化为 Demo 的基础 schema，并建立页面状态模型，用于保存用户输入、局部能力证据、用户能力画像和岗位能力需求图占位结果。

**Acceptance criteria**

- [x] Demo 使用 `capability-schema.md` 中的 8 个 capability keys。
- [x] 所有能力分数范围限制为 `0-100`。
- [x] 所有置信度范围限制为 `0.00-1.00`。
- [x] 页面状态中包含 `capability_profile` 和 `role_capability_profile`。
- [x] JSON 输出区能展示当前状态中的能力画像结构。

## ISSUE-03：实现简历/经历文本输入与模拟能力证据抽取

**Type**: AFK

**Blocked by**: ISSUE-02

**What to build**

实现简历/经历文本输入后的首版能力证据生成。首版可以使用 deterministic mock 规则，不接真实 LLM，但页面需要标注“当前为 Demo 模拟评分，后续接入 LLM rubric 评分”。

**Acceptance criteria**

- [x] 用户可以粘贴简历、项目、实习、社团或课程经历文本。
- [x] 点击生成后，系统能从文本输入生成至少 3 个能力维度的 mock 证据。
- [x] 每条证据包含 `capability_key`、`score`、`confidence`、`evidence_summary`。
- [x] 证据来源标记为 `resume_text`。
- [x] 页面明确说明当前文本分析为 Demo 模拟评分。

## ISSUE-04：实现固定问答输入与局部能力证据输出

**Type**: AFK

**Blocked by**: ISSUE-02

**What to build**

实现 6 个固定能力问答问题。用户至少填写 2-3 题后即可生成演示结果。首版可以使用 mock LLM 输出，但输出结构必须符合 `capability_evidence` JSON 约束。

**Acceptance criteria**

- [x] 页面展示 6 个固定问题。
- [x] 用户可以填写每个问题的回答。
- [x] 至少填写 2 题后，可以生成问答来源的能力证据。
- [x] 每条证据包含 `source_type: "dialogue_answer"` 和对应 `source_id`。
- [x] 不输出岗位推荐、匹配报告或训练建议。

## ISSUE-05：实现自评问卷输入与辅助能力证据

**Type**: AFK

**Blocked by**: ISSUE-02

**What to build**

实现首版自评问卷。每个能力维度设置 1-2 道 1-5 分题目，自评结果作为辅助证据进入能力画像，不作为唯一评分依据。

**Acceptance criteria**

- [x] 页面展示覆盖 8 个能力维度的自评问题。
- [x] 每题使用 1-5 分输入。
- [x] 自评结果能生成 `self_assessment` 来源的能力证据。
- [x] 自评证据的置信度低于多来源综合证据。
- [x] 页面说明自评只是辅助证据。

## ISSUE-06：实现能力证据合并与用户能力画像生成

**Type**: AFK

**Blocked by**: ISSUE-03, ISSUE-04, ISSUE-05

**What to build**

将简历/经历文本、固定问答和自评问卷产生的局部能力证据合并成完整 `capability_profile`。首版可使用简单平均或加权平均，但必须稳定、可解释。

**Acceptance criteria**

- [x] 同一能力多条证据可以合并为一个最终 `score`。
- [x] 合并结果包含 `score`、`confidence`、`evidence_sources`、`evidence_summary`。
- [x] 无证据能力显示低置信度，不强行给高分。
- [x] `capability_profile` 包含全部 8 个能力维度。
- [x] JSON 输出区展示完整 `capability_profile`。

## ISSUE-07：实现用户能力雷达图与能力明细展示

**Type**: AFK

**Blocked by**: ISSUE-06

**What to build**

展示用户能力雷达图和能力明细。雷达图显示 8 个能力维度的 `score`，明细展示中文名、分数、置信度、证据来源和证据摘要。

**Acceptance criteria**

- [x] 雷达图展示 8 个能力维度。
- [x] 雷达图数据来自 `capability_profile`。
- [x] 能力明细展示每项能力的分数和置信度。
- [x] 能力明细展示证据来源和证据摘要。
- [x] 页面在空数据、部分数据、完整数据三种状态下都不崩溃。

## ISSUE-08：实现 JD 输入与 RAG 占位岗位能力需求图

**Type**: AFK

**Blocked by**: ISSUE-02

**What to build**

实现岗位/JD 输入区和 RAG 占位结果。首版不接真实 RAG，不接向量数据库，不集成 GitHub RAG 仓库。用户粘贴 JD 或选择示例岗位后，系统展示 RAG 占位状态，并输出 mock `role_capability_profile`。

**Acceptance criteria**

- [x] 用户可以粘贴 JD 文本。
- [x] 用户可以选择示例岗位 `互联网产品经理实习生`。
- [x] 页面展示 “RAG 能力需求分析占位” 文案。
- [x] 输出 `source_type: "mock_rag_placeholder"`。
- [x] 输出 `rag_status: "placeholder"`。
- [x] `role_capability_profile` 使用统一 capability keys。
- [x] 页面明确说明真实 RAG 后续接入。

## ISSUE-09：实现岗位能力需求图展示与 JSON 输出

**Type**: AFK

**Blocked by**: ISSUE-08

**What to build**

展示 mock 岗位能力需求图，并在 JSON 输出区展示完整 `role_capability_profile`。该任务只展示岗位能力结构，不做岗位推荐、匹配报告或训练建议。

**Acceptance criteria**

- [x] 页面展示岗位名称。
- [x] 页面展示岗位能力要求水平 `required_level`。
- [x] 页面展示能力权重 `weight`。
- [x] 页面展示能力要求摘要 `requirement_summary`。
- [x] JSON 输出区展示完整 `role_capability_profile`。
- [x] 页面不展示岗位推荐列表或匹配度报告。

## ISSUE-10：整理首版演示脚本与验收路径

**Type**: HITL

**Blocked by**: ISSUE-07, ISSUE-09

**What to build**

整理一份可给领导演示的脚本，覆盖从用户输入到能力雷达图、RAG 占位岗位能力图、两份 JSON 输出的完整路径。该任务需要人工确认演示话术是否符合团队和领导预期。

**Acceptance criteria**

- [x] 演示脚本包含默认用户说明。
- [x] 演示脚本包含简历/经历输入示例。
- [x] 演示脚本包含固定问答和自评问卷操作。
- [x] 演示脚本包含 RAG 占位解释。
- [x] 演示脚本明确说明真实 RAG 是后续模块。
- [x] 用户确认演示口径可以用于对内或对领导说明。历史确认口径：legacy `demo` 默认使用 mock fallback，真实 RAG 作为可手动开启的演示增强，不作为首版默认依赖。

## ISSUE-11：预留真实 RAG 接入技术调研任务

**Type**: HITL

**Blocked by**: ISSUE-08

**What to build**

调研并固定真实 RAG 接入路线，并形成单独技术选型记录。当前选型倾向是本地 embedding、本地向量库、DeepSeek 结构化抽取。该任务不属于首版 Demo 实现范围，不阻塞首版演示。

**Acceptance criteria**

- [x] 明确真实 RAG 不纳入首版 Demo。
- [x] 明确 embedding 本地部署，优先 `BAAI/bge-m3`。
- [x] 明确向量库本地免费，Chroma 优先，FAISS 备选。
- [x] 明确 LLM extractor 使用 DeepSeek。
- [x] 说明真实 RAG 接入后如何替换 mock role profile generator。
- [x] 完成独立 RAG spike 后确认是否替换 Demo mock generator。历史确认口径：当时不默认替换 legacy `demo` mock generator，保留实时 DeepSeek RAG 开关作为可选路径，失败时回退 mock。

## 推荐开发顺序

1. ISSUE-01：搭建独立 Demo 页面骨架
2. ISSUE-02：实现统一能力维度与 Demo 状态模型
3. ISSUE-03：实现简历/经历文本输入与模拟能力证据抽取
4. ISSUE-04：实现固定问答输入与局部能力证据输出
5. ISSUE-05：实现自评问卷输入与辅助能力证据
6. ISSUE-06：实现能力证据合并与用户能力画像生成
7. ISSUE-07：实现用户能力雷达图与能力明细展示
8. ISSUE-08：实现 JD 输入与 RAG 占位岗位能力需求图
9. ISSUE-09：实现岗位能力需求图展示与 JSON 输出
10. ISSUE-10：整理首版演示脚本与验收路径
11. ISSUE-11：预留真实 RAG 接入技术调研任务

## 自评科学性升级 Issues

本轮升级目标：把“投简历 + 48 题自评问卷 -> 能力雷达”的原型，升级为能向指导老师解释专业依据和解释边界的职业能力自评画像。主参考书采用《Scale Development: Theory and Applications》，辅助参考《Competence at Work》和 `agent/interview` 中的 STAR、BARS、结构化面试与偏差控制资料。

### ISSUE-SA-01：补充自评方法论与专业书依据

**Type**: AFK

**Blocked by**: None - can start immediately

**What to build**

补充方法论和本地 issue 记录，明确当前产品不是正式心理测评，而是职业能力自评与简历/经历证据辅助画像。恢复 `docs/capability-schema.md`，避免本目录 schema 引用断点。

**Acceptance criteria**

- [x] 本地 issue 文档记录本轮升级 issue 列表和顺序。
- [x] `methodology-learning-pack.md` 明确主参考书、辅助参考和使用边界。
- [x] 文档说明当前结果是初步能力画像，不是医学诊断、心理测评、录用判断。
- [x] 文档说明“自评分数”和“简历/行为证据”必须分开解释。
- [x] 恢复 `docs/capability-schema.md`。

### ISSUE-SA-02：建立 8 个能力维度的问卷蓝图

**Type**: AFK

**Blocked by**: ISSUE-SA-01

**What to build**

为 8 个 `capability_key` 建立问卷蓝图。每个能力维度拆成 3 个行为指标，每个行为指标 2 道题，保持 8 x 6 = 48 题结构。

**Acceptance criteria**

- [x] 8 个能力维度仍使用现有 key，不新增临时 key。
- [x] 每个能力维度有 3 个行为指标。
- [x] 每个行为指标有 2 道题。
- [x] 题目更接近行为频率、经历证据或可观察表现。
- [x] 每个维度最多 1 道反向题。

### ISSUE-SA-03：重写 48 题问卷为行为锚定版本

**Type**: AFK

**Blocked by**: ISSUE-SA-02

**What to build**

替换 Demo 中的 48 道问卷题，使题目更接近 BARS/行为锚定思路。选项仍保持 1-5，但页面文案从“同意程度”升级为“行为表现/证据强度”。

**Acceptance criteria**

- [x] 问卷仍覆盖 8 个能力维度和 48 题。
- [x] 每题只测一个明确行为指标。
- [x] 页面说明 1-5 的含义从主观同意调整为行为表现强度。
- [x] 题目不复制公开心理量表原题。
- [x] `node --check agent\capability-assessment\demo\app.js` 通过。

### ISSUE-SA-04：升级自评评分与可信度解释

**Type**: AFK

**Blocked by**: ISSUE-SA-03

**What to build**

调整自评证据生成逻辑。自评仍生成 `self_assessment` evidence，但分数解释强调“自评倾向”。高自评、低经历/问答证据时，不把高分直接解释为能力强，而是提示补充行为证据。

**Acceptance criteria**

- [x] `capability_profile` schema 保持兼容。
- [x] 自评来源的 `confidence` 不高于多来源一致证据。
- [x] 问卷答案高度集中时显示低可信度提示。
- [x] 高自评、低简历证据时，报告提示需要补充行为证据。
- [x] 低分文案避免人格化评价。

### ISSUE-SA-05：优化报告展示，把能力分和证据可信度分开

**Type**: AFK

**Blocked by**: ISSUE-SA-04

**What to build**

报告页继续展示能力雷达，但更清楚地区分能力倾向分、证据来源、可信度和缺失证据。雷达图描述为当前输入下的初步画像，不作为客观最终能力结论。

**Acceptance criteria**

- [x] 报告摘要明确当前画像基于简历文本、固定问答和问卷输入。
- [x] 每个能力明细展示 `score` 和 `confidence` 的不同含义。
- [x] 对主要来自自评的能力，显示证据支持不足提示。
- [x] 报告保留岗位差距和材料补充建议，不输出岗位推荐列表。
- [x] 页面空数据、部分数据、完整数据状态都不崩溃。

### ISSUE-SA-06：补充验证计划和演示话术

**Type**: HITL

**Blocked by**: ISSUE-SA-05

**What to build**

补充轻量验证方案和演示话术，用于回应“问卷是否有专业依据”。当前不要求完成正式信效度研究，但要说明后续如何用学生试填、题项理解、分布、内部一致性和老师审阅迭代。

**Acceptance criteria**

- [x] 文档列出 20-30 名学生预测试方案。
- [x] 文档列出每题理解难度、平均分、标准差、极端集中作答检查项。
- [x] 文档说明后续可做内部一致性和题项筛选。
- [x] 演示话术能解释为什么参考《Scale Development》。
- [x] 演示话术明确当前版本是原型阶段，尚未完成正式信效度验证。

### 推荐实施顺序

1. ISSUE-SA-01
2. ISSUE-SA-02
3. ISSUE-SA-03
4. ISSUE-SA-04
5. ISSUE-SA-05
6. ISSUE-SA-06

## 粒度检查问题

- 这些 issue 的粒度是否适合你一个人逐步开发？
- `ISSUE-03`、`ISSUE-04`、`ISSUE-05` 是否需要合并成一个“输入与评分”任务？
- `ISSUE-11` 是否要现在保留，还是等首版 Demo 完成后再单独写？
- `ISSUE-10` 的演示脚本是否需要单独做成文档任务？
