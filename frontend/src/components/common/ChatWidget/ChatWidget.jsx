import { useState } from "react";
import ChatButton from "./ChatButton";
import ChatWindow from "./ChatWindow";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => setIsOpen(!isOpen);

  return (
    <div className="fixed bottom-10 right-5 z-50">
      {/* ChatWindow với absolute positioning */}
      {isOpen && (
        <div className="absolute bottom-20 right-0">
          <ChatWindow onClose={toggleChat} />
        </div>
      )}
      
      {/* ChatButton luôn ở vị trí cố định */}
      <ChatButton onClick={toggleChat} isOpen={isOpen} />
    </div>
  );
}
