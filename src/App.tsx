import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { GlobalStyle } from './components/GlobalStyles'
import { WordCard } from './components/WordCard'
import { SettingsModal } from './components/SettingsModal'
import { UnknownWordsModal } from './components/UnknownWordsModal'
import { supabase } from './utils/supabase'
import { themes } from './themes'
import { usePronunciation } from './hooks/usePronunciation'

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

interface UnknownWord {
  word: string
  translations: Translation[]
  library?: string
  index?: number
}

// 主容器
const Container = styled.div<{ $palette: (typeof themes)[number] }>`
  --ink: ${p => p.$palette.ink};
  --muted: ${p => p.$palette.muted};
  --surface: ${p => p.$palette.surface};
  --soft: ${p => p.$palette.soft};
  --line: ${p => p.$palette.line};
  --accent: ${p => p.$palette.accent};
  --on-accent: ${p => p.$palette.onAccent};
  color-scheme: ${p => (p.$palette.dark ? 'dark' : 'light')};
  min-height: 100vh;
  background: ${p => p.$palette.background};
  color: var(--ink);
  display: grid;
  grid-template-columns: 208px minmax(0, 800px) 156px;
  grid-template-areas:
    'brand search .'
    '. message .'
    'sidebar content actions'
    '. arrows .';
  gap: 24px 32px;
  align-items: start;
  align-content: start;
  justify-content: center;
  padding: 44px 32px 64px;
  position: relative;

  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas:
      'brand search'
      'message message'
      'sidebar actions'
      'content content'
      'arrows arrows';
  }
  @media (max-width: 600px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: 'brand' 'search' 'message' 'sidebar' 'actions' 'content' 'arrows';
    gap: 16px;
    padding: 24px 16px 40px;
  }
`

const Brand = styled.header`
  grid-area: brand;
  padding: 4px 0;
  strong {
    display: block;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 26px;
    font-weight: 500;
    letter-spacing: -1px;
  }
`

const PanelLabel = styled.label`
  display: block;
  margin-bottom: 14px;
  color: var(--muted);
  font-size: 12px;
  letter-spacing: 2px;
`

// 下拉框容器
const Sidebar = styled.div`
  grid-area: sidebar;
  min-width: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: var(--surface);
  border-radius: 10px;
  border: 1px solid var(--line);
  z-index: 10;

  @media (max-width: 600px) {
    padding: 15px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;
    & > label {
      grid-column: 1 / -1;
      margin: 0;
    }
    & > div {
      margin: 0;
      padding: 0;
      align-self: center;
    }
    & > form,
    & > button {
      margin-top: 0;
    }
  }
`

// 下拉框样式
const Select = styled.select<{ textColor: string }>`
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--soft);
  color: var(--ink);
  font-size: 14px;
  cursor: pointer;
  &:focus {
    background: var(--line);
  }
`

// 显示框样式
const DisplayBox = styled.div<{ textColor: string }>`
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--soft);
  color: var(--ink);
  font-size: 14px;
  margin-top: 10px;
  white-space: pre-line;
  line-height: 1.9;
  color: var(--muted);
  font-size: 12px;
  background: transparent;
  border: 0;
  padding: 16px 0;
`

const PageSelectorForm = styled.form`
  display: flex;
  gap: 8px;
  margin-top: 10px;
`

const PageInput = styled.input<{ textColor: string }>`
  min-width: 0;
  width: 80px;
  flex: 1;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--soft);
  color: var(--ink);
  font-size: 14px;

  &:focus {
    background: var(--line);
  }

  &::placeholder {
    color: currentColor;
    opacity: 0.7;
  }
`

const PageJumpButton = styled.button<{ textColor: string }>`
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--soft);
  color: var(--ink);
  font-size: 14px;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};

  &:hover:not(:disabled) {
    background: var(--line);
  }

  &:disabled {
    opacity: 0.5;
  }
`

const ContentToggleButton = styled(PageJumpButton)`
  width: 100%;
  margin-top: 10px;
`

const SearchForm = styled.form`
  grid-area: search;
  position: relative;
  justify-self: center;
  z-index: 20;
  display: flex;
  width: 100%;
  padding: 8px;
  gap: 8px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
`

const SearchInput = styled.input<{ textColor: string }>`
  min-width: 0;
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--soft);
  color: var(--ink);
  font-size: 14px;

  &:focus {
    outline: 2px solid var(--accent);
    outline-offset: 1px;
    background: var(--line);
  }

  &::placeholder {
    color: currentColor;
    opacity: 0.68;
  }
`

const SearchButton = styled(PageJumpButton)`
  min-width: 72px;
  background: var(--accent);
  color: var(--on-accent);
  &:hover:not(:disabled) {
    background: var(--accent);
    filter: brightness(1.1);
  }
`

