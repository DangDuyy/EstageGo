import { parseMessageWithProperties } from '@/utils/propertyLinkDetector'
import PropertyPreview from './PropertyPreview'

/**
 * Component to render message text with property previews
 */
export default function MessageContent({ text, isOwn }) {
  const parsed = parseMessageWithProperties(text)

  if (!parsed.hasProperties) {
    return (
      <div
        className={`px-4 py-2 rounded-2xl ${
          isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        <p className="whitespace-pre-wrap break-all">{text}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Text bubble with message content */}
      {parsed.parts.some(p => p.type === 'text' && p.content.trim()) && (
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}
        >
          <p className="whitespace-pre-wrap break-all">
            {parsed.parts.map((part, idx) => {
              if (part.type === 'text') {
                return <span key={idx}>{part.content}</span>
              } else if (part.type === 'property') {
                return (
                  <a
                    key={idx}
                    href={part.url}
                    className={`underline font-semibold ${
                      isOwn ? 'text-primary-foreground' : 'text-blue-600'
                    } hover:opacity-80`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {part.url}
                  </a>
                )
              }
              return null
            })}
          </p>
        </div>
      )}

      {/* Property previews */}
      <div className="space-y-2">
        {parsed.properties.map((propertyId) => (
          <PropertyPreview key={propertyId} propertyId={propertyId} />
        ))}
      </div>
    </div>
  )
}
