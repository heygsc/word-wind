import { type FormEvent, useEffect, useRef, useState } from 'react'
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
      {(['uk', 'us'] as const).map(accent => {
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

const Practice = styled.section`
  margin-bottom: 24px;
  h1 {
    margin: 0 0 16px;
    font-size: 20px;
    font-weight: 500;
  }
  p {
    color: var(--muted);
    font-size: 13px;
    line-height: 1.7;
  }
  label {
    display: block;
    margin: 24px 0 10px;
    font-size: 14px;
  }
`

const AnswerInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--soft);
  color: var(--ink);
  font-size: 18px;
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`

const PracticeActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
  button {
    margin: 0;
    padding: 10px 14px;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
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
  isSpelling: boolean
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
  isSpelling,
  onPlayPhonetic,
  onPlayText,
  speechMessage,
  onDontKnow
}: WordCardProps) => {
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<'match' | 'different' | 'revealed' | null>(null)
  const [showHint, setShowHint] = useState(false)
  const answerRef = useRef<HTMLInputElement>(null)
  const answerVisible = !isSpelling || result !== null
  const detailsVisible = isSpelling ? answerVisible : showContent

  useEffect(() => {
    if (isSpelling && !isLoading) answerRef.current?.focus()
  }, [isSpelling, isLoading])

  const checkAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!answer.trim() || !word.trim() || result) return
    const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase()
    setResult(normalize(answer) === normalize(word) ? 'match' : 'different')
  }

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
      {isSpelling && (
        <Practice aria-labelledby="spelling-heading">
          <h1 id="spelling-heading">看中文，回忆英文</h1>
          <List>
            {translations.map((t, i) => (
              <ListItem key={i}>
                {t.type && <strong>{t.type}: </strong>}
                {t.translation}
              </ListItem>
            ))}
          </List>
          {translations.length === 0 && <p>这个词条暂无中文释义，可以查看答案或跳过。</p>}
          <p id="spelling-help">按当前词条核对拼写；中文可能对应多个英文词。</p>
          <form onSubmit={checkAnswer}>
            <label htmlFor="spelling-answer">你的英文答案</label>
            <AnswerInput
              ref={answerRef}
              id="spelling-answer"
              value={answer}
              onChange={event => setAnswer(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && event.nativeEvent.isComposing) event.preventDefault()
              }}
              placeholder="输入英文，按 Enter 检查"
              aria-describedby="spelling-help spelling-result"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              readOnly={answerVisible}
            />
            {!answerVisible && (
              <PracticeActions>
                <Button type="submit" disabled={!answer.trim() || !word.trim()}>
                  检查拼写
                </Button>
                <PlayButton
                  type="button"
                  onClick={() => {
                    setShowHint(true)
                    answerRef.current?.focus()
                  }}
                  disabled={showHint || !word.trim()}
                >
                  首字母提示
                </PlayButton>
                <PlayButton type="button" onClick={() => setResult('revealed')}>
                  看答案
                </PlayButton>
              </PracticeActions>
            )}
          </form>
          {showHint && !answerVisible && <p role="status">首字母：{word.trim().charAt(0)}</p>}
          <p id="spelling-result" role="status" aria-live="polite">
            {result === 'match' && '拼写正确！可以继续下一个。'}
            {result === 'different' &&
              `与当前词条不一致，本词条答案是 ${word}。可以对照记忆后继续。`}
            {result === 'revealed' && `本词条答案是 ${word}。可以标记“不会”，或直接继续下一个。`}
          </p>
        </Practice>
      )}
      {answerVisible && (
        <>
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
              aria-label="播放英式发音"
              title="播放英式发音"
              onClick={() => onPlayPhonetic('uk')}
            >
              🇬🇧 🔊 {uk}
            </PlayButton>
            <PlayButton
              aria-label="播放美式发音"
              title="播放美式发音"
              onClick={() => onPlayPhonetic('us')}
            >
              🇺🇸 🔊 {us}
            </PlayButton>
          </div>
          <SpeechMessage role="status" aria-live="polite" aria-atomic="true">
            {speechMessage}
          </SpeechMessage>
        </>
      )}
      <div style={{ textAlign: 'center' }}>
        <Button onClick={handleDontKnow}>不会</Button>
        <FeedbackText type={feedback?.type ?? 'success'} aria-live="polite">
          {feedback?.message}
        </FeedbackText>
      </div>
      {detailsVisible && (
        <>
          {!isSpelling && (
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
            </>
          )}
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
