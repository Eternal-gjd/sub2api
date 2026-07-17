import type { ApiProfile } from '../types'

export const SUB2API_PROFILE_ID = 'sub2api-gpt-image'

export interface Sub2APIGroup {
  id: number
  name: string
  platform?: string
  allow_image_generation?: boolean
}

export interface Sub2APIKey {
  id: number
  key: string
  name: string
  status: string
  group_id?: number | null
  group?: Sub2APIGroup
  created_at?: string
}

export type Sub2APIBootstrapConfig =
  | { enabled: false }
  | { enabled: true; apiBaseUrl: string; gatewayBaseUrl: string }

export function getSub2APIBootstrapConfig(url: URL = new URL(window.location.href)): Sub2APIBootstrapConfig {
  if (url.searchParams.get('sub2api') !== '1') return { enabled: false }
  return {
    enabled: true,
    apiBaseUrl: `${url.origin}/api/v1`,
    gatewayBaseUrl: `${url.origin}/v1`,
  }
}

export function isSub2APIEmbeddedMode(): boolean {
  if (typeof window === 'undefined') return false
  return getSub2APIBootstrapConfig().enabled
}

function isExactGPTImageGroup(key: Sub2APIKey): boolean {
  const groupName = key.group?.name?.trim().toLowerCase() ?? ''
  return groupName === 'gpt-image' || groupName === 'gpt_image' || groupName === 'gpt image'
}

function isUsableImageKey(key: Sub2APIKey): boolean {
  return key.status === 'active' && key.group?.allow_image_generation === true && Boolean(key.key?.trim())
}

export function selectGPTImageKey(keys: Sub2APIKey[]): Sub2APIKey | null {
  const usable = keys.filter(isUsableImageKey)
  return usable.find(isExactGPTImageGroup) ?? null
}

export function buildSub2APIProfile(key: Sub2APIKey, gatewayBaseUrl: string): ApiProfile {
  return {
    id: SUB2API_PROFILE_ID,
    name: `Sub2API · ${key.group?.name || key.name || 'gpt-image'}`,
    provider: 'openai',
    baseUrl: gatewayBaseUrl.replace(/\/+$/, ''),
    apiKey: key.key.trim(),
    model: 'gpt-image-2',
    timeout: 600,
    apiMode: 'images',
    codexCli: false,
    apiProxy: false,
    streamImages: false,
    streamPartialImages: 0,
  }
}

function unwrapKeyItems(payload: unknown): Sub2APIKey[] {
  if (!payload || typeof payload !== 'object') return []
  const record = payload as Record<string, unknown>
  const data = record.code === 0 && record.data && typeof record.data === 'object'
    ? record.data as Record<string, unknown>
    : record
  const items = Array.isArray(data.items) ? data.items : Array.isArray(data.data) ? data.data : []
  return items as Sub2APIKey[]
}

export async function loadSub2APIProfile(config: Extract<Sub2APIBootstrapConfig, { enabled: true }>): Promise<ApiProfile> {
  const token = window.localStorage.getItem('auth_token')?.trim()
  if (!token) throw new Error('未检测到 Sub2API 登录状态，请返回控制台重新登录。')

  const response = await fetch(`${config.apiBaseUrl}/keys?page=1&page_size=100&status=active`, {
    credentials: 'same-origin',
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept-Language': navigator.language || 'zh-CN',
      'X-User-UI-Request': '1',
    },
  })

  if (response.status === 401) throw new Error('Sub2API 登录状态已过期，请返回控制台重新登录。')
  if (!response.ok) throw new Error(`获取 Sub2API 生图密钥失败（HTTP ${response.status}）。`)

  const key = selectGPTImageKey(unwrapKeyItems(await response.json()))
  if (!key) throw new Error('当前用户没有启用且允许生图的 gpt-image 分组密钥。')
  return buildSub2APIProfile(key, config.gatewayBaseUrl)
}

export function sanitizeSub2APISettingsForPersistence<T extends { profiles?: ApiProfile[]; apiKey?: string }>(settings: T): T {
  const containsSub2APIProfile = settings.profiles?.some((profile) => profile.id === SUB2API_PROFILE_ID) ?? false
  if (!containsSub2APIProfile) return settings
  return {
    ...settings,
    apiKey: '',
    profiles: settings.profiles?.map((profile) =>
      profile.id === SUB2API_PROFILE_ID ? { ...profile, apiKey: '' } : profile,
    ),
  }
}
