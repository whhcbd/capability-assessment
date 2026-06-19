# 主客观结合能力评价框架

本文定义能力评估的证据来源、权重口径、缺失处理和展示边界，用于承接 6.15 会议提出的“主客观结合的量化体系”。

## 评价来源

| 来源 | 当前状态 | 输入 | 输出 | 说明 |
| --- | --- | --- | --- | --- |
| 结构化自评 | 已实现 | 10 题、48 题或 AI 岗位问卷的 1-5 分答案 | `self_assessment` / `questionnaire` evidence | 反映用户自我感知，不能单独代表真实能力。 |
| 简历证据 | 已实现 | 简历文本、项目经历、实习经历 | `resume_text` evidence | 用于补充行为证据和产出证据。 |
| 模型评价 | 已实现 | 简历、问卷、岗位要求、岗位维度 | LLM evidence 与 `report_content` | 用于综合判断、解释差距、生成建议。 |
| 人工评价 | 未实现 | HR、老师、面试官、行业专家评价 | 后续 `advisor_note` 或人工评分字段 | 第一版只预留口径，不做自动生成。 |
| 面试表现 | 未实现 | Interview Agent 记录和报告 | 后续 `interview_simulation` evidence | 需要先定义 `competencyId` 到 8 个 `capability_key` 的映射。 |

## 建议权重口径

第一版报告展示建议使用以下说明口径，不直接宣称是最终评分标准：

| 来源组合 | 建议权重 |
| --- | --- |
| 简历证据 + 模型评价 | 60% |
| 结构化自评 | 25% |
| 人工评价 | 15% |

缺失处理：

- 人工评价缺失时，报告必须标注“未含人工评价”。
- 人工评价缺失时，可在已有来源内重标化，但不能把结果描述为企业或 HR 最终判断。
- 简历证据不足时，`confidence` 应降低，报告应提示补充行为证据。
- 只有自评、缺少简历或项目证据时，不应给出高可信度结论。

## 解释规则

| 场景 | 解释方式 |
| --- | --- |
| 高自评 + 简历证据充足 | 可说明用户在该维度有相对优势，并指出可迁移到目标岗位的场景。 |
| 高自评 + 缺少经历证据 | 不直接判定能力强，应提示补充项目、实习或作品集证据。 |
| 低自评 + 简历证据较强 | 不直接判定能力差，应提示可能是表达不足、自信不足或对岗位标准理解不足。 |
| 低自评 + 证据不足 | 优先建议做小任务、小项目或结构化表达训练，增加可评价证据。 |
| 岗位权重高 + 个人差距大 | 应进入关键差距区，优先给出本周可执行动作。 |

## 人工评价边界

第一版不实现人工评价录入 UI。需要人工评价时，先按以下字段预留 contract：

```json
{
  "source_type": "advisor_note",
  "source_id": "advisor_2026_06_20_001",
  "evaluator_role": "HR / teacher / interviewer / industry_expert",
  "capability_evidence": [
    {
      "capability_key": "communication_expression",
      "score": 75,
      "confidence": 0.8,
      "evidence_summary": "面试官认为候选人能结构化说明项目，但追问下业务结果表达不足。",
      "improvement_advice": "补充一个 90 秒项目表达稿，突出目标、行动、结果和复盘。"
    }
  ]
}
```

## Interview Agent 映射责任边界

- Interview Agent 不应直接发明新的能力 key。
- Interview Agent 的 `competencyId` 必须映射到 `docs/capability-schema.md` 中的 8 个 `capability_key`。
- 映射表由能力评估仓库维护；面试模块只按约定回写。
- 一个 `competencyId` 可映射到多个 `capability_key`，但必须有主能力 key。
- 在映射表完成前，`interview_simulation` evidence 不进入主报告综合分。

