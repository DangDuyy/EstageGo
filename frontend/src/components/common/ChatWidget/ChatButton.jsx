
import { MessageCircle, X } from 'lucide-react';

export default function ChatButton({ onClick, isOpen }) {
  return (
    <button
      onClick={onClick}
      className={`
        group relative w-14 h-14 rounded-full 
        bg-gradient-to-br from-blue-600 to-blue-700 
        hover:from-blue-700 hover:to-blue-800
        text-white flex items-center justify-center 
        shadow-lg hover:shadow-xl
        transition-all duration-300 ease-in-out
        hover:scale-110 active:scale-95
        focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        ${isOpen ? 'rotate-0' : 'rotate-0'}
      `}
      aria-label={isOpen ? 'Đóng chat' : 'Mở chat'}
    >
      {/* Hiệu ứng pulse khi đóng */}
      {!isOpen && (
        <span className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20"></span>
      )}

      {/* Hiệu ứng phát sáng (glow) */}
      <span className="absolute inset-0 rounded-full bg-primary blur-xl opacity-50 animate-pulse"></span>
      
      {/* Icon với animation */}
      <div className={`transition-all duration-300 ${isOpen ? 'rotate-90 scale-90' : 'rotate-0 scale-100'}`}>
        {isOpen ? (
          <X className="w-6 h-6" strokeWidth={2.5} />
        ) : (
          <MessageCircle className="w-6 h-6" strokeWidth={2.5} />
        )}
      </div>
      
      {/* Badge thông báo (có thể bật/tắt) */}
      {!isOpen && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-xs font-bold shadow-md text-destructive-foreground">
          3
        </span>
      )}
    </button>
  );
}