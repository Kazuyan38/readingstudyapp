/**
 * 日本語対応の簡易トークナイザ。専用の形態素解析器を使わず、
 * 文字種の切れ目 + 2-gram で分割し、MiniSearch の空白区切り前提を補う。
 */
export function tokenizeJapanese(text: string): string[] {
  const normalized = text.normalize('NFKC')
  const segments = normalized.split(/([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+|[a-zA-Z0-9]+)/u).filter(Boolean)

  const tokens: string[] = []
  for (const seg of segments) {
    if (/^[a-zA-Z0-9]+$/.test(seg)) {
      tokens.push(seg.toLowerCase())
      continue
    }
    if (/^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+$/u.test(seg)) {
      if (seg.length <= 2) {
        tokens.push(seg)
      } else {
        for (let i = 0; i < seg.length - 1; i++) {
          tokens.push(seg.slice(i, i + 2))
        }
      }
    }
  }
  return tokens
}
