import { describe, expect, it } from 'vitest'
import {
  buildSub2APIProfile,
  getSub2APIBootstrapConfig,
  sanitizeSub2APISettingsForPersistence,
  selectGPTImageKey,
} from './sub2apiIntegration'

describe('Sub2API embedded integration', () => {
  it('detects the same-origin embedded mode', () => {
    expect(getSub2APIBootstrapConfig(new URL('https://example.com/gpt-image-playground/?sub2api=1'))).toEqual({
      enabled: true,
      apiBaseUrl: 'https://example.com/api/v1',
      gatewayBaseUrl: 'https://example.com/v1',
    })
    expect(getSub2APIBootstrapConfig(new URL('https://example.com/'))).toEqual({ enabled: false })
  })

  it('prefers an active gpt-image group key with image generation enabled', () => {
    const selected = selectGPTImageKey([
      {
        id: 1,
        key: 'sk-other',
        name: 'Other',
        status: 'active',
        group: { id: 1, name: 'OpenAI', platform: 'openai', allow_image_generation: true },
      },
      {
        id: 2,
        key: 'sk-image',
        name: 'Image',
        status: 'active',
        group: { id: 2, name: 'gpt-image', platform: 'openai', allow_image_generation: true },
      },
    ])

    expect(selected?.id).toBe(2)
  })

  it('rejects inactive, expired and non-image keys', () => {
    expect(selectGPTImageKey([
      {
        id: 1,
        key: 'sk-disabled',
        name: 'Disabled',
        status: 'inactive',
        group: { id: 1, name: 'gpt-image', platform: 'openai', allow_image_generation: true },
      },
      {
        id: 2,
        key: 'sk-no-image',
        name: 'No Image',
        status: 'active',
        group: { id: 2, name: 'gpt-image', platform: 'openai', allow_image_generation: false },
      },
    ])).toBeNull()
  })

  it('builds a locked OpenAI-compatible image profile', () => {
    const profile = buildSub2APIProfile({
      id: 2,
      key: 'sk-image',
      name: 'Image',
      status: 'active',
      group: { id: 2, name: 'gpt-image', platform: 'openai', allow_image_generation: true },
    }, 'https://example.com/v1')

    expect(profile).toMatchObject({
      id: 'sub2api-gpt-image',
      name: 'Sub2API · gpt-image',
      provider: 'openai',
      baseUrl: 'https://example.com/v1',
      apiKey: 'sk-image',
      model: 'gpt-image-2',
      apiMode: 'images',
      apiProxy: false,
    })
  })

  it('removes the injected key before settings are persisted', () => {
    const settings = {
      profiles: [buildSub2APIProfile({
        id: 2,
        key: 'sk-image',
        name: 'Image',
        status: 'active',
        group: { id: 2, name: 'gpt-image', platform: 'openai', allow_image_generation: true },
      }, 'https://example.com/v1')],
      activeProfileId: 'sub2api-gpt-image',
      apiKey: 'sk-image',
    }

    expect(JSON.stringify(sanitizeSub2APISettingsForPersistence(settings))).not.toContain('sk-image')
  })
})
