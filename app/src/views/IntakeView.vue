<script setup lang="ts">
import { computed } from "vue";
import { customRoleOptionId, roleOptions } from "../data/roleOptions";

const props = defineProps<{
  resumeText: string;
  targetRole: string;
  targetJd: string;
  selectedRoleOptionId: string;
  uploadStatus: string;
  isUploading: boolean;
  error: string;
}>();

const emit = defineEmits<{
  "update:resumeText": [value: string];
  "update:targetRole": [value: string];
  "update:targetJd": [value: string];
  selectRoleOption: [optionId: string];
  upload: [file: File];
  next: [];
  back: [];
}>();

const isCustomRole = computed(() => props.selectedRoleOptionId === customRoleOptionId);
const hasSelectedRole = computed(() => Boolean(props.selectedRoleOptionId));
const isPresetRole = computed(() => hasSelectedRole.value && !isCustomRole.value);

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) emit("upload", file);
}
</script>

<template>
  <section class="work-page intake-page">
    <div class="page-title">
      <p class="eyebrow">Step 1</p>
      <h1>先放入简历，再填写心仪职业。</h1>
      <p>只需要提供求职材料相关输入。没有具体 JD 时，填写职业名称也可以继续。</p>
    </div>

    <p v-if="error" class="notice error">{{ error }}</p>

    <div class="intake-grid">
      <section class="plain-section">
        <label class="field-label" for="resume-file">上传 Word 或文字版 PDF</label>
        <input id="resume-file" class="file-input" type="file" accept=".docx,.pdf" @change="onFileChange" />
        <p class="field-help">
          {{
            isUploading
              ? "正在解析文件..."
              : uploadStatus || "支持 .docx 和文字版 .pdf；扫描件 PDF 请直接粘贴文字版简历。"
          }}
        </p>

        <label class="field-label" for="resume-text">简历正文</label>
        <textarea
          id="resume-text"
          rows="14"
          :value="props.resumeText"
          placeholder="也可以直接粘贴你的简历、项目经历、实习经历或课程项目。"
          @input="emit('update:resumeText', ($event.target as HTMLTextAreaElement).value)"
        />
      </section>

      <section class="plain-section">
        <span class="field-label">心仪岗位</span>
        <div class="role-option-list">
          <button
            v-for="option in roleOptions"
            :key="option.id"
            class="role-option"
            type="button"
            :aria-pressed="props.selectedRoleOptionId === option.id"
            @click="emit('selectRoleOption', option.id)"
          >
            <strong>{{ option.roleName }}</strong>
            <span>使用预置 JD，内容会展示但不可修改。</span>
          </button>
          <button
            class="role-option"
            type="button"
            :aria-pressed="isCustomRole"
            @click="emit('selectRoleOption', customRoleOptionId)"
          >
            <strong>其他</strong>
            <span>自己填写心仪岗位和详细 JD。</span>
          </button>
        </div>

        <label v-if="isCustomRole" class="field-label" for="target-role">岗位名称</label>
        <input
          v-if="isCustomRole"
          id="target-role"
          type="text"
          :value="props.targetRole"
          placeholder="例如：市场运营实习生"
          @input="emit('update:targetRole', ($event.target as HTMLInputElement).value)"
        />

        <label class="field-label" for="target-jd">
          {{ isCustomRole ? "详细 JD" : "预置 JD" }}
        </label>
        <textarea
          id="target-jd"
          rows="9"
          :value="props.targetJd"
          :readonly="isPresetRole || !hasSelectedRole"
          :placeholder="isCustomRole ? '请粘贴或填写这个岗位的详细 JD。' : '请选择一个预置岗位后查看 JD 内容。'"
          :class="{ 'is-readonly': isPresetRole || !hasSelectedRole }"
          @input="emit('update:targetJd', ($event.target as HTMLTextAreaElement).value)"
        />

        <div class="action-row">
          <button class="secondary" type="button" @click="$emit('back')">返回</button>
          <button class="primary" type="button" @click="$emit('next')">下一步</button>
        </div>
      </section>
    </div>
  </section>
</template>
