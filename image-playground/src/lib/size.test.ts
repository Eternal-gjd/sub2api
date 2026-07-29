import { describe, expect, it } from 'vitest'
import { calculateImageSize, resolveImageTierModel } from './size'

describe('calculateImageSize', () => {
  it('uses common 16:9 display resolutions for the built-in tiers', () => {
    expect(calculateImageSize('1K', '16:9')).toBe('1280x720')
    expect(calculateImageSize('2K', '16:9')).toBe('2560x1440')
    expect(calculateImageSize('4K', '16:9')).toBe('3840x2160')
  })

  it('uses matching portrait presets for common ratios', () => {
    expect(calculateImageSize('2K', '9:16')).toBe('1440x2560')
    expect(calculateImageSize('2K', '2:3')).toBe('1440x2160')
    expect(calculateImageSize('2K', '3:4')).toBe('1536x2048')
  })

  it('falls back to budget-based sizing for custom ratios', () => {
    expect(calculateImageSize('2K', '5:4')).toBe('2288x1824')
  })
})

describe('resolveImageTierModel', () => {
  it.each([
    ['1024x1024', 'gpt-image-2-1k'],
    ['1536x1024', 'gpt-image-2-1k'],
    ['2048x2048', 'gpt-image-2-2k'],
    ['2160x1440', 'gpt-image-2-2k'],
    ['3840x2160', 'gpt-image-2-4k'],
  ])('routes gpt-image-2 size %s through %s', (size, expected) => {
    expect(resolveImageTierModel('gpt-image-2', size)).toBe(expected)
  })

  it.each([
    'gpt-image-1',
    'gpt-image-2-1k',
    'custom-image-model',
  ])('leaves model %s unchanged', (model) => {
    expect(resolveImageTierModel(model, '3840x2160')).toBe(model)
  })
})
