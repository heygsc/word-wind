import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSpeechPlayer } from '../src/utils/speech.ts'

function setup(t, voices = []) {
  const originalWindow = globalThis.window
  const listeners = new Map()
  const spoken = []
  const messages = []
  const synth = {
    paused: false,
    cancellations: 0,
    getVoices: () => voices,
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: name => listeners.delete(name),
    speak: utterance => spoken.push(utterance),
    cancel() {
      this.cancellations++
    },
    resume() {
      this.paused = false
    }
  }
  globalThis.window = {
    speechSynthesis: synth,
    SpeechSynthesisUtterance: class {
      constructor(text) {
        this.text = text
      }
    }
  }
  const player = createSpeechPlayer(message => messages.push(message))
  t.after(() => {
    player.dispose()
    if (originalWindow === undefined) delete globalThis.window
    else globalThis.window = originalWindow
  })
  return { synth, spoken, messages, player, listeners }
}

test('empty initial voice list still speaks synchronously with explicit English language', t => {
  const { player, spoken } = setup(t)
  player.play('hello', 'uk')
  assert.equal(spoken.length, 1)
  assert.equal(spoken[0].lang, 'en-GB')
  assert.equal(spoken[0].voice, undefined)
})

test('late voices are picked up; matching accent outranks other local English voices', t => {
  const voices = []
  const { player, spoken, listeners } = setup(t, voices)
  const us = { lang: 'en-US', localService: true }
  const uk = { lang: 'EN_gb', localService: false }
  voices.push(us, uk)
  listeners.get('voiceschanged')()
  player.play('hello', 'uk')
  assert.equal(spoken[0].voice, uk)
  voices.push({ lang: 'en-GB', localService: true })
  player.play('hello', 'uk')
  assert.equal(spoken[1].voice, voices[2])
})

test('fallback uses English and tells the user when the requested accent is missing', t => {
  const english = { lang: 'en-AU', localService: true }
  const { player, spoken, messages } = setup(t, [{ lang: 'zh-CN', localService: true }, english])
  player.play('hello', 'us')
  assert.equal(spoken[0].voice, english)
  spoken[0].onstart()
  assert.match(messages.at(-1), /其他英语语音/)
})

test('repeated clicks replace playback and stale events cannot override the new status', t => {
  const { player, spoken, messages, synth } = setup(t)
  player.play('hello', 'us')
  const staleError = spoken[0].onerror
  player.play('world', 'uk')
  assert.equal(synth.cancellations, 1)
  staleError({ error: 'network' })
  assert.equal(messages.at(-1), '正在准备发音…')
  spoken[1].onerror({ error: 'language-unavailable' })
  assert.match(messages.at(-1), /英语语音包/)
})

test('silent startup times out, cancels playback and allows a fresh retry', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const { player, synth, messages, spoken } = setup(t)
  player.play('hello', 'us')
  t.mock.timers.tick(8000)
  assert.equal(synth.cancellations, 1)
  assert.match(messages.at(-1), /未能启动/)
  player.play('hello', 'us')
  spoken[1].onstart()
  t.mock.timers.tick(8000)
  assert.equal(messages.at(-1), '')
  assert.equal(synth.cancellations, 1)
})

test('network errors and synchronous engine failures produce actionable feedback', t => {
  const { player, synth, messages, spoken } = setup(t)
  player.play('hello', 'us')
  spoken[0].onerror({ error: 'network' })
  assert.match(messages.at(-1), /检查网络/)
  synth.speak = () => {
    throw new Error('unavailable')
  }
  player.play('hello', 'us')
  assert.match(messages.at(-1), /无法启动语音服务/)
})

test('paused engine resumes; disposal removes listeners and cancels pending callbacks', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const { player, synth, spoken, messages, listeners } = setup(t)
  synth.paused = true
  player.play('hello', 'us')
  assert.equal(synth.paused, false)
  const staleStart = spoken[0].onstart
  player.dispose()
  const messageCount = messages.length
  staleStart()
  t.mock.timers.tick(8000)
  assert.equal(messages.length, messageCount)
  assert.equal(listeners.size, 0)
  assert.equal(synth.cancellations, 1)
})

test('missing browser speech support gives a message instead of throwing', t => {
  setup(t)
  globalThis.window = {}
  let message = ''
  const player = createSpeechPlayer(value => {
    message = value
  })
  player.play('hello', 'us')
  assert.match(message, /不支持朗读/)
  player.dispose()
})
