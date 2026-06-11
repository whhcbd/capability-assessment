const demoUserId = "demo_user_001";
const abilityApiUrl = "http://127.0.0.1:8766";
const ragApiUrl = "http://127.0.0.1:8765";

const capabilities = [
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
    description: "快速学习新知识、新工具、新环境并调整方法。",
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

const likertLabels = [
  "很少出现 / 缺少证据",
  "偶尔出现",
  "有要求时能做到",
  "多数场景能主动做到",
  "稳定做到并能举出结果",
];

const questionnaireBlueprint = [
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

const questionnaireItems = questionnaireBlueprint.flatMap((group) =>
  group.indicators.flatMap((indicator) =>
    indicator.items.map((item) => ({
      capabilityKey: group.capabilityKey,
      indicator: indicator.name,
      evidenceType: indicator.evidenceType,
      text: item.text,
      reverse: Boolean(item.reverse),
    })),
  ),
).map((item, index) => ({
  id: `qa_${String(index + 1).padStart(2, "0")}`,
  ...item,
}));

const app = document.querySelector("#app");

const initialState = {
  view: "start",
  currentQuestion: 0,
  resumeText: "",
  targetRole: "",
  targetJd: "",
  uploadedFileName: "",
  uploadStatus: "",
  error: "",
  isUploading: false,
  isAnalyzing: false,
  questionnaire: Object.fromEntries(questionnaireItems.map((item) => [item.id, null])),
  capabilityProfile: null,
  roleProfile: null,
  evidence: [],
  apiMeta: {},
};

let state = structuredClone(initialState);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function clampConfidence(value) {
  return Math.max(0, Math.min(1, Number(Number(value || 0).toFixed(2))));
}

function capabilityByKey(key) {
  return capabilities.find((item) => item.key === key) ?? capabilities[0];
}

function completedQuestionnaireCount() {
  return Object.values(state.questionnaire).filter((value) => value !== null).length;
}

function completionPercent() {
  return Math.round((completedQuestionnaireCount() / questionnaireItems.length) * 100);
}

function setView(view) {
  state.view = view;
  state.error = "";
  render();
}

function setError(message, view = state.view) {
  state.error = message;
  state.view = view;
  state.isUploading = false;
  state.isAnalyzing = false;
  render();
}

function createEmptyCapabilityProfile() {
  return Object.fromEntries(
    capabilities.map(({ key }) => [
      key,
      {
        score: 0,
        confidence: 0,
        evidence_sources: [],
        evidence_summary: "尚未生成能力证据。",
      },
    ]),
  );
}

function collectEvidenceItems(groups) {
  return groups.flatMap((group) =>
    (group.capability_evidence ?? []).map((item) => ({
      ...item,
      source_type: group.source_type,
      source_id: group.source_id,
    })),
  );
}

function mergeCapabilityProfile(evidenceGroups) {
  const grouped = Object.fromEntries(capabilities.map(({ key }) => [key, []]));
  collectEvidenceItems(evidenceGroups).forEach((item) => {
    if (grouped[item.capability_key]) grouped[item.capability_key].push(item);
  });
  const sourceWeight = {
    resume_text: 1.3,
    self_assessment: 0.72,
  };
  return Object.fromEntries(
    capabilities.map(({ key }) => {
      const items = grouped[key];
      if (!items.length) {
        return [
          key,
          {
            score: 42,
            confidence: 0.16,
            evidence_sources: [],
            evidence_summary: "当前输入中缺少可解释证据。",
          },
        ];
      }
      const totalWeight = items.reduce((sum, item) => sum + (sourceWeight[item.source_type] ?? 1), 0);
      const weightedScore =
        items.reduce((sum, item) => sum + Number(item.score || 0) * (sourceWeight[item.source_type] ?? 1), 0) /
        totalWeight;
      const averageConfidence =
        items.reduce((sum, item) => sum + Number(item.confidence || 0), 0) / Math.max(items.length, 1);
      const sources = [...new Set(items.map((item) => item.source_type))];
      const sourceDiversityBonus = Math.min(0.12, sources.length * 0.04);
      return [
        key,
        {
          score: clampScore(weightedScore),
          confidence: clampConfidence(averageConfidence + sourceDiversityBonus),
          evidence_sources: sources,
          evidence_summary: items
            .slice(0, 3)
            .map((item) => item.evidence_summary)
            .join(" "),
        },
      ];
    }),
  );
}

function normalizeRoleProfile(profile) {
  const requirements = profile?.requirements ?? {};
  return {
    role_id: profile?.role_id || "custom_target_role",
    role_name: profile?.role_name || state.targetRole,
    profile_version: profile?.profile_version || "v1",
    source_type: profile?.source_type || "rag_generated_role_profile",
    rag_status: profile?.rag_status || "generated",
    source_refs: Array.isArray(profile?.source_refs) ? profile.source_refs : [],
    requirements: Object.fromEntries(
      capabilities.map(({ key }) => {
        const item = requirements[key] ?? {};
        return [
          key,
          {
            required_level: clampScore(item.required_level ?? 55),
            weight: Number(item.weight ?? 0),
            requirement_summary: item.requirement_summary || "该能力要求由岗位资料生成，建议结合岗位 JD 阅读。",
          },
        ];
      }),
    ),
  };
}

function questionnairePayload() {
  return questionnaireItems.map((item) => ({
    id: item.id,
    capability_key: item.capabilityKey,
    indicator: item.indicator,
    text: item.text,
    score: Number(state.questionnaire[item.id]),
    reverse: item.reverse,
  }));
}

async function uploadResumeFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${abilityApiUrl}/resume-text`, {
    method: "POST",
    body: formData,
  });
  const result = await response.json();
  if (!response.ok || result.error) {
    throw new Error(result.error || `简历解析失败：HTTP ${response.status}`);
  }
  if (!result.text || !result.text.trim()) {
    throw new Error("未能提取到简历正文，请粘贴文字版简历。");
  }
  return result;
}

async function fetchCapabilityEvidence() {
  const response = await fetch(`${abilityApiUrl}/capability-evidence`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: demoUserId,
      resume_text: state.resumeText,
      target_role: state.targetRole,
      questionnaire_answers: questionnairePayload(),
      timeout: 120,
      retries: 1,
    }),
  });
  const result = await response.json();
  if (!response.ok || result.error) {
    throw new Error(result.error || `Ability API HTTP ${response.status}`);
  }
  if (!Array.isArray(result.evidence) || !result.evidence.length) {
    throw new Error("Ability API 没有返回能力证据。");
  }
  return result;
}

async function fetchRoleProfile() {
  const query = `${state.targetRole}\n${state.targetJd}`.trim();
  const response = await fetch(`${ragApiUrl}/role-profile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role_id: "custom_target_role",
      role_name: state.targetRole,
      query,
      jd_text: query,
      top_k: 5,
      timeout: 120,
      retries: 1,
    }),
  });
  const result = await response.json();
  if (!response.ok || result.error) {
    throw new Error(result.error || `RAG API HTTP ${response.status}`);
  }
  if (!result.profile) {
    throw new Error("RAG API 没有返回岗位能力画像。");
  }
  return result;
}

