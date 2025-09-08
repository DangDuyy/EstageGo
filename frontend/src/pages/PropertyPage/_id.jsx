import { FooterBar } from '@/components/common/FooterBar'
import NavBar from '@/components/common/NavBar'
import PropertyDetail from '@/components/common/Property/details'

function PropertyPage() {
  return (
    <>
      <NavBar/>
      <PropertyDetail/>
      <FooterBar/> 
    </>
  )
}

export default PropertyPage