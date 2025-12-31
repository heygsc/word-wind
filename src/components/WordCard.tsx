import styled from 'styled-components'
import { fadeInUp, float } from './animations'

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

// 卡片容器
const Card = styled.div`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 900px;
  width: 100%;
  animation: ${fadeInUp} 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  z-index: 1;
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
  &:hover {
    transform: translateY(-5px) rotateX(2deg);
  }
`

// 标题样式
const Title = styled.h1<{ bgIndex: number }>`
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 30px;
  text-align: center;
  background: ${props =>
    props.bgIndex === 0
      ? 'linear-gradient(135deg, #000 0%, #333 50%, #666 100%)'
      : 'linear-gradient(135deg, #fff 0%, #e0e7ff 50%, #c7d2fe 100%)'};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: ${props =>
    props.bgIndex === 0 ? '0 0 40px rgba(0, 0, 0, 0.3)' : '0 0 40px rgba(255, 255, 255, 0.3)'};
  animation: ${float} 6s ease-in-out infinite;
  letter-spacing: -0.02em;
  line-height: 1.1;
`

// 文本样式
const Text = styled.p`
  font-size: 1.1rem;
  font-weight: 400;
  margin: 15px 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
`

// 列表样式
const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 15px 0;
`

const ListItem = styled.li`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  margin: 8px 0;
  padding: 15px 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s;
  }
  &:hover {
    transform: translateX(15px) scale(1.02);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    &::before {
      left: 100%;
    }
  }
`

// 按钮样式
const Button = styled.button<{ i?: number }>`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: ${props => (props.i === 0 ? '#000' : 'white')};
  font-size: 16px;
  font-weight: 500;
  padding: 14px 28px;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  margin: 12px;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  &:hover {
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 12px 35px rgba(102, 126, 234, 0.3);
    &::before {
      left: 100%;
    }
  }
  &:active {
    transform: translateY(-1px) scale(1.02);
  }
`

const PlayButton = styled(Button)`
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 8px 25px rgba(245, 87, 108, 0.3);
  &:hover {
    box-shadow: 0 12px 35px rgba(245, 87, 108, 0.4);
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
  onSettingsClick: () => void
  onPlayPhonetic: (type: 'us' | 'uk') => void
  onDontKnow: (word: string, translations: Translation[]) => void
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
  onPlayPhonetic,
  onDontKnow
}: WordCardProps) => {
  const handleDontKnow = () => {
    onDontKnow(word, translations)
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
      <Title bgIndex={bgIndex}>{word}</Title>
      <div
        style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '20px'
        }}
      >
        <PlayButton onClick={() => onPlayPhonetic('us')}>🇺🇸 🔊 {us}</PlayButton>
        <PlayButton onClick={() => onPlayPhonetic('uk')}>🇬🇧 🔊 {uk}</PlayButton>
      </div>
      <Text>
        <strong>翻译：</strong>
      </Text>
      <List>
        {translations.map((t, i) => (
          <ListItem key={i}>
            <strong>{t.type}:</strong> {t.translation}
          </ListItem>
        ))}
      </List>
      <Text>
        <strong>句子：</strong>
      </Text>
      <List>
        {sentences.map((s, i) => (
          <ListItem key={i}>
            <strong>{s.sentence}</strong>
            <br />
            {s.translation}
          </ListItem>
        ))}
      </List>
      {phrases.length > 0 && (
        <>
          <Text>
            <strong>短语：</strong>
          </Text>
          <List>
            {phrases.map((p, i) => (
              <ListItem key={i}>
                <strong>{p.phrase}:</strong> {p.translation}
              </ListItem>
            ))}
          </List>
        </>
      )}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Button onClick={handleDontKnow}>不会</Button>
      </div>
    </Card>
  )
}