function validateIntake() {
  if (!state.resumeText.trim()) return "请上传或粘贴一份文字版简历。";
  if (!state.targetRole.trim()) return "请填写心仪职业。";
  return "";
}

function validateQuestionnaire() {
  const missingIndex = questionnaireItems.findIndex((item) => state.questionnaire[item.id] === null);
  if (missingIndex >= 0) {
    state.currentQuestion = missingIndex;
    return `请先完成第 ${missingIndex + 1} 题。`;
  }
  return "";
}

async function runAssessment() {
  const questionnaireError = validateQuestionnaire();
  if (questionnaireError) {
    setError(questionnaireError, "quiz");
    return;
  }
  state.view = "analyzing";
  state.error = "";
  state.isAnalyzing = true;
  render();
  try {
    const [capabilityResult, roleResult] = await Promise.all([fetchCapabilityEvidence(), fetchRoleProfile()]);
    state.evidence = capabilityResult.evidence;
    state.capabilityProfile = mergeCapabilityProfile(capabilityResult.evidence);
    state.roleProfile = normalizeRoleProfile(roleResult.profile);
    state.apiMeta = {
      ability: {
        model: capabilityResult.deepseek_model,
        elapsed_seconds: capabilityResult.elapsed_seconds,
        status: capabilityResult.llm_status,
      },
      role: {
        model: roleResult.deepseek_model,
        elapsed_seconds: roleResult.elapsed_seconds,
        retrieved_chunks: roleResult.retrieved_chunks ?? [],
      },
    };
    state.view = "report";
    state.isAnalyzing = false;
    render();
  } catch (error) {
    setError(
      `无法生成报告：${error.message}。请确认 Ability API、RAG API 已启动，并已配置 DEEPSEEK_API_KEY。`,
      "error",
    );
  }
}

