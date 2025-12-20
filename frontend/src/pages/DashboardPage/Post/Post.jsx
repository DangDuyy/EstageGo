import PropertyTable from '@/components/common/Property/PropertyTable'
import PostFilter from '@/components/common/Property/PostFilter'
import { ContentLayout } from '@/components/common/SidebarMenu/content-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/redux/user/userSlice'
import { fetchAllPropertiesAPI } from '@/apis'

export default function Post() {
  const [activeTab, setActiveTab] = useState("all")
  const [propertiesData, setPropertiesData] = useState()
  const [searchValue, setSearchValue] = useState("")
  const location = useLocation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const currentUser = useSelector(selectCurrentUser)

  const searchParams = new URLSearchParams(location.search)
  const currentPage = Number(searchParams.get('page')) || 1
  const currentPageSize = Number(searchParams.get('itemsPerPage')) || 9

  const createHref = useMemo(() => {
    const base = pathname.replace(/\/$/, '')
    return `${base}/new`
  }, [pathname])

  // Fetch data theo query string + owner filter
  useEffect(() => {
    const callAPI = async () => {
      if (!currentUser?._id) return
      
      const searchParams = new URLSearchParams(location.search)
      searchParams.set('owner', currentUser._id)
      if (!searchParams.get('page')) searchParams.set('page', `${currentPage}`)
      if (!searchParams.get('itemsPerPage')) searchParams.set('itemsPerPage', `${currentPageSize}`)

      const queryString = searchParams.toString() ? `?${searchParams.toString()}` : ''
      const data = await fetchAllPropertiesAPI(queryString)
      setPropertiesData(data)
    }

    callAPI()
  }, [location.search, currentUser?._id])

  // Hàm xử lý search
  const handleSearch = () => {
    const searchParams = new URLSearchParams(location.search)
    
    if (searchValue.trim()) {
      searchParams.set('q', searchValue.trim())
    } else {
      searchParams.delete('q')
    }
    
    searchParams.set('page', '1')
    
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ""
    navigate(`${pathname}${query}`)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch()
  }

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(location.search)
    params.set('page', `${Math.max(1, newPage)}`)
    const query = params.toString() ? `?${params.toString()}` : ""
    navigate(`${pathname}${query}`)
  }

  const handlePageSizeChange = (newSize) => {
    const params = new URLSearchParams(location.search)
    params.set('itemsPerPage', `${newSize}`)
    params.set('page', '1')
    const query = params.toString() ? `?${params.toString()}` : ""
    navigate(`${pathname}${query}`)
  }

  return (
    <ContentLayout title="Posts">
      {/* Bar tìm kiếm + actions */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <div className="w-full flex flex-row justify-between px-4 sm:px-6 lg:px-8">
          <span className="flex flex-row gap-3">
            <div className="relative w-full max-w-sm">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                <Search className="w-5 h-5" />
              </span>
              <Input 
                value={searchValue} 
                onChange={(e) => setSearchValue(e.target.value)} 
                onKeyDown={handleKeyDown} 
                placeholder="Nhập tiêu đề hoặc địa chỉ..." 
                className="pl-10" 
              />
            </div>

            {/* PostFilter Component */}
            <PostFilter />

            <Button asChild className="inline-flex items-center gap-2">
              <Link to={createHref}>
                <Plus className="w-4 h-4" />
                <span>New post</span>
              </Link>
            </Button>
          </span>

          <Button className="inline-flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-3">
        {["all", "drafts", "published", "archived"].map(tab => (
          <Button
            key={tab}
            variant={activeTab === tab ? "default" : "outline"}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {/* Nội dung tab */}
      <div className="mt-6">
        {activeTab === "all" && (
          <PropertyTable
            data={propertiesData}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
        {activeTab === "drafts" && <p>Danh sách các bài viết nháp ở đây...</p>}
        {activeTab === "published" && <p>Danh sách các bài viết đã xuất bản ở đây...</p>}
        {activeTab === "archived" && <p>Danh sách các bài viết đã lưu trữ ở đây...</p>}
      </div>
    </ContentLayout>
  )
}
