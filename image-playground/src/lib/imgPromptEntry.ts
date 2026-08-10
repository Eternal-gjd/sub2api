export const OPEN_IMG_PROMPT_EVENT = 'image-playground:open-img-prompt'
export const IMG_PROMPT_GUIDE_STORAGE_KEY = 'image-playground:img-prompt-guide-dismissed'

export function openImgPrompt() {
  window.dispatchEvent(new Event(OPEN_IMG_PROMPT_EVENT))
}
