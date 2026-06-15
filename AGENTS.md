# 能力评估智能体 Agent 规范

本文件适用于当前仓库 `C:\code\capability-assessment` 及其子目录。修改代码前先阅读本文件，并遵守仓库内已有文档和测试约定。

## Project Overview

- 本仓库是 **Capability Assessment Agent / 能力评估智能体**。
- 当前主入口是 `app/`，一个独立 Vue 3 + Vite + TypeScript 前端。
- 当前正式后端是 `server/`，一个独立 FastAPI Capability API。
- 本仓库不接主项目 `backend/`、`frontend/`、登录系统或主业务数据库。
- `demo/` 是 legacy 静态版本，不再作为主流程入口。
- `rag-spike/` 是 RAG / DeepSeek 相关底层脚本来源；其中 `rag_api_server.py` 和 `ability_api_server.py` 仅保留作 legacy 本地入口。

## Product Backend Status

当前流程：

```text
简历与理想岗位
-> 是否填写问卷（10 题快速 / 48 题详细 / AI 岗位问卷 15 题）
-> 个人界面
```

主流程只需要启动一个后端：

```powershell
cd C:\code\capability-assessment
python -m server.main --host 0.0.0.0 --port 8770
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
POST /questionnaires/role-generated
POST /assessments/capability-evidence
GET  /assessments/me/latest
```

第一版学生身份使用 `X-Student-Id` header，默认 `demo_user_001`。评估会话保存到本地 SQLite，默认路径：

```text
data/capability-assessment.sqlite3
```

## Repository Layout

- `app/`：当前 Vue app。
- `app/src/composables/useAssessmentFlow.ts`：流程状态、校验、上传、岗位雷达生成、问卷生成/提交和个人界面派生数据。
- `app/src/views/ProfileView.vue`：个人界面，包含合并雷达、问卷模式弹窗和能力明细。
- `app/src/views/QuestionnairePromptView.vue`：问卷选择页，包含 10 题、48 题和 AI 岗位问卷 15 题入口。
- `app/src/components/RadarChart.vue`：个人/职业雷达叠加展示。
- `app/src/data/roleOptions.ts`：预置岗位 JD 选项。
- `app/src/services/`：Capability API client、AI 问卷 API client 和画像合并逻辑。
- `server/`：正式独立 FastAPI 后端。
- `server/main.py`：API app 和 route。
- `server/repository.py`：SQLite persistence。
- `server/service.py`：评估业务流程。
- `server/script_adapters.py`：复用 `rag-spike/scripts/` 底层算法。
- `server/profile_merge.py`：后端能力画像合并。
- `tests/`：独立后端测试。
- `docs/capability-schema.md`：8 个能力 key 和 JSON schema。
- `rag-spike/scripts/`：RAG、DeepSeek、简历解析、能力评分和 AI 问卷生成脚本。
- `rag-spike/private-data/`：本地私有知识库目录，不提交 git。

## SWEBOK Private Knowledge Base

AI 岗位问卷第一版使用本地私有 SWEBOK PDF：

```text
rag-spike/private-data/swebok-v4.pdf
```

该目录已加入 `.gitignore`，不要提交 PDF。服务器部署时需要把 PDF 放到同一路径，然后构建 Chroma 索引：

```powershell
python rag-spike/scripts/build_index.py
```

如果首次运行需要下载 embedding 模型 `BAAI/bge-m3`，服务器需要联网或提前准备模型缓存。

## Commands

安装 Python 依赖：

```powershell
cd C:\code\capability-assessment
python -m pip install -r requirements.txt
```

启动后端：

```powershell
cd C:\code\capability-assessment
python -m server.main --host 0.0.0.0 --port 8770
```

启动前端：

```powershell
cd C:\code\capability-assessment\app
npm install
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

## Environment And Secrets

- 不要提交真实 `DEEPSEEK_API_KEY`。
- `rag-spike/.env` 只允许本地使用。
- 浏览器端不得持有 DeepSeek API key。
- 前端优先使用 `VITE_CAPABILITY_API_BASE_URL`。
- `VITE_ABILITY_API_BASE_URL` 和 `VITE_RAG_API_BASE_URL` 只作为过渡 fallback。
- 本地 SQLite 数据库不应提交。
- `rag-spike/private-data/`、PDF、模型缓存和 Chroma 大索引不应提交。
- 不要在未确认的情况下触发模型下载。

## Coding Conventions

- `app/` 使用 Vue 3 + Vite + TypeScript，不引入 Vue Router、Pinia 或 Element Plus，除非先更新文档并说明原因。
- `server/` 使用 Python 3.11 + FastAPI，优先保持标准库 + 当前 `requirements.txt` 依赖。
- `capability_key` 必须来自 `docs/capability-schema.md` 的 8 个 key。
- `score` 必须限制在 `0-100`。
- `confidence` 必须限制在 `0.00-1.00`。
- RAG `source_refs` 对 Markdown 使用 `file.md#chunk_index`，对私有 PDF 知识库使用 `file.pdf#page_页码#chunk_序号`。
- RAG 用于职业雷达和 AI 岗位问卷生成；个人雷达来自简历和问卷能力证据，不要描述为 RAG 生成。
- AI 岗位问卷第一版只作为“产品经理实习生”示范能力，不承诺所有 JD 都稳定高质量。
- 不要把 mock 输出描述为生产级真实 RAG。
- 不要把 legacy `demo/` mock fallback 搬回当前主流程。

## Testing And Verification

修改 `app/` 后至少运行：

```powershell
cd C:\code\capability-assessment\app
npm run build
```

修改 `server/` 后至少运行：

```powershell
cd C:\code\capability-assessment
python -m pytest -p no:cacheprovider --basetemp .pytest-tmp tests
python -m compileall server tests
```

修改 `rag-spike/scripts/` 后至少运行：

```powershell
cd C:\code\capability-assessment
python -m compileall rag-spike\scripts
```

真实 DeepSeek 调用、真实 PDF 抽取、embedding 建索引和 Chroma 大索引构建不作为轻量自动测试必跑项，需在服务器环境人工验收。

## Documentation Rules

- 修改能力维度、JSON schema 或 agent 边界时，同步检查 `docs/capability-schema.md`。
- 修改正式后端流程时，同步检查 `README.md`、`ARCHITECTURE.md`、`DEVELOPMENT_ISSUES.md` 和 `docs/product-backend-issues.md`。
- 如果涉及 Interview Agent 协作，只修改本仓库文档；不要擅自修改其他 agent，除非用户明确要求。

## Git Safety

- 不要提交 `rag-spike/.env`、真实 API key、本地模型缓存、SQLite 数据库、私有 PDF、Chroma 大索引或无关临时文件。
- 不要使用 `git reset --hard`、`git checkout --` 等破坏性命令清理他人改动。
