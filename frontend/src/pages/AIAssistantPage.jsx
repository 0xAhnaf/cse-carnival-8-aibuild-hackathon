import { useEffect, useRef, useState } from 'react'
import { API_BASE_URL, agentApi } from '../services/api.js'

const suggestions = [
  'When is my next class?',
  'What assignments do I have due this week?',
  'Which labs have a projector and fit at least 30 people?',
  'Show me all high priority announcements.',
]

function readAgentReply(result) {
  if (typeof result === 'string') return result
  return result?.answer || result?.message || result?.response || 'Action completed.'
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! I can check live campus data, find rooms, review deadlines, and help with bookings.',
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text) {
    const cleaned = text.trim()
    if (!cleaned || sending) return

    const userMessage = { id: crypto.randomUUID(), role: 'user', text: cleaned }
    setMessages((current) => [...current, userMessage])
    setInput('')
    setError('')
    setSending(true)

    try {
      const result = await agentApi.chat(cleaned, {
        conversation: messages.map(({ role, text: content }) => ({ role, content })),
      })
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: readAgentReply(result),
          action: result?.action || result?.tool_result || null,
        },
      ])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    sendMessage(input)
  }

  return (
    <section className="assistant-page">
      <div className="page-header assistant-header">
        <div>
          <p className="eyebrow">Live-data agent</p>
          <h1>CampusOS AI Assistant</h1>
          <p>Answers and actions use the current campus backend.</p>
        </div>
        <span className="connection-chip"><span className="live-dot" /> {API_BASE_URL}</span>
      </div>

      <div className="assistant-shell">
        <div className="suggestion-grid">
          {suggestions.map((suggestion) => (
            <button type="button" key={suggestion} onClick={() => sendMessage(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>

        <div className="chat-log" aria-live="polite">
          {messages.map((message) => (
            <article className={`chat-message chat-${message.role}`} key={message.id}>
              <span>{message.role === 'assistant' ? 'AI' : 'You'}</span>
              <div>
                <p>{message.text}</p>
                {message.action && (
                  <pre className="action-result">{JSON.stringify(message.action, null, 2)}</pre>
                )}
              </div>
            </article>
          ))}
          {sending && (
            <article className="chat-message chat-assistant">
              <span>AI</span>
              <div><p>Checking live campus data…</p></div>
            </article>
          )}
          <div ref={endRef} />
        </div>

        {error && <p className="form-error assistant-error">{error}</p>}

        <form className="chat-composer" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="agent-message">Message CampusOS AI</label>
          <input
            id="agent-message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about classes, rooms, deadlines, or events…"
            autoComplete="off"
          />
          <button className="button primary-button" type="submit" disabled={sending || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </section>
  )
}
