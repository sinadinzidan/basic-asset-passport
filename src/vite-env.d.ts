/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to "true" to serve dummy data instead of calling CDF. Defaults to off. */
  readonly VITE_MOCK_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
