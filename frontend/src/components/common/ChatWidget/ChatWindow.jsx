import Header from "./Header";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

export default function ChatWindow({ onClose }) {
  return (
    <div className="w-96 h-[600px] bg-card text-card-foreground rounded-xl shadow-xl flex flex-col overflow-hidden">
      <Header onClose={onClose} title="Support Bot" />
      <MessageList />
      <MessageInput />
    </div>
  );
}