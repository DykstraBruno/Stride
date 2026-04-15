import { useState, useRef, useEffect } from 'react'
import { Send, Bot, Sparkles, X, BarChart2, RefreshCw, Zap } from 'lucide-react'
import { aiApi, AIAnalysis } from '../services/api'

interface Message {
  role: 'user' | 'ai'
  content: string
  timestamp: Date
}

interface AIAssistantProps {
  onClose: () => void
}

const QUICK_PROMPTS = [
  'Organize meu dia',
  'Preciso de uma pausa',
  'Estou procrastinando',
  'Me lembre de comer',
]

export function AIAssistant({ onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content:
        'Olá! Sou o Stride AI. Posso ajudar você a organizar tarefas, sugerir horários, lembrar de pausas e muito mais. O que você precisa?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput]         = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis]   = useState<AIAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'analysis'>('chat')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || isLoading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: msg, timestamp: new Date() }])
    setIsLoading(true)

    // Add empty AI message that will be filled progressively
    const aiMsgId = Date.now()
    setMessages((prev) => [
      ...prev,
      { role: 'ai', content: '', timestamp: new Date(), id: aiMsgId } as Message & { id: number },
    ])

    try {
      await aiApi.chatStream(msg, (chunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            (m as Message & { id?: number }).id === aiMsgId
              ? { ...m, content: m.content + chunk }
              : m,
          ),
        )
      })
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      setMessages((prev) =>
        prev.map((m) =>
          (m as Message & { id?: number }).id === aiMsgId
            ? { ...m, content: `Erro: ${detail}` }
            : m,
        ),
      )
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const analyzeSchedule = async () => {
    setIsAnalyzing(true)
    try {
      const result = await aiApi.analyze()
      setAnalysis(result)
      setActiveTab('analysis')
    } catch {
      alert('Erro ao analisar agenda. Verifique sua conexão e a chave GROQ_API_KEY no .env.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const loadGradient = (pct: number) =>
    pct > 80 ? 'from-rose-500 to-red-600'
  : pct > 60 ? 'from-amber-400 to-orange-500'
  : 'from-emerald-400 to-teal-500'

  const loadLabel = (pct: number) =>
    pct > 80 ? 'Dia muito carregado!'
  : pct > 60 ? 'Carga moderada'
  : 'Bem equilibrado'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                    p-0 sm:p-4 backdrop-blur-sm animate-fade-in"
         style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-t-2xl sm:rounded-xl shadow-2xl
                      w-full sm:max-w-md h-[88vh] sm:h-[640px]
                      flex flex-col animate-slide-up overflow-hidden"
           style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-border)' }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
             style={{ borderBottom: '1px solid var(--c-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700
                            flex items-center justify-center shadow-glow-sm">
              <Bot size={17} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-surface-900 dark:text-surface-100">
                Stride AI
              </h2>
              <p className="text-xs text-surface-400 dark:text-surface-500">
                Assistente de produtividade
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={analyzeSchedule} disabled={isAnalyzing}
              title="Analisar agenda" className="btn-icon">
              {isAnalyzing
                ? <RefreshCw size={16} className="animate-spin text-primary-500" />
                : <BarChart2 size={16} />}
            </button>
            <button onClick={onClose} className="btn-icon">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex flex-shrink-0" style={{ borderBottom: '1px solid var(--c-border)' }}>
          {(['chat', 'analysis'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide
                          transition-colors ${
                activeTab === tab
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-400'
              }`}>
              {tab === 'chat' ? 'Chat' : 'Análise'}
            </button>
          ))}
        </div>

        {/* ── Chat tab ── */}
        {activeTab === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'ai' && (
                    <div className="w-7 h-7 rounded-xl bg-primary-100 dark:bg-primary-900/40
                                    flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap size={13} className="text-primary-600 dark:text-primary-400" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm
                                   leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary-500 text-white rounded-tr-sm'
                      : 'rounded-tl-sm'
                  }`}
                       style={msg.role === 'ai' ? {
                         backgroundColor: 'var(--c-hover)',
                         color: 'var(--c-text)',
                       } : {}}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-primary-100 dark:bg-primary-900/40
                                  flex items-center justify-center">
                    <Zap size={13} className="text-primary-500" />
                  </div>
                  <div className="rounded-xl rounded-tl-sm px-4 py-3"
                       style={{ backgroundColor: 'var(--c-hover)' }}>
                    <div className="flex gap-1.5 items-center">
                      {[0, 1, 2].map((i) => (
                        <div key={i}
                          className="w-1.5 h-1.5 bg-surface-400 dark:bg-surface-500 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto flex-shrink-0 scrollbar-none">
              {QUICK_PROMPTS.map((p) => (
                <button key={p} onClick={() => sendMessage(p)}
                  className="text-xs text-primary-600 dark:text-primary-400
                             bg-primary-50 dark:bg-primary-900/20
                             border border-primary-200 dark:border-primary-800/40
                             px-3 py-1.5 rounded-full whitespace-nowrap
                             hover:bg-primary-100 dark:hover:bg-primary-900/40
                             transition-colors flex-shrink-0">
                  {p}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-4 pb-4 flex-shrink-0 pt-3"
                 style={{ borderTop: '1px solid var(--c-border)' }}>
              <div className="flex gap-2">
                <input ref={inputRef} className="input flex-1 text-sm"
                  placeholder="Pergunte algo ao Stride AI..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  disabled={isLoading} />
                <button onClick={() => sendMessage()}
                  disabled={isLoading || !input.trim()}
                  className="btn-primary px-3 py-2.5 rounded-xl aspect-square">
                  <Send size={15} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Analysis tab ── */}
        {activeTab === 'analysis' && (
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {!analysis ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30
                                flex items-center justify-center">
                  <Sparkles size={24} className="text-primary-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    Analisar agenda de hoje
                  </p>
                  <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                    Clique no ícone <BarChart2 size={12} className="inline" /> no topo
                  </p>
                </div>
                <button onClick={analyzeSchedule} disabled={isAnalyzing}
                  className="btn-primary">
                  {isAnalyzing ? 'Analisando...' : 'Analisar agora'}
                </button>
              </div>
            ) : (
              <>
                {/* Load gauge */}
                <div className={`rounded-2xl p-4 bg-gradient-to-br ${loadGradient(analysis.estimatedLoadPercentage)}`}>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-black text-white">
                      {analysis.estimatedLoadPercentage}%
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {loadLabel(analysis.estimatedLoadPercentage)}
                      </div>
                      <div className="text-xs text-white/70">carga estimada do dia</div>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white/80 rounded-full transition-all"
                      style={{ width: `${analysis.estimatedLoadPercentage}%` }} />
                  </div>
                </div>

                {/* Feedback */}
                <div className="bg-primary-50 dark:bg-primary-900/20
                                border border-primary-200/60 dark:border-primary-800/40
                                rounded-2xl p-3.5">
                  <p className="text-sm text-primary-800 dark:text-primary-200 leading-relaxed">
                    {analysis.overallFeedback}
                  </p>
                </div>

                {/* Missing essentials */}
                {analysis.missingEssentials.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20
                                  border border-amber-200/60 dark:border-amber-800/40
                                  rounded-2xl p-3.5">
                    <h3 className="text-xs font-semibold text-amber-700 dark:text-amber-400
                                   uppercase tracking-wide mb-2">
                      ⚠ Essenciais faltando
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.missingEssentials.map((item) => (
                        <span key={item}
                          className="badge bg-amber-100 dark:bg-amber-900/40
                                     text-amber-700 dark:text-amber-400
                                     border border-amber-200 dark:border-amber-800/40">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {analysis.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="section-title">Sugestões</h3>
                    {analysis.suggestions.map((s, i) => (
                      <div key={i}
                        className="bg-white dark:bg-surface-800
                                   border border-surface-100 dark:border-surface-700
                                   rounded-xl p-3 flex items-start gap-2.5">
                        <span className="text-base flex-shrink-0">
                          {s.type === 'break'    ? '⏸️'
                          : s.type === 'reminder' ? '🔔'
                          : s.type === 'priority' ? '🎯'
                          : s.type === 'schedule' ? '📅'
                          : '🔀'}
                        </span>
                        <div>
                          <p className="text-sm text-surface-700 dark:text-surface-300 leading-relaxed">
                            {s.message}
                          </p>
                          {s.suggestedTime && (
                            <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 font-medium">
                              Horário sugerido: {s.suggestedTime}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={analyzeSchedule} disabled={isAnalyzing}
                  className="btn-secondary w-full">
                  {isAnalyzing ? 'Reanalisando…' : 'Reanalisar agenda'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
