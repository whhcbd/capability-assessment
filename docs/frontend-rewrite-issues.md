# 能力评估前端重写 Issues

> 当前状态：本文档记录多段历史：先把 legacy 静态 `demo/` 改成学生一页页流程，随后升级为 `app/` 下的 Vue 3 + Vite + TypeScript 小应用，最新一轮把流程改为“岗位选择 -> 问卷可延后 -> 个人界面”。当前主演示入口以 `app/` 为准；前半部分涉及“保留静态形态”的验收项只代表 Vite 升级前的阶段状态。

本轮目标：把 `agent/capability-assessment` 从左侧导航式内部 demo 改成学生可用的一页页流程。

```text
首页 -> 简历与心仪职业 -> 分页式自评问卷 -> AI 分析中 -> 我的雷达 vs 心仪职业雷达
```

主流程只保留简历、心仪职业和 48 题问卷。基本信息、固定问答、高级开关、显眼调试 JSON 和静默 mock fallback 均移除。完整报告默认依赖真实 Ability API、真实 RAG API 和本地 DeepSeek key。

## ISSUE-FR-01：重写学生流程壳，移除左侧导航

**Status**: Done

- [x] 首页首屏只有清晰标题、用途说明、开始按钮。
- [x] 点击开始进入简历与心仪职业输入页。
- [x] 不再显示左侧导航栏。
- [x] 学生主流程不显示 mock、RAG、DeepSeek、高级设置、调试 JSON。
- [x] 当时保留静态 `index.html + app.js + styles.css` 形态，不新增前端构建工具；后续已在下方 Vite/Vue App Upgrade 中迁移到 `app/`。

## ISSUE-FR-02：实现简历上传与文本提取 API

**Status**: Done

- [x] 新增 `POST http://127.0.0.1:8766/resume-text`。
- [x] 上传 `.docx` 可提取正文文本。
- [x] 上传文字版 `.pdf` 可提取正文文本。
- [x] PDF 无可提取文本时提示扫描件限制。
- [x] 用户可不上传文件，直接粘贴简历文本。
- [x] 解析失败时停留在当前页并显示明确错误。
- [x] API 不保存文件，不提交真实 secrets。

## ISSUE-FR-03：改造 AI 能力评分为“简历 + 问卷”真实评分

**Status**: Done

- [x] 前端不再渲染固定问答。
- [x] AI prompt 不再要求 `dialogue_answer` 必须存在。
- [x] `self_assessment` / questionnaire 只能作为辅助证据。
- [x] 默认使用真实 AI 评分，不静默 mock。
- [x] API 失败时显示“请启动 Ability API / 配置 DeepSeek key”的错误。
- [x] `capability_profile` 输出仍包含 8 个能力维度、`score`、`confidence`、`evidence_sources`、`evidence_summary`。

## ISSUE-FR-04：重做问卷答题体验为一页页单题/小步进

**Status**: Done

- [x] 问卷页每次只聚焦 1 道题。
- [x] 顶部显示 `当前题号 / 48` 和进度条。
- [x] 每题显示能力维度和行为指标。
- [x] 5 个选项使用大按钮/单选块。
- [x] 支持上一题修改。
- [x] 未完成 48 题不能提交分析。
- [x] 页面没有解释性长文案。

## ISSUE-FR-05：生成心仪职业能力雷达图

**Status**: Done

- [x] 输入页包含“心仪职业”必填字段。
- [x] 可选提供 JD 文本。
- [x] 报告生成时调用真实 RAG API。
- [x] RAG API 不可用时显示明确错误，不静默使用本地模板。
- [x] `role_capability_profile` 兼容现有 schema。
- [x] 报告中展示心仪职业雷达图。

## ISSUE-FR-06：重做报告页：我的雷达 vs 职业雷达 + 建议

**Status**: Done

- [x] 报告首屏展示我的雷达和心仪职业雷达。
- [x] 展示 Top 3 优势能力、Top 3 差距能力。
- [x] 建议基于简历证据、问卷结果和职业能力要求。
- [x] 对低可信度能力提示“证据不足”。
- [x] 报告文案克制，不输出岗位推荐列表。
- [x] 折叠区可查看 `capability_profile` 和 `role_capability_profile`，默认隐藏。

## ISSUE-FR-07：视觉重构与移动端适配

**Status**: Done

- [x] 首页不像营销落地页，也不像内部 demo。
- [x] 每页只保留一个主要行动。
- [x] 上传、问卷、报告在桌面和移动端都不拥挤。
- [x] 不使用左侧页面导航。
- [x] 不出现大段“这是 AI / mock / RAG”的主流程文案。
- [x] `node --check agent\capability-assessment\demo\app.js` 纳入验证。

## ISSUE-FR-08：文档、启动说明与验收脚本更新

**Status**: Done

- [x] README 展示新版流程：开始 -> 简历/职业 -> 问卷 -> 报告。
- [x] 文档说明需要启动 Ability API 和 RAG API 才能完整生成报告。
- [x] 文档说明 `.docx` / 文字版 `.pdf` 支持范围和扫描 PDF 限制。
- [x] 演示脚本不再提固定问答和高级开关。
- [x] 本地 issue 文档记录 FR-01 到 FR-08。
- [x] 验证命令包含 `node --check`、`compileall`，以及手动上传/问卷/报告场景。

## 验证计划

