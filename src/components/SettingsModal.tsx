import styled from 'styled-components'
import { useState } from 'react'
import { useModalTransition } from '../hooks/useModalTransition'
import { supabase } from '../utils/supabase'
import { themes } from '../themes'

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
  background: rgba(15, 25, 19, 0.4);
  backdrop-filter: blur(5px);
`

const ModalContent = styled.div<{ $isOpen: boolean }>`
  background: var(--surface);
  color: var(--ink);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  box-sizing: border-box;
  padding: 32px 40px;
  max-width: 500px;
  width: 90%;
  max-height: calc(100vh - 40px);
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

  @media (max-width: 768px) {
    padding: 28px 24px;
    max-height: calc(100vh - 24px);
  }
`

const Button = styled.button`
  background: var(--accent);
  color: var(--on-accent);
  font-size: 14px;
  padding: 12px 18px;
  border: 1px solid var(--line);
  border-radius: 10px;
  cursor: pointer;
  margin: 6px 0;
  &:hover {
    filter: brightness(1.1);
  }
`

const ThemeButton = styled(Button)`
  outline: 2px solid transparent;
  outline-offset: 3px;

  &[aria-pressed='true'] {
    outline-color: var(--accent);
  }
`

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

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid var(--line);
  border-radius: 5px;
  box-sizing: border-box;
  background: var(--soft);
  color: var(--ink);
  &::placeholder {
    color: var(--muted);
  }
`

interface SettingsModalProps {
  show: boolean
  onClose: () => void
  selectedBackground: number
  onSelectBackground: (index: number) => void
}

export const SettingsModal = ({
  show,
  onClose,
  selectedBackground,
  onSelectBackground
}: SettingsModalProps) => {
  const { isVisible, isOpen } = useModalTransition(show)
  const [email, setEmail] = useState('')
  const [content, setContent] = useState('')

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
      const { error } = await supabase.from('user-feedback').insert({
        email,
        content,
        created_at: new Date()
      })

      if (error) {
        console.error('Insert failed:', error)
        alert('提交失败')
        return
      }

      alert('反馈提交成功')
      setEmail('')
      setContent('')
      onClose()
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('网络错误')
    }
  }

  if (!isVisible) return null

  return (
    <Modal onClick={onClose}>
      <ModalContent $isOpen={isOpen} onClick={e => e.stopPropagation()}>
        <CloseButton aria-label="关闭" onClick={onClose}>
          ×
        </CloseButton>
        <p>
          喜欢这个网站？
          <br />
          <br />
          欢迎关注作者：
          <a
            href="https://github.com/heygsc"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent)' }}
          >
            https://github.com/heygsc
          </a>
          <br />
          <br />
          请到{' '}
          <a
            href="https://github.com/heygsc/word-wind"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent)' }}
          >
            https://github.com/heygsc/word-wind
          </a>{' '}
          点亮 star 进行收藏！
          <br />
          <br />
          欢迎将网站分享给身边的朋友！
        </p>
        <h2>设置</h2>
        <p>选择背景：</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {themes.map((theme, i) => (
            <ThemeButton
              key={theme.name}
              style={{ background: theme.soft, color: theme.ink, borderColor: theme.line }}
              aria-pressed={selectedBackground === i}
              onClick={() => onSelectBackground(i)}
            >
              {theme.name}
              {selectedBackground === i ? ' ✓' : ''}
            </ThemeButton>
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
