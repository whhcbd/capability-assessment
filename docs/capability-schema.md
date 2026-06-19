# 共享能力维度 Schema

## 1. 设计目的

能力评估智能体、职位推荐智能体、简历助手智能体、面试陪练智能体需要使用同一套能力维度 key。

能力评估智能体负责生成用户能力图和岗位能力需求图。如果每个智能体各自定义能力名，职位推荐、简历助手和面试陪练将无法复用同一份能力模型。统一 schema 的目标是让四个智能体共享同一种能力语言。

当前主入口 `app/` 保留本文档的 8 个 `capability_key` 作为跨模块兼容底座。v2 岗位侧画像主展示改为岗位专属 6 维 `role_dimensions`，每个岗位维度必须映射到一个或多个统一 `capability_key`。用户侧 LLM evidence 仍输出 8 维能力证据，前端报告再按岗位维度映射汇总。

## 2. Capability Keys

| Key | 中文名 | 说明 |
| --- | --- | --- |
| `communication_expression` | 沟通表达能力 | 清晰表达、结构化讲述、回应问题、传递信息。 |
| `logical_analysis` | 逻辑分析能力 | 拆解问题、识别因果、建立框架、形成判断。 |
| `learning_adaptability` | 学习适应能力 | 快速学习新知识、新工具、新环境并调整方法。 |
| `execution_ownership` | 执行推进能力 | 目标拆解、行动推进、按时交付、承担结果。 |
| `collaboration_leadership` | 协作与领导力 | 团队协作、协调资源、推动他人、处理分歧。 |
| `self_awareness_motivation` | 自我认知与职业动机 | 理解自身优势、短板、兴趣、价值观和职业选择原因。 |
| `data_digital_literacy` | 数据与数字化思维 | 使用数据、工具和数字化方法支持分析和决策。 |
| `business_industry_understanding` | 商业与行业理解 | 理解行业、商业模式、用户需求、组织目标和市场环境。 |

## 3. 用户能力画像

能力评估智能体输出用户侧能力画像。

```json
{
  "user_id": "demo_user_001",
  "profile_version": "v1",
  "generated_at": "2026-06-05T00:00:00+08:00",
  "capability_profile": {
    "communication_expression": {
      "score": 78,
      "confidence": 0.72,
      "evidence_sources": ["resume_text", "dialogue_answer", "self_assessment"],
      "evidence_summary": "用户有社团展示和项目沟通经历，回答结构较清晰。",
      "improvement_advice": "今天选一个项目写 90 秒表达稿，补齐背景、个人动作、结果指标和复盘。"
    }
  }
}
```

字段说明：

| Field | Type | Required | 说明 |
| --- | --- | --- | --- |
| `user_id` | string | yes | 用户 ID。独立 demo 默认使用 `demo_user_001`。 |
| `profile_version` | string | yes | 能力画像版本，首版为 `v1`。 |
| `generated_at` | string | yes | ISO 8601 时间。 |
| `capability_profile` | object | yes | 以 capability key 为字段名的能力画像。 |
| `score` | number | yes | 能力分数，范围 `0-100`。 |
| `confidence` | number | yes | 置信度，范围 `0.00-1.00`。 |
| `evidence_sources` | string[] | yes | 证据来源。 |
| `evidence_summary` | string | yes | 支撑该分数的简短证据说明。 |
| `improvement_advice` | string | yes | LLM 生成的针对目标岗位、该能力和当前证据的具体改进建议，应落到今天或本周可执行动作。 |

## 4. 证据来源

首版支持：

| Source | 说明 |
| --- | --- |
| `resume_text` | 用户粘贴的简历、项目、实习或经历文本。 |
| `dialogue_answer` | 用户对固定能力评估问题的回答。当前 `app/` 主流程暂不采集固定问答，但保留该 source 以兼容历史 demo 和后续扩展。 |
| `self_assessment` | 用户完成的自评问卷或量表。 |

后续可扩展：

| Source | 说明 |
| --- | --- |
| `interview_simulation` | 面试陪练智能体回写的面试表现。 |
| `advisor_note` | 职业顾问记录或评价。 |
| `behavior_event` | 系统中的学习、投递、活动参与等行为数据。 |

## 5. 岗位能力需求图

岗位能力需求图由能力评估智能体负责生成。v2 主展示字段是 `role_dimensions`，固定 6 个岗位专属维度；`requirements` 继续保留为兼容字段，由 `role_dimensions.mapped_capability_keys` 派生。

示例：

```json
{
  "role_id": "internet_product_intern",
  "role_name": "互联网产品经理实习生",
  "profile_version": "v2",
  "source_type": "rag_generated_role_profile",
  "rag_status": "generated",
  "source_refs": ["product-manager-intern-jd.md#1", "internet-role-capability-guide.md#3"],
  "role_dimensions": [
    {
      "dimension_id": "user_research_insight",
      "label": "用户洞察与需求定义",
      "description": "能从用户、场景、痛点和业务目标中定义真实问题。",
      "required_level": 82,
      "weight": 0.2,
      "mapped_capability_keys": ["logical_analysis", "business_industry_understanding"],
      "evaluation_method": "结合简历中的调研/分析案例、问卷自评和模型判断。",
      "questionnaire_focus": "考察是否做过需求澄清、问题拆解、证据判断和优先级取舍。",
      "knowledge_basis": "依据 JD、本地岗位指南和检索资料。",
      "improvement_direction": "补充一个用户问题拆解案例，写清目标、证据、取舍和结果。"
    }
  ],
  "requirements": {
    "communication_expression": {
      "required_level": 75,
      "weight": 0.2,
      "requirement_summary": "需要清晰表达产品思路、用户问题和方案取舍。"
    },
    "logical_analysis": {
      "required_level": 80,
      "weight": 0.25,
      "requirement_summary": "需要能拆解业务问题、用户路径和产品指标。"
    }
  }
}
```

