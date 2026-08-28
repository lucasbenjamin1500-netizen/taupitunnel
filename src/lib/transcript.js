export function ingestVapiMessage(log, message) {
  if (message?.type === 'conversation-update') {
    const items = message.conversation || message.messages
    if (Array.isArray(items) && items.length > 0) return items
  }

  if (
    message?.type === 'transcript' &&
    message.transcript &&
    message.transcriptType !== 'partial'
  ) {
    return [...log, { role: message.role, content: message.transcript }]
  }

  return log
}

export function formatTranscript(messages) {
  return (messages ?? [])
    .map((item) => {
      const role =
        item.role === 'assistant' || item.role === 'bot' ? 'Agent' : 'Voyageur'
      const text = item.content || item.message || item.transcript || ''
      return text ? `${role}: ${text}` : null
    })
    .filter(Boolean)
    .join('\n')
}
