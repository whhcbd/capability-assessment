# DeepSeek RAG Spike 报告

## 当前状态说明

本文是 RAG spike 阶段报告，部分“替换 Demo mock generator”的表述记录的是当时从 legacy `demo/` 迁移的方案。当前主入口已经切换到 `agent/capability-assessment/app/`，完整报告默认调用本地 RAG API 和真实 DeepSeek，不再静默回退 mock 岗位雷达。legacy `demo/` 的 mock fallback 仅保留作历史参考。

## 1. 结论

本次 spike 已跑通能力评估智能体的真实 RAG 最小链路：

```text
岗位名 / JD 文本
-> 本地 BAAI/bge-m3 embedding
-> 本地 Chroma 向量索引检索
-> DeepSeek JSON 结构化抽取
-> role_capability_profile JSON
-> RAG-05 输出校验
```

当前结论：

- 技术上可行：两份样例岗位均已生成可解析的 `role_capability_profile`。
- 数据结构可用：输出字段、capability keys、权重、source_refs 和越界内容检查均通过。
- 样例规模仍小，尚未验证成本、稳定性、API key 管理和更多岗位覆盖，因此不能描述为生产级岗位能力模型。
- 用户已确认进入集成阶段；当前采用本地 RAG API 方案，`app/` 主流程默认调用真实 RAG，API 失败时显示错误。

## 2. 最终技术路线

| Layer | 选择 | 当前结果 |
| --- | --- | --- |
| Embedding | `BAAI/bge-m3` 本地运行 | 已加载并生成 1024 维 embedding，不调用付费 embedding API。 |
| Vector store | Chroma 本地持久化 | 已构建本地 collection `capability_role_knowledge`。 |
| Retrieval | 手写 top_k 检索脚本 | 可按岗位名 / JD 检索相关 chunks，结果包含 source file 和 chunk text。 |
| LLM extractor | DeepSeek OpenAI-compatible API | 已生成产品经理实习生、数据分析实习生两份岗位能力需求图。 |
| Validation | 本地校验脚本 | 已检查 JSON 结构、能力 key、数值范围、source_refs 和越界内容。 |

暂不采用完整 RAG 平台。当前手写最小流程更适合 spike，因为它能直接验证本项目真正关心的目标：把岗位资料转换成标准 `role_capability_profile`。

## 3. 本地 Embedding 运行情况

验证产物：`outputs/embedding-check.json`。

运行结果：

- 模型：`BAAI/bge-m3`
- 输入样例：`data/product-manager-intern-jd.md`
- 输入字符数：775
- embedding 维度：1024
- 模型加载耗时：87.305 秒
- 单次样例编码耗时：0.828 秒
- `uses_paid_embedding_api`: `false`

判断：

- `bge-m3` 在本机可运行，RAG-02 目标成立。
- 首次加载耗时较长，但后续编码耗时可接受。
- 当前暂不需要降级模型；如果 `app/` 演示要求更稳定的实时体验，应考虑后台预热模型、缓存 embeddings，或评估更小 BGE 模型。

## 4. Chroma / FAISS 选择结果

验证产物：`outputs/index-build-report.json`。

本次选择 Chroma：

- collection：`capability_role_knowledge`
- source files：
  - `capability-schema.md`
  - `data-analyst-intern-jd.md`
  - `internet-role-capability-guide.md`
  - `product-manager-intern-jd.md`
- chunk 数量：9
- embedding 维度：1024
- 构建耗时：6.001 秒
- `uses_remote_vector_db`: `false`

判断：

- Chroma 满足当前 spike：本地持久化、能写入 chunks、能 top_k 检索。
- FAISS 暂不需要启用，保留为备选。
- 后续如果部署环境希望更轻量、依赖更少，或 Chroma 持久化目录管理复杂，再评估 FAISS。

## 5. DeepSeek API 使用方式与 JSON 输出策略

实现脚本：`scripts/extract_role_profile.py`。

当前使用方式：

- API 形态：DeepSeek OpenAI-compatible `/chat/completions`
- 模型：`deepseek-chat`
- 配置来源：`rag-spike/.env` 或环境变量
- 请求参数：
  - `temperature: 0.1`
  - `response_format: {"type": "json_object"}`
  - system message 约束只输出合法 JSON
- prompt 约束：
  - 只输出 JSON，不输出 Markdown，不解释
  - 只能使用统一 8 个 capability keys
  - `source_type` 固定为 `rag_generated_role_profile`
  - `rag_status` 固定为 `generated`
  - `required_level` 范围 `0-100`
  - `weight` 范围 `0.00-1.00`，总和尽量接近 `1.00`
  - `source_refs` 必须引用 source chunk，格式为 `file.md#chunk_index`
  - 禁止岗位推荐、匹配度报告、训练建议、课程推荐、简历生成内容

容错策略：

- JSON 解析失败时尝试从响应文本中截取 JSON 对象。
- 抽取结果会经过本地结构校验。
- CLI 支持 `--retries`，默认至少可以重试一次。

