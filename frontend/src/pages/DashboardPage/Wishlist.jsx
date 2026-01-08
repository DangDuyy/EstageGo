import { ContentLayout } from '@/components/common/SidebarMenu/content-layout'
import { useWishlist } from '@/contexts/WishlistContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, Trash2, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'

export default function Wishlist() {
  const { items, loading, removeItem, clearWishlist } = useWishlist()

  if (loading) {
    return (
      <ContentLayout title="Wishlist">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </ContentLayout>
    )
  }

  if (items.length === 0) {
    return (
      <ContentLayout title="Wishlist">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Heart className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
            <p className="text-gray-500 mb-6">Start adding properties you love!</p>
            <Button asChild>
              <Link to="/listing/grid">Browse Properties</Link>
            </Button>
          </CardContent>
        </Card>
      </ContentLayout>
    )
  }

  return (
    <ContentLayout title="Wishlist">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Saved Properties</h2>
            <p className="text-gray-500">{items.length} properties in your wishlist</p>
          </div>
          {items.length > 0 && (
            <Button variant="outline" onClick={clearWishlist}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card 
              key={item.id} 
              className={`overflow-hidden group hover:shadow-lg transition-shadow ${
                !item.isAvailable ? 'opacity-50' : ''
              }`}
            >
              <div className="relative">
                <img
                  src={item.property.image}
                  alt={item.property.name}
                  className={`w-full h-48 object-cover ${
                    !item.isAvailable ? 'grayscale' : ''
                  }`}
                />
                <Badge className="absolute top-3 left-3 bg-blue-600">
                  <Heart className="h-3 w-3 mr-1 fill-white" />
                  Saved
                </Badge>
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Badge className="bg-red-600 text-white text-xs font-semibold">
                      {item.status === 'draft' ? 'Draft' : item.status === 'hidden' ? 'Hidden' : 'Unavailable'}
                    </Badge>
                  </div>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeItem(item.id)}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 hover:bg-white"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {item.property.name}
                </h3>
                
                {item.property.address && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                    {item.property.address}
                  </p>
                )}

                {!item.isAvailable && (
                  <p className="text-sm text-red-600 font-semibold mb-3">
                    Property no longer available
                  </p>
                )}

                {item.property.price != null && (
                  <p className={`text-xl font-bold mb-4 ${
                    item.isAvailable ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    ${Number(item.property.price).toLocaleString()}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button 
                    asChild 
                    className="flex-1"
                    disabled={!item.isAvailable}
                  >
                    <Link to={item.property.href}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                  >
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ContentLayout>
  )
}