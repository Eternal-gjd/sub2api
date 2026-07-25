import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))
const existingViewSource = readFileSync(resolve(dir, '../ImagePlaygroundView.vue'), 'utf8')
const imgxViewSource = readFileSync(resolve(dir, '../ImgXStudioView.vue'), 'utf8')
const routerSource = readFileSync(resolve(dir, '../../../router/index.ts'), 'utf8')
const sidebarSource = readFileSync(resolve(dir, '../../../components/layout/AppSidebar.vue'), 'utf8')

describe('image workspace integrations', () => {
  it('keeps the existing same-origin playground', () => {
    expect(existingViewSource).toContain('/gpt-image-playground/?sub2api=1')
    expect(routerSource).toContain("path: '/image-playground'")
    expect(sidebarSource).toContain("{ path: '/image-playground', label: t('nav.imagePlayground')")
  })

  it('embeds ImgX Studio at a distinct same-origin prefix', () => {
    expect(imgxViewSource).toContain('/imgx-studio/?sub2api=1')
    expect(imgxViewSource).toContain('title="ImgX Studio"')
  })

  it('requires authentication for the distinct ImgX route', () => {
    expect(routerSource).toContain("path: '/imgx-studio'")
    expect(routerSource).toContain("component: () => import('@/views/user/ImgXStudioView.vue')")
    expect(routerSource).toMatch(/path: '\/imgx-studio'[\s\S]*?requiresAuth: true/)
  })

  it('adds a separate sidebar entry without replacing the original one', () => {
    expect(sidebarSource).toContain("{ path: '/imgx-studio', label: t('nav.imgxStudio'), icon: ImagePlaygroundIcon")
  })
})
