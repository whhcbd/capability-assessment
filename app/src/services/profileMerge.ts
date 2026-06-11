import { capabilities } from "../data/capabilities";
import type {
  CapabilityEvidenceGroup,
  CapabilityEvidenceItem,
  CapabilityKey,
  CapabilityProfile,
  RoleCapabilityProfile,
  RoleRequirement,
} from "../types/profile";

interface EvidenceWithSource extends CapabilityEvidenceItem {
  source_type: string;
  source_id: string;
}

function clampScore(value: unknown): number {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function clampConfidence(value: unknown): number {
  return Math.max(0, Math.min(1, Number((Number(value) || 0).toFixed(2))));
}

export function createEmptyCapabilityProfile(summary = "尚未生成能力证据。"): CapabilityProfile {
  const profile = {} as CapabilityProfile;
  capabilities.forEach(({ key }) => {
    profile[key] = {
      score: 0,
      confidence: 0,
      evidence_sources: [],
      evidence_summary: summary,
    };
  });
  return profile;
}

function collectEvidenceItems(groups: CapabilityEvidenceGroup[]): EvidenceWithSource[] {
  return groups.flatMap((group) =>
    (group.capability_evidence ?? []).map((item) => ({
      ...item,
      source_type: group.source_type,
      source_id: group.source_id,
    })),
  );
}

export function mergeCapabilityProfile(evidenceGroups: CapabilityEvidenceGroup[]): CapabilityProfile {
  const grouped = {} as Record<CapabilityKey, EvidenceWithSource[]>;
  capabilities.forEach(({ key }) => {
    grouped[key] = [];
  });
  collectEvidenceItems(evidenceGroups).forEach((item) => {
    if (grouped[item.capability_key]) grouped[item.capability_key].push(item);
  });

  const sourceWeight: Record<string, number> = {
    resume_text: 1.3,
    self_assessment: 0.72,
    questionnaire: 0.72,
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
            evidence_summary: "当前输入中缺少可解释证据，需要补充简历行为案例。",
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
  ) as CapabilityProfile;
}

export function normalizeRoleProfile(profile: Partial<RoleCapabilityProfile>, targetRole: string): RoleCapabilityProfile {
  const rawRequirements = profile.requirements ?? {};
  return {
    role_id: profile.role_id || "custom_target_role",
    role_name: profile.role_name || targetRole,
    profile_version: profile.profile_version || "v1",
    source_type: profile.source_type || "rag_generated_role_profile",
    rag_status: profile.rag_status || "generated",
    source_refs: Array.isArray(profile.source_refs) ? profile.source_refs : [],
    requirements: Object.fromEntries(
      capabilities.map(({ key }) => {
        const raw = (rawRequirements as Partial<Record<CapabilityKey, Partial<RoleRequirement>>>)[key] ?? {};
        return [
          key,
          {
            required_level: clampScore(raw.required_level ?? 55),
            weight: Number(raw.weight ?? 0),
            requirement_summary: raw.requirement_summary || "该能力要求由岗位资料生成，建议结合具体 JD 阅读。",
          },
        ];
      }),
    ) as RoleCapabilityProfile["requirements"],
  };
}

export function profileAverageScore(profile: CapabilityProfile): number {
  const scores = Object.values(profile).map((item) => item.score);
  return clampScore(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}
