import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MessageInput() {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    console.log("Send message:", text);
    setText("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-card border-t">
      <div className="flex items-end gap-3">
        {/* Textarea Field */}
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            rows={1}
            className="w-full px-4 py-3 rounded-2xl border-2 border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all resize-none outline-none min-h-[48px] max-h-[120px] overflow-y-auto"
            style={{
              height: 'auto',
              minHeight: '48px'
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!text.trim()}
          size="icon"
          className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-600/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          title="Gửi tin nhắn"
        >
          <Send className="h-5 w-5 text-white" />
        </Button>
      </div>
    </div>
  );
}