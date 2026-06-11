# 能力评估智能体

本仓库是一个独立的职业能力评估应用，用于把学生的简历、理想岗位/JD 和 48 题行为锚定问卷整理成个人界面：

- 始终展示理想岗位能力雷达。
- 完成问卷后展示个人能力雷达、优势、差距和能力明细。
- 未完成问卷时展示“个人雷达还没有测试，暂时无法生成”的空状态。

当前主入口是独立 Vue app 和独立 FastAPI 后端，不接主项目 `backend/`、`frontend/`、登录系统或主业务数据库。

## 目录

```text
app/        Vue 3 + Vite + TypeScript 前端
server/     独立 FastAPI Capability API
rag-spike/  RAG / DeepSeek spike 和 legacy demo API
docs/       方案、issue、schema 和演示文档
tests/      独立后端轻量测试
```

`demo/` 和 `rag-spike/scripts/*_api_server.py` 是 legacy / spike 参考，不再是主流程服务入口。

## 流程

```text
首页
-> 简历与理想岗位
-> 是否现在填写 48 题问卷
-> 个人界面
```

理想岗位支持两类输入：

- 预置选项：`互联网产品经理实习生`、`数据分析实习生`。选择后自动填入岗位名称和 JD，JD 只读。
- `其他`：用户自行填写岗位名称和详细 JD。

问卷可以立即填写，也可以稍后填写。稍后填写时，后端仍会生成并保存理想岗位雷达；完成问卷后再写回同一个评估会话，生成个人能力雷达。

## 服务器部署前确认

这个项目已经从原项目中拆出，运行时不再依赖外层 `career` 仓库或 `agent/capability-assessment` 路径。所有命令都以本仓库根目录为准。

服务器需要准备：

- Python 3.11。
- Node.js 20 LTS 或更新的 LTS 版本。
- 可访问 DeepSeek API 的网络环境。
- `DEEPSEEK_API_KEY`。不要把真实 key 写入前端 `.env` 或提交到仓库。

当前 Python 依赖包含 `sentence-transformers`、`chromadb` 等包，首次安装和首次加载模型可能较慢。你的服务器可以联网下载时，按下面命令直接安装即可。

本文默认部署方式：

- Linux 单台服务器。
- 后端 FastAPI 单独运行在 `8770` 端口。
- 前端 Vite 单独运行在 `5173` 端口。
- 没有域名和 HTTPS，浏览器通过服务器 IP 访问，例如 `http://SERVER_IP:5173`。

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

如果服务器需要更稳的 `.docx` 解析，可额外安装可选依赖：

```bash
python -m pip install -r requirements-optional.txt
```

如果需要在服务器上运行测试，安装开发/测试依赖：

```bash
python -m pip install -r requirements-dev.txt
```

配置环境变量。把 `SERVER_IP` 替换成你的服务器公网 IP：

```bash
export CAPABILITY_API_HOST=0.0.0.0
export CAPABILITY_API_PORT=8770
export CAPABILITY_ASSESSMENT_DB=/path/to/capability-assessment/data/capability-assessment.sqlite3
export CAPABILITY_API_CORS_ORIGINS=http://SERVER_IP:5173,http://localhost:5173,http://127.0.0.1:5173
export DEEPSEEK_API_KEY=your_deepseek_key
```

Windows PowerShell：

```powershell
$env:CAPABILITY_API_HOST="0.0.0.0"
$env:CAPABILITY_API_PORT="8770"
$env:CAPABILITY_ASSESSMENT_DB="C:\path\to\capability-assessment\data\capability-assessment.sqlite3"
$env:CAPABILITY_API_CORS_ORIGINS="http://SERVER_IP:5173,http://localhost:5173,http://127.0.0.1:5173"
$env:DEEPSEEK_API_KEY="your_deepseek_key"
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
POST /assessments/capability-evidence
GET  /assessments/me/latest
```

第一版用 `X-Student-Id` header 表示学生身份；没有传时默认 `demo_user_001`。评估数据默认保存到：

```text
data/capability-assessment.sqlite3
```

本地数据库文件不应提交。

## 后端配置

Capability API 自身配置：

```text
CAPABILITY_API_HOST=127.0.0.1
CAPABILITY_API_PORT=8770
CAPABILITY_ASSESSMENT_DB=data/capability-assessment.sqlite3
CAPABILITY_API_CORS_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
```

DeepSeek 配置仍由 `rag-spike` 底层脚本读取：

```text
DEEPSEEK_API_KEY=your-local-key
```

可以放在环境变量或本地 `rag-spike/.env`。不要提交真实 key，浏览器端也不持有 key。

## 前端安装与启动

开发模式。把 `SERVER_IP` 替换成你的服务器公网 IP：

```bash
cd /path/to/capability-assessment/app
npm install
echo "VITE_CAPABILITY_API_BASE_URL=http://SERVER_IP:8770" > .env.local
echo "VITE_CAPABILITY_STUDENT_ID=demo_user_001" >> .env.local
npm run dev
```

如果要让外部浏览器访问 Vite 开发服务器，需要监听 `0.0.0.0`：

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

浏览器访问：

```text
http://SERVER_IP:5173
```

前端配置示例：

```text
app/.env.example
```

推荐配置：

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

构建产物在 `app/dist/`。如果以后改成 Nginx 静态部署，需要在构建前写好 `VITE_CAPABILITY_API_BASE_URL=http://SERVER_IP:8770`，因为 Vite 会把这个地址打进前端产物。

## Linux 单机启动示例

后端终端：

```bash
cd /path/to/capability-assessment
source .venv/bin/activate
export CAPABILITY_API_HOST=0.0.0.0
export CAPABILITY_API_PORT=8770
export CAPABILITY_API_CORS_ORIGINS=http://SERVER_IP:5173,http://localhost:5173,http://127.0.0.1:5173
export DEEPSEEK_API_KEY=your_deepseek_key
python -m server.main --host 0.0.0.0 --port 8770
```

前端终端：

```bash
cd /path/to/capability-assessment/app
echo "VITE_CAPABILITY_API_BASE_URL=http://SERVER_IP:8770" > .env.local
echo "VITE_CAPABILITY_STUDENT_ID=demo_user_001" >> .env.local
npm run dev -- --host 0.0.0.0 --port 5173
```

服务器安全组或防火墙需要放行：

```text
5173  前端页面
8770  后端 API
```

如果只打开了 `5173`，页面能打开但接口会失败；如果只打开了 `8770`，只能访问 API，不能打开前端页面。

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
python -m compileall server tests
```

真实 DeepSeek 链路需要本地 `DEEPSEEK_API_KEY` 可用；轻量测试不会调用 DeepSeek，也不会下载模型。

## 相关文档

- `docs/product-backend-issues.md`：正式后端 issue 拆分。
- `ARCHITECTURE.md`：当前架构与数据流。
- `docs/capability-schema.md`：8 个统一能力维度和 JSON schema。
- `docs/frontend-rewrite-issues.md`：前端流程改造记录。
