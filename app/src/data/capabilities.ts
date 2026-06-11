import type { CapabilityInfo, CapabilityKey } from "../types/profile";

export const capabilityKeys: CapabilityKey[] = [
  "communication_expression",
  "logical_analysis",
  "learning_adaptability",
  "execution_ownership",
  "collaboration_leadership",
  "self_awareness_motivation",
  "data_digital_literacy",
  "business_industry_understanding",
];

export const capabilities: CapabilityInfo[] = [
  {
    key: "communication_expression",
    label: "沟通表达能力",
    short: "沟通表达",
    description: "清晰表达、结构化讲述、回应问题、传递信息。",
  },
  {
    key: "logical_analysis",
    label: "逻辑分析能力",
    short: "逻辑分析",
    description: "拆解问题、识别因果、建立框架、形成判断。",
  },
  {
    key: "learning_adaptability",
    label: "学习适应能力",
    short: "学习适应",
    description: "快速学习新知识、新工具、新环境，并调整方法。",
  },
  {
    key: "execution_ownership",
    label: "执行推进能力",
    short: "执行推进",
    description: "目标拆解、行动推进、按时交付、承担结果。",
  },
  {
    key: "collaboration_leadership",
    label: "协作与领导力",
    short: "协作领导",
    description: "团队协作、协调资源、推动他人、处理分歧。",
  },
  {
    key: "self_awareness_motivation",
    label: "自我认知与职业动机",
    short: "职业动机",
    description: "理解自身优势、短板、兴趣、价值观和职业选择原因。",
  },
  {
    key: "data_digital_literacy",
    label: "数据与数字化思维",
    short: "数据思维",
    description: "使用数据、工具、数字化方法支持分析和决策。",
  },
  {
    key: "business_industry_understanding",
    label: "商业与行业理解",
    short: "行业理解",
    description: "理解行业、商业模式、用户需求、组织目标和市场环境。",
  },
];

export function capabilityByKey(key: CapabilityKey): CapabilityInfo {
  return capabilities.find((capability) => capability.key === key) ?? capabilities[0];
}
