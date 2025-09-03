import { ContentLayout } from '@/components/common/SidebarMenu/content-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Funnel, Search } from 'lucide-react'
import { useState } from 'react'

export default function Post() {
  const [activeTab, setActiveTab] = useState("all")

  return (
    <ContentLayout title="Posts">
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <div className="w-full flex flex-row justify-between px-4 sm:px-6 lg:px-8">
          <span className="flex flex-row gap-5">
            <div className="relative w-full max-w-sm">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                <Search className="w-5 h-5" />
              </span>
              <Input placeholder="Type your post title..." className="pl-10" />
            </div>
            <Button><Funnel/><span className="ml-2">Filter</span></Button>
          </span>
          <Button><Download/><span className="ml-2">Export Excel</span></Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-3">
        {["all","drafts","published","archived"].map(tab => (
          <Button
            className="cursor-pointer"
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
          <p>Danh sách tất cả bài viết ở đây...</p>
        )}
        {activeTab === "drafts" && (
          <p>Danh sách các bài viết nháp ở đây...</p>
        )}
        {activeTab === "published" && (
          <p>Danh sách các bài viết đã xuất bản ở đây...</p>
        )}
        {activeTab === "archived" && (
          <p>Danh sách các bài viết đã lưu trữ ở đây...</p>
        )}
      </div>
    </ContentLayout>
  )
}
