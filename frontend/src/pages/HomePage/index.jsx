import AgentForm from '@/components/common/Agent'
import { FeatureCard } from '@/components/common/Property/FeatureCard'
import { FooterBar } from '@/components/common/FooterBar'
import HeroSearch from '@/components/common/HeroSearch'
import LocationCard from '@/components/common/LocationCard'
import NavBar from '@/components/common/NavBar'
import ReviewForm from '@/components/common/Review'
import ChatWidget from '@/components/common/ChatWidget/ChatWidget'
import MainLayout from '@/components/common/Layout/MainLayout'

function HomePage() {

  const handleSearch = (payload) => {
    // { mode, type, location, keyword }
    console.log(payload);
    // call API / navigate ...
  }

  return (
    <>
        <HeroSearch backgroundUrl="/images/slider/slider-1.jpg" onSearch={handleSearch} />
        <FeatureCard />
        <LocationCard />
        <ReviewForm />
        <AgentForm />
    </>
  )
}

export default HomePage