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
      // Nudge format: {greeting} {customer_name}, {openingLine} {requestLine}
      const messageLines = []
      messageLines.push(`${greeting} ${customerName}, ${processedOpeningLine} ${requestLine}`)
      messageLines.push('')
      messageLines.push('https://growourreviews.com/review/a1b2c3d4e5f6')

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
      messageLines.push('https://growourreviews.com/review/a1b2c3d4e5f6')

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
                <div className="font-medium">This message will use {segments} credits instead of 1</div>
                <div className="mt-1">
                  Messages over 160 characters are split into {segments} SMS segments, with each segment using 1 credit from your monthly allowance.
                  This will reduce your available requests faster.
                </div>
                <div className="mt-2 font-medium text-orange-800">
                  💡 Try shortening your message to save credits
                </div>
              </div>
            </div>
          </div>
        )}

        {characterCount > 300 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="text-red-600 text-sm font-medium">🚫</div>
              <div className="text-sm text-red-700">
                <div className="font-medium">This message would use {segments} credits - that's extremely expensive!</div>
                <div className="mt-1">
                  A message this long could quickly exhaust your monthly credit allowance. Each of the {segments} segments counts as a separate request against your plan limit.
                </div>
                <div className="mt-2 font-medium text-red-800">
                  🔴 Please shorten your message significantly to avoid wasting credits
                </div>
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