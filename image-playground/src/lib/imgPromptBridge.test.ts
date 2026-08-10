import { describe, expect, it } from 'vitest'
import { parseImgPromptMessage } from './imgPromptBridge'

describe('IMGPrompt bridge', () => {
  const sameOrigin = 'https://example.com'

  it('accepts supported same-origin apply messages', () => {
    expect(parseImgPromptMessage({
      origin: sameOrigin,
      data: { type: 'imgprompt:apply', action: 'insert', prompt: 'cinematic lighting' },
    }, sameOrigin)).toEqual({ action: 'insert', prompt: 'cinematic lighting' })
  })

  it('rejects cross-origin messages', () => {
    expect(parseImgPromptMessage({
      origin: 'https://attacker.example',
      data: { type: 'imgprompt:apply', action: 'replace', prompt: 'ignored' },
    }, sameOrigin)).toBeNull()
  })

  it('rejects unsupported actions and empty prompts', () => {
    expect(parseImgPromptMessage({
      origin: sameOrigin,
      data: { type: 'imgprompt:apply', action: 'delete', prompt: 'ignored' },
    }, sameOrigin)).toBeNull()
    expect(parseImgPromptMessage({
      origin: sameOrigin,
      data: { type: 'imgprompt:apply', action: 'append', prompt: '   ' },
    }, sameOrigin)).toBeNull()
  })
})
