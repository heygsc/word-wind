import { useEffect, useState } from 'react'

// 先绘制弹窗的初始状态，再启动过渡；关闭后才卸载。
export const useModalTransition = (show: boolean) => {
  const [isVisible, setIsVisible] = useState(show)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    let firstFrame = 0
    let secondFrame = 0
    let closeTimer: ReturnType<typeof setTimeout> | undefined

    if (show) {
      setIsVisible(true)
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => setIsOpen(true))
      })
    } else {
      setIsOpen(false)
      const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300
      closeTimer = setTimeout(() => setIsVisible(false), duration)
    }

    return () => {
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
      clearTimeout(closeTimer)
    }
  }, [show])

  return { isVisible, isOpen }
}
