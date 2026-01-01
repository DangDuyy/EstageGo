import { ContentLayout } from '@/components/common/SidebarMenu/content-layout'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { DropzoneContent, DropzoneEmptyState, Dropzone } from '@/components/ui/dropzone'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { selectCurrentUser, updateUser } from '@/redux/user/userSlice'
import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateUserProfileAPI, changePasswordAPI, requestAgentRoleAPI, removeAgentRoleAPI, getCurrentUserAPI } from '@/apis'
import { toast } from 'react-toastify'
import authorizeAxiosInstance from '@/utils/authorizeAxios'
import { API_ROOT } from '@/utils/constants'

export default function Profile() {
  const dispatch = useDispatch()
  const user = useSelector(selectCurrentUser)
  const [files, setFiles] = useState()
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  
  // Support services list
  const SUPPORT_SERVICES = [
    'Tư vấn tài chính',
    'Hỗ trợ vay vốn',
    'Hỗ trợ phân lô, tách thửa',
    'Hỗ trợ công chứng ba bên',
    'Hỗ trợ hoàn thiện hồ sơ đăng bộ',
    'Hỗ trợ làm giấy tờ, hồ sơ nhà đất',
    'Nhận kí gửi bất động sản',
    'Xin phép xây dựng',
    'Hỗ trợ hoàn thiện nội thất',
    'Hỗ trợ hợp thức hoá nhà đất'
  ]

  // Profile form state
  const [profileData, setProfileData] = useState({
    fullName: '',
    gender: 'male',
    address: '',
    // Agent fields
    companyName: '',
    bio: '',
    experience: '',
    licenseNumber: '',
    website: '',
    socialLinks: {
      facebook: '',
      linkedin: '',
      twitter: ''
    },
    brokerPage: {
      agentTitle: '',
      yearsOfExperience: '',
      supportServices: [],
      operatingAreas: []
    }
  })

  // Temporary input state for operating areas
  const [newArea, setNewArea] = useState('')

  // Password form state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Initialize form with user data - CHỈ chạy khi user thay đổi VÀ form không dirty
  useEffect(() => {
    if (user && !isDirty) {
      setProfileData({
        fullName: user.fullName || '',
        gender: user.gender || 'male',
        address: user.address || '',
        companyName: user.companyName || '',
        bio: user.bio || '',
        experience: user.experience || '',
        licenseNumber: user.licenseNumber || '',
        website: user.website || '',
        socialLinks: {
          facebook: user.socialLinks?.facebook || '',
          linkedin: user.socialLinks?.linkedin || '',
          twitter: user.socialLinks?.twitter || ''
        },
        brokerPage: {
          agentTitle: user.brokerPage?.agentTitle || '',
          yearsOfExperience: user.brokerPage?.yearsOfExperience ?? '',
          supportServices: user.brokerPage?.supportServices || [],
          operatingAreas: user.brokerPage?.operatingAreas || []
        }
      })
    }
  }, [user]) // Bỏ isDirty khỏi dependencies

  // Poll for user data updates - CHỈ khi form KHÔNG dirty
  useEffect(() => {
    // Nếu đang edit thì không poll
    if (isDirty) {
      return
    }

    const pollUserData = async () => {
      try {
        const updatedUser = await getCurrentUserAPI()
        // Chỉ update nếu có thay đổi thực sự
        if (updatedUser && JSON.stringify(updatedUser) !== JSON.stringify(user)) {
          dispatch(updateUser(updatedUser))
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error)
      }
    }

    const interval = setInterval(pollUserData, 5000)
    return () => clearInterval(interval)
  }, [isDirty, user, dispatch]) // Thêm isDirty vào dependencies

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleDrop = (droppedFiles) => {
    console.log(droppedFiles)
    setFiles(droppedFiles)
    
    // Create preview URL
    if (droppedFiles && droppedFiles.length > 0) {
      // Revoke old preview URL if exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      // Create new preview URL
      const newPreviewUrl = URL.createObjectURL(droppedFiles[0])
      setPreviewUrl(newPreviewUrl)
    }
  }

  const handleCancelUpload = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setFiles(null)
    setPreviewUrl(null)
  }

  // Upload avatar function
  const handleUploadAvatar = async () => {
    if (!files || files.length === 0) {
      toast.error('Please select an image first')
      return
    }

    try {
      setAvatarLoading(true)
      
      const formData = new FormData()
      formData.append('avatar', files[0])

      const response = await authorizeAxiosInstance.put(
        `${API_ROOT}/v1/users/avatar`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      // Update user in Redux
      if (response.data.user) {
        dispatch(updateUser(response.data.user))
        // Clear preview and files
        handleCancelUpload()
        toast.success('Avatar updated successfully!')
      }
    } catch (error) {
      console.error('Upload avatar error:', error)
      toast.error(error.response?.data?.message || 'Failed to upload avatar')
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      const updatedUser = await updateUserProfileAPI(profileData)
      
      // Update Redux store with the new user data
      if (updatedUser) {
        dispatch(updateUser(updatedUser))
        // Reset dirty flag after successful save
        setIsDirty(false)
        toast.success('Profile updated successfully')
      }
    } catch (error) {
      console.error('Update profile error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    // Validate
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }

    try {
      setLoading(true)
      await changePasswordAPI({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      })
      
      // Clear form
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      toast.success('Password changed successfully!')
    } catch (error) {
      console.error('Change password error:', error)
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestAgent = async () => {
    try {
      setLoading(true)
      const updatedUser = await requestAgentRoleAPI()
      dispatch(updateUser(updatedUser))
      toast.success('Agent request submitted!')
    } catch (error) {
      console.error('Request agent error:', error)
      toast.error(error.response?.data?.message || 'Failed to request agent role')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAgent = async () => {
    if (!confirm('Are you sure you want to remove your agent account and return to a normal user account?')) {
      return
    }

    try {
      setLoading(true)
      const updatedUser = await removeAgentRoleAPI()
      dispatch(updateUser(updatedUser))
      toast.success('Agent role removed!')
    } catch (error) {
      console.error('Remove agent error:', error)
      toast.error(error.response?.data?.message || 'Failed to remove agent role')
    } finally {
      setLoading(false)
    }
  }

  const toggleSupportService = (service) => {
    const current = profileData.brokerPage?.supportServices || []
    const next = current.includes(service)
      ? current.filter(s => s !== service)
      : [...current, service]
    setProfileData({
      ...profileData,
      brokerPage: { ...profileData.brokerPage, supportServices: next }
    })
    setIsDirty(true)
  }

  const addArea = () => {
    const val = newArea.trim()
    const current = profileData.brokerPage?.operatingAreas || []
    if (val && !current.includes(val)) {
      setProfileData({
        ...profileData,
        brokerPage: { ...profileData.brokerPage, operatingAreas: [...current, val] }
      })
      setNewArea('')
      setIsDirty(true)
    }
  }

  const removeArea = (index) => {
    const current = profileData.brokerPage?.operatingAreas || []
    const next = current.filter((_, i) => i !== index)
    setProfileData({
      ...profileData,
      brokerPage: { ...profileData.brokerPage, operatingAreas: next }
    })
    setIsDirty(true)
  }

  return (
    <ContentLayout title="Account Settings">
      
      {/* Agent Account Section */}
      <div className="w-full border-2 rounded-2xl flex flex-col gap-5 p-5">
        <p className="font-semibold text-xl">Agent Account</p>
        
        {user?.role === 'admin' ? (
          <p className='border bg-[#d4edda] text-[#155724] p-4 rounded-2xl'>
            You are an <strong>administrator</strong> with full system access. You can manage all properties, users, and agent requests through the admin dashboard.
          </p>
        ) : user?.role === 'agent' ? (
          <>
            <p className='border bg-[#fff3cd] text-black p-4 rounded-2xl'>
              Your current account type is set to <strong>agent</strong>. If you want to remove your agent account and return to normal account, you must click the button below.
            </p>
            <Button 
              className="cursor-pointer rounded-4xl max-w-[200px]" 
              variant="destructive"
              onClick={handleRemoveAgent}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Remove Agent Account'}
            </Button>
          </>
        ) : user?.agentRequestStatus === 'pending' ? (
          <p className='border bg-[#d1ecf1] text-[#0c5460] p-4 rounded-2xl'>
            Your agent request is currently <strong>pending approval</strong>. Please wait for admin review.
          </p>
        ) : (
          <>
            <p className='border bg-[#d1ecf1] text-[#0c5460] p-4 rounded-2xl'>
              You are currently a <strong>normal user</strong>. If you want to become an agent to list and manage properties professionally, please submit an agent request for approval.
            </p>
            <Button 
              className="cursor-pointer rounded-4xl max-w-[200px]"
              onClick={handleRequestAgent}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Request Agent Account'}
            </Button>
          </>
        )}
      </div>

      <div className="mt-10 flex flex-col gap-5">
        <p className='font-semibold text-2xl'>Avatar</p>
        <div className="flex flex-row gap-10 items-start">
          {/* Current Avatar */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-gray-600">Current Avatar</p>
            <Dialog>
              <DialogTrigger asChild>
                <Avatar className="w-32 h-32 cursor-pointer hover:opacity-80 transition">
                  <AvatarImage
                    src={user.avatar}
                    className="h-full w-full object-cover"
                  />
                  <AvatarFallback className="text-xl">
                    {user.fullName}
                  </AvatarFallback>
                </Avatar>
              </DialogTrigger>

              <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none shadow-none">
                <img
                  src={user.avatar}
                  alt="Zoomed Avatar"
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Upload Section */}
          <div className="flex-1 max-w-md">
            <p className="mb-2 font-medium">Upload a new avatar</p>
            <p className="text-sm text-gray-500 mb-3">Recommended: Square image, at least 500x500px, max 5MB</p>
            
            {/* Preview */}
            {previewUrl && (
              <div className="mb-4 p-4 border-2 border-dashed rounded-lg bg-gray-50">
                <div className="flex items-center gap-4">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">Preview</p>
                    <p className="text-xs text-gray-600">{files[0]?.name}</p>
                    <p className="text-xs text-gray-500">
                      {(files[0]?.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelUpload}
                    disabled={avatarLoading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <Dropzone
              accept={{ 'image/*': [] }}
              maxFiles={1}
              maxSize={1024 * 1024 * 5}
              minSize={1024}
              onDrop={handleDrop}
              onError={console.error}
              src={files}
            >
              <DropzoneEmptyState />
              <DropzoneContent />
            </Dropzone>
            
            {files && files.length > 0 && (
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={handleUploadAvatar}
                  disabled={avatarLoading}
                  className="flex-1 rounded-3xl"
                >
                  {avatarLoading ? 'Uploading...' : 'Upload Avatar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelUpload}
                  disabled={avatarLoading}
                  className="rounded-3xl"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleProfileSubmit} className="mt-10 py-10">
        <p className="text-2xl font-semibold mb-5">Information</p>
        <div className="flex flex-col gap-8">
          <span>
            <p>Full name:*</p>
            <Input 
              type="text" 
              placeholder="Type your full name..."
              value={profileData.fullName}
              onChange={(e) => {
                setProfileData({ ...profileData, fullName: e.target.value })
                setIsDirty(true)
              }}
              required
            />
          </span>
          
          <div className="flex flex-row gap-12">
            <span className='flex flex-row gap-5'>
              <p>Gender:*</p>
              <RadioGroup 
                value={profileData.gender}
                onValueChange={(value) => {
                  setProfileData({ ...profileData, gender: value })
                  setIsDirty(true)
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Others</Label>
                </div>
              </RadioGroup> 
            </span>
            <span>
              <p>Phone: (Cannot be changed)</p>
              <Input 
                type="text" 
                value={user?.phone || 'Not set'}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            </span>
          </div>
          <span>
            <p>Location:</p>
            <Input 
              type="text" 
              placeholder="Type your address..."
              value={profileData.address}
              onChange={(e) => {
                setProfileData({ ...profileData, address: e.target.value })
                setIsDirty(true)
              }}
            />
          </span>

          {/* Agent-specific fields */}
          {user?.role === 'agent' && (
            <>
              <div className="border-t pt-6 mt-4">
                <p className="text-xl font-semibold mb-4">Agent Information</p>
                
                <div className="flex flex-col gap-6">
                  <span>
                    <p>Company Name:</p>
                    <Input 
                      type="text" 
                      placeholder="Your company name..."
                      value={profileData.companyName}
                      onChange={(e) => {
                        setProfileData({ ...profileData, companyName: e.target.value })
                        setIsDirty(true)
                      }}
                    />
                  </span>

                  <span>
                    <p>Agent Title / Position (Broker Page):</p>
                    <Input 
                      type="text" 
                      placeholder="e.g., Senior Real Estate Agent, Team Leader..."
                      value={profileData.brokerPage.agentTitle}
                      onChange={(e) => {
                        setProfileData({ 
                          ...profileData, 
                          brokerPage: { ...profileData.brokerPage, agentTitle: e.target.value }
                        })
                        setIsDirty(true)
                      }}
                    />
                  </span>

                  <span>
                    <p>Bio / About Me:</p>
                    <Textarea 
                      placeholder="Tell clients about yourself, your experience, and what makes you unique..."
                      value={profileData.bio}
                      onChange={(e) => {
                        setProfileData({ ...profileData, bio: e.target.value })
                        setIsDirty(true)
                      }}
                      rows={5}
                    />
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <span>
                      <p>Years of Experience (Broker Page):</p>
                      <Input 
                        type="number" 
                        placeholder="0"
                        min="0"
                        value={profileData.brokerPage.yearsOfExperience}
                        onChange={(e) => {
                          const val = e.target.value
                          setProfileData({ 
                            ...profileData, 
                            brokerPage: { ...profileData.brokerPage, yearsOfExperience: val }
                          })
                          setIsDirty(true)
                        }}
                      />
                    </span>

                    <span>
                      <p>License Number:</p>
                      <Input 
                        type="text" 
                        placeholder="Your license number..."
                        value={profileData.licenseNumber}
                        onChange={(e) => {
                          setProfileData({ ...profileData, licenseNumber: e.target.value })
                          setIsDirty(true)
                        }}
                      />
                    </span>
                  </div>

                  <span>
                    <p>Services Provided:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {SUPPORT_SERVICES.map((service) => (
                        <label key={service} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={profileData.brokerPage.supportServices.includes(service)}
                            onChange={() => toggleSupportService(service)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm">{service}</span>
                        </label>
                      ))}
                    </div>
                    {profileData.brokerPage.supportServices.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {profileData.brokerPage.supportServices.map((service) => (
                          <Badge key={service} variant="secondary" className="flex items-center gap-1">
                            {service}
                            <X 
                              className="h-3 w-3 cursor-pointer hover:text-destructive" 
                              onClick={() => toggleSupportService(service)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </span>

                  <span>
                    <p>Operating Areas:</p>
                    <div className="flex gap-2 mb-2">
                      <Input 
                        type="text" 
                        placeholder="e.g., Quận 1, Quận 2, Quận Tân Bình..."
                        value={newArea}
                        onChange={(e) => setNewArea(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArea())}
                      />
                      <Button type="button" onClick={addArea}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profileData.brokerPage.operatingAreas.map((area, idx) => (
                        <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                          {area}
                          <X 
                            className="h-3 w-3 cursor-pointer hover:text-destructive" 
                            onClick={() => removeArea(idx)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </span>

                  <span>
                    <p>Website:</p>
                    <Input 
                      type="url" 
                      placeholder="https://yourwebsite.com"
                      value={profileData.website}
                      onChange={(e) => {
                        setProfileData({ ...profileData, website: e.target.value })
                        setIsDirty(true)
                      }}
                    />
                  </span>

                  <div className="border-t pt-4">
                    <p className="font-semibold mb-3">Social Media Links:</p>
                    <div className="flex flex-col gap-4">
                      <span>
                        <p>Facebook:</p>
                        <Input 
                          type="url" 
                          placeholder="https://facebook.com/yourprofile"
                          value={profileData.socialLinks.facebook}
                          onChange={(e) => {
                            setProfileData({ 
                              ...profileData, 
                              socialLinks: { ...profileData.socialLinks, facebook: e.target.value }
                            })
                            setIsDirty(true)
                          }}
                        />
                      </span>
                      <span>
                        <p>LinkedIn:</p>
                        <Input 
                          type="url" 
                          placeholder="https://linkedin.com/in/yourprofile"
                          value={profileData.socialLinks.linkedin}
                          onChange={(e) => {
                            setProfileData({ 
                              ...profileData, 
                              socialLinks: { ...profileData.socialLinks, linkedin: e.target.value }
                            })
                            setIsDirty(true)
                          }}
                        />
                      </span>
                      <span>
                        <p>Twitter:</p>
                        <Input 
                          type="url" 
                          placeholder="https://twitter.com/yourhandle"
                          value={profileData.socialLinks.twitter}
                          onChange={(e) => {
                            setProfileData({ 
                              ...profileData, 
                              socialLinks: { ...profileData.socialLinks, twitter: e.target.value }
                            })
                            setIsDirty(true)
                          }}
                        />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <Button 
            type="submit"
            className="max-w-[150px] rounded-3xl"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save and update'}
          </Button>
        </div>
      </form>

      <form onSubmit={handlePasswordSubmit} className="mt-10">
        <p className="text-2xl font-semibold mb-10">Change password</p>
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          <span className="flex-1">
            <p>Old Password:*</p>
            <Input 
              type="password" 
              placeholder="Type old password..."
              value={passwordData.oldPassword}
              onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
              required
            />
          </span>
          <span className="flex-1">
            <p>New Password:*</p>
            <Input 
              type="password" 
              placeholder="Type new password..."
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              required
              minLength={6}
            />
          </span>
          <span className="flex-1">
            <p>Confirm New Password:*</p>
            <Input 
              type="password" 
              placeholder="Confirm new password..."
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              required
              minLength={6}
            />
          </span>
        </div>
        <Button 
          type="submit"
          className="max-w-[150px] rounded-3xl"
          disabled={loading}
        >
          {loading ? 'Changing...' : 'Change password'}
        </Button>
      </form>
    </ContentLayout>
  )
}
