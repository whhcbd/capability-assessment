# Capability Assessment Product Backend Issues

本文件记录 `agent/capability-assessment` 从本地 demo API 升级到独立正式后端服务的 issue 拆分。

## Decision

- 不接入主项目 `backend/` 和 `frontend/`。
- 在本仓库 `server/` 中建设独立 FastAPI 后端。
- 前端 `app/` 只调用一个 Capability API，不再要求同时启动 `rag_api_server.py` 和 `ability_api_server.py`。
- 能力评估数据按 `student_id` 持久化。第一版用 `X-Student-Id` header 表示学生身份，默认 `demo_user_001`。
- 第一版使用同步接口调用 RAG / DeepSeek；后续如耗时不可接受，再升级为异步任务。
- `rag-spike/scripts/` 保留为底层 RAG / Ability 算法来源和 legacy spike，不再作为主流程服务入口。
- v2 扩展 `POST /assessments/role-profile`，返回岗位专属 6 维 `role_dimensions`，并保留旧 `requirements` 兼容字段。

## CA-01 Define Product Backend Contract

Type: HITL  
Blocked by: None

### What to build

确认独立正式后端的 API 契约、状态机、配置项、数据归属和错误格式。

### Acceptance criteria

- [x] 明确服务入口为 `python -m server.main`。
- [x] 明确默认 API base URL 为 `http://127.0.0.1:8770`。
- [x] 明确学生身份第一版使用 `X-Student-Id`，默认 `demo_user_001`。
- [x] 明确评估状态至少包含 `questionnaire_pending` 和 `completed`。
- [x] 明确前端只配置 `VITE_CAPABILITY_API_BASE_URL`。

## CA-02 Resume Upload Through Product Backend

Type: AFK  
Blocked by: CA-01

### What to build

把简历上传和文本提取迁到正式后端 `POST /resume-text`，前端上传文件时调用新服务。

### Acceptance criteria

- [x] 支持 `.docx`。
- [x] 支持文字版 `.pdf`。
- [x] 扫描版 PDF 或空文件返回明确错误。
- [x] 后端不保存原始上传文件。
- [x] 前端上传成功后把提取文本写回简历文本框。

## CA-03 Persist Role Profile When Questionnaire Is Deferred

Type: AFK  
Blocked by: CA-01

### What to build

用户填写简历和理想岗位后，选择稍后填写问卷时，后端创建一条评估会话，生成并保存 `role_capability_profile`。

### Acceptance criteria

- [x] `POST /assessments/role-profile` 返回 `assessment_id`。
- [x] 保存 `student_id`、`resume_text`、`target_role`、`target_jd`、`role_profile`、`role_api_meta`。
- [x] 状态为 `questionnaire_pending`。
- [x] `GET /assessments/me/latest` 可取回当前学生最近一次评估。
- [x] RAG / DeepSeek 失败时返回清晰错误，前端不生成 mock 雷达。

## CA-04 Complete Questionnaire Into Same Assessment Session

Type: AFK  
Blocked by: CA-03

### What to build

用户完成 48 题问卷后，前端带 `assessment_id` 提交；后端生成 `evidence` 和 `capability_profile`，写回同一条评估会话。

### Acceptance criteria

- [x] `POST /assessments/capability-evidence` 要求 `assessment_id`。
- [x] 问卷结果保存为 `questionnaire_answers`。
- [x] 保存 `evidence`、`capability_profile`、`ability_api_meta`。
- [x] 状态更新为 `completed`。
- [x] 评估会话不存在或不属于当前学生时返回错误。

## CA-05 Frontend Uses Single Capability API

Type: AFK  
Blocked by: CA-02, CA-03, CA-04

### What to build

把前端从两个 demo API endpoint 收敛到一个 Capability API。

### Acceptance criteria

- [x] 默认 API 地址为 `http://127.0.0.1:8770`。
- [x] 支持 `VITE_CAPABILITY_API_BASE_URL`。
- [x] 保留旧 `VITE_ABILITY_API_BASE_URL` / `VITE_RAG_API_BASE_URL` 作为过渡 fallback。
- [x] 个人界面调试 JSON 展示 `assessment_id`。
- [x] 错误提示和启动命令指向 Capability API。

## CA-06 Backend Tests And Failure Coverage

Type: AFK  
Blocked by: CA-02, CA-03, CA-04

### What to build

补充不依赖真实 DeepSeek 的后端测试。

### Acceptance criteria

- [x] SQLite repository 测试覆盖创建、完成、latest 查询。
- [x] 能力画像合并测试覆盖 8 个 capability key。
- [x] 后续 API 测试可 mock RAG / Ability service，不触发模型下载或真实网络。
- [x] 测试命令可在项目工作区内运行，不依赖用户临时目录权限。

## CA-07 Documentation And Runbook

Type: AFK  
Blocked by: CA-05, CA-06

### What to build

统一 README、架构说明、开发问题记录和 agent 规范中的启动命令和边界描述。

### Acceptance criteria

- [x] 文档说明主流程只需启动 Capability API。
- [x] `rag_api_server.py` 和 `ability_api_server.py` 被标记为 legacy spike entrypoints。
- [x] 文档列出新 API endpoint、环境变量、验证命令。
- [x] 文档保留“不接主项目 backend/frontend”的边界。

## CA-08 Real DeepSeek Chain Acceptance

Type: HITL  
Blocked by: CA-07

### What to build

使用真实 `DEEPSEEK_API_KEY` 做完整人工验收。

### Acceptance criteria

- [ ] 预置产品经理 JD 可生成理想岗位雷达。
- [ ] 预置数据分析 JD 可生成理想岗位雷达。
- [ ] 预置电商运营 JD 可生成岗位 6 维能力模型。
- [ ] `其他` JD 可生成理想岗位雷达。
- [ ] 稍后填写问卷路径可进入个人界面并显示未测试空状态。
- [ ] 完成 48 题后回到个人界面并显示个人能力雷达。
- [ ] AI 岗位问卷题目携带 `role_dimension_id`，并能提交到同一评估会话。
- [ ] 缺少 key、RAG 失败、Ability 失败时均显示明确错误。