字段说明：

| Field | Type | Required | 说明 |
| --- | --- | --- | --- |
| `role_id` | string | yes | 岗位或职业方向 ID。 |
| `role_name` | string | yes | 岗位或职业方向名称。 |
| `profile_version` | string | yes | 岗位能力需求图版本；当前 `app/` 主流程使用 `v2`。 |
| `source_type` | string | yes | 来源类型。当前真实 RAG 使用 `rag_generated_role_profile`；legacy mock 输出可保留 `mock_rag_placeholder`。 |
| `rag_status` | string | yes | RAG 状态。当前真实 RAG 使用 `generated`；legacy mock 输出可保留 `placeholder`。 |
| `source_refs` | string[] | yes | 当前真实 RAG 使用 `file.md#chunk_index` 或私有 PDF 知识库的 `file.pdf#page_页码#chunk_序号` 记录检索资料来源；legacy mock 输出可能是内置资料名。 |
| `role_dimensions` | object[] | yes in v2 | 固定 6 个岗位专属能力维度，是报告和雷达的主展示结构。 |
| `dimension_id` | string | yes | 岗位维度 ID，小写英文、数字和下划线。 |
| `label` | string | yes | 岗位语言下的能力名称。 |
| `mapped_capability_keys` | string[] | yes | 映射到第 2 节的 8 个统一 key，至少 1 个。 |
| `evaluation_method` | string | yes | 第一版如何结合简历证据、问卷自评和模型判断评价。 |
| `questionnaire_focus` | string | yes | 该维度的行为锚定自评题设计方向。 |
| `knowledge_basis` | string | yes | 该维度依据的 JD、岗位指南、知识库或行业资料。 |
| `improvement_direction` | string | yes | 该维度的近期提升方向。 |
| `requirements` | object | yes | 以 capability key 为字段名的岗位能力要求。 |
| `required_level` | number | yes | 该岗位所需能力水平，范围 `0-100`。 |
| `weight` | number | yes | 该能力在岗位中的相对重要性，范围 `0.00-1.00`。 |
| `requirement_summary` | string | yes | 该岗位为什么需要该能力的简短说明。 |

## 6. LLM 局部评分输出

单次简历分析或问答分析输出局部证据，不直接覆盖完整能力画像。

```json
{
  "source_type": "dialogue_answer",
  "source_id": "question_01",
  "capability_evidence": [
    {
      "capability_key": "communication_expression",
      "score": 76,
      "confidence": 0.68,
      "evidence_summary": "用户能按背景、行动、结果描述项目经历。",
      "improvement_advice": "今天补一段沟通案例，写清楚沟通对象、分歧点、你的表达方式和结果。"
    }
  ]
}
```

字段约束：

- `capability_key` 必须来自本文档第 2 节。
- `score` 必须在 `0-100` 之间。
- `confidence` 必须在 `0.00-1.00` 之间。
- `evidence_summary` 必须说明评分依据。
- `improvement_advice` 必须由 LLM 根据目标岗位、当前能力、简历证据和问卷结果生成，建议要具体到可马上执行的动作。
- 不允许在该输出中生成岗位推荐、匹配报告或训练建议。

## 7. 报告展示文案

正式后端 `POST /assessments/capability-evidence` 的 LLM 输出除 `evidence` 外，还应包含 `report_content`。该字段用于个人界面的能力明细和 4 周提升计划，前端只负责渲染，不再套固定文案模板。

```json
{
  "report_content": {
    "capability_details": [
      {
        "role_dimension_id": "user_research_insight",
        "role_application": "该岗位最看重能否把模糊需求转成**清晰的用户场景和优先级**。",
        "personal_assessment": "简历中技术实现证据较多，但缺少**用户需求拆解案例**。",
        "improvement_advice": "本周补一页**用户痛点、约束、优先级和验收标准**。"
      }
    ],
    "improvement_plan": [
      {
        "title": "工具提升（第 1 周）",
        "items": ["每天 1 小时完成一个工具产出，沉淀**可展示作品**。"]
      }
    ]
  }
}
```

约束：

- `capability_details` 应尽量与 v2 `role_dimensions` 一一对应，使用 `role_dimension_id` 关联。
- `role_application`、`personal_assessment`、`improvement_advice` 必须由 LLM 根据岗位、简历、问卷和岗位维度生成。
- `improvement_plan` 必须是 4 个模块，围绕 4 周可执行计划组织。
- 展示文案可使用 `**重点内容**` 标记加粗；加粗由 LLM 根据内容选择，不能机械加粗固定模板句式。
- 前端不得直接渲染 HTML，只允许把安全转义后的 `**...**` 转为粗体。

## 8. 自评解释边界

自评问卷产生的 `self_assessment` evidence 只能表示用户当前的自评倾向。最终报告必须结合简历文本、固定问答或其他行为证据解释：

- 高自评但缺少经历证据时，应提示补充行为证据。
- 低自评不等于能力差，也可能表示经历不足、表达不足或自信不足。
- `confidence` 应随多来源证据一致性提高，不能只因自评完成度高就给出高可信度。
