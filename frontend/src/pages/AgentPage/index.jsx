import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Loader2 } from 'lucide-react'
import AgentCard from '@/components/common/Agent/AgentCard'
import { getAllAgentsAPI } from '@/apis'
import NavBar from '@/components/common/NavBar'
import { FooterBar } from '@/components/common/FooterBar'

export default function AgentListPage() {
  const [agents, setAgents] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchAgents()
  }, [pagination.page])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const data = await getAllAgentsAPI(searchQuery, pagination.page, pagination.limit)
      setAgents(data.agents)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPagination({ ...pagination, page: 1 })
    fetchAgents()
  }

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-background pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Find Real Estate Agents</h1>
            <p className="text-muted-foreground text-lg">
              Connect with professional agents to help you buy, sell, or rent properties
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-4 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search agents by name, company, or area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
          </form>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No agents found</p>
            </div>
          ) : (
            <>
              {/* Agent Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {agents.map((agent) => (
                  <AgentCard key={agent._id} agent={agent} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    {[...Array(pagination.totalPages)].map((_, idx) => {
                      const pageNum = idx + 1
                      // Show first, last, current, and adjacent pages
                      if (
                        pageNum === 1 ||
                        pageNum === pagination.totalPages ||
                        Math.abs(pageNum - pagination.page) <= 1
                      ) {
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === pagination.page ? 'default' : 'outline'}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        )
                      } else if (
                        pageNum === pagination.page - 2 ||
                        pageNum === pagination.page + 2
                      ) {
                        return <span key={pageNum} className="px-2">...</span>
                      }
                      return null
                    })}
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <FooterBar />
    </>
  )
}
