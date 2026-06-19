# Capability Assessment Development Issues

本文记录本独立仓库当前状态、风险和后续 issue。

## 当前状态

- 当前主入口是 `app/` Vue app。
- 当前正式后端入口是 `server/` FastAPI Capability API。
- 主流程不再要求同时启动 `rag_api_server.py` 和 `ability_api_server.py`。
- `rag-spike/scripts/*_api_server.py` 保留为 legacy spike entrypoints。
- `demo/` 是 legacy 静态版本，不再作为当前主演示入口。
- 后端第一版使用 SQLite 按 `student_id` 持久化评估会话。
- 第一版学生身份来自 `X-Student-Id` header，默认 `demo_user_001`。
- RAG / Ability / AI 问卷生成为同步接口。
- AI 岗位问卷第一版基于本地私有 SWEBOK PDF + DeepSeek，生成 15 道 1-5 分自评题。
- SWEBOK PDF 为英文资料，RAG 检索已改为中文原始岗位/JD + 英文 retrieval query 的双语混合检索。
- v2 岗位能力模型改为岗位专属 6 维 `role_dimensions`，并保留到统一 8 维 `capability_key` 的映射。
- 报告主展示岗位 6 维、能力明细和 4 周提升计划；能力明细展示文案与计划来自后端 LLM `report_content`，人工评价第一版只预留说明，不做录入 UI。

## 已完成

- [已完成] JD 输入改为预置岗位 + `其他` 自定义。
- [已完成] 预置 JD 展示但不可编辑。
- [已完成] 问卷改为可延后。
- [已完成] 问卷支持 10 题快速模式和 48 题详细模式。
- [已完成] 问卷新增 AI 岗位问卷 15 题入口。
- [已完成] 个人界面补做或重做问卷时弹窗选择问卷模式。
- [已完成] 未完成问卷时显示个人雷达未测试空状态。
- [已完成] 个人界面合并个人雷达和职业雷达，支持个人、职业、叠加视图。
- [已完成] 个人界面能力明细改为能力、岗位应用场景、个人能力评估、针对性改进建议。
- [已完成] 针对性改进建议改为后端 LLM 输出，并保留到 `capability_profile`。
- [已完成] 能力明细展示文案和 4 周提升计划改为后端 LLM 生成，并支持 `**重点**` 由 LLM 自行决定加粗。
- [已完成] 删除独立可执行行动清单展示。
- [已完成] 新增独立 FastAPI Capability API。
- [已完成] 新增 SQLite 持久化评估会话。
- [已完成] 新增 `POST /resume-text`。
- [已完成] 新增 `POST /assessments/role-profile`。
- [已完成] 新增 `POST /questionnaires/role-generated`。
- [已完成] 新增 `POST /assessments/capability-evidence`。
- [已完成] 新增 `GET /assessments/me/latest`。
- [已完成] `rag-spike/scripts/build_index.py` 支持 `rag-spike/data/*.md` 和 `rag-spike/private-data/*.pdf`。
- [已完成] SWEBOK PDF 私有目录约定为 `rag-spike/private-data/swebok-v4.pdf`。
- [已完成] `.gitignore` 忽略 `rag-spike/private-data/`。
- [已完成] PDF chunk metadata 支持 `source_file`、`source_type`、`page_number`、`chunk_index`。
- [已完成] 岗位雷达和 AI 岗位问卷检索支持双语混合 query，改善中文 JD 检索英文 SWEBOK 的召回质量。
- [已完成] 前端统一到 `VITE_CAPABILITY_API_BASE_URL`，旧 API env 只作过渡 fallback。
- [已完成] 新增后端轻量测试，不调用真实 DeepSeek。
- [已完成] 新增 AI 问卷 schema 校验测试。
- [已完成] 新增本地岗位定制能力模型 v2 implementation issues 文档。
- [已完成] 新增电商运营实习生预置 JD。
- [已完成] 新增可提交岗位指南 `rag-spike/data/role-capability-v2-guide.md`。
- [已完成] 新增真实样例脱敏与实测流程文档。

## 未完成

