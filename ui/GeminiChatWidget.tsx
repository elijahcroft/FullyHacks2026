'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { Bottle } from '@/types'
import { useSimulationContext } from '@/simulation/context'
import { sendChatMessage, type ChatMessage } from '@/lib/geminiChat'

interface Props {
  bottles: Bottle[]
  selectedBottle: Bottle | null
}

const SUGGESTIONS = [
  'Where do bottles usually end up?',
  'What is the Great Pacific Garbage Patch?',
  'How do ocean gyres affect drift?',
]

export function GeminiChatWidget({ bottles, selectedBottle }: Props) {
  const { daysElapsed } = useSimulationContext()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      const userMsg: ChatMessage = { role: 'user', text: trimmed }
      const next = [...messages, userMsg]
      setMessages(next)
      setInput('')
      setLoading(true)

      const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? ''
      try {
        const reply = await sendChatMessage(next, bottles, selectedBottle, daysElapsed, key)
        setMessages(prev => [...prev, { role: 'model', text: reply }])
      } catch (err) {
        setMessages(prev => [
          ...prev,
          { role: 'model', text: `Error: ${err instanceof Error ? err.message : String(err)}` },
        ])
      } finally {
        setLoading(false)
      }
    },
    [messages, loading, bottles, selectedBottle, daysElapsed],
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="fixed bottom-5 left-[244px] z-[1100] flex flex-col items-start gap-2">
      {open && (
        <div className="w-80 h-[440px] bg-[#080f1f] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm">✨</span>
              <span className="text-xs font-medium text-white/70">Ocean Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/20">gemini-2.0-flash-lite</span>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="text-[10px] text-white/25 hover:text-white/50 px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors"
                >
                  clear
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {messages.length === 0 ? (
              <div className="pt-4">
                <p className="text-xs text-white/25 text-center mb-4">Ask me anything about the ocean</p>
                <div className="space-y-1.5">
                  {SUGGESTIONS.map(q => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="block w-full text-left text-[11px] text-blue-400/60 hover:text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/25 rounded-lg px-3 py-2 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600/20 border border-blue-500/20 text-white/80'
                        : 'bg-white/4 border border-white/8 text-white/60'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/4 border border-white/8 rounded-xl px-3 py-2 flex items-center gap-2">
                  <div className="size-3 border-2 border-purple-400/60 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="text-xs text-white/30">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-3 shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about the ocean…"
                disabled={loading}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/70 placeholder-white/20 outline-none focus:border-blue-500/40 focus:bg-white/8 disabled:opacity-40 transition-all"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="bg-blue-600/80 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl px-3 py-2 text-white text-sm transition-colors"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs transition-all border backdrop-blur-sm shadow-lg ${
          open
            ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
            : 'bg-[#080f1f]/90 border-white/10 text-white/50 hover:text-white hover:border-white/20'
        }`}
      >
        <span>💬</span>
        <span>Ask Gemini</span>
        {messages.length > 0 && !open && (
          <span className="bg-blue-500/30 text-blue-300 text-[10px] px-1.5 py-0.5 rounded-full">
            {messages.length}
          </span>
        )}
      </button>
    </div>
  )
}
