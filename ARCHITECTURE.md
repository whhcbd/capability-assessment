# 能力评估智能体架构

本文描述当前独立仓库的正式架构。项目运行时以本仓库根目录为准，不依赖外层 `career` 仓库或旧的 `agent/capability-assessment` 路径。

## 模块

| 模块 | 路径 | 作用 |
| --- | --- | --- |
| Vue App | `app/` | 独立 Vue 3 + Vite + TypeScript 前端，承载简历/JD 输入、问卷和个人界面 |
| Capability API | `server/` | 独立 FastAPI 后端，统一简历解析、岗位雷达、AI 问卷生成、问卷评分和 SQLite 持久化 |
| RAG / Ability scripts | `rag-spike/scripts/` | DeepSeek、Chroma、简历解析、能力评分、PDF/Markdown 索引和 AI 问卷生成底层逻辑 |
| Private knowledge base | `rag-spike/private-data/` | 本地私有知识库目录，当前约定放置 `swebok-v4.pdf`，不提交 git |
| Shared schema docs | `docs/capability-schema.md` | 8 个统一 `capability_key`、v2 岗位 6 维 `role_dimensions` 和画像 JSON 结构 |
| Tests | `tests/` | 独立后端轻量测试，不触发真实 DeepSeek、HuggingFace 下载或大索引构建 |

## 边界

- 不接主项目 `backend/`。
- 不接主项目 `frontend/`。
- 不接登录系统。
- 第一版用 `X-Student-Id` 代表学生身份，默认 `demo_user_001`。
- 第一版使用同步接口调用 RAG / DeepSeek。
- 数据持久化使用本地 SQLite。
- 浏览器端不保存 `DEEPSEEK_API_KEY`。
- `demo/` 和 `rag-spike/scripts/*_api_server.py` 只作为 legacy / spike 参考。

## 主流程

```text
用户打开 Vite app
-> 上传或粘贴简历，选择预置岗位 JD 或填写自定义 JD
-> 如上传文件，POST /resume-text
-> POST /assessments/role-profile
-> 后端创建 assessment session，保存 v2 role_profile 和 6 个 role_dimensions
-> 进入是否填写问卷页面
-> 选择稍后填写或选择 10 题、48 题、AI 岗位问卷 15 题
-> 如选择 AI 岗位问卷，POST /questionnaires/role-generated 基于 role_dimensions 生成 15 题
-> 前端进入现有问卷页，使用统一 1-5 选项作答
-> POST /assessments/capability-evidence
-> 后端写回 questionnaire_answers、evidence、capability_profile 和 LLM report_content
-> 状态 completed
-> 前端进入个人界面，展示合并雷达和能力明细
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
POST /questionnaires/role-generated
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
  "role_id": "internet_product_intern",
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
role_profile.profile_version=v2
role_profile.role_dimensions[6]
role_profile.requirements
role_api_meta
```

### `POST /questionnaires/role-generated`

输入：

```json
{
  "target_role": "互联网产品经理实习生",
  "target_jd": "...",
  "role_id": "internet_product_intern",
  "role_dimensions": [],
  "question_count": 15,
  "top_k": 6,
  "timeout": 120,
  "retries": 1
}
```

输出包含：

```text
questionnaire_items
source_refs
questionnaire_api_meta
```

前端会把当前 `role_profile.role_dimensions` 传入该接口。每个 `questionnaire_items` 元素会携带 `role_dimension_id` 和兼容用 `capability_key`，前端复用当前 1-5 分问卷选项和评分提交链路。

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

`ability_api_meta.report_content` 包含前端个人界面直接展示的能力明细文案和 4 周提升计划；文案由 LLM 生成，可在字符串中使用 `**重点**` 标记加粗。

如果 `assessment_id` 不存在或不属于当前 `X-Student-Id`，返回 404。

## 知识库与索引

索引构建脚本：

```text
rag-spike/scripts/build_index.py
```

读取来源：

```text
rag-spike/data/*.md
rag-spike/private-data/*.pdf
```

PDF 使用 `pypdf` 按页抽文本，空页跳过，文本切块后写入 Chroma。metadata 包含：

```text
source_file
source_type
page_number
chunk_index
chars
```

构建报告写入：

```text
rag-spike/outputs/index-build-report.json
```

报告包含 Markdown chunk 数、PDF 文件数、PDF 总页数、可抽文本页数、空页数和 PDF chunk 数。

`build_index.py` 默认设置 `HF_HUB_OFFLINE=1`，只加载本地缓存中的 embedding 模型；首次构建如需联网下载模型，必须显式传入 `--allow-download`。

检索英文 SWEBOK PDF 时，后端会先用 DeepSeek 把中文岗位/JD 压缩为英文 retrieval query，再把中文原文和英文 query 拼接后做 embedding 检索。英文 query 生成失败时回退到中文原文检索，不中断主流程。

## 数据流

岗位雷达：

```text
target_role + target_jd
-> server/service.py
-> rag-spike/scripts/extract_role_profile.py
-> build_bilingual_retrieval_query()
-> retrieve_chunks()
-> DeepSeek structured extraction
-> role_capability_profile v2: role_dimensions[6] + compatibility requirements
-> SQLite
-> Vue ProfileView
```

AI 岗位问卷：

```text
target_role + target_jd
-> server/service.py
-> rag-spike/scripts/generate_questionnaire.py
-> build_bilingual_retrieval_query()
-> retrieve_chunks()
-> DeepSeek structured questionnaire generation with role_dimensions
-> 15 role-specific questionnaire_items with role_dimension_id
-> Vue QuestionnaireView
-> POST /assessments/capability-evidence
```

个人雷达：

```text
resume_text + questionnaire_answers
-> server/service.py
-> rag-spike/scripts/ability_api_server.py::score_capability_for_request()
-> DeepSeek scoring
-> evidence[]
-> server/profile_merge.py
-> capability_profile
-> LLM report_content
-> SQLite
-> Vue ProfileView maps 8 capability evidence into role_dimensions
```

个人雷达来自简历和问卷答案的能力证据评分，不是 RAG 检索结果。v2 页面主展示岗位 6 维；8 维 `capability_key` 只作为跨模块兼容和映射底座。

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
error_message
created_at
updated_at
completed_at
```

## 失败处理

- Capability API 未启动：前端显示启动 `python -m server.main` 的指引。
- `DEEPSEEK_API_KEY` 缺失：后端返回 502，前端显示明确错误。
- RAG / DeepSeek 失败：不生成 mock 岗位雷达或 mock AI 问卷。
- Ability scoring 失败：不生成 mock 个人雷达。
- SWEBOK PDF 缺失或索引为空：AI 岗位问卷生成失败并提示错误。
- 简历解析失败：停留在简历页面或错误页，提示原因。

## Legacy

以下入口只保留作 spike / legacy 参考：

```text
rag-spike/scripts/rag_api_server.py
rag-spike/scripts/ability_api_server.py
demo/
```

当前主流程不要求启动 `8765` 和 `8766` 两个服务。
