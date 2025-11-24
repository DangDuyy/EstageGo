import Header from "./Header";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useState } from "react";

// const dummyMessages = [
//   {
//     id: 1,
//     text: "Xin chào! Tôi có thể giúp gì cho bạn hôm nay?",
//     sender: "bot",
//     timestamp: "10:30",
//     status: "read"
//   },
//   {
//     id: 2,
//     text: "Chào bạn! Tôi muốn hỏi về sản phẩm của các bạn.",
//     sender: "user",
//     timestamp: "10:31",
//     status: "read"
//   },
//   {
//     id: 3,
//     text: "Tất nhiên rồi! Chúng tôi có nhiều sản phẩm khác nhau. Bạn quan tâm đến loại sản phẩm nào cụ thể?",
//     sender: "bot",
//     timestamp: "10:31",
//     status: "read"
//   },
//   {
//     id: 4,
//     text: "Tôi đang tìm hiểu về gói dịch vụ premium. Có thể cho tôi biết thêm thông tin không?",
//     sender: "user",
//     timestamp: "10:32",
//     status: "sent"
//   },
//   {
//     id: 5,
//     text: "Đây là một câu hỏi dài hơn để test giao diện. Tôi muốn biết liệu gói premium có bao gồm support 24/7 không và các tính năng nâng cao như API access hay không?",
//     sender: "user",
//     timestamp: "10:33",
//     status: "delivered"
//   },
// ];

export default function ChatWindow({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);

  return (
    <div className="w-96 h-[600px] bg-card text-card-foreground rounded-xl shadow-xl flex flex-col overflow-hidden">
      <Header onClose={onClose} title="Support Bot" />
      <MessageList dummyMessages={messages} typing = {typing}/>
      <MessageInput setMessages={setMessages} setTyping={setTyping}/>
    </div>
  );
}