'use client'

interface SmsPreviewProps {
  greeting: string
  openingLine: string
  requestLine: string
  signOff: string | null
  businessName: string
  templateType: 'initial' | 'nudge'
  customerName?: string
}

export default function SmsPreview({
  greeting,
  openingLine,
  requestLine,
  signOff,
  businessName,
  templateType,
  customerName = 'Sarah'
}: SmsPreviewProps) {
  // Replace {business_name} placeholder in opening line
  const processedOpeningLine = openingLine.replace(/\{business_name\}/g, businessName)

  // Assemble the message based on template type
  const assembleMessage = () => {
    if (templateType === 'nudge') {
      // Nudge format: {greeting} {customer_name}, just a gentle reminder — {request_line}:
      const messageLines = []
      messageLines.push(`${greeting} ${customerName}, just a gentle reminder — ${requestLine}:`)
      messageLines.push('')
      messageLines.push('https://growourreviews.com/review/abc123')

      if (signOff && signOff.trim()) {
        messageLines.push('')
        messageLines.push(signOff)
      }

      return messageLines.join('\n')
    } else {
      // Initial format: {greeting} {customer_name}, {opening_line}
      const messageLines = []
      messageLines.push(`${greeting} ${customerName}, ${processedOpeningLine}`)
      messageLines.push('')
      messageLines.push(`${requestLine} 👇`)
      messageLines.push('')
      messageLines.push('https://growourreviews.com/review/abc123')

      if (signOff && signOff.trim()) {
        messageLines.push('')
        messageLines.push(signOff)
      }

      return messageLines.join('\n')
    }
  }

  const message = assembleMessage()
  const characterCount = message.length

  // Determine message segments (160 chars per segment)
  const segments = Math.ceil(characterCount / 160)

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="text-xs text-gray-500 mb-3">Live Preview</div>

        {/* SMS Bubble */}
        <div className="flex justify-end">
          <div className="max-w-sm bg-blue-500 text-white rounded-l-2xl rounded-tr-2xl rounded-br-sm px-4 py-3">
            <div className="text-sm font-medium whitespace-pre-wrap break-words">
              {message}
            </div>
          </div>
        </div>

        <div className="text-right mt-2">
          <div className="text-xs text-gray-500">
            {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Character count and warning */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Message length: {characterCount} / 160 characters
          </span>
          <span className={`font-medium ${segments > 1 ? 'text-orange-600' : 'text-green-600'}`}>
            {segments} SMS segment{segments > 1 ? 's' : ''}
          </span>
        </div>

        {segments > 1 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="text-orange-600 text-sm font-medium">⚠️</div>
              <div className="text-sm text-orange-700">
                This message is over 160 characters and will be sent as {segments} SMS segments, which costs more.
                Try shortening your message.
              </div>
            </div>
          </div>
        )}

        {characterCount > 300 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="text-red-600 text-sm font-medium">🚫</div>
              <div className="text-sm text-red-700">
                Message is too long (over 300 characters). This would be very expensive to send.
                Please shorten your message significantly.
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
        <strong>Note:</strong> Your review link is always included automatically — you don't need to add it.
        The customer name and business name are inserted automatically when the SMS is sent.
      </div>
    </div>
  )
}