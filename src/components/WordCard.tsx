import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { fadeInUp } from './animations'

interface Translation {
  type: string
  translation: string
}

interface Phrase {
  phrase: string
  translation: string
}

interface Sentence {
  sentence: string
  translation: string
}

// 单词阅读卡片
const Card = styled.div`
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 44px 48px 24px;
  box-shadow: 0 12px 40px rgba(30, 45, 35, 0.04);
  width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
  animation: ${fadeInUp} 0.35s ease-out;
  @media (max-width: 600px) {
    padding: 28px 22px 16px;
  }
`

const Title = styled.h1`
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 400;
  color: var(--ink);
  margin: 0 0 24px;
  text-align: center;
  letter-spacing: -0.04em;
  line-height: 1.15;
`

const Text = styled.p`
  margin: 28px 0 12px;
  padding-top: 24px;
  border-top: 1px solid var(--line);
  font-size: 11px;
  letter-spacing: 2px;
  color: var(--muted);
  strong {
    font-weight: 500;
  }
`

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`

const ListItem = styled.li`
  padding: 8px 0;
  color: var(--ink);
  font-size: 15px;
  line-height: 1.9;
  strong {
    font-weight: 500;
  }
  & + & {
    margin-top: 4px;
  }
`

const Button = styled.button`
  background: var(--accent);
  color: var(--on-accent);
  font-size: 14px;
  font-weight: 500;
  padding: 12px 28px;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  margin: 8px;
  transition:
    background 0.2s,
    transform 0.2s;
  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0);
  }
`

const PlayButton = styled(Button)`
  background: var(--soft);
  color: var(--ink);
  border-color: var(--line);
  font-size: 13px;
  padding: 9px 10px;
  margin: 0;
`

const InlinePlayButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  min-width: 48px;
  height: 32px;
  padding: 0 6px;
  gap: 4px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--soft);
  color: var(--ink);
  cursor: pointer;
  &:hover {
    background: var(--line);
  }
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`

const InlinePlayGroup = styled.span`
  display: inline-flex;
  vertical-align: middle;
  gap: 4px;
  margin-left: 6px;
`

function TextPlayButtons({
  text,
  kind,
  onPlay
}: {
  text: string
  kind: string
  onPlay: (text: string, accent: 'us' | 'uk') => void
}) {
  if (!text.trim()) return null

  return (
    <InlinePlayGroup role="group" aria-label={`${kind}朗读`}>
      {(['us', 'uk'] as const).map(accent => {
        const label = `${accent === 'us' ? '美式' : '英式'}朗读${kind}`
        return (
          <InlinePlayButton
            key={accent}
            type="button"
            aria-label={`${label}：${text}`}
            title={label}
            onClick={() => onPlay(text, accent)}
          >
            <span aria-hidden="true">{accent === 'us' ? '🇺🇸' : '🇬🇧'} 🔊</span>
          </InlinePlayButton>
        )
      })}
    </InlinePlayGroup>
  )
}

const FeedbackText = styled.div<{ type: 'success' | 'info' }>`
  min-height: 24px;
  margin-top: 4px;
  color: var(--muted);
  font-size: 12px;
`

const SpeechMessage = styled.div`
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
  text-align: center;
  &:not(:empty) {
    margin: -8px 0 16px;
  }
`

interface WordCardProps {
  word: string
  us: string
  uk: string
  translations: Translation[]
  phrases: Phrase[]
  sentences: Sentence[]
  bgIndex: number
  isLoading: boolean
  showContent: boolean
  onSettingsClick: () => void
  onPlayPhonetic: (type: 'us' | 'uk') => void
  onPlayText: (text: string, accent: 'us' | 'uk') => void
  speechMessage: string
  onDontKnow: (word: string, translations: Translation[]) => boolean
}

export const WordCard = ({
  word,
  us,
  uk,
  translations,
  phrases,
  sentences,
  bgIndex,
  isLoading,
  showContent,
  onPlayPhonetic,
  onPlayText,
  speechMessage,
  onDontKnow
}: WordCardProps) => {
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'info' } | null>(
    null
  )
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setFeedback(null)
  }, [word])

  const handleDontKnow = () => {
    const added = onDontKnow(word, translations)

    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current)
    }

    setFeedback({
      message: added ? '已加入不会的单词' : '这个单词已标记过',
      type: added ? 'success' : 'info'
    })
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null)
    }, 1800)
  }

  if (isLoading) {
    return (
      <Card>
        <div
          style={{ textAlign: 'center', fontSize: '2rem', color: bgIndex === 0 ? '#000' : '#fff' }}
        >
          Loading...
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <Title>{word}</Title>
      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '20px'
        }}
      >
        <PlayButton
          aria-label="播放美式发音"
          title="播放美式发音"
          onClick={() => onPlayPhonetic('us')}
        >
          🇺🇸 🔊 {us}
        </PlayButton>
        <PlayButton
          aria-label="播放英式发音"
          title="播放英式发音"
          onClick={() => onPlayPhonetic('uk')}
        >
          🇬🇧 🔊 {uk}
        </PlayButton>
      </div>
      <SpeechMessage role="status" aria-live="polite" aria-atomic="true">
        {speechMessage}
      </SpeechMessage>
      <div style={{ textAlign: 'center' }}>
        <Button onClick={handleDontKnow}>不会</Button>
        <FeedbackText type={feedback?.type ?? 'success'} aria-live="polite">
          {feedback?.message}
        </FeedbackText>
      </div>
      {showContent && (
        <>
          <Text>
            <strong>释义 / MEANING</strong>
          </Text>
          <List>
            {translations.map((t, i) => (
              <ListItem key={i}>
                <strong>{t.type}:</strong> {t.translation}
              </ListItem>
            ))}
          </List>
          <Text>
            <strong>例句 / IN CONTEXT</strong>
          </Text>
          <List>
            {sentences.map((s, i) => (
              <ListItem key={i}>
                <strong>{s.sentence}</strong>
                <TextPlayButtons text={s.sentence} kind="例句" onPlay={onPlayText} />
                <br />
                {s.translation}
              </ListItem>
            ))}
          </List>
          {phrases.length > 0 && (
            <>
              <Text>
                <strong>短语 / PHRASES</strong>
              </Text>
              <List>
                {phrases.map((p, i) => (
                  <ListItem key={i}>
                    <strong>{p.phrase}</strong>
                    <TextPlayButtons text={p.phrase} kind="短语" onPlay={onPlayText} />
                    {'：'}
                    {p.translation}
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </>
      )}
    </Card>
  )
}
