import styled from 'styled-components'
import { useState, useEffect } from 'react'

interface Translation {
  type: string
  translation: string
}

interface UnknownWordsModalProps {
  show: boolean
  onClose: () => void
  unknownWords: { word: string; translations: Translation[] }[]
  onRemove: (index: number) => void
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
`

// 模态框内容
const ModalContent = styled.div<{ isOpen: boolean }>`
  background: rgba(0, 0, 0, 0.5);
  color: white;
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transform: scale(1.05);
  transition:
    opacity 0.3s ease-out,
    transform 0.3s ease-out;
  position: relative;
  ${props =>
    props.isOpen &&
    `
    opacity: 1;
    transform: scale(1);
  `}
`

// 标题
const ModalTitle = styled.h2`
  color: white;
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
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  &:active {
    background-color: rgba(255, 255, 255, 0.2);
  }
`

// 单词项
const WordItem = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  margin: 10px 0;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  position: relative;
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

export const UnknownWordsModal = ({
  show,
  onClose,
  unknownWords,
  onRemove
}: UnknownWordsModalProps) => {
  const [isVisible, setIsVisible] = useState(show)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      setTimeout(() => setIsOpen(true), 0)
    } else {
      setIsOpen(false)
    }
  }, [show])

  const handleTransitionEnd = () => {
    if (!isOpen) {
      setIsVisible(false)
    }
  }

  if (!isVisible) return null

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent
        isOpen={isOpen}
        onClick={e => e.stopPropagation()}
        onTransitionEnd={handleTransitionEnd}
      >
        <CloseButton onClick={onClose}>×</CloseButton>
        <ModalTitle>不会的单词</ModalTitle>
        <p style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
          点击单词面板底部的"不会"按钮，即可标记
        </p>
        {unknownWords.length === 0 ? (
          <p style={{ color: 'white', textAlign: 'center' }}>暂无不会的单词</p>
        ) : (
          unknownWords.map((item, index) => (
            <WordItem key={index}>
              <DeleteButton onClick={() => onRemove(index)}>×</DeleteButton>
              <strong>{item.word}</strong>
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