const SearchMessage = styled.div<{ $isError: boolean }>`
  grid-area: message;
  position: relative;
  justify-self: center;
  max-width: 100%;
  overflow-wrap: anywhere;
  z-index: 20;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(20, 20, 20, 0.7);
  color: ${props => (props.$isError ? '#fecaca' : '#fff')};
  font-size: 14px;
`

// 设置按钮
const SettingsButton = styled.button<{ textColor: string }>`
  position: relative;
  padding: 10px 20px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--soft);
  color: var(--ink);
  font-size: 14px;
  cursor: pointer;
  &:hover {
    background: var(--line);
  }
  z-index: 10;

  @media (max-width: 768px) {
    padding: 8px 15px;
    font-size: 14px;
  }
`

// 不会单词按钮
const UnknownWordsButton = styled(SettingsButton)``

// 大箭头按钮
const ArrowButton = styled.button<{ textColor: string }>`
  padding: 15px 30px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--soft);
  color: var(--ink);
  font-size: 14px;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  align-items: center;
  gap: 10px;
  &:hover:not(:disabled) {
    background: var(--line);
  }
  &:disabled {
    opacity: 0.5;
  }
`

// 切词按钮在卡片下方占据独立空间
const ArrowContainer = styled.div`
  grid-area: arrows;
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: 600px) {
    & > button {
      padding: 12px 16px;
    }
  }
`

const ButtonContainer = styled.div`
  grid-area: actions;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: 600px) {
    flex-direction: row;
    flex-wrap: wrap;
  }
`

const WordContainer = styled.main`
  grid-area: content;
  min-width: 0;
  display: flex;
  justify-content: center;
`

const BACKGROUND_STORAGE_KEY = 'selectedBackground'
const CONTENT_VISIBILITY_STORAGE_KEY = 'wordCardContentVisible'

const libraryKeys = ['chuzhong', 'gaozhong', 'cet4', 'cet6', 'kaoyan', 'toefl', 'sat']

