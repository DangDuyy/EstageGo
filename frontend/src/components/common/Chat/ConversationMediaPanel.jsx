import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getConversationMediaAPI } from "@/apis"

export default function ConversationMediaPanel({
  conversationId,
  kind = "visual", // visual: image/video, binary: audio/file
  onlyTab, // "image" | "video" | "audio" | "file"
  defaultTab = "image",
  pageSize = 8,
  gridCols = 4,
  showTabs = false,
  showLoadMore = false,
  onImageClick
}) {
  const [tab, setTab] = useState(onlyTab || defaultTab)
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [conversationId, tab])

  useEffect(() => {
    const fetchData = async () => {
      if (!conversationId) return
      try {
        setLoading(true)
        const res = await getConversationMediaAPI(conversationId, tab, page, pageSize)
        if (page === 1) setItems(res.items || [])
        else setItems((prev) => [...prev, ...(res.items || [])])
        setHasMore((res.pagination?.page || 1) < (res.pagination?.totalPages || 1))
      } catch (e) {
        console.error("media fetch error", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [conversationId, tab, page, pageSize])

  const gridClass = `grid grid-cols-${gridCols} gap-2`

  const renderItem = (it, idx) => {
    if (tab === "image" || tab === "video") {
      return (
        <button
          key={`${it.url}-${idx}`}
          onClick={() => onImageClick?.(it.url)}
          className="relative overflow-hidden rounded-lg border hover:border-primary transition-colors group cursor-pointer"
        >
          <img 
            src={it.url} 
            alt={it.filename || "media"} 
            className="w-full aspect-square object-cover group-hover:scale-105 transition-transform" 
          />
        </button>
      )
    }
    if (tab === "audio") {
      return (
        <Card key={`${it.url}-${idx}`} className="p-2">
          <audio controls className="w-full">
            <source src={it.url} type={it.mimetype || "audio/webm"} />
          </audio>
        </Card>
      )
    }
    // file
    return (
      <Card key={`${it.url}-${idx}`} className="p-2 text-sm truncate">
        <a href={it.url} target="_blank" rel="noopener noreferrer" className="underline">
          {it.filename || it.url}
        </a>
      </Card>
    )
  }

  const tabs = kind === "visual"
    ? ["image", "video"]
    : ["audio", "file"]

  return (
    <div>
      {showTabs && (
        <div className="flex gap-2 mb-2">
          {tabs.map((t) => (
            <Button key={t} variant={t === tab ? "default" : "outline"} size="sm" onClick={() => setTab(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground">No items</div>
      ) : (
        <div className={gridClass}>
          {items.map(renderItem)}
        </div>
      )}

      {showLoadMore && hasMore && (
        <Button className="w-full mt-3" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={loading}>
          {loading ? "Loading..." : "Load more"}
        </Button>
      )}
    </div>
  )
}
