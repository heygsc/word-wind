const normalizeLanguage = (language: string) => language.replace(/_/g, '-').toLowerCase()

const errorMessages: Partial<Record<SpeechSynthesisErrorCode, string>> = {
  'not-allowed': '浏览器未允许播放，请再次点击音标；仍无声音时，请在系统浏览器中打开。',
  'language-unavailable':
    '设备没有可用的英语语音，请在系统语音设置中安装英语语音包，或更换浏览器。',
  'voice-unavailable': '所选语音暂不可用，请再次点击音标，或更换浏览器。',
  'synthesis-unavailable': '设备的语音服务不可用，请检查系统文字转语音设置，或更换浏览器。',
  'synthesis-failed': '语音合成失败，请重试，或在系统浏览器中打开。',
  network: '语音服务连接失败，请检查网络后重试。',
  'audio-busy': '音频设备正被占用，请关闭其他音频应用后重试。',
  'audio-hardware': '无法使用声音输出设备，请检查扬声器或耳机连接。'
}

export function createSpeechPlayer(onMessage: (message: string) => void) {
  const synth = window.speechSynthesis
  const supported = !!synth && typeof window.SpeechSynthesisUtterance === 'function'
  let voices: SpeechSynthesisVoice[] = []
  // 保留正在播放的对象，并用它识别过期的异步事件。
  let active: SpeechSynthesisUtterance | null = null
  let startTimer: ReturnType<typeof setTimeout> | undefined

  const refreshVoices = () => {
    try {
      voices = synth.getVoices()
    } catch {
      voices = []
    }
  }

  const release = () => {
    clearTimeout(startTimer)
    startTimer = undefined
    if (active) {
      active.onstart = null
      active.onend = null
      active.onerror = null
      active = null
    }
  }

  const stop = () => {
    const wasActive = !!active
    release()
    if (wasActive) {
      try {
        synth.cancel()
      } catch {
        // 部分内嵌浏览器暴露接口，但没有可用的语音引擎。
      }
    }
  }

  if (supported) {
    synth.addEventListener('voiceschanged', refreshVoices)
    refreshVoices()
  }

  return {
    stop,
    play(word: string, accent: 'us' | 'uk') {
      stop()
      if (!word.trim()) return
      if (!supported) {
        onMessage('当前浏览器不支持朗读，请复制链接到系统浏览器中打开。')
        return
      }

      onMessage('正在准备发音…')
      try {
        refreshVoices()
        const language = accent === 'us' ? 'en-US' : 'en-GB'
        const englishVoices = voices.filter(v => /^en(?:-|$)/.test(normalizeLanguage(v.lang)))
        const matchingVoices = englishVoices.filter(
          v => normalizeLanguage(v.lang) === normalizeLanguage(language)
        )
        // 同口音优先选择本地语音，减少对远程服务的依赖。
        const candidates = matchingVoices.length ? matchingVoices : englishVoices
        const voice = candidates.find(v => v.localService) ?? candidates[0]
        const fallback = voice && normalizeLanguage(voice.lang) !== normalizeLanguage(language)
        const utterance = new window.SpeechSynthesisUtterance(word)
        utterance.lang = voice ? voice.lang.replace(/_/g, '-') : language
        if (voice) utterance.voice = voice
        active = utterance

        utterance.onstart = () => {
          if (active !== utterance) return
          clearTimeout(startTimer)
          onMessage(fallback ? '当前设备缺少所选口音，已使用其他英语语音。' : '')
        }
        utterance.onend = () => {
          if (active !== utterance) return
          release()
          onMessage(fallback ? '当前设备缺少所选口音，已使用其他英语语音。' : '')
        }
        utterance.onerror = event => {
          if (active !== utterance) return
          release()
          if (event.error === 'canceled' || event.error === 'interrupted') {
            onMessage('播放已中断，请再次点击音标。')
            return
          }
          onMessage(errorMessages[event.error] ?? '发音失败，请重试，或在系统浏览器中打开。')
        }
        startTimer = setTimeout(() => {
          if (active !== utterance) return
          stop()
          onMessage(
            '发音未能启动，请再次点击音标；仍无声音时，请检查系统英语语音设置或更换浏览器。'
          )
        }, 8000)

        if (synth.paused) synth.resume()
        // 不等待 voiceschanged：保留本次点击的用户激活状态。
        // 列表为空时仍指定语言，让引擎自行选择语音。
        synth.speak(utterance)
      } catch {
        stop()
        onMessage('无法启动语音服务，请重试，或在系统浏览器中打开。')
      }
    },
    dispose() {
      stop()
      if (supported) synth.removeEventListener('voiceschanged', refreshVoices)
    }
  }
}
