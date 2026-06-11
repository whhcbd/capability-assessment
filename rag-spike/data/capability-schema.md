# 能力维度 Schema 摘要

本文件用于 RAG spike，约束岗位能力需求图只能使用以下 8 个 capability keys。

## Capability Keys

| Key | 中文名 | 说明 |
| --- | --- | --- |
| `communication_expression` | 沟通表达能力 | 清晰表达、结构化讲述、回应问题、传递信息。 |
| `logical_analysis` | 逻辑分析能力 | 拆解问题、识别因果、建立框架、形成判断。 |
| `learning_adaptability` | 学习适应能力 | 快速学习新知识、新工具、新环境并调整方法。 |
| `execution_ownership` | 执行推进能力 | 目标拆解、行动推进、按时交付、承担结果。 |
| `collaboration_leadership` | 协作与领导力 | 团队协作、协调资源、推动他人、处理分歧。 |
| `self_awareness_motivation` | 自我认知与职业动机 | 理解自身优势、短板、兴趣、价值观和职业选择原因。 |
| `data_digital_literacy` | 数据与数字化思维 | 使用数据、工具、数字化方法支持分析和决策。 |
| `business_industry_understanding` | 商业与行业理解 | 理解行业、商业模式、用户需求、组织目标和市场环境。 |

## role_capability_profile 输出要求

真实 RAG 输出必须兼容：

```json
{
  "role_id": "internet_product_intern",
  "role_name": "互联网产品经理实习生",
  "profile_version": "v1",
  "source_type": "rag_generated_role_profile",
  "rag_status": "generated",
  "source_refs": ["product-manager-intern-jd.md#1", "internet-role-capability-guide.md#3"],
  "requirements": {
    "communication_expression": {
      "required_level": 75,
      "weight": 0.2,
      "requirement_summary": "需要清晰表达产品思路、用户问题和方案取舍。"
    }
  }
}
```

字段约束：

- `required_level` 范围为 `0-100`。
- `weight` 范围为 `0.00-1.00`。
- `requirements` 的 key 必须来自上方 8 个 capability keys。
- `requirement_summary` 必须说明岗位为什么需要该能力。
- 不允许输出岗位推荐、匹配度报告、训练建议、课程推荐或简历生成内容。