function overallScore() {
  const profile = state.capabilityProfile ?? createEmptyCapabilityProfile();
  const scores = Object.values(profile).map((item) => item.score);
  return clampScore(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}

function capabilityRows() {
  const profile = state.capabilityProfile ?? createEmptyCapabilityProfile();
  const requirements = state.roleProfile?.requirements ?? {};
  return capabilities
    .map((capability) => {
      const user = profile[capability.key] ?? {};
      const role = requirements[capability.key] ?? {};
      const required = clampScore(role.required_level ?? 0);
      const score = clampScore(user.score ?? 0);
      return {
        ...capability,
        score,
        confidence: clampConfidence(user.confidence ?? 0),
        evidence_sources: user.evidence_sources ?? [],
        evidence_summary: user.evidence_summary ?? "暂无证据摘要。",
        required,
        gap: Math.max(0, required - score),
        surplus: Math.max(0, score - required),
        requirement_summary: role.requirement_summary ?? "暂无岗位要求摘要。",
      };
    })
    .sort((a, b) => b.required - a.required);
}

function topStrengths() {
  return [...capabilityRows()].sort((a, b) => b.surplus - a.surplus || b.score - a.score).slice(0, 3);
}

function topGaps() {
  return [...capabilityRows()].sort((a, b) => b.gap - a.gap || b.required - a.required).slice(0, 3);
}

function sourceLabel(source) {
  const labels = {
    resume_text: "简历证据",
    self_assessment: "问卷自评",
  };
  return labels[source] ?? source;
}

function createRadarSvg(profile, options = {}) {
  const { requirements = null, title = "能力雷达图" } = options;
  const size = 360;
  const center = size / 2;
  const radius = 124;
  const steps = [0.25, 0.5, 0.75, 1];
  const pointFor = (index, valueRadius) => {
    const angle = (Math.PI * 2 * index) / capabilities.length - Math.PI / 2;
    return [center + Math.cos(angle) * valueRadius, center + Math.sin(angle) * valueRadius];
  };
  const polygonFor = (values) =>
    capabilities
      .map((_, index) => pointFor(index, (Math.max(0, Math.min(100, values[index])) / 100) * radius).join(","))
      .join(" ");
  const userValues = capabilities.map(({ key }) => profile?.[key]?.score ?? 0);
  const roleValues = capabilities.map(({ key }) => requirements?.[key]?.required_level ?? 0);
  const grid = steps
    .map((step) => {
      const points = capabilities.map((_, index) => pointFor(index, radius * step).join(",")).join(" ");
      return `<polygon class="radar-grid" points="${points}" />`;
    })
    .join("");
  const axes = capabilities
    .map((capability, index) => {
      const [x, y] = pointFor(index, radius + 25);
      const [x2, y2] = pointFor(index, radius);
      return `
        <line class="radar-axis" x1="${center}" y1="${center}" x2="${x2}" y2="${y2}" />
        <text class="radar-label" x="${x}" y="${y}" text-anchor="middle">${escapeHtml(capability.short)}</text>
      `;
    })
    .join("");
  return `
    <svg viewBox="0 0 ${size} ${size}" role="img" aria-label="${escapeHtml(title)}">
      ${grid}
      ${axes}
      ${requirements ? `<polygon class="radar-role" points="${polygonFor(roleValues)}" />` : ""}
      <polygon class="radar-user" points="${polygonFor(userValues)}" />
    </svg>
  `;
}

function renderProgress() {
  const labels = ["简历与职业", "问卷", "报告"];
  const active = state.view === "start" || state.view === "intake" ? 0 : state.view === "quiz" ? 1 : 2;
  return `
    <div class="top-progress" aria-label="流程进度">
      ${labels
        .map(
          (label, index) => `
            <span class="${index <= active ? "is-active" : ""}">
              <i>${index + 1}</i>${escapeHtml(label)}
            </span>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderShell(content) {
  const showProgress = !["start", "error"].includes(state.view);
  return `
    <main class="shell">
      ${showProgress ? renderProgress() : ""}
      ${content}
    </main>
  `;
}

function renderStartView() {
  return renderShell(`
    <section class="start-page">
      <p class="eyebrow">Career Capability Assessment</p>
      <h1>用一份简历和一套问卷，看清你与心仪职业的能力距离。</h1>
      <p class="lead">上传或粘贴简历，填写心仪职业，完成 48 道自评题。系统会生成你的能力雷达，并和目标职业要求进行对比。</p>
      <button class="primary large" type="button" data-action="start">开始评估</button>
      <p class="fine-print">结果用于职业发展自评和求职材料诊断，不是医学诊断、心理测评或录用判断。</p>
    </section>
  `);
}

function renderIntakeView() {
  return renderShell(`
    <section class="work-page intake-page">
      <div class="page-title">
        <p class="eyebrow">Step 1</p>
        <h1>先放入简历，再填写心仪职业。</h1>
      </div>
      ${state.error ? `<p class="notice error">${escapeHtml(state.error)}</p>` : ""}
      <div class="intake-grid">
        <section class="plain-section">
          <label class="field-label" for="resume-file">上传 Word 或文字版 PDF</label>
          <input id="resume-file" class="file-input" type="file" accept=".docx,.pdf" data-resume-file />
          <p class="field-help">${
            state.isUploading
              ? "正在解析文件..."
              : state.uploadStatus || "支持 .docx 和文字版 .pdf；扫描件 PDF 请直接粘贴文字版简历。"
          }</p>
          <label class="field-label" for="resume-text">简历正文</label>
          <textarea id="resume-text" rows="14" data-field="resumeText" placeholder="也可以直接粘贴你的简历、项目经历、实习经历或课程项目。">${escapeHtml(
            state.resumeText,
          )}</textarea>
        </section>
        <section class="plain-section">
          <label class="field-label" for="target-role">心仪职业</label>
          <input id="target-role" type="text" data-field="targetRole" value="${escapeHtml(
            state.targetRole,
          )}" placeholder="例如：互联网产品经理实习生" />
          <label class="field-label" for="target-jd">目标岗位 JD（可选）</label>
          <textarea id="target-jd" rows="9" data-field="targetJd" placeholder="如果你有具体 JD，可以粘贴在这里；没有也可以只填职业名称。">${escapeHtml(
            state.targetJd,
          )}</textarea>
          <div class="action-row">
            <button class="secondary" type="button" data-action="back-start">返回</button>
            <button class="primary" type="button" data-action="start-quiz">开始问卷</button>
          </div>
        </section>
      </div>
    </section>
  `);
}

function renderQuizView() {
  const item = questionnaireItems[state.currentQuestion];
  const capability = capabilityByKey(item.capabilityKey);
  const answer = state.questionnaire[item.id];
  const percent = Math.round(((state.currentQuestion + 1) / questionnaireItems.length) * 100);
  return renderShell(`
    <section class="work-page quiz-page">
      <div class="quiz-top">
        <span>第 ${state.currentQuestion + 1} / ${questionnaireItems.length} 题</span>
        <div class="progress-line"><i style="width:${percent}%"></i></div>
      </div>
      ${state.error ? `<p class="notice error">${escapeHtml(state.error)}</p>` : ""}
      <div class="question-block">
        <p class="eyebrow">${escapeHtml(capability.label)} · ${escapeHtml(item.indicator)}</p>
        <h1>${escapeHtml(item.text)}</h1>
        <div class="choice-list">
          ${likertLabels
            .map(
              (label, index) => `
                <button class="choice-button" type="button" data-answer="${index + 1}" aria-pressed="${
                  answer === index + 1
                }">
                  <strong>${index + 1}</strong>
                  <span>${escapeHtml(label)}</span>
                </button>
              `,
            )
            .join("")}
        </div>
      </div>
      <div class="quiz-actions">
        <button class="secondary" type="button" data-action="previous-question" ${
          state.currentQuestion === 0 ? "disabled" : ""
        }>上一题</button>
        <button class="primary" type="button" data-action="${
          state.currentQuestion === questionnaireItems.length - 1 ? "submit-assessment" : "next-question"
        }">
          ${state.currentQuestion === questionnaireItems.length - 1 ? "生成报告" : "下一题"}
        </button>
      </div>
    </section>
  `);
}

function renderAnalyzingView() {
  return renderShell(`
    <section class="analyzing-page">
      <div class="loader"></div>
      <h1>正在生成能力画像</h1>
      <p>系统正在读取简历证据、问卷结果和目标职业要求。请稍等片刻。</p>
    </section>
  `);
}

function renderErrorView() {
  return renderShell(`
    <section class="error-page">
      <p class="eyebrow">无法完成分析</p>
      <h1>请检查本地服务后重试。</h1>
      <p class="notice error">${escapeHtml(state.error || "服务暂时不可用。")}</p>
      <div class="command-box">
        <code>.\\.venv\\Scripts\\python.exe agent\\capability-assessment\\rag-spike\\scripts\\ability_api_server.py</code>
        <code>.\\.venv\\Scripts\\python.exe agent\\capability-assessment\\rag-spike\\scripts\\rag_api_server.py</code>
      </div>
      <div class="action-row">
        <button class="secondary" type="button" data-action="back-quiz">返回问卷</button>
        <button class="primary" type="button" data-action="retry-assessment">重试生成</button>
      </div>
    </section>
  `);
}

function renderReportView() {
  const rows = capabilityRows();
  const strengths = topStrengths();
  const gaps = topGaps();
  return renderShell(`
    <section class="report-page">
      <div class="report-head">
        <div>
          <p class="eyebrow">Assessment Report</p>
          <h1>${escapeHtml(state.targetRole)} 能力对比</h1>
          <p class="lead">综合分 ${overallScore()} / 100。请结合证据可信度阅读，不把低分直接理解为能力差。</p>
        </div>
        <button class="secondary" type="button" data-action="restart">重新评估</button>
      </div>
      <section class="radar-comparison">
        <div class="radar-panel">
          <h2>我的能力雷达</h2>
          ${createRadarSvg(state.capabilityProfile, { title: "我的能力雷达" })}
        </div>
        <div class="radar-panel">
          <h2>心仪职业雷达</h2>
          ${createRadarSvg(createEmptyCapabilityProfile(), {
            requirements: state.roleProfile.requirements,
            title: "心仪职业雷达",
          })}
        </div>
      </section>
      <section class="summary-grid">
        <div class="report-card">
          <h2>相对优势</h2>
          ${strengths.map(renderInsightRow).join("")}
        </div>
        <div class="report-card">
          <h2>优先补齐</h2>
          ${gaps.map(renderGapInsight).join("")}
        </div>
      </section>
      <section class="report-card report-list">
        <h2>能力明细</h2>
        ${rows.map(renderCapabilityRow).join("")}
      </section>
      <section class="advice-section">
        <h2>下一步建议</h2>
        <ul>
          <li>把差距最大的能力补成简历证据：写清楚场景、个人动作、结果和反馈。</li>
          <li>如果某项能力可信度低，优先补具体项目经历，不要只在面试里口头解释。</li>
          <li>围绕 ${escapeHtml(state.targetRole)} 重写一段求职动机，说明经历和岗位任务之间的连接。</li>
        </ul>
      </section>
      <details class="developer-details">
        <summary>开发数据</summary>
        <pre>${escapeHtml(JSON.stringify(buildJsonOutput(), null, 2))}</pre>
      </details>
    </section>
  `);
}

function renderInsightRow(item) {
  return `
    <div class="insight-row">
      <strong>${escapeHtml(item.label)}</strong>
      <span>当前 ${item.score} / 要求 ${item.required || "未标注"}</span>
    </div>
  `;
}

function renderGapInsight(item) {
  return `
    <div class="insight-row">
      <strong>${escapeHtml(item.label)}</strong>
      <span>${item.gap ? `差距 ${item.gap}` : "当前接近要求"}</span>
    </div>
  `;
}

function renderCapabilityRow(item) {
  const sources = item.evidence_sources.length ? item.evidence_sources.map(sourceLabel).join("、") : "证据不足";
  return `
    <div class="capability-row">
      <div>
        <strong>${escapeHtml(item.label)}</strong>
        <p>${escapeHtml(item.evidence_summary)}</p>
        <small>来源：${escapeHtml(sources)} · 可信度 ${Math.round(item.confidence * 100)}%</small>
      </div>
      <div class="score-stack">
        <span>我 ${item.score}</span>
        <span>职业 ${item.required}</span>
      </div>
    </div>
  `;
}

function buildJsonOutput() {
  return {
    user_id: demoUserId,
    target_role: state.targetRole,
    generated_at: new Date().toISOString(),
    capability_profile: state.capabilityProfile,
    role_capability_profile: state.roleProfile,
    api_meta: state.apiMeta,
  };
}

function renderCurrentView() {
  if (state.view === "intake") return renderIntakeView();
  if (state.view === "quiz") return renderQuizView();
  if (state.view === "analyzing") return renderAnalyzingView();
  if (state.view === "report") return renderReportView();
  if (state.view === "error") return renderErrorView();
  return renderStartView();
}

function render() {
  app.innerHTML = renderCurrentView();
  bindEvents();
}

function bindEvents() {
  app.querySelectorAll("[data-action]").forEach((element) => {
    element.addEventListener("click", () => handleAction(element.dataset.action));
  });
  app.querySelectorAll("[data-field]").forEach((field) => {
    field.addEventListener("input", () => {
      state[field.dataset.field] = field.value;
    });
  });
  const fileInput = app.querySelector("[data-resume-file]");
  if (fileInput) {
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      state.isUploading = true;
      state.error = "";
      state.uploadStatus = `正在解析 ${file.name}`;
      render();
      try {
        const result = await uploadResumeFile(file);
        state.resumeText = result.text;
        state.uploadedFileName = result.file_name;
        state.uploadStatus = `已解析 ${result.file_name}`;
        state.isUploading = false;
        render();
      } catch (error) {
        setError(error.message, "intake");
      }
    });
  }
  app.querySelectorAll("[data-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = questionnaireItems[state.currentQuestion];
      state.questionnaire[item.id] = Number(button.dataset.answer);
      state.error = "";
      if (state.currentQuestion < questionnaireItems.length - 1) {
        window.setTimeout(() => {
          state.currentQuestion += 1;
          render();
        }, 160);
      } else {
        render();
      }
    });
  });
}

function handleAction(action) {
  if (action === "start") {
    setView("intake");
    return;
  }
  if (action === "back-start") {
    setView("start");
    return;
  }
  if (action === "start-quiz") {
    const error = validateIntake();
    if (error) {
      setError(error, "intake");
      return;
    }
    state.currentQuestion = 0;
    setView("quiz");
    return;
  }
  if (action === "previous-question") {
    state.currentQuestion = Math.max(0, state.currentQuestion - 1);
    state.error = "";
    render();
    return;
  }
  if (action === "next-question") {
    const item = questionnaireItems[state.currentQuestion];
    if (state.questionnaire[item.id] === null) {
      setError("请选择一个答案后再继续。", "quiz");
      return;
    }
    state.currentQuestion = Math.min(questionnaireItems.length - 1, state.currentQuestion + 1);
    state.error = "";
    render();
    return;
  }
  if (action === "submit-assessment" || action === "retry-assessment") {
    void runAssessment();
    return;
  }
  if (action === "back-quiz") {
    setView("quiz");
    return;
  }
  if (action === "restart") {
    state = structuredClone(initialState);
    render();
  }
}

render();
