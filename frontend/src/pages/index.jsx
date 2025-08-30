import AgentForm from '@/components/common/Agent'
import { FeatureCard } from '@/components/common/FeatureCard'
import { FooterBar } from '@/components/common/FooterBar'
import HeroSearch from '@/components/common/HeroSearch'
import LocationCard from '@/components/common/LocationCard'
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
      <HeroSearch backgroundUrl="/images/home/house-21.jpg" onSearch={handleSearch}/>
      <FeatureCard/>
      <LocationCard/>
      <ReviewForm/>
      <AgentForm/>
      <FooterBar/>
    </>
  )
}

export default HomePage