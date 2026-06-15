# 能力评估智能体

本仓库是一个独立的职业能力评估应用，用于把学生的简历、理想岗位/JD 和问卷答案整理成个人能力界面。

当前能力：

- 始终展示理想岗位能力雷达。
- 问卷支持 10 题快速模式、48 题详细模式和 AI 岗位问卷 15 题示范模式。
- AI 岗位问卷基于目标岗位/JD 和本地 SWEBOK 私有知识库生成，检索时会把中文岗位输入转成英文 retrieval query 后与中文原文混合检索。
- 完成问卷后展示个人能力雷达、合并雷达对比和能力明细。
- 能力明细包含能力、岗位应用场景、个人能力评估、针对性改进建议。
- 针对性改进建议来自后端 LLM 输出，目标是给出可落地、马上能做的建议。
- 未完成问卷时展示“个人雷达还没有测试，暂时无法生成”的空状态。

当前主入口是独立 Vue app 和独立 FastAPI 后端，不接主项目 `backend/`、`frontend/`、登录系统或主业务数据库。

## 目录

```text
app/        Vue 3 + Vite + TypeScript 前端
server/     独立 FastAPI Capability API
rag-spike/  RAG / DeepSeek scripts 和 legacy demo API
docs/       方案、issue、schema 和演示文档
tests/      独立后端轻量测试
```

`demo/` 和 `rag-spike/scripts/*_api_server.py` 是 legacy / spike 参考，不再是主流程服务入口。

## 流程

```text
首页
-> 简历与理想岗位
-> 选择是否现在填写问卷
   -> 10 题快速
   -> 48 题详细
   -> AI 岗位问卷 15 题
   -> 稍后填写
-> 个人界面
```

理想岗位支持两类输入：

- 预置选项：`互联网产品经理实习生`、`数据分析实习生`。选择后自动填入岗位名称和 JD，JD 只读。
- `其他`：用户自行填写岗位名称和详细 JD。

当前 RAG 的明确使用范围是职业雷达和 AI 岗位问卷生成：

- `POST /assessments/role-profile` 基于目标岗位/JD 生成岗位能力需求图，检索英文 SWEBOK 时使用中文原文 + 英文 retrieval query 的混合查询。
- `POST /questionnaires/role-generated` 基于目标岗位/JD 和本地知识库生成 15 题岗位化问卷，检索英文 SWEBOK 时同样使用双语混合查询。
- `POST /assessments/capability-evidence` 基于已保存简历和问卷答案生成个人能力证据，个人雷达不是 RAG 检索结果。

## 服务器部署前确认

本项目已从原项目中拆出，运行时以本仓库根目录为准。

服务器需要准备：

- Python 3.11。
- Node.js 20 LTS 或更新的 LTS 版本。
- 可访问 DeepSeek API 的网络环境。
- `DEEPSEEK_API_KEY`。不要把真实 key 写入前端 `.env` 或提交到仓库。
- 如需首次构建索引，需要能下载或已经缓存 embedding 模型 `BAAI/bge-m3`。

AI 岗位问卷示范使用本地私有 SWEBOK PDF 知识库。不要把 PDF 提交到仓库；服务器上请放到：

```text
rag-spike/private-data/swebok-v4.pdf
```

放好 PDF 后构建本地 Chroma 索引：

```bash
python rag-spike/scripts/build_index.py
```

构建报告会写入：

```text
rag-spike/outputs/index-build-report.json
```

验收时需要检查 `pdf_extractable_pages > 0`、`indexed_chunks > 0`。

## 后端安装与启动

Linux / macOS：

```bash
cd /path/to/capability-assessment
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Windows PowerShell：

```powershell
cd C:\path\to\capability-assessment
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

如果服务器需要更稳定的 `.docx` 解析，可额外安装可选依赖：

```bash
python -m pip install -r requirements-optional.txt
```

环境变量示例：

```bash
export CAPABILITY_API_HOST=0.0.0.0
export CAPABILITY_API_PORT=8770
export CAPABILITY_ASSESSMENT_DB=/path/to/capability-assessment/data/capability-assessment.sqlite3
export CAPABILITY_API_CORS_ORIGINS=http://SERVER_IP:5173,http://localhost:5173,http://127.0.0.1:5173
export DEEPSEEK_API_KEY=your_deepseek_key
```

