/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NODE_ENV: string;
  readonly VITE_BASE_URL: string;
  readonly VITE_PROD_API_URL: string;
  readonly VITE_DEV_API_URL: string;
  readonly VITE_CLOUDINARY_PATH: string;
  readonly VITE_PERFORMANCE_APP_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
