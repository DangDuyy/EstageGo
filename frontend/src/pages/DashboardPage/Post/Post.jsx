import PropertyTable from '@/components/common/Property/PropertyTable'
import { ContentLayout } from '@/components/common/SidebarMenu/content-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Funnel, Plus, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { fetchAllPropertiesAPI } from '@/apis'

export default function Post() {
  const [activeTab, setActiveTab] = useState("all")
  const [propertiesData, setPropertiesData] = useState()
  const [searchValue, setSearchValue] = useState("") // 💡 Lưu nội dung người dùng nhập
  const location = useLocation()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const createHref = useMemo(() => {
    const base = pathname.replace(/\/$/, '')
    return `${base}/new`
  }, [pathname])

  // Fetch data theo query string
  useEffect(() => {
    const callAPI = async () => {
      const data = await fetchAllPropertiesAPI(location.search)
      setPropertiesData(data)
    }

    callAPI()
  }, [location.search]);

  // 🔍 Hàm xử lý khi người dùng nhấn Enter hoặc click search
  const handleSearch = () => {
    // Tạo query mới (?search=...)
    const query = searchValue ? `?page=1&q=${encodeURIComponent(searchValue)}` : ""
    navigate(`${pathname}${query}`)
  }

  // ⌨️ Cho phép nhấn Enter để tìm
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch()
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
              <Input value={searchValue} onChange={(e) => setSearchValue(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type your post title..." className="pl-10" />
            </div>

            <Button variant="outline" className="inline-flex items-center gap-2">
              <Funnel className="w-4 h-4" />
              <span>Filter</span>
            </Button>

            {/* New post: Button asChild + Link để icon & text nằm cùng hàng */}
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
        {activeTab === "all" && <PropertyTable data={propertiesData} />}
        {activeTab === "drafts" && <p>Danh sách các bài viết nháp ở đây...</p>}
        {activeTab === "published" && <p>Danh sách các bài viết đã xuất bản ở đây...</p>}
        {activeTab === "archived" && <p>Danh sách các bài viết đã lưu trữ ở đây...</p>}
      </div>
    </ContentLayout>
  )
}
