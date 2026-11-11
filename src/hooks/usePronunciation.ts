import { useEffect, useRef, useState } from 'react'
import { createSpeechPlayer } from '../utils/speech'

export function usePronunciation(word: string, location: string) {
  const playerRef = useRef<ReturnType<typeof createSpeechPlayer> | null>(null)
  const [speechMessage, setSpeechMessage] = useState('')

  useEffect(() => {
    const player = createSpeechPlayer(setSpeechMessage)
    playerRef.current = player
    return () => {
      player.dispose()
      playerRef.current = null
    }
  }, [])

  useEffect(() => {
    setSpeechMessage('')
    playerRef.current?.stop()
  }, [word, location])

  const playPhonetic = (accent: 'us' | 'uk') => {
    playerRef.current?.play(word, accent)
  }

  const playText = (text: string, accent: 'us' | 'uk') => {
    playerRef.current?.play(text, accent)
  }

  return { playPhonetic, playText, speechMessage }
}
