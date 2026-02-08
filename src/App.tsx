import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { GlobalStyle } from './components/GlobalStyles'
import { gradientShift, pulse } from './components/animations'
import { WordCard } from './components/WordCard'
import { SettingsModal } from './components/SettingsModal'
import { UnknownWordsModal } from './components/UnknownWordsModal'
import { supabase } from './utils/supabase'

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

// 主容器
const Container = styled.div<{ bg: string; textColor: string }>`
  min-height: 100vh;
  background: ${props => props.bg};
  background-size: 400% 400%;
  animation: ${gradientShift} 15s ease infinite;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  font-family: 'Inter', sans-serif;
  color: ${props => props.textColor};
  position: relative;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(120, 219, 226, 0.3) 0%, transparent 50%);
    animation: ${pulse} 8s ease-in-out infinite;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 80px 10px;
    align-items: stretch;
  }
`

// 下拉框容器
const Sidebar = styled.div`
  position: fixed;
  top: 80px;
  left: 20px;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 10;

  @media (max-width: 768px) {
    position: static;
    width: 100%;
    margin-bottom: 20px;
    padding: 15px;
  }
`

// 下拉框样式
const Select = styled.select<{ textColor: string }>`
  padding: 10px;
  border: none;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.2);
  color: ${props => props.textColor};
  font-size: 16px;
  cursor: pointer;
  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.3);
  }
`

// 显示框样式
const DisplayBox = styled.div<{ textColor: string }>`
  padding: 10px;
  border: none;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.2);
  color: ${props => props.textColor};
  font-size: 16px;
  margin-top: 10px;
  white-space: pre-line;
`

// 固定设置按钮
const FixedSettingsButton = styled.button<{ textColor: string }>`
  position: fixed;
  top: 80px;
  right: 20px;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.2);
  color: ${props => props.textColor};
  font-size: 16px;
  cursor: pointer;
  backdrop-filter: blur(10px);
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  &:focus {
    outline: none;
  }
  z-index: 10;

  @media (max-width: 768px) {
    position: static;
    padding: 8px 15px;
    font-size: 14px;
  }
`

// 不会单词按钮
const UnknownWordsButton = styled(FixedSettingsButton)`
  top: 150px;
`

// 大箭头按钮
const ArrowButton = styled.button<{ textColor: string }>`
  padding: 15px 30px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  color: ${props => props.textColor};
  font-size: 18px;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  align-items: center;
  gap: 10px;
  backdrop-filter: blur(10px);
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
  }
  &:focus {
    outline: none;
  }
  &:disabled {
    opacity: 0.5;
  }
`

// 左箭头按钮
const LeftArrowButton = styled(ArrowButton)`
  position: fixed;
  bottom: 200px;
  left: 50px;
  z-index: 10;

  @media (max-width: 768px) {
    position: static;
  }
`

// 右箭头按钮
const RightArrowButton = styled(ArrowButton)`
  position: fixed;
  bottom: 250px;
  right: 50px;
  z-index: 10;

  @media (max-width: 768px) {
    position: static;
  }
`
// 随机按钮
const RandomArrowButton = styled(ArrowButton)`
  position: fixed;
  bottom: 150px;
  right: 50px;
  z-index: 10;

  @media (max-width: 768px) {
    position: static;
  }
`

// 箭头按钮容器（移动端）
const ArrowContainer = styled.div`
  @media (max-width: 768px) {
    display: flex;
    justify-content: space-between;
    width: 100%;
    margin-top: 20px;
  }
`

// 按钮容器（移动端）
const ButtonContainer = styled.div`
  @media (max-width: 768px) {
    display: flex;
    justify-content: space-between;
    width: 100%;
    margin-top: 20px;
  }
`

