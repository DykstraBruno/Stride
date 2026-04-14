import { useState, useRef, useEffect } from 'react'
import { Send, Bot, Sparkles, X, BarChart2, RefreshCw } from 'lucide-react'
import { aiApi, AIAnalysis } from '../services/api'

interface Message {
  role: 'user' | 'ai'
  content: string
  timestamp: Date
}

interface AIAssistantProps {
  onClose: () => void
}

export function AIAssistant({ onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content:
        'Olá! Sou o Stride AI. Posso ajudar você a organizar suas tarefas, sugerir horários, lembrar de pausas para refeições e muito mais. O que você precisa?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'analysis'>('chat')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage, timestamp: new Date() },
    ])
    setIsLoading(true)

    try {
      const { reply } = await aiApi.chat(userMessage)
      setMessages((prev) => [...prev, { role: 'ai', content: reply, timestamp: new Date() }])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: 'Desculpe, houve um erro. Verifique se a ANTHROPIC_API_KEY está configurada.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeSchedule = async () => {
    setIsAnalyzing(true)
    try {
      const result = await aiApi.analyze()
      setAnalysis(result)
      setActiveTab('analysis')
    } catch {
      alert('Erro ao analisar agenda. Verifique a configuração da API.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const loadColor = (pct: number) =>
    pct > 80 ? 'text-red-600 bg-red-50' : pct > 60 ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 animate-fade-in">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md h-[85vh] sm:h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-stride-500 to-stride-700 rounded-full flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-gray-900">Stride AI</h2>
              <p className="text-xs text-gray-400">Assistente de produtividade</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={analyzeSchedule}
              disabled={isAnalyzing}
              title="Analisar agenda de hoje"
              className="btn-ghost p-1.5 text-stride-600"
            >
              {isAnalyzing ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <BarChart2 size={16} />
              )}
            </button>
            <button onClick={onClose} className="btn-ghost p-1">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-stride-600 border-b-2 border-stride-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'analysis'
                ? 'text-stride-600 border-b-2 border-stride-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Análise
          </button>
        </div>

        {/* Chat tab */}
        {activeTab === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {msg.role === 'ai' && (
                    <div className="w-6 h-6 bg-stride-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot size={12} className="text-stride-700" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-stride-600 text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 bg-stride-100 rounded-full flex items-center justify-center">
                    <Bot size={12} className="text-stride-700" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts */}
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto flex-shrink-0">
              {[
                'Organize meu dia',
                'Preciso de uma pausa',
                'Estou procrastinando',
                'Me lembre de comer',
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInput(prompt)
                  }}
                  className="text-xs text-stride-600 bg-stride-50 border border-stride-200 px-2.5 py-1 rounded-full whitespace-nowrap hover:bg-stride-100 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100 flex-shrink-0">
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Pergunte algo ao Stride AI..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="btn-primary p-2 aspect-square"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Analysis tab */}
        {activeTab === 'analysis' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!analysis ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-gray-400">
                <Sparkles size={32} className="text-stride-300" />
                <p className="text-sm">
                  Clique no botão <BarChart2 size={14} className="inline" /> no topo para analisar
                  sua agenda de hoje.
                </p>
              </div>
            ) : (
              <>
                {/* Load indicator */}
                <div className={`rounded-xl p-3 flex items-center gap-3 ${loadColor(analysis.estimatedLoadPercentage)}`}>
                  <div className="text-2xl font-bold">{analysis.estimatedLoadPercentage}%</div>
                  <div>
                    <div className="text-sm font-medium">Carga do dia</div>
                    <div className="text-xs opacity-75">
                      {analysis.estimatedLoadPercentage > 80
                        ? 'Dia muito carregado!'
                        : analysis.estimatedLoadPercentage > 60
                          ? 'Carga moderada'
                          : 'Bem equilibrado'}
                    </div>
                  </div>
                </div>

                {/* Overall feedback */}
                <div className="bg-stride-50 rounded-xl p-3">
                  <p className="text-sm text-stride-800 leading-relaxed">
                    {analysis.overallFeedback}
                  </p>
                </div>

                {/* Missing essentials */}
                {analysis.missingEssentials.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                    <h3 className="text-xs font-semibold text-orange-700 mb-2 uppercase tracking-wide">
                      Essenciais faltando
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.missingEssentials.map((item) => (
                        <span
                          key={item}
                          className="badge bg-orange-100 text-orange-700 text-xs"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {analysis.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Sugestões
                    </h3>
                    {analysis.suggestions.map((s, i) => (
                      <div key={i} className="bg-white border border-gray-100 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-base">
                            {s.type === 'break'
                              ? '⏸️'
                              : s.type === 'reminder'
                                ? '🔔'
                                : s.type === 'priority'
                                  ? '🎯'
                                  : s.type === 'schedule'
                                    ? '📅'
                                    : '🔀'}
                          </span>
                          <p className="text-sm text-gray-700 leading-relaxed">{s.message}</p>
                        </div>
                        {s.suggestedTime && (
                          <p className="text-xs text-stride-600 mt-1 ml-7">
                            Horário sugerido: {s.suggestedTime}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={analyzeSchedule}
                  disabled={isAnalyzing}
                  className="btn-secondary w-full text-sm"
                >
                  {isAnalyzing ? 'Analisando...' : 'Reanalisar agenda'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
