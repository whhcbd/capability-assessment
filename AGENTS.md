# 能力评估智能体 Agent 规范

本文件是未来 agent 的最小操作契约。项目事实、架构和状态不要在这里重复展开；先读下方文档，再按项目实际情况工作。

## 必读文档

- `README.md`：项目入口、运行方式、API、部署前确认和验证命令。
- `ARCHITECTURE.md`：正式架构、模块边界、API contract、数据流、SQLite 存储和失败处理。
- `DEVELOPMENT_ISSUES.md`：当前完成/未完成事项、风险、下一步和已知测试缺口。
- `docs/capability-schema.md`：8 个统一 `capability_key`、v2 岗位 6 维 `role_dimensions`、JSON schema 和报告文案约束。
- `docs/product-backend-issues.md`：正式 FastAPI 后端 issue 拆分和验收状态。
- `docs/meeting-6-15-core-issues.md`：6.15 会议核心问题拆分、agent 可交付范围和 HITL 状态。
- `docs/evaluation-framework.md`：主客观结合能力评价框架、缺失处理和 Interview Agent 映射边界。
- `docs/real-sample-workflow.md`：真实或高可信脱敏样例结构和主流程实测要求。
- `DESIGN.md`：前端界面设计指导文件。除非用户明确要求修改设计规范，否则不要改动该文件。

## 当前边界

- 主入口是 `app/` Vue 3 + Vite + TypeScript 前端。
- 正式后端是 `server/` FastAPI Capability API。
- `rag-spike/scripts/` 是 RAG / DeepSeek / 能力评分底层脚本来源。
- `demo/` 和 `rag-spike/scripts/*_api_server.py` 仅作 legacy / spike 参考，不是当前主流程入口。
- 本仓库不接主项目 `backend/`、`frontend/`、登录系统或主业务数据库。
- 第一版学生身份使用 `X-Student-Id` header，默认 `demo_user_001`。
- 默认本地 API 是 `http://127.0.0.1:8770`，默认 SQLite 是 `data/capability-assessment.sqlite3`。

## 常用命令

启动后端：

```powershell
cd C:\code\capability-assessment
python -m server.main --host 0.0.0.0 --port 8770
```

启动前端：

```powershell
cd C:\code\capability-assessment\app
npm run dev
```

前端构建：

```powershell
cd C:\code\capability-assessment\app
npm run build
```

后端测试：

```powershell
cd C:\code\capability-assessment
python -m pytest -p no:cacheprovider --basetemp .pytest-tmp tests
```

Python 编译检查：

```powershell
cd C:\code\capability-assessment
python -m compileall server tests rag-spike\scripts
```

## 工作规则

- 修改 `app/` 后至少运行 `npm run build`。
- 修改 `server/` 后至少运行后端测试和 `python -m compileall server tests`。
- 修改 `rag-spike/scripts/` 后至少运行 `python -m compileall rag-spike\scripts`。
- Agent 不负责真实测试和验收。真实简历/JD 样例收集、真实 DeepSeek key 链路、私有 PDF / Chroma 索引、服务器环境、产品效果和报告质量验收必须由人工执行并判断。
- Agent 可执行的验证范围仅限不依赖真实密钥、私有数据、模型下载或人工主观判断的轻量检查，例如前端构建、后端单元测试和 Python 编译检查；无法执行时说明原因。
- 不要在本地执行 `pip install`、`npm install`、模型下载或其他依赖下载命令；缺依赖时直接说明验证无法运行。
- 不要触发 embedding 模型下载。`build_index.py` 默认离线加载 `BAAI/bge-m3`；服务器首次构建如需下载，必须由人工确认并显式使用 `--allow-download`。
- 不要提交真实 `DEEPSEEK_API_KEY`、`rag-spike/.env`、SQLite 数据库、私有 PDF、模型缓存、Chroma 大索引或无关临时文件。
- 浏览器端不得持有 DeepSeek API key；前端优先使用 `VITE_CAPABILITY_API_BASE_URL`。
- `capability_key` 必须来自 `docs/capability-schema.md` 的 8 个 key。
- v2 岗位侧主展示使用固定 6 个 `role_dimensions`，每个岗位维度必须映射到一个或多个 8 维 `capability_key`。
- `score` 限制在 `0-100`，`confidence` 限制在 `0.00-1.00`。
- RAG 只用于岗位能力模型和 AI 岗位问卷生成；个人雷达来自简历和问卷能力证据，不要描述为 RAG 生成。
- 主流程演示使用真实或高可信脱敏简历/JD，不要使用“姓名 XX / 岗位 XX / 公司 XX”占位数据。
- 不要把 legacy `demo/` mock fallback 搬回当前主流程。

## 文档同步

- 修改能力维度、JSON schema 或 agent 边界时，同步检查 `docs/capability-schema.md`。
- 修改正式后端流程时，同步检查 `README.md`、`ARCHITECTURE.md`、`DEVELOPMENT_ISSUES.md` 和 `docs/product-backend-issues.md`。
- 如果涉及 Interview Agent 协作，只修改本仓库文档；不要擅自修改其他 agent，除非用户明确要求。
