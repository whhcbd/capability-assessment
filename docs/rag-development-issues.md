# 能力评估智能体真实 RAG 开发任务拆分

> 当前状态：本文档记录 RAG spike 阶段任务拆分。当前本地 RAG API 已接入 `app/` 主流程；剩余重点是扩展岗位样例、改进检索稳定性、补充失败原因和成本日志。

本文档基于 `rag-research-plan.md` 拆分真实 RAG spike 任务。当前目标不是替换首版 Demo，而是独立验证：

```text
本地 embedding
-> 本地向量库
-> DeepSeek 结构化抽取
-> role_capability_profile JSON
```

## RAG-01：准备 RAG spike 目录与样例资料

**Type**: AFK

**Blocked by**: None - can start immediately

**User stories covered**:

- 作为能力评估智能体开发者，我需要一组可重复使用的岗位资料，验证岗位能力需求图生成是否稳定。

**What to build**

新建独立 `rag-spike/` 工作区，准备最小 Markdown 资料集，不接 Demo 页面，不接现有后端。

**Acceptance criteria**

- [x] 新建 `agent/capability-assessment/rag-spike/`。
- [x] 新建 `data/`，包含产品经理实习生 JD、数据分析实习生 JD、互联网岗位能力说明。
- [x] 新建或复制能力维度 schema 资料。
- [x] 新建 `README.md` 说明 spike 目标、运行顺序和不做范围。
- [x] 明确当前 spike 不接 Demo、不做职位推荐、不做匹配报告。

## RAG-02：验证本地 embedding 模型

**Type**: AFK

**Blocked by**: RAG-01

**User stories covered**:

- 作为能力评估智能体开发者，我需要确认 embedding 可以本地运行，不依赖付费云 embedding。

**What to build**

用本地 embedding 模型对样例资料生成向量。优先验证 `BAAI/bge-m3`；如果本机运行太慢，记录降级到更小 BGE 模型的备选方案。

**Acceptance criteria**

- [x] 能在本地加载 embedding 模型。
- [x] 能对中文 JD 文本生成 embedding。
- [x] 记录模型名称、运行方式、依赖和本机运行情况。
- [x] 记录是否需要模型降级。
- [x] 不调用付费 embedding API。

## RAG-03：构建本地向量索引与检索

**Type**: AFK

**Blocked by**: RAG-02

**User stories covered**:

- 作为能力评估智能体开发者，我需要从本地岗位资料中检索和输入 JD 相关的资料片段。

**What to build**

将样例 Markdown 切分成 chunks，写入本地向量库，并实现 top_k 检索。Chroma 优先，FAISS 备选。

**Acceptance criteria**

- [x] 能读取 `data/` 下的 Markdown 资料。
- [x] 能按稳定规则切分 chunks。
- [x] 能写入本地 Chroma 或 FAISS 索引。
- [x] 输入岗位名或 JD 后能检索 top_k chunks。
- [x] 检索结果包含来源文件名和 chunk 文本。
- [x] 不接远程向量数据库。

## RAG-04：调用 DeepSeek 抽取岗位能力需求图

**Type**: AFK

**Blocked by**: RAG-03

**User stories covered**:

- 作为能力评估智能体开发者，我需要用 DeepSeek 将检索结果转换成标准 `role_capability_profile`。

**What to build**

将 top_k chunks 与岗位输入一起提交给 DeepSeek，要求模型只输出 JSON，并映射到统一 8 个 capability keys。

**Acceptance criteria**

- [x] 使用 DeepSeek API 作为 LLM extractor。
- [x] 请求使用 JSON Output 或等价的 JSON-only 约束。
- [x] prompt 明确禁止岗位推荐、匹配报告和训练建议。
- [x] 输出包含 `role_id`、`role_name`、`profile_version`、`source_type`、`rag_status`、`source_refs`、`requirements`。
- [x] `requirements` 使用统一 capability keys。
- [x] 每个能力要求包含 `required_level`、`weight`、`requirement_summary`。
- [x] 解析失败时至少有一次重试或明确错误提示。

## RAG-05：校验输出并生成样例结果

**Type**: AFK

**Blocked by**: RAG-04

**User stories covered**:

- 作为能力评估智能体开发者，我需要判断 RAG 输出是否足够稳定，能否替换 Demo 中的 mock 岗位能力图。

**What to build**

对产品经理实习生和数据分析实习生两个样例跑完整链路，保存输出 JSON，并人工检查字段、能力映射和越界内容。

**Acceptance criteria**

- [x] 输出至少 2 份 `role_capability_profile` JSON。
- [x] JSON 可以被解析。
- [x] JSON 不包含岗位推荐、匹配度报告、训练建议。
- [x] JSON 中的 `source_refs` 能追溯到检索资料。
- [x] 记录输出质量问题和需要改进的 prompt。
- [x] 给出是否可以替换 Demo mock generator 的初步结论。

## RAG-06：整理 DeepSeek RAG spike 报告

**Type**: HITL

**Blocked by**: RAG-05

**User stories covered**:

- 作为项目成员，我需要向团队说明真实 RAG 的当前可行性、成本、风险和下一步接入方式。

**What to build**

整理 spike 报告，说明本地 embedding、本地向量库、DeepSeek 抽取的结果、风险和推荐后续路线。

**Acceptance criteria**

- [x] 报告说明最终技术路线。
- [x] 报告说明 DeepSeek API 使用方式和 JSON 输出策略。
- [x] 报告说明本地 embedding 运行情况。
- [x] 报告说明 Chroma/FAISS 选择结果。
- [x] 报告列出真实 RAG 替换 Demo mock generator 的步骤。
- [x] 用户确认是否进入 Demo 集成阶段。

## 推荐开发顺序

1. RAG-01：准备 RAG spike 目录与样例资料
2. RAG-02：验证本地 embedding 模型
3. RAG-03：构建本地向量索引与检索
4. RAG-04：调用 DeepSeek 抽取岗位能力需求图
5. RAG-05：校验输出并生成样例结果
6. RAG-06：整理 DeepSeek RAG spike 报告

## 粒度检查问题

- `RAG-02` 和 `RAG-03` 是否需要合并成一个本地检索任务？
- `RAG-04` 是否需要先做纯 mock DeepSeek response，再接真实 API？
- `RAG-06` 是否等 spike 跑通后再写，还是先建立报告模板？
