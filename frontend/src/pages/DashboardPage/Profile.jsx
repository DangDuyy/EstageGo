import { ContentLayout } from '@/components/common/SidebarMenu/content-layout'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { DropzoneContent, DropzoneEmptyState, Dropzone } from '@/components/ui/dropzone'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { selectCurrentUser, updateUser } from '@/redux/user/userSlice'
import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateUserProfileAPI, changePasswordAPI } from '@/apis'
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
    address: ''
  })

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
        address: user.address || ''
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

  return (
    <ContentLayout title="Account Settings">
      
      <div className="w-full border-2 rounded-2xl flex flex-col gap-5 p-5">
        <p>Agent Account</p>
        <p className='border-1 bg-[#fff3cd] text-black p-4 rounded-2xl'>
          Your current account type is set to agent, if you want to remove your agent account, and return to normal account, you must click the button below
        </p>
        <Button className="cursor-pointer rounded-4xl max-w-[200px]">
          Remove Agent Account
        </Button>
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
