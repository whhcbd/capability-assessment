import type { CapabilityKey, QuestionnaireItem } from "../types/profile";

interface BlueprintItem {
  text: string;
  reverse?: boolean;
}

interface IndicatorBlueprint {
  name: string;
  evidenceType: string;
  items: BlueprintItem[];
}

interface CapabilityBlueprint {
  capabilityKey: CapabilityKey;
  indicators: IndicatorBlueprint[];
}

export const likertLabels = [
  "很少出现 / 缺少证据",
  "偶尔出现",
  "有要求时能做到",
  "多数场景能主动做到",
  "稳定做到并能举出结果",
];

const questionnaireBlueprint: CapabilityBlueprint[] = [
  {
    capabilityKey: "communication_expression",
    indicators: [
      {
        name: "结构化讲述",
        evidenceType: "项目表达证据",
        items: [
          { text: "最近一次介绍项目或经历时，我能按背景、目标、个人行动、结果的顺序讲清楚。" },
          { text: "被要求压缩时间时，我能保留关键结论和证据，而不是只删掉细节。" },
        ],
      },
      {
        name: "受众适配",
        evidenceType: "沟通对象调整",
        items: [
          { text: "面对不同背景的人，我会调整术语、例子和表达深度。" },
          { text: "展示方案前，我会先判断对方最关心目标、风险、数据还是执行细节。" },
        ],
      },
      {
        name: "回应追问",
        evidenceType: "追问回应证据",
        items: [
          { text: "遇到质疑时，我经常只重复原观点，难以补充事实或例子。", reverse: true },
          { text: "被追问贡献或结果时，我能补充具体动作、证据或反馈。" },
        ],
      },
    ],
  },
  {
    capabilityKey: "logical_analysis",
    indicators: [
      {
        name: "问题拆解",
        evidenceType: "分析框架证据",
        items: [
          { text: "面对复杂任务时，我会先写出目标、约束、变量和判断标准。" },
          { text: "我能把一个模糊问题拆成几个可以分别验证的小问题。" },
        ],
      },
      {
        name: "证据判断",
        evidenceType: "事实推理证据",
        items: [
          { text: "做判断前，我会区分事实、推测和个人感受。" },
          { text: "形成结论前，我会主动寻找反例或替代解释。" },
        ],
      },
      {
        name: "优先级取舍",
        evidenceType: "方案取舍证据",
        items: [
          { text: "信息不足时，我常常只能凭直觉推进，难以说明判断依据。", reverse: true },
          { text: "比较多个方案时，我能说明优先级、取舍理由和潜在风险。" },
        ],
      },
    ],
  },
  {
    capabilityKey: "learning_adaptability",
    indicators: [
      {
        name: "学习路径",
        evidenceType: "新领域学习证据",
        items: [
          { text: "接触新工具或新领域时，我会先确定学习目标、资料来源和练习任务。" },
          { text: "我能在较短时间内做出一个小样例，验证自己是否真的学会。" },
        ],
      },
      {
        name: "迁移应用",
        evidenceType: "经验迁移证据",
        items: [
          { text: "我会把一次任务中有效的方法迁移到新的课程、项目或实习场景。" },
          { text: "遇到类似问题时，我能复用已有框架，同时根据新限制做调整。" },
        ],
      },
      {
        name: "变化应对",
        evidenceType: "调整策略证据",
        items: [
          { text: "任务要求变化时，我经常明显慌乱，难以重新组织行动。", reverse: true },
          { text: "原方法失效时，我能快速复盘原因并改用新的策略。" },
        ],
      },
    ],
  },
  {
    capabilityKey: "execution_ownership",
    indicators: [
      {
        name: "目标拆解",
        evidenceType: "计划推进证据",
        items: [
          { text: "接到任务后，我会拆出任务清单、时间节点和可检查结果。" },
          { text: "任务不清晰时，我会主动确认下一步，而不是只等待别人安排。" },
        ],
      },
      {
        name: "进度与风险",
        evidenceType: "风险管理证据",
        items: [
          { text: "推进任务时，我会记录进度、阻塞点和需要他人配合的事项。" },
          { text: "发现延期或质量风险时，我会尽早暴露并提出调整方案。" },
        ],
      },
      {
        name: "结果负责",
        evidenceType: "交付结果证据",
        items: [
          { text: "如果没有外部催促，我很难持续推进任务。", reverse: true },
          { text: "任务结束后，我会用交付物、反馈或数据判断是否真正完成。" },
        ],
      },
    ],
  },
  {
    capabilityKey: "collaboration_leadership",
    indicators: [
      {
        name: "目标对齐",
        evidenceType: "协作沟通证据",
        items: [
          { text: "和他人意见不同的时候，我会先澄清共同目标，再讨论方案。" },
          { text: "团队讨论跑偏时，我能把大家拉回事实、目标和下一步行动。" },
        ],
      },
      {
        name: "资源协调",
        evidenceType: "协调资源证据",
        items: [
          { text: "我能识别团队成员分别需要什么信息、支持或决策。" },
          { text: "需要跨人协作时，我会主动明确分工、时间点和交付标准。" },
        ],
      },
      {
        name: "推动他人",
        evidenceType: "团队推进证据",
        items: [
          { text: "合作中我通常只完成自己的部分，很少关心整体进展。", reverse: true },
          { text: "我能举出一次自己推动会议、分工、跟进或复盘的经历。" },
        ],
      },
    ],
  },
  {
    capabilityKey: "self_awareness_motivation",
    indicators: [
      {
        name: "职业动机",
        evidenceType: "目标选择证据",
        items: [
          { text: "我能说明自己为什么关注某个岗位或行业，并连接到具体经历。" },
          { text: "谈到目标岗位时，我能说出吸引我的工作内容，而不是只说热门或稳定。" },
        ],
      },
      {
        name: "优势短板",
        evidenceType: "自我复盘证据",
        items: [
          { text: "我知道自己目前最需要补强的能力，并能举出原因或例子。" },
          { text: "评价自己优势时，我会用经历、结果或他人反馈作为依据。" },
        ],
      },
      {
        name: "反馈调整",
        evidenceType: "求职迭代证据",
        items: [
          { text: "谈到职业选择时，我经常说不出具体原因。", reverse: true },
          { text: "收到反馈后，我能调整求职材料、练习重点或目标岗位表达。" },
        ],
      },
    ],
  },
  {
    capabilityKey: "data_digital_literacy",
    indicators: [
      {
        name: "数据取证",
        evidenceType: "数据支持证据",
        items: [
          { text: "做判断时，我会主动寻找数据、事实或用户反馈，而不是只凭印象。" },
          { text: "我能说明一次用数据或事实改变判断的经历。" },
        ],
      },
      {
        name: "工具应用",
        evidenceType: "工具实践证据",
        items: [
          { text: "我能使用 Excel、SQL、Python、BI 或问卷工具完成基础数据任务。" },
          { text: "处理数据时，我会关注样本、口径、缺失值或异常值。" },
        ],
      },
      {
        name: "业务转化",
        evidenceType: "数据到行动证据",
        items: [
          { text: "我很少主动用数据验证自己的观点。", reverse: true },
          { text: "我能把数据结论转化成产品、业务、运营或项目行动建议。" },
        ],
      },
    ],
  },
  {
    capabilityKey: "business_industry_understanding",
    indicators: [
      {
        name: "行业理解",
        evidenceType: "行业研究证据",
        items: [
          { text: "准备目标岗位时，我会研究行业用户、业务模式和竞争格局。" },
          { text: "我能说出目标行业最近的变化，以及它可能影响哪些岗位任务。" },
        ],
      },
      {
        name: "用户与价值",
        evidenceType: "用户价值证据",
        items: [
          { text: "分析产品或服务时，我能说明它为谁解决什么问题、创造什么价值。" },
          { text: "我能把个人项目经历和真实用户、业务或组织目标联系起来。" },
        ],
      },
      {
        name: "岗位连接",
        evidenceType: "岗位理解证据",
        items: [
          { text: "我通常只关注岗位要求，很少理解公司和行业背景。", reverse: true },
          { text: "我能说出一个岗位在组织中承担的价值，而不只是列职责。" },
        ],
      },
    ],
  },
];

export const questionnaireItems: QuestionnaireItem[] = questionnaireBlueprint
  .flatMap((group) =>
    group.indicators.flatMap((indicator) =>
      indicator.items.map((item) => ({
        capabilityKey: group.capabilityKey,
        indicator: indicator.name,
        evidenceType: indicator.evidenceType,
        text: item.text,
        reverse: Boolean(item.reverse),
      })),
    ),
  )
  .map((item, index) => ({
    id: `qa_${String(index + 1).padStart(2, "0")}`,
    ...item,
  }));
