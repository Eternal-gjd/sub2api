import { createPortal } from 'react-dom'
import { useEffect, useRef } from 'react'
import { useCloseOnEscape } from '../hooks/useCloseOnEscape'
import { usePreventBackgroundScroll } from '../hooks/usePreventBackgroundScroll'
import { buildImgPromptUrl, parseImgPromptMessage, type ImgPromptApplyPayload } from '../lib/imgPromptBridge'
import { CloseIcon } from './icons'

interface ImgPromptModalProps {
  open: boolean
  onClose: () => void
  onApply: (payload: ImgPromptApplyPayload) => void
}

export default function ImgPromptModal({ open, onClose, onApply }: ImgPromptModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useCloseOnEscape(open, onClose)
  usePreventBackgroundScroll(open)

  useEffect(() => {
    if (!open) return

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return
      const payload = parseImgPromptMessage(event, window.location.origin)
      if (!payload) return
      onApply(payload)
      onClose()
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onApply, onClose, open])

  if (!open) return null

  return createPortal(
    <div
      data-no-drag-select
      role="dialog"
      aria-modal="true"
      aria-labelledby="imgprompt-modal-title"
      className="fixed inset-0 z-[90] bg-black/45 p-0 sm:p-3"
    >
      <div className="flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-gray-950 sm:rounded-lg sm:border sm:border-white/20">
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 px-4 dark:border-white/[0.08]">
          <div className="min-w-0">
            <h2 id="imgprompt-modal-title" className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">IMGPrompt 提示词词典</h2>
            <p className="hidden truncate text-xs text-gray-500 dark:text-gray-400 sm:block">选择标签后，在词典右侧将提示词插入、追加或替换到当前输入框。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-white/[0.08] dark:hover:text-gray-100"
            aria-label="关闭提示词词典"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <iframe
          ref={iframeRef}
          title="IMGPrompt 提示词词典"
          src={buildImgPromptUrl(document.documentElement.lang || navigator.language)}
          className="min-h-0 flex-1 border-0 bg-white"
          allow="clipboard-write"
        />
      </div>
    </div>,
    document.body,
  )
}
