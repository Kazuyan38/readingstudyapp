/**
 * ISBN からの書誌データ多段フォールバック（docs/DESIGN.md §11）。
 * openBD → NDL サーチ → 楽天ブックス → Google Books の順に試す。
 * 全て GitHub Pages からブラウザ直叩き可能（CORS 実地確認済み・2026-08）。
 */

export interface BookMetadata {
  title: string
  authors: string[]
  publisher?: string
  publishedAt?: string
  coverUrl?: string
  source: 'openbd' | 'ndl' | 'rakuten' | 'google' | 'manual'
}

function normalizeIsbn(raw: string): string {
  return raw.replace(/[^0-9Xx]/g, '')
}

async function fromOpenBD(isbn: string): Promise<BookMetadata | null> {
  const res = await fetch(`https://api.openbd.jp/v1/get?isbn=${isbn}`)
  if (!res.ok) return null
  const data = (await res.json()) as unknown[]
  const entry = data?.[0] as
    | { summary?: { title?: string; author?: string; publisher?: string; pubdate?: string; cover?: string } }
    | null
  if (!entry?.summary?.title) return null
  const s = entry.summary
  return {
    title: s.title ?? '',
    authors: s.author ? s.author.split(/[／,、]/).map((a) => a.trim()).filter(Boolean) : [],
    publisher: s.publisher,
    publishedAt: s.pubdate,
    coverUrl: s.cover || undefined,
    source: 'openbd',
  }
}

async function fromNdl(isbn: string): Promise<BookMetadata | null> {
  const res = await fetch(`https://ndlsearch.ndl.go.jp/api/opensearch?isbn=${isbn}`)
  if (!res.ok) return null
  const xmlText = await res.text()
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml')
  const item = doc.querySelector('item')
  if (!item) return null
  const title = item.querySelector('title')?.textContent?.trim()
  if (!title) return null
  const creators = Array.from(item.getElementsByTagNameNS('*', 'creator')).map((n) => n.textContent?.trim() ?? '')
  const publisher = item.getElementsByTagNameNS('*', 'publisher')[0]?.textContent?.trim()
  const date = item.querySelector('date')?.textContent?.trim()
  return {
    title,
    authors: creators.filter(Boolean),
    publisher,
    publishedAt: date,
    source: 'ndl',
  }
}

async function fromRakuten(isbn: string, applicationId?: string): Promise<BookMetadata | null> {
  if (!applicationId) return null
  const url = `https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404?format=json&isbnjan=${isbn}&applicationId=${applicationId}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as { Items?: { Item: Record<string, string> }[] }
  const item = data.Items?.[0]?.Item
  if (!item?.title) return null
  return {
    title: item.title,
    authors: item.author ? item.author.split(/[／,、]/).map((a) => a.trim()).filter(Boolean) : [],
    publisher: item.publisherName,
    publishedAt: item.salesDate,
    coverUrl: item.largeImageUrl || item.mediumImageUrl,
    source: 'rakuten',
  }
}

async function fromGoogleBooks(isbn: string, apiKey?: string): Promise<BookMetadata | null> {
  if (!apiKey) return null
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as {
    items?: { volumeInfo?: { title?: string; authors?: string[]; publisher?: string; publishedDate?: string; imageLinks?: { thumbnail?: string } } }[]
  }
  const info = data.items?.[0]?.volumeInfo
  if (!info?.title) return null
  return {
    title: info.title,
    authors: info.authors ?? [],
    publisher: info.publisher,
    publishedAt: info.publishedDate,
    coverUrl: info.imageLinks?.thumbnail,
    source: 'google',
  }
}

export interface LookupOptions {
  rakutenApplicationId?: string
  googleBooksApiKey?: string
}

/** 複数ソースを順に試し、最初に成功した結果を返す。全滅なら null（手入力へ）。 */
export async function lookupByIsbn(rawIsbn: string, options: LookupOptions = {}): Promise<BookMetadata | null> {
  const isbn = normalizeIsbn(rawIsbn)
  if (!isbn) return null

  const attempts: Array<() => Promise<BookMetadata | null>> = [
    () => fromOpenBD(isbn),
    () => fromNdl(isbn),
    () => fromRakuten(isbn, options.rakutenApplicationId),
    () => fromGoogleBooks(isbn, options.googleBooksApiKey),
  ]

  for (const attempt of attempts) {
    try {
      const result = await attempt()
      if (result) return result
    } catch {
      // このソースが失敗しても次を試す
    }
  }
  return null
}
