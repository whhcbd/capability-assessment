<script setup lang="ts">
import { computed } from "vue";
import { capabilities } from "../data/capabilities";
import type { CapabilityProfile, RoleRequirements } from "../types/profile";

type RadarDisplayMode = "user" | "role" | "both";

const props = defineProps<{
  title: string;
  profile?: CapabilityProfile | null;
  requirements?: RoleRequirements | null;
  displayMode?: RadarDisplayMode;
}>();

const size = 360;
const center = size / 2;
const radius = 124;
const steps = [0.25, 0.5, 0.75, 1];

function pointFor(index: number, valueRadius: number): [number, number] {
  const angle = (Math.PI * 2 * index) / capabilities.length - Math.PI / 2;
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

const gridPolygons = computed(() =>
  steps.map((step) => capabilities.map((_, index) => pointFor(index, radius * step).join(",")).join(" ")),
);

const axes = computed(() =>
  capabilities.map((capability, index) => {
    const [labelX, labelY] = pointFor(index, radius + 25);
    const [axisX, axisY] = pointFor(index, radius);
    return {
      key: capability.key,
      label: capability.short,
      labelX,
      labelY,
      axisX,
      axisY,
    };
  }),
);

const userPolygon = computed(() => {
  if (!props.profile || props.displayMode === "role") return "";
  return polygonFor(capabilities.map(({ key }) => props.profile?.[key]?.score ?? 0));
});

const rolePolygon = computed(() => {
  if (!props.requirements || props.displayMode === "user") return "";
  return polygonFor(capabilities.map(({ key }) => props.requirements?.[key]?.required_level ?? 0));
});

const userScores = computed(() => {
  if (!props.profile || props.displayMode === "role") return [];
  return capabilities.map(({ key }, index) => {
    const value = scoreFor(props.profile?.[key]?.score);
    const [x, y] = pointFor(index, Math.max(34, (value / 100) * radius + 16));
    return { key, value, x, y };
  });
});

const roleScores = computed(() => {
  if (!props.requirements || props.displayMode === "user") return [];
  const inwardOffset = props.profile && props.displayMode !== "role" ? -10 : 16;
  return capabilities.map(({ key }, index) => {
    const value = scoreFor(props.requirements?.[key]?.required_level);
    const [x, y] = pointFor(index, Math.max(30, (value / 100) * radius + inwardOffset));
    return { key, value, x, y };
  });
});
</script>

<template>
  <svg :viewBox="`0 0 ${size} ${size}`" role="img" :aria-label="title">
    <polygon v-for="points in gridPolygons" :key="points" class="radar-grid" :points="points" />
    <g v-for="axis in axes" :key="axis.key">
      <line class="radar-axis" :x1="center" :y1="center" :x2="axis.axisX" :y2="axis.axisY" />
      <text class="radar-label" :x="axis.labelX" :y="axis.labelY" text-anchor="middle">
        {{ axis.label }}
      </text>
    </g>
    <polygon v-if="rolePolygon" class="radar-role" :points="rolePolygon" />
    <polygon v-if="userPolygon" class="radar-user" :points="userPolygon" />
    <g v-for="score in roleScores" :key="`role-${score.key}`">
      <circle class="radar-score-dot radar-score-dot-role" :cx="score.x" :cy="score.y - 4" r="10" />
      <text class="radar-score radar-score-role" :x="score.x" :y="score.y" text-anchor="middle">
        {{ score.value }}
      </text>
    </g>
    <g v-for="score in userScores" :key="`user-${score.key}`">
      <circle class="radar-score-dot radar-score-dot-user" :cx="score.x" :cy="score.y - 4" r="10" />
      <text class="radar-score radar-score-user" :x="score.x" :y="score.y" text-anchor="middle">
        {{ score.value }}
      </text>
    </g>
  </svg>
</template>
