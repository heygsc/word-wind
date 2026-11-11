import styled from 'styled-components'
import { useState } from 'react'
import { useModalTransition } from '../hooks/useModalTransition'

interface Translation {
  type: string
  translation: string
}

interface UnknownWordsModalProps {
  show: boolean
  onClose: () => void
  unknownWords: {
    word: string
    translations: Translation[]
    library?: string
    index?: number
  }[]
  onRemove: (index: number) => void
}

const WordLink = styled.a`
  color: inherit;
  text-decoration: underline;
  text-decoration-color: rgba(255, 255, 255, 0.55);
  text-underline-offset: 3px;

  &:hover {
    text-decoration-color: currentColor;
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 3px;
    border-radius: 2px;
  }
`

const getWordHref = (item: UnknownWordsModalProps['unknownWords'][number]) => {
  const params = new URLSearchParams()

  if (item.library && item.index) {
    params.set('library', item.library)
    params.set('index', item.index.toString())
  } else {
    params.set('word', item.word)
  }

  return `${window.location.pathname}?${params.toString()}`
}

const buildWordDocument = (
  unknownWords: UnknownWordsModalProps['unknownWords'],
  docx: typeof import('docx')
) => {
  const {
    AlignmentType,
    Document,
    HeadingLevel,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType
  } = docx

  const headerCells = ['序号', '单词', '释义'].map(
    text =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text, bold: true })],
            alignment: AlignmentType.CENTER
          })
        ]
      })
  )

  const rows = unknownWords.map(
    (item, index) =>
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph(String(index + 1))]
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: item.word, bold: true })]
              })
            ]
          }),
          new TableCell({
            children: item.translations.map(
              t =>
                new Paragraph({
                  children: [
                    new TextRun({ text: `${t.type}: `, bold: true }),
                    new TextRun(t.translation)
                  ]
                })
            )
          })
        ]
      })
  )

  return new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: '不会的单词',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER
          }),
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE
            },
            rows: [
              new TableRow({
                children: headerCells,
                tableHeader: true
              }),
              ...rows
            ]
          })
        ]
      }
    ]
  })
}

// 模态框容器
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  background: rgba(15, 25, 19, 0.4);
  backdrop-filter: blur(5px);
`

// 模态框内容
const ModalContent = styled.div<{ $isOpen: boolean }>`
  background: var(--surface);
  color: var(--ink);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transform: translateY(12px) scale(0.97);
  transition:
    opacity 0.3s ease-out,
    transform 0.3s ease-out;
  position: relative;
  overflow-wrap: anywhere;
  ${props =>
    props.$isOpen &&
    `
    opacity: 1;
    transform: translateY(0) scale(1);
  `}
`

// 标题
const ModalTitle = styled.h2`
  color: var(--ink);
  margin-bottom: 20px;
  text-align: center;
`

// 关闭按钮
const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: var(--ink);
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  &:active {
    background-color: rgba(255, 255, 255, 0.2);
  }
`

// 单词项
const WordItem = styled.div`
  background: var(--soft);
  backdrop-filter: blur(10px);
  margin: 10px 0;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid var(--line);
  color: var(--ink);
  position: relative;
  overflow-wrap: anywhere;
`

// 删除按钮
const DeleteButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background: none;
  border: none;
  color: #ff6b6b;
  font-size: 18px;
  cursor: pointer;
  &:hover {
    color: #ff5252;
  }
`

const ExportButton = styled.button`
  display: block;
  width: 100%;
  margin: 0 0 20px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: var(--soft);
  color: var(--ink);
  font-size: 16px;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
  }

  &:disabled {
    opacity: 0.5;
  }
`

export const UnknownWordsModal = ({
  show,
  onClose,
  unknownWords,
  onRemove
}: UnknownWordsModalProps) => {
  const { isVisible, isOpen } = useModalTransition(show)
  const [isExporting, setIsExporting] = useState(false)

  const handleExportWord = async () => {
    if (unknownWords.length === 0 || isExporting) return

    setIsExporting(true)

    try {
      const docx = await import('docx')
      const documentContent = buildWordDocument(unknownWords, docx)
      const blob = await docx.Packer.toBlob(documentContent)
      const link = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)

      link.href = URL.createObjectURL(blob)
      link.download = `不会的单词-${date}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    } finally {
      setIsExporting(false)
    }
  }

  if (!isVisible) return null

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent $isOpen={isOpen} onClick={e => e.stopPropagation()}>
        <CloseButton aria-label="关闭" onClick={onClose}>
          ×
        </CloseButton>
        <ModalTitle>不会的单词</ModalTitle>
        <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: '20px' }}>
          点击单词音标下方的“不会”按钮，即可标记
        </p>
        <ExportButton
          type="button"
          onClick={handleExportWord}
          disabled={unknownWords.length === 0 || isExporting}
        >
          {isExporting ? '导出中...' : '导出 Word'}
        </ExportButton>
        {unknownWords.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center' }}>暂无不会的单词</p>
        ) : (
          unknownWords.map((item, index) => (
            <WordItem key={index}>
              <DeleteButton onClick={() => onRemove(index)}>×</DeleteButton>
              <WordLink href={getWordHref(item)} target="_blank" rel="noopener noreferrer">
                <strong>{item.word}</strong>
              </WordLink>
              <br />
              {item.translations.map((t, i) => (
                <div key={i}>
                  <strong>{t.type}:</strong> {t.translation}
                </div>
              ))}
            </WordItem>
          ))
        )}
      </ModalContent>
    </ModalOverlay>
  )
}
