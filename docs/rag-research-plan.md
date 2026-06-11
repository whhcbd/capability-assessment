# 能力评估智能体 RAG 调研与 Spike 计划

> 当前状态：本文档是 RAG spike 启动前的历史调研计划。当时目标是验证真实 RAG 能否替换 legacy `demo` 的 `mock_rag_placeholder`。当前 RAG 最小链路和本地 RAG API 已接入 `app/` 主流程；最新状态见 `rag-spike/README.md` 和 `docs/deepseek-rag-spike-report.md`。

## 1. 历史阶段结论

真实 RAG 当时不纳入首版 legacy Demo。该阶段的 legacy Demo 使用 `mock_rag_placeholder` 输出 `role_capability_profile`。

下一阶段目标是做独立 RAG spike，验证真实 RAG 能否替换当时的 mock role profile generator。

技术路线暂定为：

```text
Embedding: 本地部署，优先 BAAI/bge-m3
Vector store: 本地免费，Chroma 优先，FAISS 备选
LLM extractor: DeepSeek，允许付费调用
RAG framework: 先手写最小流程，不优先接大型 RAG 平台
```

## 2. 约束条件

必须满足：

- embedding 模型本地部署。
- embedding 不依赖付费云服务。
- 向量库本地运行。
- RAG 基础流程尽量免费。
- LLM 可以付费，计划使用 DeepSeek。
- 输出必须兼容现有 `role_capability_profile` schema。

暂不做：

- 不直接改现有 Demo 页面。
- 不接现有 `career` 后端。
- 不接登录、数据库或用户体系。
- 不做职位爬虫。
- 不做岗位推荐和匹配报告。
- 不优先集成 RAGFlow、Dify 这类完整平台。

## 3. RAG 在本项目中的任务定义

本项目的 RAG 不是通用知识库问答，而是岗位能力需求图生成。

目标链路：

```text
岗位名 / JD 文本
-> 检索岗位知识库、行业资料、职业能力资料
-> DeepSeek 根据检索上下文做结构化抽取
-> 输出 role_capability_profile
```

最终输出示例：

```json
{
  "role_id": "internet_product_intern",
  "role_name": "互联网产品经理实习生",
  "profile_version": "v1",
  "source_type": "rag_generated_role_profile",
  "rag_status": "generated",
  "source_refs": ["product-manager-intern-jd.md#1", "internet-role-capability-guide.md#3"],
  "requirements": {
    "communication_expression": {
      "required_level": 75,
      "weight": 0.2,
      "requirement_summary": "需要清晰表达产品思路、用户问题和方案取舍。"
    }
  }
}
```

## 4. 候选技术

### 4.1 Embedding 模型

首选：

- `BAAI/bge-m3`

原因：

- 支持中英文和多语言。
- 适合中文 JD、中文行业资料和中英文混合资料。
- 可以本地通过 `sentence-transformers` 或相关推理方式运行。

备选：

- 体积更小的 BGE 中文或多语言模型。

使用备选的触发条件：

- 本机跑 `bge-m3` 太慢。
- 显存/内存不够。
- 安装依赖或模型下载成本过高。

### 4.2 Vector Store

首选：

- Chroma

原因：

- 本地运行简单。
- 开发体验更接近“向量数据库”。
- 适合 spike 阶段快速验证。

备选：

- FAISS

原因：

- 本地轻量、免费、成熟。
- 更底层，后续可控性强。

首版建议：

```text
先用 Chroma；如果 Chroma 环境安装或持久化有问题，再换 FAISS。
```

### 4.3 LLM Extractor

计划使用：

- DeepSeek

职责：

- 读取检索到的 chunks。
- 按统一 8 个 capability keys 抽取岗位能力要求。
- 输出严格 JSON。

对 DeepSeek 的要求：

- 能按提示词稳定输出 JSON。
- 能理解中文 JD 和岗位能力资料。
- 能把自然语言岗位要求映射到固定能力 key。
- 能生成 `required_level`、`weight`、`requirement_summary`。

接入方式：

- 使用 DeepSeek OpenAI-compatible API。
- JSON 抽取请求使用 JSON Output 模式。
- prompt 中必须包含 `json` 字样，并给出目标 JSON 示例。
- 若 JSON 解析失败，先做一次重试；后续再补 schema validation 和 JSON repair。

## 5. 最小 Spike 范围

建议新建独立目录：

```text
agent/capability-assessment/rag-spike/
```

建议结构：

