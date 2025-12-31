import { Outlet } from "react-router-dom";
import { FooterBar } from "../FooterBar";
import NavBar from "../NavBar";
import ChatWidget from "@rasahq/chat-widget-react";

export default function MainLayout() {
  return (
    <>
      <NavBar />
      <Outlet />
      <FooterBar />

      {/* Rasa Chat Widget */}
      <style>
        {`
          :root {
            --color-primary: #1563df;
          }
        `}
      </style>
      <ChatWidget
        serverUrl={import.meta.env.VITE_CHATBOT_URL || "http://localhost:5005"}
        widgetTitle="Trợ lý AI"
        inputMessagePlaceholder="Nhập tin nhắn..."
        // initialPayload="Xin chào quý khách! Tôi có thể giúp bạn tìm kiếm bất động sản như thế nào?"
      />
    </>
  );
}