如果需要 HuggingFace 镜像，可配置：

```bash
export HF_ENDPOINT=https://hf-mirror.com
```

启动 Capability API：

```bash
python -m server.main --host 0.0.0.0 --port 8770
```

默认本地地址：

```text
http://127.0.0.1:8770
```

主要接口：

```text
GET  /health
POST /resume-text
POST /assessments/role-profile
POST /questionnaires/role-generated
POST /assessments/capability-evidence
GET  /assessments/me/latest
```

第一版用 `X-Student-Id` header 表示学生身份；没有传时默认 `demo_user_001`。评估数据默认保存到：

```text
data/capability-assessment.sqlite3
```

本地数据库文件不应提交。

## AI 岗位问卷知识库

第一版 AI 岗位问卷只作为“产品经理实习生”示范能力。知识库使用本地私有 PDF：

```text
rag-spike/private-data/swebok-v4.pdf
```

索引脚本会同时读取：

```text
rag-spike/data/*.md
rag-spike/private-data/*.pdf
```

PDF 使用 `pypdf` 按页抽取文本并切块，metadata 会记录 `source_file`、`source_type=pdf`、`page_number` 和 `chunk_index`。

生成接口：

```text
POST /questionnaires/role-generated
```

接口会先用 DeepSeek 把中文目标岗位/JD 压缩成英文 retrieval query，再与中文原文拼接后检索英文 SWEBOK 知识库，最后调用 DeepSeek 生成 15 道与岗位相关的 1-5 分自评题。题目提交后仍走 `POST /assessments/capability-evidence` 评分。

## 前端安装与启动

开发模式。把 `SERVER_IP` 替换成服务器公网 IP：

```bash
cd /path/to/capability-assessment/app
npm install
echo "VITE_CAPABILITY_API_BASE_URL=http://SERVER_IP:8770" > .env.local
echo "VITE_CAPABILITY_STUDENT_ID=demo_user_001" >> .env.local
npm run dev -- --host 0.0.0.0 --port 5173
```

浏览器访问：

```text
http://SERVER_IP:5173
```

推荐前端配置：

```text
VITE_CAPABILITY_API_BASE_URL=http://SERVER_IP:8770
VITE_CAPABILITY_STUDENT_ID=demo_user_001
```

`VITE_ABILITY_API_BASE_URL` 和 `VITE_RAG_API_BASE_URL` 只保留为过渡 fallback，新代码应优先使用 `VITE_CAPABILITY_API_BASE_URL`。

生产构建：

```bash
cd /path/to/capability-assessment/app
npm install
npm run build
```

构建产物在 `app/dist/`。

## 简历上传

`POST /resume-text` 使用 `multipart/form-data`，字段名为 `file`。

支持：

- `.docx`
- 文字版 `.pdf`

不支持：

- 扫描版 PDF OCR
- 空文件
- 其他文件类型

上传文件只在请求内读取，不保存到本地磁盘。

## 验证

前端构建：

```bash
cd /path/to/capability-assessment/app
npm run build
```

后端测试：

```bash
cd /path/to/capability-assessment
python -m pip install -r requirements-dev.txt
python -m pytest -p no:cacheprovider --basetemp .pytest-tmp tests
```

Python 编译检查：

```bash
cd /path/to/capability-assessment
python -m compileall server tests rag-spike/scripts
```

轻量测试不会调用真实 DeepSeek，不会下载模型，也不会构建大索引。真实 AI 岗位问卷验收需要服务器可用的 `DEEPSEEK_API_KEY`、SWEBOK PDF 和 Chroma 索引。

## 相关文档

- `ARCHITECTURE.md`：当前架构与数据流。
- `DEVELOPMENT_ISSUES.md`：当前状态、风险和下一步。
- `docs/capability-schema.md`：8 个统一能力维度和 JSON schema。
- `docs/product-backend-issues.md`：正式后端 issue 拆分。
- `docs/questionnaire-report-improvement-notes.md`：问卷、个人界面和 RAG 内容填充记录。
- `docs/questionnaire-report-improvement-issues.md`：问卷与个人界面优化 issue 状态。