function App() {
  // 从localStorage获取词库位置
  const getStoredIndex = (library: string) => {
    const stored = localStorage.getItem(`wordLibrary_${library}`)
    return stored ? parseInt(stored, 10) : 1
  }

  // 存储词库位置到localStorage
  const storeIndex = (library: string, index: number) => {
    localStorage.setItem(`wordLibrary_${library}`, index.toString())
  }

  // 从localStorage获取当前词库
  const getStoredLibrary = () => {
    const stored = localStorage.getItem('selectedLibrary')
    return stored || 'cet4'
  }

  // 处理词库切换
  const handleLibraryChange = (value: string) => {
    setSelectedLibrary(value)

    const index = getStoredIndex(value)
    setCurrentIndex(index)

    localStorage.setItem('selectedLibrary', value)
  }

  const [word, setWord] = useState('')
  const [us, setUs] = useState('')
  const [uk, setUk] = useState('')
  const [translations, setTranslations] = useState<Translation[]>([])
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [sentences, setSentences] = useState<Sentence[]>([])
  const [bgIndex, setBgIndex] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [showUnknown, setShowUnknown] = useState(false)
  const [selectedLibrary, setSelectedLibrary] = useState(getStoredLibrary)
  const [currentIndex, setCurrentIndex] = useState(() => getStoredIndex(selectedLibrary))
  const [totalWords, setTotalWords] = useState(0)
  const [unknownWords, setUnknownWords] = useState<{ word: string; translations: Translation[] }[]>(
    () => {
      const data = localStorage.getItem('unknownWords')
      return data ? JSON.parse(data) : []
    }
  )
  const [isLoading, setIsLoading] = useState(false)

  const backgrounds = [
    'linear-gradient(-45deg, #f5f5dc, #ede0c8, #f5f5dc)',
    'linear-gradient(-45deg, #f39c12, #e67e22, #e74c3c, #c0392b, #f39c12)',
    'linear-gradient(-45deg, #1abc9c, #16a085, #2ecc71, #27ae60, #1abc9c)',
    'linear-gradient(-45deg, #2196f3, #21cbf3, #2196f3)',
    'linear-gradient(-45deg, #1a1a2e, #16213e, #0f3460, #1a1a2e, #533483)'
  ]

  const themeColors = ['#f5f5dc', '#f39c12', '#1abc9c', '#2196f3', '#1a1a2e']

  const libraryNames: { [key: string]: string } = {
    chuzhong: '初中',
    gaozhong: '高中',
    cet4: 'CET4',
    cet6: 'CET6',
    kaoyan: '考研',
    toefl: '托福',
    sat: 'SAT'
  }

  useEffect(() => {
    const fetchTotalWords = async () => {
      const { count, error } = await supabase
        .from(selectedLibrary)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.error('Failed to fetch total words:', error)
        return
      }

      setTotalWords(count as number)
    }

    fetchTotalWords()
  }, [selectedLibrary])

  useEffect(() => {
    const fetchWord = async () => {
      setIsLoading(true)

      const { data, error } = await supabase
        .from(selectedLibrary)
        .select('*')
        .eq('id', currentIndex)
        .single()

      if (error) {
        console.error(error)
        setIsLoading(false)
        return
      }

      setWord(data.word)
      setUs(data.us)
      setUk(data.uk)
      setTranslations(data.translations)
      setPhrases(data.phrases)
      setSentences(data.sentences)
      setIsLoading(false)
    }

    fetchWord()
  }, [selectedLibrary, currentIndex])

  useEffect(() => {
    storeIndex(selectedLibrary, currentIndex)
  }, [selectedLibrary, currentIndex])

  const playPhonetic = (type: 'us' | 'uk') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word)
      const voices = speechSynthesis.getVoices()
      const voice = voices.find(v => v.lang === (type === 'us' ? 'en-US' : 'en-GB'))
      if (voice) {
        utterance.voice = voice
      }
      speechSynthesis.speak(utterance)
    } else {
      alert('Speech synthesis not supported in this browser.')
    }
  }

  const handleDontKnow = (word: string, translations: Translation[]) => {
    const existing = JSON.parse(localStorage.getItem('unknownWords') || '[]')
    existing.push({ word, translations })
    localStorage.setItem('unknownWords', JSON.stringify(existing))
    setUnknownWords(existing)
  }

  const handleRemoveUnknown = (index: number) => {
    const existing = [...unknownWords]
    existing.splice(index, 1)
    localStorage.setItem('unknownWords', JSON.stringify(existing))
    setUnknownWords(existing)
  }

  return (
    <>
      <GlobalStyle />
      <Container bg={backgrounds[bgIndex]} textColor={bgIndex === 0 ? '#000' : '#fff'}>
        <Sidebar>
          <Select
            textColor={bgIndex === 0 ? '#000' : '#fff'}
            value={selectedLibrary}
            onChange={e => handleLibraryChange(e.target.value)}
          >
            <option value="chuzhong">初中</option>
            <option value="gaozhong">高中</option>
            <option value="cet4">CET4</option>
            <option value="cet6">CET6</option>
            <option value="kaoyan">考研</option>
            <option value="toefl">托福</option>
            <option value="sat">SAT</option>
          </Select>
          <DisplayBox textColor={bgIndex === 0 ? '#000' : '#fff'}>
            {`当前是${libraryNames[selectedLibrary]}词库\n第${currentIndex}个，共${totalWords}个`}
          </DisplayBox>
        </Sidebar>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <WordCard
            word={word}
            us={us}
            uk={uk}
            translations={translations}
            phrases={phrases}
            sentences={sentences}
            bgIndex={bgIndex}
            isLoading={isLoading}
            onSettingsClick={() => setShowSettings(true)}
            onPlayPhonetic={playPhonetic}
            onDontKnow={handleDontKnow}
          />
        </div>
        <ArrowContainer>
          <LeftArrowButton
            textColor={bgIndex === 0 ? '#000' : '#fff'}
            onClick={() => setCurrentIndex(prev => Math.max(1, prev - 1))}
            disabled={isLoading}
          >
            ⬅️ 上一个
          </LeftArrowButton>
          <RightArrowButton
            textColor={bgIndex === 0 ? '#000' : '#fff'}
            onClick={() => setCurrentIndex(prev => (prev < totalWords ? prev + 1 : prev))}
            disabled={isLoading}
          >
            下一个 ➡️
          </RightArrowButton>
          <RandomArrowButton
            textColor={bgIndex === 0 ? '#000' : '#fff'}
            onClick={() => setCurrentIndex(()=> (Math.floor(Math.random() * totalWords) + 1))}
            disabled={isLoading}
          >
            随机 🔀
          </RandomArrowButton>
        </ArrowContainer>
        <ButtonContainer>
          <FixedSettingsButton
            textColor={bgIndex === 0 ? '#000' : '#fff'}
            onClick={() => setShowSettings(true)}
          >
            设置&反馈
          </FixedSettingsButton>
          <UnknownWordsButton
            textColor={bgIndex === 0 ? '#000' : '#fff'}
            onClick={() => setShowUnknown(true)}
          >
            不会的单词
          </UnknownWordsButton>
        </ButtonContainer>
        <SettingsModal
          show={showSettings}
          onClose={() => setShowSettings(false)}
          backgrounds={backgrounds}
          themeColors={themeColors}
          onSelectBackground={index => setBgIndex(index)}
        />
        <UnknownWordsModal
          show={showUnknown}
          onClose={() => setShowUnknown(false)}
          unknownWords={unknownWords}
          onRemove={handleRemoveUnknown}
        />
      </Container>
    </>
  )
}

export default App
