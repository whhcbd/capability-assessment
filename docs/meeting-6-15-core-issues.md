# 6.15 会议核心问题 Issues

本文根据 `docs/meeting-summary/6.15会议纪要.md` 的核心讨论内容 1-5 拆分本仓库后续 issue。当前环境没有外部 issue tracker 工具，先在仓库内维护可执行 issue。

## Issue MS-01: 用真实样例重跑能力评估主流程

Status: HITL pending, agent preparation done

Type: HITL

Blocked by: None - can start immediately

## What to build

围绕真实或高可信脱敏简历、真实 JD 和真实公司岗位，形成一套可复现的主流程样例包。样例应覆盖上传或粘贴简历、选择预置岗位或自定义 JD、生成岗位能力模型、选择问卷模式、生成个人报告的完整路径。

该 issue 的核心不是让 agent 代替人工验收，而是把真实样例、执行步骤、观察记录和问题回填格式准备好，供人工在真实环境中验收。

Agent deliverable: `docs/real-sample-acceptance-template.md`.

## Acceptance criteria

- [ ] 至少整理 3 组脱敏真实或高可信样例，覆盖产品、数据、运营等目标岗位。
- [ ] 每组样例记录简历来源授权状态、岗位来源、真实 JD 或脱敏 JD 摘要。
- [x] 每组样例都有按 `docs/real-sample-workflow.md` 执行的记录模板。
- [x] 明确标注 agent 不负责真实数据收集、真实 DeepSeek 链路验收或最终效果判断。
- [x] 明确禁止使用“姓名 XX / 岗位 XX / 公司 XX”作为主演示数据。

## Issue MS-02: 补齐岗位能力模型真实岗位调优闭环

Status: HITL pending, agent preparation done

Type: HITL

Blocked by: MS-01

## What to build

在现有 v2 `role_dimensions` 基础上，为产品经理、数据分析、电商运营等样板岗位建立真实样例调优闭环。每个岗位都应对 6 个岗位维度、权重、评估方法、问卷关注点、知识依据和提升方向做人工复核记录。

该 issue 不是重做 v2 schema，而是把“已能生成”推进到“可用真实岗位样例持续校准”。

Agent deliverable: `docs/role-model-calibration.md`.

## Acceptance criteria

- [ ] 每个样板岗位都保留一份 6 维岗位模型人工复核记录。
- [ ] 复核记录包含不合理维度、不合理权重、缺失能力领域和建议修改方向。
- [x] 岗位指南或 prompt 调整前后能追踪变更原因。
- [x] AI 岗位问卷题目能关联对应 `role_dimension_id` 的检查项被记录。
- [x] 对非样板 JD 的稳定性边界有明确说明。

## Issue MS-03: 明确主客观结合能力评价框架

Status: Done

Type: HITL

Blocked by: None - can start immediately

## What to build

把能力评价拆成结构化自评、简历证据、模型评价和人工评价四类来源，明确每类来源的输入、输出、权重口径、缺失时处理方式和前端展示方式。

当前系统已有简历、问卷和 LLM evidence，但人工评价、题目难度、能力点占比和评分解释仍缺少正式框架。本 issue 先形成产品与数据 contract，再决定后续是否实现人工录入 UI 或 Interview Agent 回写。

Deliverable: `docs/evaluation-framework.md`.

## Acceptance criteria

- [x] 文档定义结构化自评、简历证据、模型评价、人工评价四类来源。
- [x] 文档定义每类来源在综合分中的建议权重和缺失时重标化规则。
- [x] 文档说明高自评但缺少经历证据、低自评但证据不足等情况如何解释。
- [x] 文档定义人工评价第一版是否只预留字段，还是需要 UI 录入。
- [x] 文档定义 Interview Agent 的 `competencyId` 到 8 个 `capability_key` 的 mapping 责任边界。

## Issue MS-04: 强化报告重点差距与提升计划展示

Status: Done

Type: AFK

Blocked by: MS-03

## What to build

在现有能力明细和 4 周提升计划基础上，进一步突出用户最需要关注的关键差距。报告应优先展示 `权重 × 差距` 较高的岗位维度，并让用户一眼看出最重要问题、投入优先级和下一步行动。

当前系统已支持 LLM `report_content`、`**重点**` 加粗和 4 周提升计划。本 issue 聚焦前端信息层级和报告解释，而不是重新设计评分模型。

## Acceptance criteria

- [x] 报告页展示 Top 3 关键差距，并说明排序依据。
- [x] 能力明细中关键结论有清晰视觉重点，不只依赖大段正文。
- [x] 4 周提升计划按基础能力、工具训练、知识阅读、实践项目或等价结构组织。
- [x] 跳过问卷时报告页不生成个人差距，只展示岗位模型空态。
- [x] 前端只渲染安全转义后的 `**...**` 粗体，不直接渲染任意 HTML。

## Issue MS-05: 真实 DeepSeek 与 SWEBOK 链路验收准备

Status: HITL pending, checklist done

Type: HITL

Blocked by: MS-01, MS-02

## What to build

准备真实 DeepSeek、SWEBOK PDF、Chroma 索引和 AI 岗位问卷链路的人工验收清单。agent 可以维护清单、错误口径和运行说明，但不执行真实 key 验收、模型下载、私有 PDF 验收或最终质量判断。

Agent deliverable: `docs/deepseek-swebok-acceptance-checklist.md`.

## Acceptance criteria

- [x] 验收清单包含 `DEEPSEEK_API_KEY`、`rag-spike/private-data/swebok-v4.pdf`、Chroma 索引和 API 启动状态。
- [x] 验收清单包含产品经理、数据分析、电商运营三个预置岗位的测试路径。
- [x] 验收清单包含 AI 岗位问卷是否携带 `role_dimension_id`、是否能提交到同一 assessment session。
- [x] 验收清单包含缺 key、RAG 失败、Ability 失败时的错误展示检查项。
- [x] 清单明确真实验收由人工执行，agent 只负责代码、文档和轻量可运行性检查。

## Issue MS-06: 修复 AI 问卷 schema 测试夹具

Status: Done

Type: AFK

Blocked by: None - can start immediately

## What to build

修复当前 `tests/test_questionnaire_generation.py` 中 `generated_items()` helper 缺少返回值的问题，使 AI 问卷 schema 校验测试可以作为本地轻量验证口径。

该 issue 只覆盖不依赖真实 DeepSeek、不下载模型、不构建大索引的测试修复。

## Acceptance criteria

- [x] `generated_items()` 返回合法的问卷题目数组。
- [x] 删除或整理当前不可达的死代码。
- [x] 测试夹具覆盖合法 `capability_key` 和 `role_dimension_id`。
- [x] 本地轻量测试不触发真实 DeepSeek、HuggingFace 下载或 Chroma 大索引构建。
