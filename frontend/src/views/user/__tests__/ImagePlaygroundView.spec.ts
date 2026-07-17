import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))
const viewSource = readFileSync(resolve(dir, '../ImagePlaygroundView.vue'), 'utf8')
const routerSource = readFileSync(resolve(dir, '../../../router/index.ts'), 'utf8')
const sidebarSource = readFileSync(resolve(dir, '../../../components/layout/AppSidebar.vue'), 'utf8')

describe('image playground integration', () => {
  it('embeds the same-origin playground', () => {
    expect(viewSource).toContain('/gpt-image-playground/?sub2api=1')
  })

  it('requires authentication for the playground route', () => {
    expect(routerSource).toContain("path: '/image-playground'")
    expect(routerSource).toContain("component: () => import('@/views/user/ImagePlaygroundView.vue')")
  })

  it('adds a sidebar entry', () => {
    expect(sidebarSource).toContain("{ path: '/image-playground', label: t('nav.imagePlayground'), icon: ImagePlaygroundIcon")
  })
})