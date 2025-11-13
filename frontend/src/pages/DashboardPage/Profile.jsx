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
import { updateUserProfileAPI, changePasswordAPI, requestAgentRoleAPI, removeAgentRoleAPI } from '@/apis'
import { toast } from 'react-toastify'

export default function Profile() {
  const dispatch = useDispatch()
  const user = useSelector(selectCurrentUser)
  const [files, setFiles] = useState()
  const [loading, setLoading] = useState(false)
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    fullName: '',
    gender: 'male',
    address: '',
    // Agent fields
    companyName: '',
    agentTitle: '',
    bio: '',
    specializations: [],
    areasServed: [],
    experience: '',
    licenseNumber: '',
    website: '',
    socialLinks: {
      facebook: '',
      linkedin: '',
      twitter: ''
    }
  })

  // Temporary input states for array fields
  const [newSpecialization, setNewSpecialization] = useState('')
  const [newArea, setNewArea] = useState('')

  // Password form state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        gender: user.gender || 'male',
        address: user.address || '',
        companyName: user.companyName || '',
        agentTitle: user.agentTitle || '',
        bio: user.bio || '',
        specializations: user.specializations || [],
        areasServed: user.areasServed || [],
        experience: user.experience || '',
        licenseNumber: user.licenseNumber || '',
        website: user.website || '',
        socialLinks: {
          facebook: user.socialLinks?.facebook || '',
          linkedin: user.socialLinks?.linkedin || '',
          twitter: user.socialLinks?.twitter || ''
        }
      })
    }
  }, [user])

  const handleDrop = (files) => {
    console.log(files)
    setFiles(files)
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      const updatedUser = await updateUserProfileAPI(profileData)
      
      // Update Redux store
      dispatch(updateUser(updatedUser))
    } catch (error) {
      console.error('Update profile error:', error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
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
    } catch (error) {
      console.error('Remove agent error:', error)
      toast.error(error.response?.data?.message || 'Failed to remove agent role')
    } finally {
      setLoading(false)
    }
  }

  const addSpecialization = () => {
    if (newSpecialization.trim() && !profileData.specializations.includes(newSpecialization.trim())) {
      setProfileData({
        ...profileData,
        specializations: [...profileData.specializations, newSpecialization.trim()]
      })
      setNewSpecialization('')
    }
  }

  const removeSpecialization = (index) => {
    setProfileData({
      ...profileData,
      specializations: profileData.specializations.filter((_, i) => i !== index)
    })
  }

  const addArea = () => {
    if (newArea.trim() && !profileData.areasServed.includes(newArea.trim())) {
      setProfileData({
        ...profileData,
        areasServed: [...profileData.areasServed, newArea.trim()]
      })
      setNewArea('')
    }
  }

  const removeArea = (index) => {
    setProfileData({
      ...profileData,
      areasServed: profileData.areasServed.filter((_, i) => i !== index)
    })
  }

  return (
    <ContentLayout title="Account Settings">
      
      {/* Agent Account Section */}
      <div className="w-full border-2 rounded-2xl flex flex-col gap-5 p-5">
        <p className="font-semibold text-xl">Agent Account</p>
        
        {user?.role === 'admin' ? (
          <p className='border-1 bg-[#d4edda] text-[#155724] p-4 rounded-2xl'>
            You are an <strong>administrator</strong> with full system access. You can manage all properties, users, and agent requests through the admin dashboard.
          </p>
        ) : user?.role === 'agent' ? (
          <>
            <p className='border-1 bg-[#fff3cd] text-black p-4 rounded-2xl'>
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
          <p className='border-1 bg-[#d1ecf1] text-[#0c5460] p-4 rounded-2xl'>
            Your agent request is currently <strong>pending approval</strong>. Please wait for admin review.
          </p>
        ) : (
          <>
            <p className='border-1 bg-[#d1ecf1] text-[#0c5460] p-4 rounded-2xl'>
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
        <div className="flex flex-row gap-10">
          <Dialog>
            <DialogTrigger asChild>
              <Avatar className="size-50 cursor-pointer hover:opacity-80 transition">
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
          <div className="">
            <p>Upload a new avatar</p>
            <Dropzone
              accept={{ 'image/*': [] }}
              maxFiles={10}
              maxSize={1024 * 1024 * 10}
              minSize={1024}
              onDrop={handleDrop}
              onError={console.error}
              src={files}
            >
              <DropzoneEmptyState />
              <DropzoneContent />
            </Dropzone>
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
              onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
              required
            />
          </span>
          
          <div className="flex flex-row gap-12">
            <span className='flex flex-row gap-5'>
              <p>Gender:*</p>
              <RadioGroup 
                value={profileData.gender}
                onValueChange={(value) => setProfileData({ ...profileData, gender: value })}
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
              onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
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
                      onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                    />
                  </span>

                  <span>
                    <p>Agent Title / Position:</p>
                    <Input 
                      type="text" 
                      placeholder="e.g., Senior Real Estate Agent, Team Leader..."
                      value={profileData.agentTitle}
                      onChange={(e) => setProfileData({ ...profileData, agentTitle: e.target.value })}
                    />
                  </span>

                  <span>
                    <p>Bio / About Me:</p>
                    <Textarea 
                      placeholder="Tell clients about yourself, your experience, and what makes you unique..."
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      rows={5}
                    />
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <span>
                      <p>Years of Experience:</p>
                      <Input 
                        type="number" 
                        placeholder="0"
                        min="0"
                        value={profileData.experience}
                        onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                      />
                    </span>

                    <span>
                      <p>License Number:</p>
                      <Input 
                        type="text" 
                        placeholder="Your license number..."
                        value={profileData.licenseNumber}
                        onChange={(e) => setProfileData({ ...profileData, licenseNumber: e.target.value })}
                      />
                    </span>
                  </div>

                  <span>
                    <p>Specializations:</p>
                    <div className="flex gap-2 mb-2">
                      <Input 
                        type="text" 
                        placeholder="e.g., Residential, Commercial, Luxury..."
                        value={newSpecialization}
                        onChange={(e) => setNewSpecialization(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialization())}
                      />
                      <Button type="button" onClick={addSpecialization}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profileData.specializations.map((spec, idx) => (
                        <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                          {spec}
                          <X 
                            className="h-3 w-3 cursor-pointer hover:text-destructive" 
                            onClick={() => removeSpecialization(idx)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </span>

                  <span>
                    <p>Areas Served:</p>
                    <div className="flex gap-2 mb-2">
                      <Input 
                        type="text" 
                        placeholder="e.g., District 1, District 2, Binh Thanh..."
                        value={newArea}
                        onChange={(e) => setNewArea(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArea())}
                      />
                      <Button type="button" onClick={addArea}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profileData.areasServed.map((area, idx) => (
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
                      onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
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
                          onChange={(e) => setProfileData({ 
                            ...profileData, 
                            socialLinks: { ...profileData.socialLinks, facebook: e.target.value }
                          })}
                        />
                      </span>
                      <span>
                        <p>LinkedIn:</p>
                        <Input 
                          type="url" 
                          placeholder="https://linkedin.com/in/yourprofile"
                          value={profileData.socialLinks.linkedin}
                          onChange={(e) => setProfileData({ 
                            ...profileData, 
                            socialLinks: { ...profileData.socialLinks, linkedin: e.target.value }
                          })}
                        />
                      </span>
                      <span>
                        <p>Twitter:</p>
                        <Input 
                          type="url" 
                          placeholder="https://twitter.com/yourhandle"
                          value={profileData.socialLinks.twitter}
                          onChange={(e) => setProfileData({ 
                            ...profileData, 
                            socialLinks: { ...profileData.socialLinks, twitter: e.target.value }
                          })}
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
