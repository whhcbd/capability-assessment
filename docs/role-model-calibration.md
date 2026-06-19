# 岗位能力模型调优记录

本文用于把 v2 岗位 6 维模型从“可生成”推进到“可用真实岗位样例持续校准”。Agent 可维护记录模板和字段；岗位合理性复核必须由人工完成。

## 调优对象

第一批样板岗位：

- 互联网产品经理实习生
- 数据分析实习生
- 电商运营实习生

后续扩展岗位必须先记录真实 JD 来源，再进入调优。

## 复核表模板

| 字段 | 内容 |
| --- | --- |
| calibration_id | `role_calibration_001` |
| role_name | 岗位名称 |
| role_source | 真实 JD 来源 |
| sample_id | 对应真实样例 ID |
| reviewer | 人工复核人 |
| review_date | YYYY-MM-DD |
| prompt_or_guide_version | prompt / 岗位指南版本或提交说明 |

## 岗位维度复核

| dimension_id | label | required_level | weight | mapped_capability_keys | 复核结论 | 调整建议 |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  | 合理 / 需调整 / 删除 / 新增替代 |  |

复核重点：

- 6 个维度是否真正使用岗位语言，而不是通用能力换名。
- 是否覆盖岗位核心工作场景。
- 权重是否符合真实 JD 的职责重心。
- `mapped_capability_keys` 是否能解释个人证据如何汇总到岗位维度。
- `evaluation_method` 是否说明简历、问卷和模型判断怎么结合。
- `questionnaire_focus` 是否能指导 AI 岗位问卷生成行为锚定题。
- `knowledge_basis` 是否能追溯到 JD、岗位指南或知识库。
- `improvement_direction` 是否足够具体。

## AI 岗位问卷复核

| question_id | role_dimension_id | capability_key | 题目质量 | 问题 |
| --- | --- | --- | --- | --- |
|  |  |  | 合理 / 泛泛 / 重复 / 不可作答 |  |

必须检查：

- 15 题是否覆盖全部 6 个 `role_dimension_id`。
- 每题的 `capability_key` 是否属于该岗位维度的 `mapped_capability_keys` 或有合理解释。
- 题目是否能收集行为证据，而不只是询问态度。

## 变更记录

| 日期 | 变更对象 | 变更原因 | 调整内容 | 人工确认 |
| --- | --- | --- | --- | --- |
|  | prompt / 岗位指南 / schema / 前端展示 |  |  |  |

