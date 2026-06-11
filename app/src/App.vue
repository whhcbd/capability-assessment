<script setup lang="ts">
import StepProgress from "./components/StepProgress.vue";
import { useAssessmentFlow } from "./composables/useAssessmentFlow";
import AnalyzingView from "./views/AnalyzingView.vue";
import IntakeView from "./views/IntakeView.vue";
import ProfileView from "./views/ProfileView.vue";
import QuestionnairePromptView from "./views/QuestionnairePromptView.vue";
import QuestionnaireView from "./views/QuestionnaireView.vue";
import StartView from "./views/StartView.vue";

const flow = useAssessmentFlow();
const {
  state,
  completedQuestionnaireCount,
  currentItem,
  currentCapability,
  currentAnswer,
  quizPercent,
  overallScore,
  capabilityRows,
  topStrengths,
  topGaps,
  debugJson,
  sourceLabel,
  setView,
  handleResumeUpload,
  selectRoleOption,
  continueFromIntake,
  beginQuestionnaire,
  goToProfileWithoutQuiz,
  selectAnswer,
  previousQuestion,
  nextQuestion,
  submitAssessment,
  restart,
} = flow;
</script>

<template>
  <main class="shell">
    <StepProgress v-if="!['start', 'error'].includes(state.view)" :view="state.view" />

    <StartView v-if="state.view === 'start'" @start="setView('intake')" />

    <IntakeView
      v-else-if="state.view === 'intake'"
      v-model:resume-text="state.resumeText"
      v-model:target-role="state.targetRole"
      v-model:target-jd="state.targetJd"
      :selected-role-option-id="state.selectedRoleOptionId"
      :upload-status="state.uploadStatus"
      :is-uploading="state.isUploading"
      :error="state.error"
      @upload="handleResumeUpload"
      @select-role-option="selectRoleOption"
      @next="continueFromIntake"
      @back="setView('start')"
    />

    <QuestionnairePromptView
      v-else-if="state.view === 'questionnairePrompt'"
      :target-role="state.targetRole"
      :error="state.error"
      :is-analyzing="state.isAnalyzing"
      @start-quiz="beginQuestionnaire"
      @skip-quiz="goToProfileWithoutQuiz"
      @back="setView('intake')"
    />

    <QuestionnaireView
      v-else-if="state.view === 'quiz'"
      :item="currentItem"
      :capability="currentCapability"
      :current-index="state.currentQuestion"
      :answer="currentAnswer"
      :percent="quizPercent"
      :error="state.error"
      @select="selectAnswer"
      @previous="previousQuestion"
      @next="nextQuestion"
      @submit="submitAssessment"
    />

    <AnalyzingView v-else-if="state.view === 'analyzing'" />

    <ProfileView
      v-else-if="state.view === 'profile' && state.roleProfile"
      :target-role="state.targetRole"
      :target-jd="state.targetJd"
      :overall-score="overallScore"
      :capability-profile="state.capabilityProfile"
      :role-profile="state.roleProfile"
      :rows="capabilityRows"
      :strengths="topStrengths"
      :gaps="topGaps"
      :debug-json="debugJson"
      :source-label="sourceLabel"
      @start-quiz="beginQuestionnaire"
      @restart="restart"
    />

    <section v-else class="error-page">
      <p class="eyebrow">无法完成分析</p>
      <h1>请检查本地服务后重试。</h1>
      <p class="notice error">{{ state.error || "服务暂时不可用。" }}</p>
      <div class="command-box">
        <code>cd capability-assessment</code>
        <code>python -m server.main --host 0.0.0.0 --port 8770</code>
      </div>
      <div class="action-row">
        <button
          class="secondary"
          type="button"
          @click="setView(completedQuestionnaireCount === 48 ? 'quiz' : 'questionnairePrompt')"
        >
          {{ completedQuestionnaireCount === 48 ? "返回问卷" : "返回上一步" }}
        </button>
        <button
          class="primary"
          type="button"
          @click="completedQuestionnaireCount === 48 ? submitAssessment() : goToProfileWithoutQuiz()"
        >
          重试生成
        </button>
      </div>
    </section>
  </main>
</template>