```text
rag-spike/
  README.md
  data/
    product-manager-intern-jd.md
    data-analyst-intern-jd.md
    internet-role-capability-guide.md
    capability-schema.md
  scripts/
    build_index.py
    retrieve.py
    extract_role_profile.py
  outputs/
    product-manager-intern-role-profile.json
```

首版 spike 只验证：

1. 能读取本地 Markdown 资料。
2. 能 chunk 文档。
3. 能用本地 embedding 生成向量。
4. 能写入本地 Chroma 或 FAISS。
5. 输入岗位名/JD 后能检索 top_k chunks。
6. 能把 chunks 交给 DeepSeek。
7. DeepSeek 能输出 `role_capability_profile` JSON。

## 6. 输入资料准备

最小资料集：

### 6.1 产品经理实习生 JD

内容应覆盖：

- 用户需求分析。
- 竞品研究。
- 产品原型设计。
- 数据指标跟踪。
- 与研发、设计、运营协作。

### 6.2 数据分析实习生 JD

内容应覆盖：

- SQL / Excel / Python。
- 数据清洗。
- 指标分析。
- 可视化。
- 业务问题拆解。

### 6.3 互联网岗位能力说明

内容应覆盖 8 个能力维度：

- `communication_expression`
- `logical_analysis`
- `learning_adaptability`
- `execution_ownership`
- `collaboration_leadership`
- `self_awareness_motivation`
- `data_digital_literacy`
- `business_industry_understanding`

### 6.4 能力维度 Schema

可从 `capability-schema.md` 摘取 8 个 key 和中文定义。

## 7. DeepSeek 抽取提示词要求

提示词必须强调：

- 只输出 JSON。
- 只能使用统一 capability keys。
- 不输出岗位推荐。
- 不输出匹配报告。
- 不输出训练建议。
- `required_level` 范围为 `0-100`。
- `weight` 范围为 `0.00-1.00`。
- `weight` 总和尽量接近 `1.00`。
- 每个 `requirement_summary` 必须来自 JD 或检索资料依据。

抽取任务描述：

```text
你是职业能力模型抽取器。请根据岗位 JD 和检索资料，将岗位要求映射到固定 8 个能力维度，输出 role_capability_profile JSON。
```

## 8. 验收标准

Spike 完成标准：

- [ ] 可以在本地生成 embedding。
- [ ] 可以在本地构建向量索引。
- [ ] 可以检索到与岗位相关的 chunks。
- [ ] 可以调用 DeepSeek 完成结构化抽取。
- [ ] 输出 JSON 能通过人工检查。
- [ ] 输出 JSON 包含统一 8 个 capability keys 中的相关能力。
- [ ] 输出 JSON 不包含岗位推荐、匹配度报告或训练建议。
- [ ] 输出 JSON 可以替换 Demo 中的 `mock_rag_placeholder`。

## 9. 风险与处理

### 9.1 本地 embedding 太慢

处理：

- 降级到更小的 BGE 模型。
- 减少 chunk 数量。
- 先只索引 3-5 个 Markdown 文件。

### 9.2 DeepSeek 输出 JSON 不稳定

处理：

- 加强 prompt 约束。
- 增加 JSON 修复/校验步骤。
- 失败时重试一次。
- 后续使用 schema validation。

### 9.3 检索结果不相关

处理：

- 调整 chunk size。
- 增加岗位关键词。
- 在 query 中加入 8 个 capability keys。
- 后续考虑 rerank。

### 9.4 RAG 方案接入 Demo 太重

处理：

- 保持 RAG spike 独立。
- 只有当 `role_capability_profile` 输出稳定后，再替换 Demo 中的 mock generator。

## 10. 下一步任务拆分

建议新增后续任务：

### RAG-01：准备 RAG spike 目录与样例资料

- 新建 `rag-spike/`。
- 写入 3-4 个 Markdown 样例资料。
- 复制或摘录 capability schema。

### RAG-02：验证本地 embedding

- 安装并运行本地 embedding 模型。
- 用样例 JD 生成向量。
- 记录模型大小、运行速度、依赖问题。

### RAG-03：构建本地向量索引

- 使用 Chroma 优先。
- 写入 chunks。
- 能按 query 检索 top_k。

### RAG-04：调用 DeepSeek 抽取岗位能力图

- 读取检索 chunks。
- 调用 DeepSeek。
- 输出 `role_capability_profile` JSON。

### RAG-05：评估并决定是否替换 Demo mock generator

- 对比 mock 输出和 RAG 输出。
- 判断是否稳定。
- 决定是否接入现有 Demo。
