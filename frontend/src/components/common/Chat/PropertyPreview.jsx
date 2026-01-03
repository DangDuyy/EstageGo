import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, MapPin, Bed, Bath, Ruler, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { fetchPropertyDetail } from '@/apis'
import { getFirstImageUrl } from '@/utils/helper';

export default function PropertyPreview({ propertyId, onClose }) {
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadProperty = async () => {
      try {
        setLoading(true)
        const data = await fetchPropertyDetail(propertyId)
        setProperty(data.data || data)
        setError(null)
      } catch (err) {
        console.error('Failed to load property:', err)
        setError('Không thể tải thông tin bất động sản')
      } finally {
        setLoading(false)
      }
    }

    if (propertyId) {
      loadProperty()
    }
  }, [propertyId])

  if (loading) {
    return (
      <Card className="w-full max-w-sm p-4 bg-muted">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

  if (error || !property) {
    return (
      <Card className="w-full max-w-sm p-4 bg-red-50 border-red-200">
        <div className="text-sm text-red-700">{error || 'Không tìm thấy bất động sản'}</div>
      </Card>
    )
  }

  // Get main image from property data
  const mainImage = getFirstImageUrl(property.media, property.images?.[0] || property.image || '/images/placeholder.jpg');
  const title = property.title || property.name || 'Untitled Property'
  
  // Handle price - could be nested in price object
  let price = 0
  if (typeof property.price === 'number') {
    price = property.price
  } else if (property.price?.value) {
    // Handle MongoDB $numberLong format
    if (typeof property.price.value === 'object' && property.price.value.$numberLong) {
      price = parseInt(property.price.value.$numberLong)
    } else {
      price = property.price.value
    }
  }
  
  const currency = property.price?.currency || property.currency || 'VND'
  const area = property.area || 0
  
  // Handle rooms - could be nested in rooms object
  let bedrooms = 0
  let bathrooms = 0
  if (property.rooms) {
    bedrooms = property.rooms.bedrooms || 0
    bathrooms = property.rooms.bathrooms || 0
  } else {
    bedrooms = property.bedrooms || 0
    bathrooms = property.bathrooms || 0
  }
  
  // Handle address - could be object or string
  let address = 'N/A'
  if (property.address?.fullAddress) {
    address = property.address.fullAddress
  } else if (typeof property.address === 'string') {
    address = property.address
  } else if (property.address && typeof property.address === 'object') {
    const parts = []
    if (property.address.street) parts.push(property.address.street)
    if (property.address.ward) parts.push(property.address.ward)
    if (property.address.district) parts.push(property.address.district)
    if (property.address.province) parts.push(property.address.province)
    address = parts.join(', ') || 'N/A'
  } else if (property.fullAddress) {
    address = property.fullAddress
  }
  
  const district = typeof property.district === 'string' ? property.district : property.district?.name || property.address?.district || ''
  const province = typeof property.province === 'string' ? property.province : property.province?.name || property.address?.province || ''
  const purpose = property.purpose || 'sale' // 'sale' or 'rent'

  // Format price
  const formatPrice = (value, curr) => {
    if (curr === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
      }).format(value)
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr || 'USD',
      maximumFractionDigits: 0
    }).format(value)
  }

  const getStatusColor = (st) => {
    const statusMap = {
      'sale': 'bg-blue-100 text-blue-800',
      'rent': 'bg-purple-100 text-purple-800'
    }
    return statusMap[st?.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (st) => {
    const labelMap = {
      'sale': 'Bán',
      'rent': 'Cho thuê'
    }
    return labelMap[st?.toLowerCase()] || st || 'N/A'
  }

  return (
    <Card className="w-full max-w-sm overflow-hidden bg-white border shadow-md hover:shadow-lg transition-shadow">
      {/* Image Container */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        <img
          src={mainImage}
          alt={title}
          className="w-full h-full object-cover hover:scale-105 transition-transform"
          onError={(e) => {
            e.target.src = '/images/placeholder.jpg'
          }}
        />
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(purpose)}`}>
          {getStatusLabel(purpose)}
        </div>
      </div>

      {/* Content Container */}
      <div className="p-4 space-y-3">
        {/* Title and Price */}
        <div>
          <h3 className="font-semibold text-sm line-clamp-2 text-foreground">
            {title}
          </h3>
          <p className="text-lg font-bold text-primary mt-1">
            {formatPrice(price, currency)}
          </p>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="flex-1 line-clamp-2">
            {address}
            {district && `, ${district}`}
            {province && `, ${province}`}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          {bedrooms > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <Bed className="h-4 w-4 text-muted-foreground" />
              <span>{bedrooms} phòng</span>
            </div>
          )}
          {bathrooms > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <Bath className="h-4 w-4 text-muted-foreground" />
              <span>{bathrooms} WC</span>
            </div>
          )}
          {area > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <span>{area} m²</span>
            </div>
          )}
        </div>

        {/* View Button */}
        <a
          href={`/properties/${propertyId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full mt-3 px-3 py-2 bg-primary text-primary-foreground text-xs font-medium rounded text-center hover:bg-primary/90 transition"
        >
          Xem chi tiết
        </a>
      </div>
    </Card>
  )
}
