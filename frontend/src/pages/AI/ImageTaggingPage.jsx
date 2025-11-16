import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/redux/user/userSlice'
import {
  getUserPropertiesWithMediaAPI,
  getAllUserImageTagsAPI,
  analyzePropertyImageAPI,
  updateImageTagsAPI,
  bulkAnalyzeImagesAPI,
  analyzeTemporaryImageAPI,
  clearImageTagsAPI
} from '@/apis'
import { toast } from 'react-toastify'
import { Loader2, Sparkles, Tag, Image as ImageIcon, X, Plus, Upload, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import NavBar from '@/components/common/NavBar'
import { FooterBar } from '@/components/common/FooterBar'

const ImageTaggingPage = () => {
  const currentUser = useSelector(selectCurrentUser)
  const [properties, setProperties] = useState([])
  const [allTags, setAllTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadedPreview, setUploadedPreview] = useState(null)
  const [tempAnalysisResult, setTempAnalysisResult] = useState(null)

  useEffect(() => {
    if (currentUser) {
      loadData()
    }
  }, [currentUser])

  const loadData = async () => {
    try {
      setLoading(true)
      const [propertiesData, tagsData] = await Promise.all([
        getUserPropertiesWithMediaAPI(),
        getAllUserImageTagsAPI()
      ])
      
      setProperties(propertiesData.data || [])
      setAllTags(tagsData.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load properties')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyzeImage = async (propertyId, imageId) => {
    try {
      setAnalyzing(true)
      const result = await analyzePropertyImageAPI(propertyId, imageId)
      
      toast.success('Image analyzed successfully!')
      
      // Update local state
      setProperties(prev => prev.map(prop => {
        if (prop._id === propertyId) {
          return {
            ...prop,
            media: prop.media.map(img => 
              img._id === imageId 
                ? { ...img, tags: result.data.tags, detectedObjects: result.data.detectedObjects, analyzed: true }
                : img
            )
          }
        }
        return prop
      }))
      
      // Reload tags
      const tagsData = await getAllUserImageTagsAPI()
      setAllTags(tagsData.data || [])
      
      if (selectedImage && selectedImage._id === imageId) {
        setSelectedImage(prev => ({
          ...prev,
          tags: result.data.tags,
          detectedObjects: result.data.detectedObjects,
          analyzed: true
        }))
      }
    } catch (error) {
      console.error('Error analyzing image:', error)
      toast.error('Failed to analyze image')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleBulkAnalyze = async (propertyId) => {
    try {
      setAnalyzing(true)
      await bulkAnalyzeImagesAPI(propertyId)
      await loadData()
    } catch (error) {
      console.error('Error bulk analyzing:', error)
      toast.error('Failed to analyze images')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAddTag = async () => {
    if (!newTag.trim() || !selectedImage) return
    
    try {
      const updatedTags = [
        ...(selectedImage.tags || []),
        {
          label: newTag.toLowerCase().trim(),
          confidence: 1,
          source: 'manual'
        }
      ]
      
      await updateImageTagsAPI(
        selectedImage.propertyId,
        selectedImage._id,
        updatedTags,
        selectedImage.detectedObjects
      )
      
      setSelectedImage(prev => ({ ...prev, tags: updatedTags }))
      setNewTag('')
      toast.success('Tag added successfully')
      
      // Reload properties
      await loadData()
    } catch (error) {
      console.error('Error adding tag:', error)
      toast.error('Failed to add tag')
    }
  }

  const handleRemoveTag = async (tagIndex) => {
    if (!selectedImage) return
    
    try {
      const updatedTags = selectedImage.tags.filter((_, index) => index !== tagIndex)
      
      await updateImageTagsAPI(
        selectedImage.propertyId,
        selectedImage._id,
        updatedTags,
        selectedImage.detectedObjects
      )
      
      setSelectedImage(prev => ({ ...prev, tags: updatedTags }))
      toast.success('Tag removed successfully')
      
      // Reload properties
      await loadData()
    } catch (error) {
      console.error('Error removing tag:', error)
      toast.error('Failed to remove tag')
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    
    setUploadedFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setUploadedPreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyzeUploadedImage = async () => {
    if (!uploadedFile) {
      toast.error('Please select an image first')
      return
    }
    
    try {
      setAnalyzing(true)
      const result = await analyzeTemporaryImageAPI(uploadedFile)
      
      setTempAnalysisResult(result.data)
      toast.success('Image analyzed successfully!')
    } catch (error) {
      console.error('Error analyzing uploaded image:', error)
      toast.error('Failed to analyze image')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleClearTags = async (propertyId, imageId) => {
    try {
      await clearImageTagsAPI(propertyId, imageId)
      
      // Update local state
      setProperties(prev => prev.map(prop => {
        if (prop._id === propertyId) {
          return {
            ...prop,
            media: prop.media.map(img => 
              img._id === imageId 
                ? { ...img, tags: [], detectedObjects: [], analyzed: false }
                : img
            )
          }
        }
        return prop
      }))
      
      // Reload tags
      const tagsData = await getAllUserImageTagsAPI()
      setAllTags(tagsData.data || [])
      
      if (selectedImage && selectedImage._id === imageId) {
        setSelectedImage(null)
      }
    } catch (error) {
      console.error('Error clearing tags:', error)
      toast.error('Failed to clear tags')
    }
  }

  const openImageModal = (property, image) => {
    setSelectedImage({
      ...image,
      propertyId: property._id,
      propertyTitle: property.title
    })
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-lg text-muted-foreground">Please login to use Image Tagging</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <>
     <NavBar/>
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Image Tagging</h1>
        <p className="text-muted-foreground">
          Automatically detect and tag objects in your property images using AI
        </p>
      </div>

      {/* Upload & Analyze Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Try It Now - Upload & Analyze
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium">
                Upload an image to analyze
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
              {uploadedPreview && (
                <div className="mt-4">
                  <img
                    src={uploadedPreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <Button
                    onClick={handleAnalyzeUploadedImage}
                    disabled={analyzing}
                    className="w-full mt-2"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Analyze Image
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
            
            {tempAnalysisResult && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Analysis Result</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Room Type</p>
                    <Badge variant="default" className="text-sm">
                      {tempAnalysisResult.roomType || 'Unknown'}
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {tempAnalysisResult.tags?.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag.label} ({Math.round(tag.confidence * 100)}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {tempAnalysisResult.detectedObjects && tempAnalysisResult.detectedObjects.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Detected Objects</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {tempAnalysisResult.detectedObjects.map((obj, index) => (
                          <div key={index} className="text-xs flex justify-between">
                            <span>{obj.name}</span>
                            <span className="text-muted-foreground">
                              {Math.round(obj.confidence * 100)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {tempAnalysisResult.description && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{tempAnalysisResult.description}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tag Cloud */}
      {allTags.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Your Tags ({allTags.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {allTags.slice(0, 20).map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground"
                >
                  {tag.label} ({tag.count})
                  <span className="ml-1 text-xs opacity-70">
                    {tag.sources.ai > 0 && `🤖${tag.sources.ai}`}
                    {tag.sources.manual > 0 && `✋${tag.sources.manual}`}
                  </span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Properties with Images */}
      {properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-2">No properties with images found</p>
            <p className="text-sm text-muted-foreground">Upload images to your properties to start tagging</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {properties.map((property) => (
            <Card key={property._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{property.title}</CardTitle>
                  <Button
                    onClick={() => handleBulkAnalyze(property._id)}
                    disabled={analyzing}
                    size="sm"
                    variant="outline"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {property.media
                    .filter(media => media.type.startsWith('image'))
                    .map((image) => (
                      <div
                        key={image._id}
                        className="relative group cursor-pointer"
                        onClick={() => openImageModal(property, image)}
                      >
                        <img
                          src={image.url}
                          alt={image.metadata?.filename || 'Property image'}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2 flex-col">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAnalyzeImage(property._id, image._id)
                            }}
                            disabled={analyzing}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            {image.analyzed ? 'Re-analyze' : 'Analyze'}
                          </Button>
                          {image.analyzed && image.tags && image.tags.length > 0 && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleClearTags(property._id, image._id)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Clear Tags
                            </Button>
                          )}
                        </div>
                        {image.analyzed && (
                          <Badge className="absolute top-2 right-2" variant="default">
                            ✓ Analyzed
                          </Badge>
                        )}
                        {image.tags && image.tags.length > 0 && (
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="flex flex-wrap gap-1">
                              {image.tags.slice(0, 3).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tag.label}
                                </Badge>
                              ))}
                              {image.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{image.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Detail Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedImage?.propertyTitle}</DialogTitle>
          </DialogHeader>
          
          {selectedImage && (
            <div className="space-y-4">
              <img
                src={selectedImage.url}
                alt="Property image"
                className="w-full rounded-lg"
              />
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAnalyzeImage(selectedImage.propertyId, selectedImage._id)}
                  disabled={analyzing}
                  size="sm"
                >
                  {analyzing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {selectedImage.analyzed ? 'Re-analyze' : 'Analyze with AI'}
                </Button>
                {selectedImage.analyzed && selectedImage.tags && selectedImage.tags.length > 0 && (
                  <Button
                    onClick={() => handleClearTags(selectedImage.propertyId, selectedImage._id)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Tags
                  </Button>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedImage.tags?.map((tag, index) => (
                    <Badge
                      key={index}
                      variant={tag.source === 'ai' ? 'default' : 'secondary'}
                      className="flex items-center gap-1"
                    >
                      {tag.label}
                      {tag.source === 'ai' && <span className="text-xs">🤖</span>}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => handleRemoveTag(index)}
                      />
                    </Badge>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button onClick={handleAddTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {selectedImage.detectedObjects && selectedImage.detectedObjects.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Detected Objects</h3>
                  <div className="space-y-1">
                    {selectedImage.detectedObjects.map((obj, index) => (
                      <div key={index} className="text-sm flex justify-between">
                        <span>{obj.name}</span>
                        <span className="text-muted-foreground">
                          {Math.round(obj.confidence * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    <FooterBar/>
    </>
  )
}

export default ImageTaggingPage