```powershell
cd C:\code\career
node --check agent\capability-assessment\demo\app.js
.\.venv\Scripts\python.exe -m compileall agent\capability-assessment\rag-spike\scripts
```

手动场景：

- 首页开始 -> 简历/职业 -> 48 题问卷 -> 报告。
- 缺少简历阻断下一步。
- 缺少心仪职业阻断下一步。
- 未完成 48 题阻断报告。
- Ability API 不可用时显示错误，不生成 mock 报告。
- RAG API 不可用时显示错误，不生成 mock 岗位雷达。
- `.docx`、文字版 `.pdf`、扫描 PDF 和粘贴简历分别验收。

## Vite/Vue App Upgrade

本轮目标：把静态 `demo/` 升级为独立 Vue 3 + Vite + TypeScript 小应用，主入口放在 `agent/capability-assessment/app/`。旧 `demo/` 保留为 legacy 参考，不再作为主演示入口。

### ISSUE-VUE-01：建立独立 Vite/Vue 工程

**Status**: Done

- [x] 新增 `app/package.json`、`index.html`、`vite.config.ts`、`tsconfig.json`。
- [x] 使用 Vue 3、Vite、TypeScript、vue-tsc。
- [x] 不引入 Vue Router、Pinia、Element Plus。
- [x] 新增 `.env.example` 配置 Ability API 和 RAG API 地址。

### ISSUE-VUE-02：拆分组件、数据、服务和流程状态

**Status**: Done

- [x] `views/` 拆出首页、简历输入、问卷、分析中、报告。
- [x] `components/` 拆出雷达图和流程进度。
- [x] `data/` 拆出 8 个能力维度和 48 题问卷。
- [x] `services/` 拆出 Ability API、RAG API、画像合并。
- [x] `composables/useAssessmentFlow.ts` 管理流程状态、校验、提交和错误处理。

### ISSUE-VUE-03：保持真实 API 与外部 JSON 兼容

**Status**: Done

- [x] 保持 `POST /resume-text`、`POST /capability-evidence`、`POST /role-profile` 不变。
- [x] 保持 `capability_profile` 和 `role_capability_profile` 输出结构不变。
- [x] API 不可用时显示明确错误，不生成 mock 报告。
- [x] 不接主项目登录、数据库、学生路由或权限。

### ISSUE-VUE-04：文档和 legacy 标记

**Status**: Done

- [x] README 指向新 `app/` 主入口。
- [x] 演示脚本改为 `npm install`、`npm run dev` 和两个 Python API。
- [x] `demo/README.md` 标记旧静态版本为 legacy。
- [x] 本地 issue 文档记录 Vite/Vue app upgrade。

### Vite/Vue 验证命令

```powershell
cd C:\code\career\agent\capability-assessment\app
npm run build

cd C:\code\career
.\.venv\Scripts\python.exe -m compileall agent\capability-assessment\rag-spike\scripts
```

## Profile Flow Upgrade

本轮目标：把线性流程 `信息填写 -> 问卷 -> 报告` 改成 `信息填写 -> 是否立即问卷 -> 个人界面`。个人界面始终展示理想岗位雷达；完成问卷后再展示个人能力雷达。

### ISSUE-PF-01：岗位 JD 改为预置选项 + 其他

**Status**: Done

- [x] 预置岗位第一版使用 `互联网产品经理实习生` 和 `数据分析实习生`。
- [x] 选择预置岗位时自动写入 `targetRole` 和 `targetJd`。
- [x] 预置 JD 在文本框中展示但不可修改。
- [x] 选择 `其他` 时可编辑岗位名称和详细 JD。
- [x] 选择 `其他` 且缺少岗位名称或 JD 时不能进入下一步。

### ISSUE-PF-02：问卷改为可延后

**Status**: Done

- [x] 简历和岗位填写完成后进入问卷选择页。
- [x] 用户可以选择“现在填写问卷”。
- [x] 用户可以选择“稍后填写，进入个人界面”。
- [x] 跳过问卷时先调用 RAG API 生成理想岗位雷达。
- [x] 未完成问卷时不调用 Ability API，不生成 `capability_profile`。

### ISSUE-PF-03：报告并入个人界面

**Status**: Done

- [x] 新增个人界面，替代独立最终报告页。
- [x] 个人界面展示岗位名称、JD 摘要和理想岗位能力雷达。
- [x] 未完成问卷时，个人能力雷达区域展示空状态和“去填写问卷”按钮。
- [x] 完成问卷后，个人界面展示个人能力雷达、优势、差距、能力明细和开发数据折叠区。
- [x] 从个人界面可进入问卷，提交后回到个人界面。

### Profile Flow 验证命令

```powershell
cd C:\code\career\agent\capability-assessment\app
npm run build
```

手动场景：

- 选择 `互联网产品经理实习生`：JD 自动显示且不可编辑。
- 选择 `数据分析实习生`：JD 自动显示且不可编辑。
- 选择 `其他`：岗位名称和 JD 可编辑；未填写完整时不能进入下一步。
- 填完信息后选择“稍后填写”：进入个人界面，显示理想岗位雷达，个人能力雷达显示未测试空状态。
- 在个人界面点击“去填写问卷”，完成 48 题后返回个人界面，显示个人能力雷达和能力明细。
- 填完信息后选择“现在填写”：完成问卷后直接进入个人界面并看到两个雷达。
- RAG API 不可用时，跳过问卷进入个人界面的路径显示明确错误。
- Ability API 不可用时，问卷提交路径显示明确错误。
