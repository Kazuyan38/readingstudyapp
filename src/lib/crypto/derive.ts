/**
 * パスフレーズ → spaceId / dataKey の導出（docs/DESIGN.md §6.1）。
 * PBKDF2 でパスフレーズを引き伸ばし、HKDF で用途別（id / data）に分離する。
 * 端末につき 1 回だけ実行するため、Web Worker で呼び出しメインスレッドを塞がない前提。
 */

const SALT = new TextEncoder().encode('readingstudyapp/v1')
const PBKDF2_ITERATIONS = 600_000

async function importPassphraseKey(passphrase: string): Promise<CryptoKey> {
  const material = new TextEncoder().encode(passphrase)
  return crypto.subtle.importKey('raw', material, 'PBKDF2', false, ['deriveBits'])
}

async function stretchPassphrase(passphrase: string): Promise<ArrayBuffer> {
  const key = await importPassphraseKey(passphrase)
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: SALT, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  )
}

async function hkdfExpand(stretched: ArrayBuffer, info: string, lengthBits: number): Promise<ArrayBuffer> {
  const hkdfKey = await crypto.subtle.importKey('raw', stretched, 'HKDF', false, ['deriveBits'])
  return crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: SALT,
      info: new TextEncoder().encode(info),
    },
    hkdfKey,
    lengthBits
  )
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export interface DerivedKeys {
  spaceId: string // hex 文字列。サーバーに送るラベル
  dataKey: CryptoKey // AES-GCM 暗号化に使う。端末から出さない
}

export async function deriveKeys(passphrase: string): Promise<DerivedKeys> {
  const stretched = await stretchPassphrase(passphrase)
  const spaceIdBits = await hkdfExpand(stretched, 'readingstudyapp/id', 256)
  const dataKeyBits = await hkdfExpand(stretched, 'readingstudyapp/data', 256)

  const dataKey = await crypto.subtle.importKey('raw', dataKeyBits, 'AES-GCM', false, ['encrypt', 'decrypt'])

  return { spaceId: toHex(spaceIdBits), dataKey }
}
