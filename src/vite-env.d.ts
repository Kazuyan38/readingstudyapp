/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SYNC_ENDPOINT?: string
  readonly VITE_RAKUTEN_APP_ID?: string
  readonly VITE_GOOGLE_BOOKS_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
