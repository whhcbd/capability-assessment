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
- 第一版 RAG / Ability 分析为同步接口。

## 已完成

- [已完成] JD 输入改为预置岗位 + `其他` 自定义。
- [已完成] 预置 JD 展示但不可编辑。
- [已完成] 问卷改为可延后。
- [已完成] 原报告内容并入个人界面。
- [已完成] 未完成问卷时显示个人雷达未测试空状态。
- [已完成] 新增独立 FastAPI Capability API。
- [已完成] 新增 SQLite 持久化评估会话。
- [已完成] 新增 `POST /resume-text`。
- [已完成] 新增 `POST /assessments/role-profile`。
- [已完成] 新增 `POST /assessments/capability-evidence`。
- [已完成] 新增 `GET /assessments/me/latest`。
- [已完成] 前端统一到 `VITE_CAPABILITY_API_BASE_URL`，旧 API env 只作过渡 fallback。
- [已完成] 新增后端轻量测试，不调用真实 DeepSeek。
- [已完成] 新增 `docs/product-backend-issues.md` 记录正式后端 issue 拆分。

## 未完成

- [未完成] 尚未接入主项目登录系统；当前仍用 `X-Student-Id`。
- [未完成] 尚未接入主项目 `backend/` 或 `frontend/`。
- [未完成] 尚未做异步任务、任务进度轮询或队列。
- [未完成] 尚未做大规模岗位样本稳定性验证。
- [未完成] RAG 样例岗位仍只有产品经理实习生和数据分析实习生，覆盖不足。
- [未完成] RAG `source_refs` 仍为 `file.md#chunk_index`，没有页码、段落或 offset 级引用。
- [未完成] Interview Agent 的 `competencyId` 到 8 个 `capability_key` 的 mapping 尚未定义。
- [未完成] `interview_simulation` evidence 回写尚未实现。

## 已知风险

- [风险] `BAAI/bge-m3` 首次加载较慢，真实演示前需要预热或接受等待。
- [风险] DeepSeek API 失败、网络失败、余额不足或 key 配置错误时，当前流程会中断并显示错误，不会生成 mock 报告。
- [风险] 学生能力 LLM 评分存在一致性、延迟和成本风险；输入证据不足时必须降低 `confidence`。
- [风险] 当前 RAG 输出只有本地结构校验，还没有大规模稳定性测试。
- [风险] 同步接口在真实网络较慢时会让前端等待较久；后续可按 CA-08 结果决定是否引入异步任务。
- [风险] `rag-spike/index/chroma/` 是本地向量索引，提交策略需要团队确认。

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

前端：

```bash
cd /path/to/capability-assessment/app
npm install
npm run dev
```

验证：

```bash
cd /path/to/capability-assessment
python -m pytest -p no:cacheprovider --basetemp .pytest-tmp tests
python -m compileall server tests
cd /path/to/capability-assessment/app
npm run build
```

## 下一步

1. 用真实 `DEEPSEEK_API_KEY` 做 CA-08 人工验收。
2. 根据真实耗时判断是否需要异步任务。
3. 扩展岗位 JD 样本到 5-10 个。
4. 增加 RAG context selector 或 reranker。
5. 明确 Interview Agent 结果回写 mapping。
