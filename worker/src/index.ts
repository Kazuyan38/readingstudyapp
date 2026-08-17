/**
 * 同期ワーカー — 唯一のサーバーコード（docs/DESIGN.md §6.3, §6.5）。
 * 中身は解釈しない「暗号文の右から左」。認証は spaceId 許可リスト 1 本。
 *
 * デプロイ手順（要 Cloudflare アカウント。無料・クレカ不要）:
 *   npm create cloudflare@latest -- --existing-script  (または wrangler をこのディレクトリで直接使う)
 *   wrangler d1 create readingstudyapp-sync
 *   wrangler d1 execute DB --file=../schema.sql --remote
 *   wrangler secret put ALLOWED_ORIGIN        # 例: https://kazuyan38.github.io
 *   wrangler secret put ALLOWED_SPACE_HASH    # SHA-256(spaceId) を 16進で
 *   wrangler deploy
 */

export interface Env {
  DB: D1Database
  SYNC_LIMITER: { limit: (opts: { key: string }) => Promise<{ success: boolean }> }
  ALLOWED_ORIGIN: string
  ALLOWED_SPACE_HASH: string
}

const MAX_BODY_BYTES = 1_000_000
const MAX_RECORD_BYTES = 64_000
const PAGE_SIZE = 200

interface ChangeRecord {
  entityId: string
  entityType: string
  updatedAt: number
  deletedAt: number | null
  ciphertext: string
  iv: string
}

interface SyncRequestBody {
  since: number
  changes: ChangeRecord[]
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = corsHeaders(env.ALLOWED_ORIGIN)

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers })
    }
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers })
    }

    // ① レート制限
    const ip = request.headers.get('cf-connecting-ip') ?? 'unknown'
    const rl = await env.SYNC_LIMITER.limit({ key: ip })
    if (!rl.success) {
      return new Response('Too Many Requests', { status: 429, headers })
    }

    // ② spaceId 許可リスト
    const auth = request.headers.get('Authorization') ?? ''
    const spaceId = auth.replace(/^Bearer\s+/i, '')
    if (!spaceId) {
      return new Response('Unauthorized', { status: 401, headers })
    }
    const spaceHash = await sha256Hex(spaceId)
    if (spaceHash !== env.ALLOWED_SPACE_HASH) {
      return new Response('Forbidden', { status: 403, headers })
    }

    // ③ サイズ上限
    const raw = await request.text()
    if (raw.length > MAX_BODY_BYTES) {
      return new Response('Payload Too Large', { status: 413, headers })
    }

    let body: SyncRequestBody
    try {
      body = JSON.parse(raw)
    } catch {
      return new Response('Bad Request', { status: 400, headers })
    }

    // push: 送られてきた変更を upsert
    for (const change of body.changes ?? []) {
      if (change.ciphertext.length > MAX_RECORD_BYTES) continue
      await env.DB.prepare(
        `INSERT INTO records (space_id, entity_id, entity_type, updated_at, deleted_at, ciphertext, iv)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT (space_id, entity_id) DO UPDATE SET
           updated_at = excluded.updated_at,
           deleted_at = excluded.deleted_at,
           ciphertext = excluded.ciphertext,
           iv = excluded.iv
         WHERE excluded.updated_at > records.updated_at`
      )
        .bind(spaceId, change.entityId, change.entityType, change.updatedAt, change.deletedAt, change.ciphertext, change.iv)
        .run()
    }

    // pull: since 以降の変更をページングして返す
    const since = body.since ?? 0
    const result = await env.DB.prepare(
      `SELECT entity_id, entity_type, updated_at, deleted_at, ciphertext, iv
       FROM records WHERE space_id = ?1 AND updated_at > ?2
       ORDER BY updated_at ASC LIMIT ?3`
    )
      .bind(spaceId, since, PAGE_SIZE + 1)
      .all()

    const rows = result.results ?? []
    const hasMore = rows.length > PAGE_SIZE
    const changes = rows.slice(0, PAGE_SIZE).map((r) => ({
      entityId: r.entity_id,
      entityType: r.entity_type,
      updatedAt: r.updated_at,
      deletedAt: r.deleted_at,
      ciphertext: r.ciphertext,
      iv: r.iv,
    }))

    return new Response(
      JSON.stringify({ serverTime: Date.now(), changes, hasMore }),
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    )
  },
}
