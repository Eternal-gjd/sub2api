import { describe, expect, it } from "vitest"

import {
  buildImgXSub2APIConfig,
  selectGPTImageKey,
  type Sub2APIKey,
} from "./sub2api-integration"

const imageKey: Sub2APIKey = {
  id: 2,
  key: "sk-image",
  name: "Image",
  status: "active",
  group: { id: 2, name: "gpt-image", allow_image_generation: true },
}

describe("ImgX Sub2API embedded integration", () => {
  it("detects embedded mode and builds same-origin URLs", () => {
    expect(buildImgXSub2APIConfig(new URL("https://example.com/imgx-studio/?sub2api=1"))).toEqual({
      enabled: true,
      apiBaseUrl: "https://example.com/api/v1",
      gatewayBaseUrl: "https://example.com/v1",
    })
    expect(buildImgXSub2APIConfig(new URL("https://example.com/imgx-studio/"))).toEqual({ enabled: false })
  })

  it("selects only an active image-enabled gpt-image group key", () => {
    expect(selectGPTImageKey([
      { ...imageKey, id: 1, group: { id: 1, name: "other", allow_image_generation: true } },
      imageKey,
    ])?.id).toBe(2)
    expect(selectGPTImageKey([
      { ...imageKey, status: "inactive" },
      { ...imageKey, group: { ...imageKey.group!, allow_image_generation: false } },
    ])).toBeNull()
  })
})
