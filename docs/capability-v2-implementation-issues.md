# Capability Assessment v2 Implementation Issues

本文件是根据 6.15 会议纪要和岗位定制能力评估 v2 计划拆出的本地 implementation issues。当前环境没有可用的外部 issue tracker 工具，因此先在仓库内维护可执行 issue。

## Issue 1: 岗位能力模型 v2 生成与兼容

Type: AFK

Blocked by: None - can start immediately

What to build:

提交简历和目标岗位后，现有 `/assessments/role-profile` 返回 v2 岗位能力模型。模型包含固定 6 个岗位专属维度，每个维度有要求分、权重、评估方法、问卷关注点、知识依据、提升方向，并映射到现有 8 个 `capability_key`。旧 `requirements` 结构继续保留用于兼容。

Acceptance criteria:

- [ ] v2 `role_profile` 固定包含 6 个 `role_dimensions`。
- [ ] 每个维度都有至少一个合法 `mapped_capability_keys`。
- [ ] 权重、要求分和旧 `requirements` 派生结构合法。
- [ ] 旧 v1 `requirements` 会话仍可被前端读取。

## Issue 2: AI 岗位问卷携带岗位维度

Type: AFK

Blocked by: Issue 1

What to build:

AI 岗位问卷继续使用 `/questionnaires/role-generated`，但题目需要携带 `role_dimension_id`，并保留兼容用 `capability_key`。10 题和 48 题通用问卷保持现状。

Acceptance criteria:

- [ ] AI 岗位问卷题目包含 `role_dimension_id`。
- [ ] AI 岗位问卷题目仍包含合法 `capability_key`。
- [ ] 题目数量仍为 15，失败时明确报错，不 mock。

## Issue 3: 前端岗位 6 维雷达与报告行

Type: AFK

Blocked by: Issue 1, Issue 2

What to build:

个人界面主展示改为岗位 6 维。无论用户选择 10 题、48 题还是 AI 岗位问卷，报告都按岗位维度展示。通用 8 维证据通过映射汇总到岗位维度。跳过问卷时只显示岗位模型空态。

Acceptance criteria:

- [ ] 雷达图支持动态维度，不再写死 8 维。
- [ ] 报告行来自 `role_dimensions`。
- [ ] 跳过问卷只显示岗位要求和权重，不生成个人差距。

## Issue 4: 关键差距、评价来源和 4 周提升计划

Type: AFK

Blocked by: Issue 3

What to build:

报告突出 `权重 × 差距` Top 3 关键差距。综合分使用模型/证据评价 60、自评 25、人工评价 15 的口径；人工评价缺失时按已有来源重标化并标注未含人工评价。新增 4 周提升计划，按基础能力、工具训练、知识阅读、实践项目组织。

Acceptance criteria:

- [ ] 报告展示关键差距 Top 3。
- [ ] 综合分说明包含“未含人工评价”。
- [ ] 4 周提升计划可在完成问卷后展示，跳过问卷时为空态。

## Issue 5: 真实样例、岗位指南和文档更新

Type: AFK

Blocked by: Issue 1

What to build:

新增电商运营实习生预置 JD。新增本地岗位指南和匿名真实样例模板，更新 README、ARCHITECTURE、DEVELOPMENT_ISSUES 和 capability schema，说明 v2 岗位维度、8 维映射和真实数据要求。

Acceptance criteria:

- [ ] 前端预置岗位包含电商运营实习生。
- [ ] 本地岗位指南可被 RAG 索引脚本读取。
- [ ] 文档明确不提交真实简历、私有资料和占位演示数据。
