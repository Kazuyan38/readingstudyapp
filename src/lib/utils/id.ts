import { v7 as uuidv7 } from 'uuid'

/** 時系列順にソート可能な uuid v7。同期の索引効率のため v4 でなくこちらを使う。 */
export function newId(): string {
  return uuidv7()
}