改进建议：

- 增加 JSON Schema 或 Pydantic schema validation。
- `source_refs` 已升级为 `file#chunk_index`；后续可继续增加 UI 展示和更细的证据解释。
- 增加 context selector 或 reranker，减少相邻岗位资料混入 prompt。
- 为 DeepSeek 调用补充成本日志和失败原因分类。

## 6. 样例输出结果

RAG-05 校验产物：`outputs/rag05-validation-report.json`。

校验结果：

- `accepted`: `true`
- 样例数量：2
- 两份 JSON 均可解析
- `validation_errors`: 空
- `traceability_errors`: 空
- 未发现岗位推荐、匹配度报告、训练建议、课程推荐、简历生成、面试陪练等越界内容

样例文件：

- `outputs/role-capability-profile-product-manager.json`
- `outputs/role-capability-profile-data-analyst.json`

产品经理实习生输出概览：

- role_id：`internet_product_intern`
- requirements：
  - `logical_analysis`
  - `communication_expression`
  - `execution_ownership`
  - `data_digital_literacy`
  - `business_industry_understanding`
- weight 总和：1.0
- source_refs：
  - `product-manager-intern-jd.md#1`
  - `internet-role-capability-guide.md#3`

数据分析实习生输出概览：

- role_id：`data_analyst_intern`
- requirements：
  - `data_digital_literacy`
  - `logical_analysis`
  - `communication_expression`
  - `execution_ownership`
  - `learning_adaptability`
  - `business_industry_understanding`
- weight 总和：1.0
- source_refs：
  - `data-analyst-intern-jd.md#1`
  - `internet-role-capability-guide.md#2`

## 7. 成本与运行风险

### 成本

- Embedding：本地运行，不调用付费 embedding API。
- Vector store：本地 Chroma，不使用远程向量数据库。
- DeepSeek：会产生 LLM API 调用成本，具体成本取决于 top_k、chunk 长度、岗位数量和重试次数。

### 主要风险

- 样例数量少：当前只有产品经理和数据分析两个岗位方向，不能代表全部岗位。
- 检索混入风险：产品经理 query 中也检索到了数据分析 JD，说明相近领域资料可能混入上下文。
- 首次加载慢：`bge-m3` 首次加载约 87 秒，演示前需要预热或缓存。
- API 失败风险：DeepSeek 网络、余额、限流、密钥配置失败会导致当前 `app` 报告生成失败并展示错误。
- 结构稳定性风险：当前两份样例通过校验，但还需要更多岗位重复验证。
- 安全与配置风险：不能把真实 `DEEPSEEK_API_KEY` 写入代码、输出或文档。

## 8. 从 legacy Demo mock 到当前 App 集成

以下步骤记录历史迁移思路；当前 `app/` 已完成真实 RAG API 集成，不再把 mock generator 作为主流程默认路径。

已完成的迁移结果：

1. `rag-spike` 已提供 `rag_api_server.py`，通过 `POST /role-profile` 返回 `role_capability_profile`。
2. `app/src/services/ragApi.ts` 已调用本地 RAG API。
3. 当前 `app` 报告生成失败时显示明确错误，不静默回退 mock。
4. JD / role input 已映射到本地 RAG 服务封装：
   ```text
   JD / role input
   -> retrieve top_k chunks
   -> DeepSeek extractor
   -> validate role_capability_profile
   -> render role capability requirements
   ```
5. 后续仍需扩展至少 5-10 个岗位样例，确认 capability keys、权重和 source_refs 稳定。
6. 进入正式系统集成前，再决定是否把 RAG 封装为后端 API、队列任务或离线预生成任务。

## 9. 推荐后续路线

### 推荐立即做

- 保持 `app/` 主流程调用本地 RAG API，API 不可用时显示明确错误。
- 将 RAG 输出展示文案继续标注为本地真实 RAG spike 结果，不把它描述为生产级能力。
- 演示前预热 embedding 模型并确认 `DEEPSEEK_API_KEY` 可用。

### 推荐进入集成前补齐

- 增加更多岗位资料。
- 在 UI 中更清晰展示 `file#chunk_index` 级 source_refs。
- 增加 DeepSeek 调用失败原因分类和更清晰的错误提示。
- 记录 DeepSeek 调用耗时、token / 成本估算和失败率。
- 增加 schema validation，最好与前端 `app` 读取结构共用同一份 JSON schema。

## 10. 用户确认与当前实现

RAG-06 的最后一个验收点已由用户确认：

```text
进入 Demo 集成阶段，实时调用 DeepSeek。
```

当前实现：`app` 主流程默认调用本地 RAG API，由本地 Python 服务读取 DeepSeek key、检索本地 Chroma 并调用 DeepSeek；如果实时链路失败，页面显示错误，不静默回退 mock 输出。legacy `demo` 的 mock fallback 仍保留作历史参考。
