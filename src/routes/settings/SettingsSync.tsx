import { useState } from 'react'
import { GlassCard } from '../../components/ui/GlassCard'
import { GlassButton } from '../../components/ui/GlassButton'
import { TextField } from '../../components/ui/Field'
import { generatePassphrase } from '../../lib/crypto/wordlist'
import { deriveKeys } from '../../lib/crypto/derive'

const SYNC_ENDPOINT = import.meta.env.VITE_SYNC_ENDPOINT as string | undefined

export function SettingsSync() {
  const [passphrase, setPassphrase] = useState<string[] | null>(null)
  const [spaceId, setSpaceId] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [joinInput, setJoinInput] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleGenerate() {
    const words = generatePassphrase(6)
    setPassphrase(words)
    setBusy(true)
    const { spaceId } = await deriveKeys(words.join(' '))
    setSpaceId(spaceId)
    setBusy(false)
  }

  async function handleJoin() {
    if (!joinInput.trim()) return
    setBusy(true)
    const words = joinInput.trim().split(/\s+/)
    const { spaceId } = await deriveKeys(words.join(' '))
    setSpaceId(spaceId)
    setBusy(false)
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      {!SYNC_ENDPOINT && (
        <GlassCard padding="sm" className="border-(--accent-warm) text-sm text-(--text-muted)">
          同期ワーカー（Cloudflare Workers + D1）がまだデプロイされていません。ここでは鍵の生成・確認までを試せます。
          <code className="ml-1 rounded bg-black/20 px-1">worker/</code> をデプロイし、
          <code className="ml-1 rounded bg-black/20 px-1">VITE_SYNC_ENDPOINT</code> を設定すると実際の同期が有効になります（docs/DESIGN.md §6.5）。
        </GlassCard>
      )}

      {!passphrase && !spaceId && (
        <GlassCard padding="lg" className="flex flex-col gap-4">
          <h2 className="text-lg">同期を有効にする</h2>
          <p className="text-sm text-(--text-muted)">
            この端末を最初の端末として、6 語のパスフレーズを発行します。他の端末はこのパスフレーズで参加できます。
          </p>
          <GlassButton variant="primary" onClick={handleGenerate} disabled={busy}>
            {busy ? '生成中…' : 'パスフレーズを発行'}
          </GlassButton>

          <div className="mt-4 border-t border-(--glass-stroke) pt-4">
            <p className="mb-2 text-sm text-(--text-muted)">すでにパスフレーズを持っている場合</p>
            <div className="flex gap-2">
              <div className="flex-1">
                <TextField
                  label=""
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value)}
                  placeholder="藍色 灯台 余白 螺旋 雪解け 手紙"
                />
              </div>
              <GlassButton onClick={handleJoin} disabled={busy || !joinInput.trim()}>
                参加する
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}

      {passphrase && !confirmed && (
        <GlassCard padding="lg" className="flex flex-col gap-4">
          <h2 className="text-lg">このパスフレーズを控えてください</h2>
          <p className="text-sm text-(--danger)">
            忘れると同期データを復号できなくなります（サーバーには暗号文しかありません）。
          </p>
          <div className="glass grid grid-cols-2 gap-2 p-4 text-center font-serif text-lg">
            {passphrase.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>
          <GlassButton variant="primary" onClick={() => setConfirmed(true)}>
            控えました
          </GlassButton>
        </GlassCard>
      )}

      {spaceId && (confirmed || joinInput) && (
        <GlassCard padding="lg" className="flex flex-col gap-2">
          <h2 className="text-lg">同期の準備ができました</h2>
          <p className="text-sm text-(--text-muted)">スペース ID</p>
          <p className="font-mono text-xs break-all text-(--text-muted)">{spaceId}</p>
          {!SYNC_ENDPOINT && (
            <p className="mt-2 text-sm text-(--text-muted)">
              同期ワーカーが未接続のため、今はローカルにのみ保存されています。
            </p>
          )}
        </GlassCard>
      )}
    </div>
  )
}
