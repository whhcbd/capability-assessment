# Capability Assessment RAG Spike

本目录用于验证真实 RAG / DeepSeek 链路是否能生成岗位能力画像，并提供能力评估后端复用的底层脚本。

## 当前定位

- 当前主流程入口不是本目录下的 demo API server。
- 当前主流程由本仓库 `server/` 的 FastAPI Capability API 承载。
- `server/` 会复用本目录脚本中的核心函数：
  - `rag-spike/scripts/rag_api_server.py::extract_role_profile_for_request`
  - `rag-spike/scripts/ability_api_server.py::score_capability_for_request`
  - `rag-spike/scripts/ability_api_server.py::extract_resume_text`
- `rag_api_server.py` 和 `ability_api_server.py` 仍可本地单独运行，但只作为 legacy spike entrypoints。

## 主流程启动方式

请优先启动正式 Capability API：

```bash
cd /path/to/capability-assessment
python -m server.main --host 0.0.0.0 --port 8770
```

默认 API：

```text
http://127.0.0.1:8770
```

前端 `app/` 默认调用该 API，不再要求同时启动 `8765` 和 `8766` 两个服务。

## Spike 验证命令

安装依赖：

```bash
cd /path/to/capability-assessment
python -m pip install -r requirements.txt
```

验证 embedding 环境：

```bash
cd /path/to/capability-assessment
python rag-spike/scripts/verify_embedding.py
```

构建本地 Chroma index：

```bash
cd /path/to/capability-assessment
python rag-spike/scripts/build_index.py
```

检索验证：

```bash
cd /path/to/capability-assessment
python rag-spike/scripts/retrieve.py "互联网产品经理实习生 用户调研 数据指标 产品原型 协作" --top-k 3
```

输出校验：

```bash
cd /path/to/capability-assessment
python rag-spike/scripts/validate_rag05_outputs.py
```

## Legacy demo API

以下命令仅用于单独调试 spike，不是当前主流程必需步骤：

```bash
cd /path/to/capability-assessment
python rag-spike/scripts/rag_api_server.py
```

```bash
cd /path/to/capability-assessment
python rag-spike/scripts/ability_api_server.py
```

Legacy endpoint：

```text
http://127.0.0.1:8765/role-profile
http://127.0.0.1:8766/resume-text
http://127.0.0.1:8766/capability-evidence
```

新代码不要直接依赖这些 endpoint，应通过 `server/` 的 Capability API 调用。

## Secrets

- 不要提交真实 `DEEPSEEK_API_KEY`。
- `rag-spike/.env` 只允许本地使用。
- 浏览器端不得持有 DeepSeek key。
- 当前脚本默认设置 `HF_HUB_OFFLINE=1` 和 `TRANSFORMERS_OFFLINE=1`，不要在未确认的情况下触发模型下载。