const getRequestedLocation = () => {
  const params = new URLSearchParams(window.location.search)
  const library = params.get('library')
  const index = Number.parseInt(params.get('index') || '', 10)

  if (library && libraryKeys.includes(library) && Number.isInteger(index) && index > 0) {
    return { library, index }
  }

  return null
}

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
    const requestedLocation = getRequestedLocation()
    if (requestedLocation) return requestedLocation.library

    const stored = localStorage.getItem('selectedLibrary')
    return stored || 'cet4'
  }

  // 从localStorage获取背景设置
  const getStoredBackgroundIndex = () => {
    const stored = localStorage.getItem(BACKGROUND_STORAGE_KEY)
    const index = stored ? Number.parseInt(stored, 10) : 0
    return Number.isInteger(index) && index >= 0 && index < themes.length ? index : 0
  }

  // 从localStorage获取内容显示设置
  const getStoredContentVisible = () => {
    return localStorage.getItem(CONTENT_VISIBILITY_STORAGE_KEY) !== 'false'
  }

  // 处理背景切换
  const handleBackgroundChange = (index: number) => {
    setBgIndex(index)
    localStorage.setItem(BACKGROUND_STORAGE_KEY, index.toString())
  }

  // 处理词库切换
  const handleLibraryChange = (value: string) => {
    setSelectedLibrary(value)

    const index = getStoredIndex(value)
    setCurrentIndex(index)
    setPageInput(index.toString())

    localStorage.setItem('selectedLibrary', value)
  }

  const [word, setWord] = useState('')
  const [us, setUs] = useState('')
  const [uk, setUk] = useState('')
  const [translations, setTranslations] = useState<Translation[]>([])
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [sentences, setSentences] = useState<Sentence[]>([])
  const [bgIndex, setBgIndex] = useState(getStoredBackgroundIndex)
  const [showSettings, setShowSettings] = useState(false)
  const [showUnknown, setShowUnknown] = useState(false)
  const [showCardContent, setShowCardContent] = useState(getStoredContentVisible)
  const [selectedLibrary, setSelectedLibrary] = useState(getStoredLibrary)
  const [currentIndex, setCurrentIndex] = useState(
    () => getRequestedLocation()?.index ?? getStoredIndex(selectedLibrary)
  )
  const [pageInput, setPageInput] = useState(() => currentIndex.toString())
  const [searchInput, setSearchInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState<{
    text: string
    isError: boolean
  } | null>(null)
  const [totalWords, setTotalWords] = useState(0)
  const [unknownWords, setUnknownWords] = useState<UnknownWord[]>(() => {
    const data = localStorage.getItem('unknownWords')
    return data ? JSON.parse(data) : []
  })
  const [isLoading, setIsLoading] = useState(false)
  const wordRequestLockedRef = useRef(false)
  const wordRequestIdRef = useRef(0)

  const clampIndex = useCallback(
    (index: number) => Math.min(Math.max(index, 1), Math.max(totalWords, 1)),
    [totalWords]
  )

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
    const requestedWord = new URLSearchParams(window.location.search).get('word')
    if (!requestedWord) return

    let cancelled = false

    const findRequestedWord = async () => {
      const libraries = [selectedLibrary, ...libraryKeys.filter(key => key !== selectedLibrary)]

      for (const library of libraries) {
        const { data, error } = await supabase
          .from(library)
          .select('id')
          .eq('word', requestedWord)
          .limit(1)
          .maybeSingle()

        if (cancelled) return
        if (!error && data?.id) {
          setSelectedLibrary(library)
          setCurrentIndex(data.id)
          setPageInput(data.id.toString())
          return
        }
      }
    }

    findRequestedWord()
    return () => {
      cancelled = true
    }
    // This query is intentionally resolved only once when a direct word link opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      const requestId = wordRequestIdRef.current + 1
      wordRequestIdRef.current = requestId
      setIsLoading(true)

      try {
        const { data, error } = await supabase
          .from(selectedLibrary)
          .select('*')
          .eq('id', currentIndex)
          .single()

        if (wordRequestIdRef.current !== requestId) {
          return
        }

        if (error) {
          console.error(error)
          return
        }

        setWord(data.word)
        setUs(data.us)
        setUk(data.uk)
        setTranslations(data.translations)
        setPhrases(data.phrases)
        setSentences(data.sentences)
      } finally {
        if (wordRequestIdRef.current === requestId) {
          setIsLoading(false)
          wordRequestLockedRef.current = false
        }
      }
    }

    fetchWord()
  }, [selectedLibrary, currentIndex])

  useEffect(() => {
    storeIndex(selectedLibrary, currentIndex)
  }, [selectedLibrary, currentIndex])

  useEffect(() => {
    setPageInput(currentIndex.toString())
  }, [currentIndex])

  const handleContentVisibilityToggle = () => {
    setShowCardContent(current => {
      const next = !current
      localStorage.setItem(CONTENT_VISIBILITY_STORAGE_KEY, String(next))
      return next
    })
  }

  const { playPhonetic, speechMessage } = usePronunciation(
    word,
    `${selectedLibrary}:${currentIndex}`
  )

  const handleDontKnow = (word: string, translations: Translation[]) => {
    const existing = JSON.parse(localStorage.getItem('unknownWords') || '[]')
    if (existing.some((item: { word: string }) => item.word === word)) {
      return false
    }

    existing.push({ word, translations, library: selectedLibrary, index: currentIndex })
    localStorage.setItem('unknownWords', JSON.stringify(existing))
    setUnknownWords(existing)
    return true
  }

  const handleRemoveUnknown = (index: number) => {
    const existing = [...unknownWords]
    existing.splice(index, 1)
    localStorage.setItem('unknownWords', JSON.stringify(existing))
    setUnknownWords(existing)
  }

  const changeWord = useCallback(
    (step: -1 | 1) => {
      if (isLoading || wordRequestLockedRef.current) {
        return
      }

      const nextIndex = clampIndex(currentIndex + step)

      if (nextIndex === currentIndex) {
        return
      }

      wordRequestLockedRef.current = true
      setCurrentIndex(nextIndex)
    },
    [clampIndex, currentIndex, isLoading]
  )

  const handlePageSelect = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isLoading || wordRequestLockedRef.current || totalWords === 0) {
      return
    }

    const requestedIndex = Number.parseInt(pageInput, 10)
    if (Number.isNaN(requestedIndex)) {
      setPageInput(currentIndex.toString())
      return
    }

    const nextIndex = clampIndex(requestedIndex)
    setPageInput(nextIndex.toString())

    if (nextIndex === currentIndex) {
      return
    }

    wordRequestLockedRef.current = true
    setCurrentIndex(nextIndex)
  }

  const handleWordSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const requestedWord = searchInput.trim().toLowerCase()
    if (!requestedWord || isSearching) {
      return
    }

    setIsSearching(true)
    setSearchMessage(null)

    const searchLibrary = async (library: string) => {
      const { data, error } = await supabase
        .from(library)
        .select('id, word')
        .eq('word', requestedWord)
        .limit(1)
        .maybeSingle()

      return { library, data, error }
    }

    try {
      const currentResult = await searchLibrary(selectedLibrary)
      let match = currentResult.data ? currentResult : null
      let hadError = Boolean(currentResult.error)

      if (!match) {
        const otherResults = await Promise.all(
          libraryKeys
            .filter(library => library !== selectedLibrary)
            .map(library => searchLibrary(library))
        )

        match = otherResults.find(result => result.data) ?? null
        hadError = hadError || otherResults.some(result => result.error)
      }

      if (!match?.data) {
        setSearchMessage({
          text: hadError ? '搜索失败，请稍后重试' : `未找到“${searchInput.trim()}”`,
          isError: true
        })
        return
      }

      const nextIndex = Number(match.data.id)
      setSelectedLibrary(match.library)
      setCurrentIndex(nextIndex)
      setPageInput(nextIndex.toString())
      setSearchInput(match.data.word)
      localStorage.setItem('selectedLibrary', match.library)

      const params = new URLSearchParams()
      params.set('library', match.library)
      params.set('index', nextIndex.toString())
      window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)

      setSearchMessage({
        text: `已跳转到 ${match.data.word}`,
        isError: false
      })
    } catch (error) {
      console.error('Failed to search for word:', error)
      setSearchMessage({ text: '搜索失败，请稍后重试', isError: true })
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tagName = target?.tagName
      const isEditable =
        target?.isContentEditable ||
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT'

      if (isEditable) {
        return
      }

      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        event.preventDefault()
        changeWord(-1)
      }

      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        event.preventDefault()
        changeWord(1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [changeWord])

  return (
    <>
      <GlobalStyle />
      <Container $palette={themes[bgIndex]}>
        <Brand>
          <strong>Word Wind</strong>
        </Brand>
        <SearchForm onSubmit={handleWordSearch} role="search">
          <SearchInput
            textColor={bgIndex === 0 ? '#000' : '#fff'}
            type="search"
            value={searchInput}
            placeholder="搜索英文单词"
            onChange={event => {
              setSearchInput(event.target.value)
              setSearchMessage(null)
            }}
            aria-label="搜索单词"
            autoComplete="off"
          />
          <SearchButton
            textColor={bgIndex === 0 ? '#000' : '#fff'}
            type="submit"
            disabled={isSearching || !searchInput.trim()}
          >
            {isSearching ? '搜索中…' : '搜索'}
          </SearchButton>
        </SearchForm>
        {searchMessage && (
          <SearchMessage $isError={searchMessage.isError} role="status" aria-live="polite">
            {searchMessage.text}
          </SearchMessage>
        )}
        <Sidebar>
          <PanelLabel htmlFor="word-library">学习词库</PanelLabel>
          <Select
            id="word-library"
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
          <PageSelectorForm onSubmit={handlePageSelect}>
            <PageInput
              textColor={bgIndex === 0 ? '#000' : '#fff'}
              type="number"
              min={1}
              max={totalWords || undefined}
              inputMode="numeric"
              value={pageInput}
              placeholder="页码"
              onChange={event => setPageInput(event.target.value)}
              aria-label="选择页码"
            />
            <PageJumpButton
              textColor={bgIndex === 0 ? '#000' : '#fff'}
              type="submit"
              disabled={isLoading || totalWords === 0}
            >
              跳转
            </PageJumpButton>
          </PageSelectorForm>
          <ContentToggleButton
            textColor={bgIndex === 0 ? '#000' : '#fff'}
            type="button"
            onClick={handleContentVisibilityToggle}
          >
            {showCardContent ? '隐藏释义' : '显示释义'}
          </ContentToggleButton>
        </Sidebar>
        <WordContainer>
          <WordCard
            word={word}
            us={us}
            uk={uk}
            translations={translations}
            phrases={phrases}
            sentences={sentences}
            bgIndex={bgIndex}
            isLoading={isLoading}
            showContent={showCardContent}
            onSettingsClick={() => setShowSettings(true)}
            onPlayPhonetic={playPhonetic}
            speechMessage={speechMessage}
            onDontKnow={handleDontKnow}
          />
        </WordContainer>
        <ArrowContainer>
          <ArrowButton
            textColor={bgIndex === 0 ? '#000' : '#fff'}
            onClick={() => changeWord(-1)}
            disabled={isLoading || currentIndex <= 1}
          >
            ← 上一个
          </ArrowButton>
          <ArrowButton
            textColor={bgIndex === 0 ? '#000' : '#fff'}
            onClick={() => changeWord(1)}
            disabled={isLoading || currentIndex >= totalWords}
          >
            下一个 →
          </ArrowButton>
        </ArrowContainer>
        <ButtonContainer>
          <SettingsButton
            textColor={bgIndex === 0 ? '#000' : '#fff'}
            onClick={() => setShowSettings(true)}
          >
            设置&反馈
          </SettingsButton>
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
          selectedBackground={bgIndex}
          onSelectBackground={handleBackgroundChange}
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
