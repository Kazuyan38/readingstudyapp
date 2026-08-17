import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { GlassCard } from '../../components/ui/GlassCard'
import { GlassButton } from '../../components/ui/GlassButton'
import { getSettings, updateSettings } from '../../lib/db/repository'
import { exportAllData, downloadBlob } from '../../lib/backup/export'
import { importAllData } from '../../lib/backup/import'
import type { Settings } from '../../lib/db/schema'

export function SettingsHome() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  async function handleExport() {
    const blob = await exportAllData()
    downloadBlob(blob, `readingstudyapp-backup-${new Date().toISOString().slice(0, 10)}.json`)
    await updateSettings({ lastBackupAt: Date.now() })
    setSettings(await getSettings())
    setMessage('エクスポートしました。')
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!confirm('現在のデータは全て置き換えられます。よろしいですか？')) return
    await importAllData(file)
    setMessage('復元しました。ページを再読み込みしてください。')
  }

  if (!settings) return <div className="glass h-40 animate-pulse" />

  return (
    <div className="flex flex-col gap-6">
      <GlassCard padding="lg" className="flex flex-col gap-4">
        <h2 className="text-lg">1 日の上限枚数</h2>
        <label className="flex items-center justify-between text-sm">
          <span>新規カード</span>
          <input
            type="number"
            min={1}
            value={settings.dailyNewLimit}
            onChange={async (e) => {
              await updateSettings({ dailyNewLimit: Number(e.target.value) })
              setSettings(await getSettings())
            }}
            className="w-20 rounded-lg border border-(--glass-stroke) bg-transparent px-2 py-1 text-right"
          />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span>復習</span>
          <input
            type="number"
            min={1}
            value={settings.dailyReviewLimit}
            onChange={async (e) => {
              await updateSettings({ dailyReviewLimit: Number(e.target.value) })
              setSettings(await getSettings())
            }}
            className="w-20 rounded-lg border border-(--glass-stroke) bg-transparent px-2 py-1 text-right"
          />
        </label>
      </GlassCard>

      <GlassCard padding="lg" className="flex flex-col gap-4">
        <h2 className="text-lg">バックアップ</h2>
        <p className="text-sm text-(--text-muted)">
          {settings.lastBackupAt
            ? `最終エクスポート: ${new Date(settings.lastBackupAt).toLocaleString('ja-JP')}`
            : 'まだエクスポートしていません'}
        </p>
        <div className="flex flex-wrap gap-2">
          <GlassButton variant="primary" onClick={handleExport}>
            JSON にエクスポート
          </GlassButton>
          <GlassButton onClick={() => fileInput.current?.click()}>JSON から復元</GlassButton>
          <input ref={fileInput} type="file" accept="application/json" hidden onChange={handleImportFile} />
        </div>
        {message && <p className="text-sm text-(--accent-warm)">{message}</p>}
      </GlassCard>

      <GlassCard padding="lg">
        <h2 className="mb-2 text-lg">端末間同期</h2>
        <p className="mb-3 text-sm text-(--text-muted)">他の端末でも同じデータを使えるようにします。</p>
        <Link to="/settings/sync">
          <GlassButton>同期を設定する</GlassButton>
        </Link>
      </GlassCard>
    </div>
  )
}
