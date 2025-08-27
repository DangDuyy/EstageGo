import AgentForm from '@/components/common/Agent'
import { FooterBar } from '@/components/common/FooterBar'
import HeroSearch from '@/components/common/HeroSearch'
import NavBar from '@/components/common/NavBar'
import ReviewForm from '@/components/common/Review'

function HomePage() {

  const handleSearch = (payload) => {
    // { mode, type, location, keyword }
    console.log(payload);
    // call API / navigate ...
  }

  return (
    <>
      <NavBar/>
      <HeroSearch backgroundUrl="/images/page-title/page-title-3.jpg" onSearch={handleSearch}/>
      <ReviewForm/>
      <AgentForm/>
      <FooterBar/>
    </>
  )
}

export default HomePage