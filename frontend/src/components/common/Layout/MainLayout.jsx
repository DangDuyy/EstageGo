import { Outlet } from "react-router-dom";
import ChatWidget from "../ChatWidget/ChatWidget";
import { FooterBar } from "../FooterBar";
import NavBar from "../NavBar";

export default function MainLayout() {

  return (
    <>
      <NavBar />
      <Outlet />
      <FooterBar />
      <ChatWidget />
    </>
  )
}