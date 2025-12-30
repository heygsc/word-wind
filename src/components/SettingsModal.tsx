import styled from 'styled-components'
import { useState, useEffect } from 'react'

const Modal = styled.div`
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

const ModalContent = styled.div<{ isOpen: boolean }>`
  background: rgba(0, 0, 0, 0.5);
  color: white;
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
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

const Button = styled.button<{ i?: number }>`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: ${props => (props.i === 0 ? '#000' : 'white')};
  font-size: 16px;
  font-weight: 500;
  padding: 12px 24px;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  margin: 10px;
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

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
`

interface SettingsModalProps {
  show: boolean
  onClose: () => void
  backgrounds: string[]
  themeColors: string[]
  onSelectBackground: (index: number) => void
}

export const SettingsModal = ({
  show,
  onClose,
  backgrounds,
  themeColors,
  onSelectBackground
}: SettingsModalProps) => {
  const [isVisible, setIsVisible] = useState(show)
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [content, setContent] = useState('')

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

  const handleSubmit = async () => {
    if (!email.trim() && !content.trim()) {
      alert('邮箱和内容不能为空')
      return
    }
    if (!email.trim()) {
      alert('邮箱不能为空')
      return
    }
    if (!content.trim()) {
      alert('内容不能为空')
      return
    }
    try {
      const response = await fetch('https://hisupabase.vercel.app/api/user-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, content })
      })
      if (response.ok) {
        alert('反馈提交成功')
        setEmail('')
        setContent('')
        onClose()
      } else {
        alert('提交失败')
      }
    } catch (error) {
      alert('网络错误')
    }
  }

  if (!isVisible) return null

  return (
    <Modal onClick={onClose}>
      <ModalContent
        isOpen={isOpen}
        onClick={e => e.stopPropagation()}
        onTransitionEnd={handleTransitionEnd}
      >
        <CloseButton onClick={onClose}>×</CloseButton>
        <p>
          喜欢这个网站？
          <br />
          请到{' '}
          <a
            href="https://github.com/heygsc/word-wind"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'orange' }}
          >
            https://github.com/heygsc/word-wind
          </a>{' '}
          点亮 star 进行收藏！
        </p>
        <h2>设置</h2>
        <p>选择背景：</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {backgrounds.map((_, i) => (
            <Button
              key={i}
              i={i}
              style={{ background: themeColors[i] }}
              onClick={() => {
                onSelectBackground(i)
                onClose()
              }}
            >
              背景{i + 1}
            </Button>
          ))}
        </div>
        <h2>反馈</h2>
        <label>
          邮箱：<span style={{ color: 'red' }}>*</span>
        </label>
        <Input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="请输入您的邮箱"
          maxLength={100}
          required
        />
        <label>
          内容：<span style={{ color: 'red' }}>*</span>
        </label>
        <Input
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="请输入反馈内容"
          maxLength={100}
          required
        />
        <Button onClick={handleSubmit}>提交</Button>
      </ModalContent>
    </Modal>
  )
}
