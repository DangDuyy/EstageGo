import { Bot, User, Check, CheckCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function MessageItem({ message }) {
  const isUser = message.sender === "user";
  
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} items-start animate-in slide-in-from-bottom-2 duration-300`}>
      {/* Avatar */}
      <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
        <AvatarFallback className={isUser ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-700'}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Bubble */}
      <div className={`flex flex-col max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`
          group relative px-4 py-2.5 rounded-2xl shadow-sm
          transition-all duration-200 hover:shadow-md
          ${isUser 
            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md' 
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
          }
        `}>
          {/* Message Text */}
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
            {message.text}
          </p>

          {/* Timestamp & Status */}
          <div className={`
            flex items-center gap-1 mt-1.5
            ${isUser ? 'justify-end' : 'justify-start'}
          `}>
            <span className={`text-xs ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
              {message.timestamp}
            </span>
            
            {isUser && message.status && (
              <span className="ml-1">
                {message.status === 'sent' && (
                  <Check className="w-3 h-3 text-blue-200" />
                )}
                {message.status === 'delivered' && (
                  <CheckCheck className="w-3 h-3 text-blue-200" />
                )}
                {message.status === 'read' && (
                  <CheckCheck className="w-3 h-3 text-blue-300" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Sender Name (optional - for bot messages) */}
        {!isUser && (
          <span className="text-xs text-gray-500 mt-1 ml-1">
            Trợ lý AI
          </span>
        )}
      </div>
    </div>
  );
}