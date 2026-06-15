# 能力评估智能体 Agent 规范

本文件适用于 `agent/capability-assessment/` 及其子目录。开始修改本目录前，先阅读仓库根目录 `AGENTS.md`，再阅读本文件。

## Project Overview

- 本目录是 **Capability Assessment Agent / 能力评估智能体**。
- 当前主入口是 `app/`，一个独立 Vue 3 + Vite + TypeScript 前端。
- 当前正式后端是 `server/`，一个独立 FastAPI Capability API。
- 本目录不接主项目 `backend/`、`frontend/`、登录系统或主业务数据库。
- `demo/` 是 legacy 静态版本。
- `rag-spike/` 是 RAG / DeepSeek spike；其中 `rag_api_server.py` 和 `ability_api_server.py` 仅保留作 legacy 本地入口，不再是主流程服务。

## Product Backend Status

当前流程：

```text
简历与理想岗位
-> 是否填写问卷（10 题快速 / 48 题详细）
-> 个人界面
```

主流程只需要启动一个后端：

```powershell
cd C:\code\career\agent\capability-assessment
..\..\.venv\Scripts\python.exe -m server.main
```

默认 API：

```text
http://127.0.0.1:8770
```

主要 endpoint：

```text
GET  /health
POST /resume-text
POST /assessments/role-profile
POST /assessments/capability-evidence
GET  /assessments/me/latest
```

第一版学生身份使用 `X-Student-Id` header，默认 `demo_user_001`。评估会话保存到本地 SQLite，默认路径：

```text
agent/capability-assessment/data/capability-assessment.sqlite3
```

## Repository Layout

- `app/`：当前 Vue app。
- `app/src/composables/useAssessmentFlow.ts`：流程状态、校验、上传、岗位雷达生成、问卷提交和个人界面派生数据。
- `app/src/views/ProfileView.vue`：个人界面，包含合并雷达、问卷模式弹窗、能力明细和行动清单。
- `app/src/components/RadarChart.vue`：个人/职业雷达叠加展示，分数显示在能力标签旁。
- `app/src/data/roleOptions.ts`：预置岗位 JD 选项。
- `app/src/services/`：Capability API client 和画像合并逻辑。
- `server/`：正式独立 FastAPI 后端。
- `server/main.py`：API app 和 route。
- `server/repository.py`：SQLite persistence。
- `server/service.py`：评估业务流程。
- `server/script_adapters.py`：复用 `rag-spike/scripts/` 底层算法。
- `server/profile_merge.py`：后端能力画像合并。
- `tests/`：独立后端测试。
- `docs/product-backend-issues.md`：从 demo 到正式后端的 issue 拆分。
- `docs/questionnaire-report-improvement-notes.md`：问卷和个人界面优化归纳，以及职业个性化 AI 问卷、RAG 内容填充待定事项。
- `docs/questionnaire-report-improvement-issues.md`：问卷和个人界面优化 issue 状态。
- `rag-spike/`：RAG / DeepSeek spike 和底层脚本。
- `demo/`：legacy 静态 demo。

## Commands

安装 Python 依赖：

```powershell
cd C:\code\career
.\.venv\Scripts\python.exe -m pip install -r agent\capability-assessment\requirements.txt
```

启动后端：

```powershell
cd C:\code\career\agent\capability-assessment
..\..\.venv\Scripts\python.exe -m server.main
```

启动前端：

```powershell
cd C:\code\career\agent\capability-assessment\app
npm install
npm run dev
```

前端构建：

```powershell
cd C:\code\career\agent\capability-assessment\app
npm run build
```

后端测试：

```powershell
cd C:\code\career
.\.venv\Scripts\python.exe -m pytest -p no:cacheprovider --basetemp agent\capability-assessment\.pytest-tmp agent\capability-assessment\tests
```

Python 编译检查：

```powershell
cd C:\code\career
.\.venv\Scripts\python.exe -m compileall agent\capability-assessment\server agent\capability-assessment\tests
```

## Environment And Secrets

- 不要提交真实 `DEEPSEEK_API_KEY`。
- `rag-spike/.env` 只允许本地使用。
- 浏览器端不得持有 DeepSeek API key。
- 前端优先使用 `VITE_CAPABILITY_API_BASE_URL`。
- `VITE_ABILITY_API_BASE_URL` 和 `VITE_RAG_API_BASE_URL` 只作为过渡 fallback。
- 本地 SQLite 数据库不应提交。
- 不要在未确认的情况下触发模型下载。

## Coding Conventions

- `app/` 使用 Vue 3 + Vite + TypeScript，不引入 Vue Router、Pinia 或 Element Plus，除非先更新文档并说明原因。
- `server/` 使用 Python 3.11 + FastAPI，优先保持标准库 + 当前 `requirements.txt` 依赖。
- `capability_key` 必须来自 `docs/capability-schema.md` 的 8 个 key。
- `score` 必须限制在 `0-100`。
- `confidence` 必须限制在 `0.00-1.00`。
- RAG `source_refs` 必须使用 `file.md#chunk_index`。
- 当前 RAG 明确用于职业雷达 / 岗位能力需求图；个人雷达来自简历和问卷能力证据，不要描述为 RAG 生成。
- 职业个性化 AI 问卷和 RAG 内容填充目前是待定事项，未确认前不要实现新接口或改 schema。
- 不要把 mock 输出描述为生产级真实 RAG。
- 不要把 legacy `demo/` mock fallback 搬回当前主流程。

## Testing And Verification

修改 `app/` 后至少运行：

```powershell
cd C:\code\career\agent\capability-assessment\app
npm run build
```

修改 `server/` 后至少运行：

```powershell
cd C:\code\career
.\.venv\Scripts\python.exe -m pytest -p no:cacheprovider --basetemp agent\capability-assessment\.pytest-tmp agent\capability-assessment\tests
.\.venv\Scripts\python.exe -m compileall agent\capability-assessment\server agent\capability-assessment\tests
```

修改 `rag-spike/scripts/` 后至少运行：

```powershell
cd C:\code\career
.\.venv\Scripts\python.exe -m compileall agent\capability-assessment\rag-spike\scripts
```

真实 DeepSeek 调用不作为文档-only 改动的必跑项；完整人工验收见 `docs/product-backend-issues.md` 的 CA-08。

## Documentation Rules

- 修改能力维度、JSON schema 或 agent 边界时，同步检查 `docs/capability-schema.md`。
- 修改正式后端流程时，同步检查 `README.md`、`ARCHITECTURE.md`、`DEVELOPMENT_ISSUES.md` 和 `docs/product-backend-issues.md`。
- 如果涉及 Interview Agent 协作，只修改本目录文档；不要擅自修改 `agent/interview/`，除非用户明确要求。

## Git Safety

- 不要提交 `rag-spike/.env`、真实 API key、本地模型缓存、SQLite 数据库或无关临时文件。
- 不要使用 `git reset --hard`、`git checkout --` 等破坏性命令清理他人改动。
