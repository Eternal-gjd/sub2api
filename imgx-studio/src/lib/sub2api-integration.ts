export const IMGX_SUB2API_PROFILE_ID = 'imgx-sub2api-gpt-image'

export interface Sub2APIGroup {
  id: number
  name: string
  allow_image_generation?: boolean
}

export interface Sub2APIKey {
  id: number
  key: string
  name: string
  status: string
  group_id?: number | null
  group?: Sub2APIGroup
}

export type ImgXSub2APIConfig =
  | { enabled: false }
  | { enabled: true; apiBaseUrl: string; gatewayBaseUrl: string }

export function buildImgXSub2APIConfig(url: URL = new URL(window.location.href)): ImgXSub2APIConfig {
  if (url.searchParams.get('sub2api') !== '1') return { enabled: false }
  return {
    enabled: true,
    apiBaseUrl: `${url.origin}/api/v1`,
    gatewayBaseUrl: `${url.origin}/v1`,
  }
}

function isImageGroup(key: Sub2APIKey) {
  const name = key.group?.name?.trim().toLowerCase() ?? ''
  return name === 'gpt-image' || name === 'gpt_image' || name === 'gpt image'
}

export function selectGPTImageKey(keys: Sub2APIKey[]): Sub2APIKey | null {
  return keys.find((key) =>
    key.status === 'active' &&
    key.group?.allow_image_generation === true &&
    Boolean(key.key?.trim()) &&
    isImageGroup(key)
  ) ?? null
}

function unwrapItems(payload: unknown): Sub2APIKey[] {
  if (!payload || typeof payload !== 'object') return []
  const record = payload as Record<string, unknown>
  const data = record.code === 0 && record.data && typeof record.data === 'object'
    ? record.data as Record<string, unknown>
    : record
  const items = Array.isArray(data.items) ? data.items : Array.isArray(data.data) ? data.data : []
  return items as Sub2APIKey[]
}

export async function loadImgXSub2APIKey(config: Extract<ImgXSub2APIConfig, { enabled: true }>) {
  const token = window.localStorage.getItem('auth_token')?.trim()
  if (!token) throw new Error('未检测到 Sub2API 登录状态，请返回控制台重新登录。')
  const response = await fetch(`${config.apiBaseUrl}/keys?page=1&page_size=100&status=active`, {
    credentials: 'same-origin',
    headers: { Authorization: `Bearer ${token}`, 'X-User-UI-Request': '1' },
  })
  if (response.status === 401) throw new Error('Sub2API 登录状态已过期，请返回控制台重新登录。')
  if (!response.ok) throw new Error(`获取 ImgX 生图密钥失败（HTTP ${response.status}）。`)
  const key = selectGPTImageKey(unwrapItems(await response.json()))
  if (!key) throw new Error('当前用户没有启用且允许生图的 gpt-image 分组密钥。')
  return { token, apiKey: key.key.trim(), baseUrl: config.gatewayBaseUrl }
}