- [未完成] 尚未接入主项目登录系统；当前仍用 `X-Student-Id`。
- [未完成] 尚未接入主项目 `backend/` 或 `frontend/`。
- [未完成] 尚未做异步任务、任务进度轮询或队列。
- [未完成] 尚未做大规模岗位样本稳定性验证。
- [未完成] 岗位 6 维模型仍需用真实产品、数据、运营岗位样例持续调 prompt 和岗位指南。
- [未完成] AI 岗位问卷第一版只做产品经理实习生示范，不承诺所有 JD 都稳定。
- [未完成] SWEBOK PDF 知识库和 AI 岗位问卷尚未在服务器真实 DeepSeek 链路验收。
- [未完成] RAG 内容尚未直接进入能力明细的岗位应用场景或建议生成。
- [未完成] Interview Agent 的 `competencyId` 到 8 个 `capability_key` 的 mapping 尚未定义。
- [未完成] `interview_simulation` evidence 回写尚未实现。

## 已知风险

- [风险] `BAAI/bge-m3` 首次加载较慢，真实演示前需要预热或接受等待。
- [风险] SWEBOK PDF 是本地私有知识库文件，不应提交到 git；服务器需要手动放置到 `rag-spike/private-data/swebok-v4.pdf`。
- [风险] PDF 如果不是可复制文字版，`pypdf` 可能抽取不到正文，需要换文本版或增加 OCR 管线。
- [风险] DeepSeek API 失败、网络失败、余额不足或 key 配置错误时，当前流程会中断并显示错误，不会生成 mock 报告。
- [风险] 学生能力 LLM 评分存在一致性、延迟和成本风险；输入证据不足时必须降低 `confidence`。
- [风险] 同步接口在真实网络较慢时会让前端等待较久，后续可能需要引入异步任务。
- [风险] `rag-spike/index/chroma/` 是本地向量索引，提交策略需要团队确认；默认不应提交大索引。
- [风险] 当前 RAG 明确用于职业雷达和 AI 问卷生成；个人雷达来自简历和问卷评分，不应在演示中描述为 RAG 生成。
- [风险] 岗位专属维度由 AI 每次生成，同一 JD 多次输出可能有轻微差异；演示前应使用真实样例复测。

## 当前运行方式

后端：

```bash
cd /path/to/capability-assessment
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
export DEEPSEEK_API_KEY=your_deepseek_key
python -m server.main --host 0.0.0.0 --port 8770
```

Windows PowerShell 使用 `.venv\Scripts\Activate.ps1` 激活虚拟环境。Windows 上 `pysqlite3-binary` 会被依赖平台标记跳过，后端脚本使用标准库 `sqlite3`。

前端：

```bash
cd /path/to/capability-assessment/app
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

构建 SWEBOK 知识库索引：

```bash
cd /path/to/capability-assessment
mkdir -p rag-spike/private-data
# 放置 PDF: rag-spike/private-data/swebok-v4.pdf
python rag-spike/scripts/build_index.py
```

轻量验证：

```bash
cd /path/to/capability-assessment
python -m pytest -p no:cacheprovider --basetemp .pytest-tmp tests
python -m compileall server tests rag-spike/scripts
cd /path/to/capability-assessment/app
npm run build
```

## 下一步

1. 在服务器确认 `rag-spike/private-data/swebok-v4.pdf` 存在。
2. 在服务器构建 Chroma 索引，并检查 `index-build-report.json` 中 `pdf_extractable_pages > 0`、`indexed_chunks > 0`。
3. 用真实 `DEEPSEEK_API_KEY` 验收产品经理实习生 AI 岗位问卷 15 题。
4. 用真实 `DEEPSEEK_API_KEY` 验收产品经理、数据分析、电商运营三个预置岗位的 v2 岗位 6 维模型。
5. 检查 AI 岗位问卷题目是否携带 `role_dimension_id`，是否能正常提交评分进入个人界面。
6. 按 `docs/real-sample-workflow.md` 收集脱敏真实简历/JD 样例并重跑主流程。
7. 根据真实耗时判断是否需要异步任务。
8. 扩展岗位 JD 样本到 5-10 个。
9. 决定 RAG 内容是否进入能力明细的岗位应用场景。
10. 明确 Interview Agent 结果回写 mapping。
