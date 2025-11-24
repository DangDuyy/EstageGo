import { Bot, User, Check, CheckCheck, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const dummyMessages = [
  { 
    id: 1, 
    text: "Xin chào! Tôi có thể giúp gì cho bạn hôm nay?", 
    sender: "bot",
    timestamp: "10:30",
    status: "read"
  },
  { 
    id: 2, 
    text: "Chào bạn! Tôi muốn hỏi về sản phẩm của các bạn.", 
    sender: "user",
    timestamp: "10:31",
    status: "read"
  },
  { 
    id: 3, 
    text: "Tất nhiên rồi! Chúng tôi có nhiều sản phẩm khác nhau. Bạn quan tâm đến loại sản phẩm nào cụ thể?", 
    sender: "bot",
    timestamp: "10:31",
    status: "read"
  },
  { 
    id: 4, 
    text: "Tôi đang tìm hiểu về gói dịch vụ premium. Có thể cho tôi biết thêm thông tin không?", 
    sender: "user",
    timestamp: "10:32",
    status: "sent"
  },
  { 
    id: 5, 
    text: "Đây là một câu hỏi dài hơn để test giao diện. Tôi muốn biết liệu gói premium có bao gồm support 24/7 không và các tính năng nâng cao như API access hay không?", 
    sender: "user",
    timestamp: "10:33",
    status: "delivered"
  },
];

// Company Intro Component
function CompanyIntro() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-6 animate-in fade-in duration-500">
      {/* Logo */}
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-30 animate-pulse"></div>
        <div className="relative w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-xl">
          <Sparkles className="w-10 h-10 text-white" strokeWidth={2} />
        </div>
      </div>

      {/* Company Name */}
      <h2 className="text-2xl font-bold text-foreground mb-2">
        EstageGo
      </h2>
      <p className="text-muted-foreground text-sm mb-6 text-center max-w-xs">
        Trợ lý AI thông minh của bạn
      </p>

      {/* Welcome Message */}
      <p className="text-sm text-foreground text-center leading-relaxed">
        👋 Xin chào! Chúng tôi luôn sẵn sàng hỗ trợ bạn. 
        Hãy đặt câu hỏi hoặc chia sẻ vấn đề bạn đang gặp phải.
      </p>

      {/* Quick Actions */}
      {/* <div className="mt-6 w-full max-w-md space-y-2">
        <p className="text-xs text-muted-foreground text-center mb-3">Câu hỏi thường gặp:</p>
        <div className="grid grid-cols-1 gap-2">
          {['Thông tin sản phẩm', 'Bảng giá dịch vụ', 'Liên hệ hỗ trợ'].map((item, idx) => (
            <button
              key={idx}
              className="px-4 py-2.5 text-sm text-left text-foreground bg-card hover:bg-accent border hover:border-primary rounded-xl transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              {item}
            </button>
          ))}
        </div>
      </div> */}
    </div>
  );
}

// Message Item Component
function MessageItem({ message }) {
  const isUser = message.sender === "user";
  
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} items-start animate-in slide-in-from-bottom-2 duration-300`}>
      {/* Avatar */}
      <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
        <AvatarFallback className={isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </AvatarFallback>
      </Avatar>

      {/* Message Bubble */}
      <div className={`flex flex-col max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`
          group relative px-4 py-2.5 rounded-2xl shadow-sm
          transition-all duration-200 hover:shadow-md
          ${isUser 
            ? 'bg-primary text-primary-foreground rounded-br-md' 
            : 'bg-muted text-foreground border rounded-bl-md'
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
            <span className={`text-xs ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
              {message.timestamp}
            </span>
            
            {isUser && message.status && (
              <span className="ml-1">
                {message.status === 'sent' && (
                  <Check className="w-3 h-3 text-primary-foreground/70" />
                )}
                {message.status === 'delivered' && (
                  <CheckCheck className="w-3 h-3 text-primary-foreground/70" />
                )}
                {message.status === 'read' && (
                  <CheckCheck className="w-3 h-3 text-primary-foreground" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Sender Name (optional - for bot messages) */}
        {!isUser && (
          <span className="text-xs text-muted-foreground mt-1 ml-1">
            Trợ lý AI
          </span>
        )}
      </div>
    </div>
  );
}

// Main MessageList Component
export default function MessageList() {
  const hasMessages = dummyMessages.length > 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-background">
      {/* Company Intro - shows when no messages or at the top */}
      {!hasMessages && <CompanyIntro />}
      
      {/* Messages */}
      {hasMessages && (
        <div className="space-y-4">
          {/* Show intro at top if there are messages */}
          <CompanyIntro />
          
          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs text-muted-foreground font-medium">Cuộc trò chuyện</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          {/* Message List */}
          {dummyMessages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
        </div>
      )}
    </div>
  );
}