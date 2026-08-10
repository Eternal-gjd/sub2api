export type ImgPromptAction = 'insert' | 'append' | 'replace'

export interface ImgPromptApplyPayload {
  action: ImgPromptAction
  prompt: string
}

type MessageLike = Pick<MessageEvent, 'origin' | 'data'>

export function parseImgPromptMessage(
  event: MessageLike,
  expectedOrigin: string,
): ImgPromptApplyPayload | null {
  if (event.origin !== expectedOrigin || !event.data || typeof event.data !== 'object') {
    return null
  }

  const data = event.data as Record<string, unknown>
  if (data.type !== 'imgprompt:apply') return null
  if (data.action !== 'insert' && data.action !== 'append' && data.action !== 'replace') return null
  if (typeof data.prompt !== 'string' || !data.prompt.trim()) return null

  return { action: data.action, prompt: data.prompt.trim() }
}

export function buildImgPromptUrl(locale = 'zh') {
  const normalizedLocale = locale.toLowerCase().startsWith('zh') ? 'zh' : 'en'
  return `/img-prompt/${normalizedLocale}/#embedded=1`
}
