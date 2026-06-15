# 能力评估智能体架构

本文描述本仓库当前正式化后的独立架构。项目已从原仓库拆出，运行时不依赖外层 `career` 仓库或 `agent/capability-assessment` 路径。

## 模块

| 模块 | 路径 | 作用 |
| --- | --- | --- |
| Vue App | `app/` | 独立 Vue 3 + Vite + TypeScript 学生个人界面流程 |
| Capability API | `server/` | 独立 FastAPI 后端，统一简历解析、岗位雷达、问卷评分和 SQLite 持久化 |
| RAG / Ability spike | `rag-spike/scripts/` | DeepSeek、Chroma、简历解析和能力评分底层逻辑来源；其中 `*_api_server.py` 仅作 legacy 本地入口 |
| Shared schema docs | `docs/capability-schema.md` | 8 个统一 `capability_key` 和画像 JSON 结构 |
| Product backend issues | `docs/product-backend-issues.md` | 从 demo API 升级为正式后端的 issue 拆分 |

## 边界

- 不接主项目 `backend/`。
- 不接主项目 `frontend/`。
- 不接登录系统。
- 第一版用 `X-Student-Id` 代表学生身份，默认 `demo_user_001`。
- 第一版使用同步接口调用 RAG / DeepSeek。
- 数据持久化使用本地 SQLite。
- 浏览器端不保存 `DEEPSEEK_API_KEY`。

## 请求流

```text
用户打开 Vite app
-> 上传或粘贴简历，选择预置岗位 JD 或填写其他 JD
-> 如上传文件，POST /resume-text
-> 进入是否填写问卷页面
-> 稍后填写：POST /assessments/role-profile
-> 后端创建 assessment session，保存 role_profile，状态 questionnaire_pending
-> 前端进入个人界面，显示理想岗位雷达和个人能力雷达空状态
-> 立即填写或稍后补填问卷，可选 10 题快速模式或 48 题详细模式
-> POST /assessments/capability-evidence
-> 后端按 assessment_id 写回 questionnaire_answers、evidence、capability_profile
-> 状态 completed
-> 前端回到个人界面，显示合并雷达、能力明细和可执行行动清单
```

## API

默认 base URL：

```text
http://127.0.0.1:8770
```

Endpoint：

```text
GET  /health
POST /resume-text
POST /assessments/role-profile
POST /assessments/capability-evidence
GET  /assessments/me/latest
```

### `POST /resume-text`

输入：`multipart/form-data`，字段名 `file`。

输出：

```json
{
  "file_name": "resume.docx",
  "file_type": "docx",
  "text": "...",
  "extraction_status": "extracted"
}
```

### `POST /assessments/role-profile`

输入：

```json
{
  "resume_text": "...",
  "target_role": "互联网产品经理实习生",
  "target_jd": "...",
  "role_id": "custom_target_role",
  "top_k": 5,
  "timeout": 120,
  "retries": 1
}
```

输出包含：

```text
assessment_id
student_id
status=questionnaire_pending
target_role
target_jd
role_profile
role_api_meta
```

### `POST /assessments/capability-evidence`

输入：

```json
{
  "assessment_id": "...",
  "questionnaire_answers": []
}
```

输出包含：

```text
status=completed
evidence
capability_profile
ability_api_meta
questionnaire_answers
```

如果 `assessment_id` 不存在或不属于当前 `X-Student-Id`，返回 404。

## 存储

默认数据库：

```text
data/capability-assessment.sqlite3
```

核心表：

```text
assessment_sessions
```

主要字段：

```text
id
student_id
resume_text
target_role
target_jd
role_profile_json
role_api_meta_json
evidence_json
capability_profile_json
ability_api_meta_json
questionnaire_answers_json
status
created_at
updated_at
completed_at
```

## 能力画像数据流

岗位雷达：

```text
target_role + target_jd
-> server/service.py
-> rag-spike/scripts/rag_api_server.py::extract_role_profile_for_request()
-> retrieve_chunks()
-> DeepSeek structured extraction
-> role_capability_profile
-> SQLite
-> Vue ProfileView
```

当前 RAG 明确用于岗位雷达。`role_api_meta` 会保留模型、检索片段和耗时等信息；前端主界面目前不直接展示检索片段。

个人雷达：

```text
resume_text + questionnaire_answers
-> server/service.py
-> rag-spike/scripts/ability_api_server.py::score_capability_for_request()
-> DeepSeek scoring
-> evidence[]
-> server/profile_merge.py
-> capability_profile
-> SQLite
-> Vue ProfileView
```

个人雷达来自简历和问卷答案的能力证据评分，不是 RAG 检索结果。后续如要让 RAG 填充岗位应用场景、面试场景或来源依据，需要扩展岗位画像输出或前端来源展示；当前仅作为待定事项记录在 `docs/questionnaire-report-improvement-notes.md`。

前端仍保留 `app/src/services/profileMerge.ts`，用于兼容旧响应和本地展示推导；正式后端也会保存合并后的 `capability_profile`。

## 失败处理

- Capability API 未启动：前端显示启动 `python -m server.main` 的指引。
- `DEEPSEEK_API_KEY` 缺失：后端返回 502，前端显示明确错误。
- RAG / DeepSeek 失败：不生成 mock 岗位雷达。
- Ability scoring 失败：不生成 mock 个人雷达。
- 简历解析失败：停留在简历页面或错误页，提示原因。

## Legacy

以下入口只保留作 spike / legacy 参考：

```text
rag-spike/scripts/rag_api_server.py
rag-spike/scripts/ability_api_server.py
demo/
```

当前主流程不要求启动 `8765` 和 `8766` 两个服务。
