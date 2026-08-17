# 読書学習帳（readingstudyapp）

読んだ本の学びを、忘れる前に取り戻すための個人用アプリ。読書メモを要点カードに凝縮し、
エビングハウスの忘却曲線に沿って復習を出し分ける。設計の全体像は [docs/DESIGN.md](docs/DESIGN.md) を参照。

- 配信先: <https://kazuyan38.github.io/readingstudyapp/>（`main` への push で自動デプロイ）
- スタック: Vite + React 19 + TypeScript + React Router、Dexie（IndexedDB）、MiniSearch、Tailwind v4

## 開発

```bash
npm install
npm run dev       # http://localhost:5173/readingstudyapp/
npm run build     # dist/ に静的出力
npm run preview   # ビルド結果をローカルで確認
```

書誌データの多段フォールバック（openBD → NDL → 楽天 → Google Books）を使う場合は
`.env.example` を `.env` にコピーし、必要な API キーを設定する（任意）。

## 端末間同期（任意・未デプロイ）

E2E 暗号化された端末間同期は `worker/`（Cloudflare Workers + D1）が担う。設計は
[docs/DESIGN.md §6](docs/DESIGN.md#6-同期アーキテクチャ) を参照。デプロイ手順は
`worker/src/index.ts` の先頭コメントに記載。デプロイ後、`VITE_SYNC_ENDPOINT` を
GitHub リポジトリの Actions variables（Settings → Secrets and variables → Actions → Variables）
に設定すると同期が有効になる。

## ロードマップ

Phase 0（基盤）・Phase 1（記録）・Phase 2（定着 = 忘却曲線エンジン）・検索・統計・PWA
までを実装済み。Phase 3（端末間同期）はクライアント側の暗号・ワーカーのコードを用意済みだが、
実際のデプロイ（Cloudflare アカウントが必要）は未実施。詳細は [docs/DESIGN.md §10](docs/DESIGN.md#10-開発ロードマップ) を参照。
