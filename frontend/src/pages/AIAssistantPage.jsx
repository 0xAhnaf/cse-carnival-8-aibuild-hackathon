import { useEffect, useRef, useState } from 'react'
import { agentApi } from '../services/api.js'

const suggestions = [
  'When is my next class?',
  'What assignments do I have due this week?',
  'Which labs have a projector and fit at least 30 people?',
  'Show me all high priority announcements.',
  'Book Room 7A02 tomorrow from 3 PM to 5 PM.',
  'Register me for Guest Lecture: Deep Learning in Medical Imaging.',
]

function cleanAssistantText(value) {
  return String(value)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .trim()
}

function readAgentReply(result) {
  const reply = typeof result === 'string'
    ? result
    : result?.answer || result?.message || result?.response
  return cleanAssistantText(reply || 'The assistant returned an empty response. Please try again.')
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([{ id: 'welcome', role: 'assistant', text: 'Hi! I can check current campus data, find rooms, review deadlines, and help with bookings.' }])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  async function sendMessage(text) {
    const cleaned = text.trim()
    if (!cleaned || sending) return
    const userMessage = { id: crypto.randomUUID(), role: 'user', text: cleaned }
    setMessages((current) => [...current, userMessage])
    setInput('')
    setError('')
    setSending(true)
    try {
      const result = await agentApi.chat(cleaned, { conversation: messages.map(({ role, text: content }) => ({ role, content })) })
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', text: readAgentReply(result), action: result?.action || result?.tool_result || null }])
    } catch (requestError) { setError(requestError.message) }
    finally { setSending(false) }
  }

  return <section className="assistant-page">
    <div className="page-header assistant-header">
      <div><p className="eyebrow">Campus AI agent</p><h1>CampusOS AI Assistant</h1><p>Answers and actions use current CampusOS data.</p></div>
      <span className="connection-chip">Tool-enabled assistant</span>
    </div>
    <div className="assistant-shell">
      <div className="suggestion-grid">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => sendMessage(suggestion)}>{suggestion}</button>)}</div>
      <div className="chat-log" aria-live="polite">
        {messages.map((message) => <article className={`chat-message chat-${message.role}`} key={message.id}>
          <span>{message.role === 'assistant' ? 'AI' : 'You'}</span><div><p>{message.text}</p>{message.action && <pre className="action-result">{JSON.stringify(message.action, null, 2)}</pre>}</div>
        </article>)}
        {sending && <article className="chat-message chat-assistant"><span>AI</span><div><p>Checking current campus data…</p></div></article>}
        <div ref={endRef} />
      </div>
      {error && <p className="form-error assistant-error">{error}</p>}
      <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); sendMessage(input) }}>
        <label className="sr-only" htmlFor="agent-message">Message CampusOS AI</label>
        <input id="agent-message" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about classes, rooms, deadlines, or events…" autoComplete="off" />
        <button className="button primary-button" type="submit" disabled={sending || !input.trim()}>Send</button>
      </form>
    </div>
  </section>
}
