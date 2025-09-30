/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
  // thêm các biến khác ở đây
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}