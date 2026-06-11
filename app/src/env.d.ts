/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CAPABILITY_API_BASE_URL?: string;
  readonly VITE_CAPABILITY_STUDENT_ID?: string;
  readonly VITE_ABILITY_API_BASE_URL?: string;
  readonly VITE_RAG_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
