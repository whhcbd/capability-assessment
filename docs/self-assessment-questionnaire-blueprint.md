# 职业能力自评问卷蓝图

本蓝图用于解释当前 `app/` 中 48 道自评题的结构。问卷参考《Scale Development: Theory and Applications》的题项开发思路，先定义构念和行为指标，再写题项；参考《Competence at Work》和结构化面试资料，将题目尽量写成可观察行为、经历证据或行为频率，而不是抽象自我评价。

当前版本是职业发展自评原型，不是正式心理测评量表。题目不复制公开心理量表原题，后续需要经过学生预测试、题项分析和老师审阅继续迭代。

## 反应格式

每题使用 1-5 行为表现/证据强度：

| 分值 | 含义 |
| --- | --- |
| 1 | 很少出现 / 缺少证据 |
| 2 | 偶尔出现 |
| 3 | 有要求时能做到 |
| 4 | 多数场景能主动做到 |
| 5 | 稳定做到并能举出结果 |

## 题项蓝图

| Capability key | 行为指标 | 题项数量 | 预期证据类型 |
| --- | --- | --- | --- |
| `communication_expression` | 结构化讲述 | 2 | 项目表达证据 |
| `communication_expression` | 受众适配 | 2 | 沟通对象调整 |
| `communication_expression` | 回应追问 | 2 | 追问回应证据 |
| `logical_analysis` | 问题拆解 | 2 | 分析框架证据 |
| `logical_analysis` | 证据判断 | 2 | 事实推理证据 |
| `logical_analysis` | 优先级取舍 | 2 | 方案取舍证据 |
| `learning_adaptability` | 学习路径 | 2 | 新领域学习证据 |
| `learning_adaptability` | 迁移应用 | 2 | 经验迁移证据 |
| `learning_adaptability` | 变化应对 | 2 | 调整策略证据 |
| `execution_ownership` | 目标拆解 | 2 | 计划推进证据 |
| `execution_ownership` | 进度与风险 | 2 | 风险管理证据 |
| `execution_ownership` | 结果负责 | 2 | 交付结果证据 |
| `collaboration_leadership` | 目标对齐 | 2 | 协作沟通证据 |
| `collaboration_leadership` | 资源协调 | 2 | 协调资源证据 |
| `collaboration_leadership` | 推动他人 | 2 | 团队推进证据 |
| `self_awareness_motivation` | 职业动机 | 2 | 目标选择证据 |
| `self_awareness_motivation` | 优势短板 | 2 | 自我复盘证据 |
| `self_awareness_motivation` | 反馈调整 | 2 | 求职迭代证据 |
| `data_digital_literacy` | 数据取证 | 2 | 数据支持证据 |
| `data_digital_literacy` | 工具应用 | 2 | 工具实践证据 |
| `data_digital_literacy` | 业务转化 | 2 | 数据到行动证据 |
| `business_industry_understanding` | 行业理解 | 2 | 行业研究证据 |
| `business_industry_understanding` | 用户与价值 | 2 | 用户价值证据 |
| `business_industry_understanding` | 岗位连接 | 2 | 岗位理解证据 |

## 反向题规则

- 每个能力维度最多 1 道反向题。
- 反向题只用于轻量观察回答一致性，不用于“抓错”或降低用户体验。
- 如果出现大量同分、正反向题明显矛盾或全高分，报告只降低解释可信度，不直接判定用户能力差。

## 解释边界

- `score` 是当前输入下的能力倾向分。
- `confidence` 是证据支持程度。
- 高自评但缺少简历/问答证据时，应提示补充具体行为证据。
- 低分不等于能力差，也可能是经历不足、表达不足或证据不足。
