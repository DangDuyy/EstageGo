import { useState } from "react"
import { Smile, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toggleReactionAPI } from "@/apis"

const defaultReactions = ["👍", "❤️", "😂", "😮", "😢", "😡"]

export default function ReactionButton({ messageId, userEmojis = [] }) {
  const [loading, setLoading] = useState(false)

  const handleReactionClick = async (emoji) => {
    if (loading) return
    console.log('Adding reaction:', emoji, 'for message:', messageId)
    try {
      setLoading(true)
      const result = await toggleReactionAPI(messageId, emoji)
      console.log('Reaction added:', result)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative inline-block">
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 group"
        type="button"
      >
        <Smile className="w-3 h-3" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-12 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto" />
        <div
          className="absolute opacity-0 group-hover:opacity-100
          pointer-events-none group-hover:pointer-events-auto
          transition-opacity duration-200
          -top-12 left-1/2 -translate-x-1/2
          flex gap-1 bg-background border
          px-3 py-2 rounded-full shadow-lg z-50
          whitespace-nowrap"
        >
          {defaultReactions.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={`text-xl hover:scale-110 transition-transform ${
                userEmojis.includes(emoji) ? 'opacity-100 scale-110' : 'opacity-60'
              }`}
              onClick={() => handleReactionClick(emoji)}
              title={userEmojis.includes(emoji) ? 'Remove reaction' : 'Add reaction'}
            >
              {emoji}
            </button>
          ))}
        </div>
      </Button>
    </div>
  )
}

