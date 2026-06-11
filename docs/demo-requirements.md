# 能力评估智能体首版 Demo 需求

> 当前状态：本文档是首版 legacy 静态 `demo/` 的历史需求，包含 mock/RAG placeholder 口径。当前主演示入口是 `agent/capability-assessment/app/`，完整报告默认依赖真实 Ability API、真实 RAG API 和本地 `DEEPSEEK_API_KEY`，不静默生成 mock 报告。

## 1. 首版目标

首版 Demo 目标是让领导和团队直观看到能力评估智能体的产品闭环：

```text
用户经历输入
-> 固定能力问答
-> 自评问卷
-> 生成用户能力雷达图
-> 展示岗位能力需求图占位
-> 输出两份 JSON
```

首版重点不是实现完整 RAG，而是把 RAG 的产品位置、输入输出和后续接入点预留清楚。

## 2. 页面形态

首版做一个独立页面或独立小应用，不接入现有 `career` 前端和后端。

页面建议采用左右两栏：

### 2.1 左侧：输入与评估流程

包含：

- Demo 用户信息：`demo_user_001`
- 简历/经历文本输入框
- 固定能力问答区
- 自评问卷区
- 岗位/JD 输入区
- “生成能力画像”按钮

### 2.2 右侧：结果展示

包含：

- 用户能力雷达图
- 用户能力明细
- 岗位能力需求图占位区
- JSON 输出区

## 3. 用户输入

### 3.1 简历/经历文本

使用多行文本框。

用户输入：

```text
请粘贴你的简历、项目经历、实习经历、社团经历、课程项目或自我介绍。
```

首版限制：

- 不做 PDF/Word 上传。
- 不做文件解析。
- 不做多份简历管理。

### 3.2 固定能力问答

使用固定 6 题：

1. 请介绍一个你主导或深度参与的项目，并说明你具体负责什么。
2. 遇到一个复杂问题时，你通常如何拆解和推进？
3. 请描述一次你需要和他人协作但意见不一致的经历。
4. 请讲一个你快速学习新领域、新工具或新方法的例子。
5. 你目前选择互联网方向的主要原因是什么？
6. 请举例说明你如何使用数据或事实支持自己的判断。

首版可以允许只填写 2-3 题后生成演示结果。

### 3.3 自评问卷

每个能力维度 1-2 道题，使用 1-5 分。

首版自评只用于补充展示，不直接作为唯一评分依据。

### 3.4 岗位/JD 输入

输入方式：

- 粘贴 JD 文本。
- 或选择内置示例岗位：`互联网产品经理实习生`。

首版不做真实 RAG 检索。系统只展示一个 RAG 占位过程和 mock `role_capability_profile`。

## 4. RAG 占位设计

RAG 是后续独立实现项，首版只做占位。

### 4.1 首版要展示什么

当用户粘贴 JD 或选择示例岗位后，页面展示：

```text
RAG 能力需求分析占位
1. 已接收岗位/JD 输入
2. 后续将检索岗位知识库、行业资料和职业能力资料
3. 当前 Demo 使用内置示例能力需求图
```

### 4.2 首版输出什么

首版直接返回 mock `role_capability_profile`，例如：

```json
{
  "role_id": "internet_product_intern",
  "role_name": "互联网产品经理实习生",
  "profile_version": "v1",
  "source_type": "mock_rag_placeholder",
  "rag_status": "placeholder",
  "source_refs": ["demo_jd_text", "mock_industry_knowledge"],
  "requirements": {
    "communication_expression": {
      "required_level": 75,
      "weight": 0.2,
      "requirement_summary": "需要清晰表达产品思路、用户问题和方案取舍。"
    },
    "logical_analysis": {
      "required_level": 80,
      "weight": 0.25,
      "requirement_summary": "需要拆解业务问题、用户路径和产品指标。"
    },
    "data_digital_literacy": {
      "required_level": 70,
      "weight": 0.2,
      "requirement_summary": "需要理解基础数据指标，并能用数据支持产品判断。"
    }
  }
}
```

### 4.3 首版不做什么

- 不接向量数据库。
- 不接真实知识库。
- 不实现 embedding。
- 不实现检索排序。
- 不从 GitHub 集成 RAG 仓库。
- 不做多文档上传。
- 不承诺岗位能力图完全由真实资料生成。

### 4.4 后续 RAG 实现入口

后续真实 RAG 模块只需要替换：

```text
JD / role input
-> mock role profile generator
```

替换为：

```text
JD / role input
-> retriever
-> reranker or context selector
-> LLM role capability extractor
-> role_capability_profile
```

## 5. LLM 输出 JSON

首版能力评估 LLM 输出局部证据 JSON：

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

约束：

- `capability_key` 必须来自统一 8 个 key。
- `score` 范围为 `0-100`。
- `confidence` 范围为 `0.00-1.00`。
- `evidence_summary` 必须说明依据。
- 不输出岗位推荐、匹配报告和训练建议。

首版如果暂时没有接 LLM，也可以使用 mock JSON，但页面文案必须标注：

```text
当前为 Demo 模拟评分，后续接入 LLM rubric 评分。
```

## 6. 雷达图生成

雷达图使用 8 个统一能力维度：

- `communication_expression`
- `logical_analysis`
- `learning_adaptability`
- `execution_ownership`
- `collaboration_leadership`
- `self_awareness_motivation`
- `data_digital_literacy`
- `business_industry_understanding`

首版生成规则：

- 汇总简历文本、问答、自评三类来源的能力证据。
- 同一能力有多条证据时，取加权平均或简单平均。
- 无证据能力显示默认低置信度，不强行给高分。
- 雷达图展示 `score`。
- 能力明细展示 `score`、`confidence`、`evidence_sources`、`evidence_summary`。

首版可以先用 deterministic mock 合并规则，后续再优化评分算法。

## 7. 明确不做

首版 Demo 明确不做：

- 不接现有 `career` 登录和权限。
- 不接现有后端 API。
- 不做 PDF/Word 上传解析。
- 不做真实 RAG。
- 不做 GitHub RAG 仓库集成。
- 不做职位爬虫。
- 不做岗位推荐列表。
- 不做匹配度报告。
- 不做训练计划和课程推荐。
- 不做简历生成或面试陪练。

## 8. 首版验收

Demo 达到以下标准即可：

- 页面能展示完整输入流程。
- 点击生成后能展示用户能力雷达图。
- 能展示每项能力分数、证据和置信度。
- 能展示 RAG 占位区和 mock 岗位能力需求图。
- 能展示 `capability_profile` JSON。
- 能展示 `role_capability_profile` JSON。
- 领导能理解：真实 RAG 是后续模块，当前 demo 已预留接入点。
