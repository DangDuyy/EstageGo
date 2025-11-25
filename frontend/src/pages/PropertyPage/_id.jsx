import { FooterBar } from '@/components/common/FooterBar'
import MainLayout from '@/components/common/Layout/MainLayout'
import NavBar from '@/components/common/NavBar'
import PropertyDetail from '@/components/common/Property/details'

function PropertyPage() {
  return (
    <>
      <MainLayout>
        <PropertyDetail />
      </MainLayout>
    </>
  )
}

export default PropertyPage