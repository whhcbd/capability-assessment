<script setup lang="ts">
import { computed } from "vue";
import { capabilities } from "../data/capabilities";
import type { CapabilityProfile, RadarAxis, RoleRequirements } from "../types/profile";

type RadarDisplayMode = "user" | "role" | "both";

const props = defineProps<{
  title: string;
  profile?: CapabilityProfile | null;
  requirements?: RoleRequirements | null;
  axes?: RadarAxis[];
  displayMode?: RadarDisplayMode;
}>();

const size = 460;
const center = size / 2;
const radius = 140;
const labelRadius = 180;
const steps = [0.25, 0.5, 0.75, 1];

function labelLines(label: string): string[] {
  const preferredBreaks: Record<string, string[]> = {
    协作与领导力: ["协作与", "领导力"],
    自我认知与职业动机: ["自我认知与", "职业动机"],
    数据与数字化思维: ["数据与", "数字化思维"],
    商业与行业理解: ["商业与", "行业理解"],
  };
  return preferredBreaks[label] ?? [label];
}

function pointFor(index: number, valueRadius: number): [number, number] {
  const angle = (Math.PI * 2 * index) / radarAxes.value.length - Math.PI / 2;
  return [center + Math.cos(angle) * valueRadius, center + Math.sin(angle) * valueRadius];
}

function polygonFor(values: number[]): string {
  return values
    .map((value, index) => {
      const safeValue = Math.max(0, Math.min(100, value));
      return pointFor(index, (safeValue / 100) * radius).join(",");
    })
    .join(" ");
}

function scoreFor(value: number | undefined): number {
  return Math.max(0, Math.min(100, Math.round(Number(value ?? 0))));
}

const activeDisplayMode = computed<RadarDisplayMode>(() => props.displayMode ?? "both");
const radarAxes = computed<RadarAxis[]>(() => {
  if (props.axes?.length) return props.axes;
  return capabilities.map((capability) => ({
    key: capability.key,
    label: capability.label,
    mappedCapabilityKeys: [capability.key],
    userScore: props.profile?.[capability.key]?.score,
    roleScore: props.requirements?.[capability.key]?.required_level,
  }));
});

const gridPolygons = computed(() =>
  steps.map((step) => radarAxes.value.map((_, index) => pointFor(index, radius * step).join(",")).join(" ")),
);

const axes = computed(() =>
  radarAxes.value.map((axis, index) => {
    const [labelX, labelY] = pointFor(index, labelRadius);
    const [axisX, axisY] = pointFor(index, radius);
    const userValue = typeof axis.userScore === "number" ? scoreFor(axis.userScore) : null;
    const roleValue = typeof axis.roleScore === "number" ? scoreFor(axis.roleScore) : null;
    let scoreLabel = "";

    if (activeDisplayMode.value === "user" && userValue !== null) {
      scoreLabel = String(userValue);
    } else if (activeDisplayMode.value === "role" && roleValue !== null) {
      scoreLabel = String(roleValue);
    } else if (userValue !== null && roleValue !== null) {
      scoreLabel = `${userValue}/${roleValue}`;
    } else if (userValue !== null) {
      scoreLabel = String(userValue);
    } else if (roleValue !== null) {
      scoreLabel = String(roleValue);
    }

    return {
      key: axis.key,
      label: axis.label,
      labelLines: labelLines(axis.label),
      scoreLabel,
      labelX,
      labelY: labelY - (labelLines(axis.label).length > 1 ? 8 : 0),
      axisX,
      axisY,
    };
  }),
);

const userPolygon = computed(() => {
  if (activeDisplayMode.value === "role") return "";
  return polygonFor(radarAxes.value.map((axis) => axis.userScore ?? 0));
});

const rolePolygon = computed(() => {
  if (activeDisplayMode.value === "user") return "";
  return polygonFor(radarAxes.value.map((axis) => axis.roleScore ?? 0));
});
</script>

<template>
  <svg :viewBox="`0 0 ${size} ${size}`" role="img" :aria-label="title">
    <polygon v-for="points in gridPolygons" :key="points" class="radar-grid" :points="points" />
    <g v-for="axis in axes" :key="axis.key">
      <line class="radar-axis" :x1="center" :y1="center" :x2="axis.axisX" :y2="axis.axisY" />
    </g>
    <polygon v-if="rolePolygon" class="radar-role" :points="rolePolygon" />
    <polygon v-if="userPolygon" class="radar-user" :points="userPolygon" />
    <g v-for="axis in axes" :key="`${axis.key}-label`">
      <text class="radar-label" :x="axis.labelX" :y="axis.labelY" text-anchor="middle">
        <tspan v-for="(line, index) in axis.labelLines" :key="line" :x="axis.labelX" :dy="index === 0 ? 0 : 13">
          {{ line }}
        </tspan>
        <tspan v-if="axis.scoreLabel" class="radar-label-score" :x="axis.labelX" dy="13">
          {{ axis.scoreLabel }}
        </tspan>
      </text>
    </g>
  </svg>
</template>
