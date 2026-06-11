# 能力评估智能体独立 Demo 规划

> 当前状态：本文档记录首版 legacy 静态 `demo/` 的规划，包含固定问答和 mock/RAG placeholder 设计。当前主演示入口已迁移到 `agent/capability-assessment/app/`，流程为简历/心仪职业 -> 48 题问卷 -> 真实 Ability API + RAG API -> 报告。本文保留作历史需求参考。

## 1. Demo 目标

Demo 用来向团队和领导展示能力评估智能体的核心价值：学生输入个人经历并完成简短问答后，系统生成个人职业能力雷达图和结构化能力画像。

首版 Demo 不追求完整系统集成，而是验证以下闭环：

```text
学生经历输入
-> 固定问题问答
-> 自评问卷
-> LLM rubric 评分
-> 能力雷达图
-> JD/RAG placeholder 生成岗位能力需求图
-> capability_profile JSON
```

## 2. 推荐形态

首版做成独立页面或独立小应用，不接入现有 `frontend` / `backend`。

建议页面信息架构：

1. 顶部：能力评估智能体名称、默认 demo 用户。
2. 左侧输入区：经历文本、固定问答、自评问卷。
3. 岗位输入区：粘贴 JD 或选择示例互联网岗位。
4. 右侧结果区：用户雷达图、岗位能力需求图、能力明细、证据摘要。
5. 底部/侧栏：标准化 `capability_profile` 和 `role_capability_profile` JSON。

## 3. Demo 用户

```json
{
  "user_id": "demo_user_001",
  "display_name": "Demo Student",
  "education_stage": "undergraduate_or_graduate",
  "target_direction": "internet_company_general"
}
```

## 4. 输入设计

### 4.1 简历/经历文本

使用多行文本框，不做文件上传。

占位提示：

```text
请粘贴你的简历、项目经历、实习经历、社团经历、课程项目或自我介绍。
```

### 4.2 固定问答

首版使用固定 6 题：

1. 请介绍一个你主导或深度参与的项目，并说明你具体负责什么。
2. 遇到一个复杂问题时，你通常如何拆解和推进？
3. 请描述一次你需要和他人协作但意见不一致的经历。
4. 请讲一个你快速学习新领域、新工具或新方法的例子。
5. 你目前选择互联网方向的主要原因是什么？
6. 请举例说明你如何使用数据或事实支持自己的判断。

每题回答后，LLM 按固定 rubric 输出局部能力证据。

### 4.3 自评问卷

每个能力维度首版设置 2 道题即可，使用 1-5 分。

自评只作为辅助证据，不直接等同最终能力分。

### 4.4 岗位/JD 输入

岗位能力需求图由能力评估智能体负责生成。首版支持两种输入：

- 粘贴一个具体 JD。
- 选择一个内置示例岗位，例如“互联网产品经理实习生”。

系统通过 RAG placeholder 或演示知识库，将岗位资料映射到统一 8 个能力维度，并生成每项能力的要求水平和权重。首版不实现真实 RAG。

### 4.5 RAG 占位

首版 RAG 只做占位：

- 接收 JD 或示例岗位输入。
- 展示“RAG 能力需求分析占位”状态。
- 使用内置 mock `role_capability_profile` 输出岗位能力需求图。
- 不接向量数据库、embedding、检索排序或 GitHub RAG 仓库。

后续真实 RAG 接入时，只替换 mock 岗位能力生成逻辑。

## 5. LLM Rubric

LLM 评分必须遵守：

- 分数范围：`0-100`
- 置信度范围：`0.00-1.00`
- 输出必须是 JSON。
- 每个能力证据必须包含 `capability_key`、`score`、`confidence`、`evidence_summary`。
- 不输出岗位推荐、岗位匹配报告、训练建议。

单条输出示例：

```json
{
  "source_type": "dialogue_answer",
  "source_id": "question_01",
  "capability_evidence": [
    {
      "capability_key": "execution_ownership",
      "score": 74,
      "confidence": 0.7,
      "evidence_summary": "用户能说明项目目标、个人职责和推进结果。"
    }
  ]
}
```

## 6. 结果展示

### 6.1 雷达图

展示 8 个维度：

- 沟通表达能力
- 逻辑分析能力
- 学习适应能力
- 执行推进能力
- 协作与领导力
- 自我认知与职业动机
- 数据与数字化思维
- 商业与行业理解

### 6.2 能力明细

每项展示：

- 中文名
- 分数
- 置信度
- 证据来源
- 证据摘要

### 6.3 JSON 输出

展示完整 `capability_profile` 和 `role_capability_profile`，用于说明它可以被其他智能体读取。

### 6.4 岗位能力需求图

展示某个岗位需要的能力结构：

- 岗位名称
- 能力要求水平
- 能力权重
- RAG 占位依据摘要
- 统一 capability key

## 7. 演示脚本

建议演示顺序：

1. 打开能力评估智能体页面。
2. 展示默认用户和能力维度说明。
3. 粘贴一段学生经历文本。
4. 回答 2-3 个固定问题即可，完整 6 题可作为完整版演示。
5. 快速填写自评问卷。
6. 点击生成能力画像。
7. 展示雷达图。
8. 粘贴或选择一个互联网方向 JD。
9. 展示 RAG 占位区和 mock 岗位能力需求图。
10. 展示某个能力分数背后的证据摘要和置信度。
11. 展示 `capability_profile` 和 `role_capability_profile` JSON。
12. 说明职位推荐智能体负责爬取职位，并读取这两张图做推荐；简历助手、面试陪练也可以读取用户能力画像。

## 8. 后续集成方向

后续接入现有信息系统时：

- 从学生档案读取 `user_id` 和基础信息。
- 从简历助手读取简历文本或结构化经历。
- 从面试陪练读取面试表现证据。
- 将能力画像写回学生 profile。
- 从职位推荐智能体接收爬取到的 JD 或岗位信息。
- 首版使用 mock/RAG placeholder 生成 `role_capability_profile`。
- 后续接入真实 RAG 后，生成 `role_capability_profile` 供职位推荐智能体做岗位匹配。
