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

const size = 460;
const center = size / 2;
const radius = 140;
const labelRadius = 180;
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

const activeDisplayMode = computed<RadarDisplayMode>(() => props.displayMode ?? "both");

const gridPolygons = computed(() =>
  steps.map((step) => capabilities.map((_, index) => pointFor(index, radius * step).join(",")).join(" ")),
);

const axes = computed(() =>
  capabilities.map((capability, index) => {
    const [labelX, labelY] = pointFor(index, labelRadius);
    const [axisX, axisY] = pointFor(index, radius);
    const userValue = props.profile ? scoreFor(props.profile[capability.key]?.score) : null;
    const roleValue = props.requirements ? scoreFor(props.requirements[capability.key]?.required_level) : null;
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
      key: capability.key,
      label: capability.label,
      scoreLabel,
      labelX,
      labelY,
      axisX,
      axisY,
    };
  }),
);

const userPolygon = computed(() => {
  if (!props.profile || activeDisplayMode.value === "role") return "";
  return polygonFor(capabilities.map(({ key }) => props.profile?.[key]?.score ?? 0));
});

const rolePolygon = computed(() => {
  if (!props.requirements || activeDisplayMode.value === "user") return "";
  return polygonFor(capabilities.map(({ key }) => props.requirements?.[key]?.required_level ?? 0));
});
</script>

<template>
  <svg :viewBox="`0 0 ${size} ${size}`" role="img" :aria-label="title">
    <polygon v-for="points in gridPolygons" :key="points" class="radar-grid" :points="points" />
    <g v-for="axis in axes" :key="axis.key">
      <line class="radar-axis" :x1="center" :y1="center" :x2="axis.axisX" :y2="axis.axisY" />
      <text class="radar-label" :x="axis.labelX" :y="axis.labelY" text-anchor="middle">
        {{ axis.label }}
        <tspan v-if="axis.scoreLabel" class="radar-label-score" dx="4">{{ axis.scoreLabel }}</tspan>
      </text>
    </g>
    <polygon v-if="rolePolygon" class="radar-role" :points="rolePolygon" />
    <polygon v-if="userPolygon" class="radar-user" :points="userPolygon" />
  </svg>
</template>
