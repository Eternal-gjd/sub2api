import { describe, expect, it, vi } from 'vitest'
import { dataUrlToBlob } from './canvasImage'

describe('dataUrlToBlob', () => {
  it('decodes data URLs without issuing a fetch request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    const blob = await dataUrlToBlob('data:image/png;base64,AQID')

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(blob.type).toBe('image/png')
    expect([...new Uint8Array(await blob.arrayBuffer())]).toEqual([1, 2, 3])
  })
})
