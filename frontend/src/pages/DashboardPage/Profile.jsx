import { ContentLayout } from '@/components/common/SidebarMenu/content-layout'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { DropzoneContent, DropzoneEmptyState, Dropzone } from '@/components/ui/dropzone'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { selectCurrentUser } from '@/redux/user/userSlice'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'

export default function Profile() {
  const user = useSelector(selectCurrentUser)
  const [files, setFiles] = useState()

  const handleDrop = (files) => {
    console.log(files)
    setFiles(files)
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
                  src={user.avatarUrl}
                  className="h-full w-full object-cover"
                />
                <AvatarFallback className="text-xl">
                  {user.fullName}
                </AvatarFallback>
              </Avatar>
            </DialogTrigger>

            <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none shadow-none">
              <img
                src={user.avatarUrl}
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

      <div className="mt-10 py-10">
        <p className="text-2xl font-semibold mb-5">Information</p>
        <div className="flex flex-col gap-8">
          <span>
            <p>Full name:*</p>
            <Input type="text" placeholder="Type your full name..."></Input>
          </span>
          <span>
            <p>Bio:*</p>
            <Input type="text" placeholder="Type your bio..."></Input>
          </span>
          <div className="flex flex-row gap-12">
            <span className='flex flex-row gap-5'>
              <p>Gender:*</p>
              <RadioGroup defaultValue="option-one">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option-one" id="option-one" />
                  <Label htmlFor="option-one">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option-two" id="option-two" />
                  <Label htmlFor="option-two">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option-three" id="option-two" />
                  <Label htmlFor="option-two">Others</Label>
                </div>
              </RadioGroup> 
            </span>
            <span>
              <p>Phone:*</p>
              <Input type="text" placeholder="Type your phone number.."></Input>
            </span>
          </div>
          <span>
            <p>Location:*</p>
            <Input type="text" placeholder="Type your address..."></Input>
          </span>
          <Button className="max-w-[150px] rounded-3xl">Save and update</Button>
        </div>
      </div>

      <div className="mt-10">
        <p className="text-2xl font-semibold mb-10">Change password</p>
        <div className="flex flex-row gap-30 mb-10">
          <span>
            <p>Old Password:*</p>
            <Input type="password" placeholder="Type password..."></Input>
          </span>
          <span>
            <p>New Password:*</p>
            <Input type="password" placeholder="Type password..."></Input>
          </span>
          <span>
            <p>Confirm New Password:*</p>
            <Input type="password" placeholder="Type password..."></Input>
          </span>
        </div>
        <Button className="max-w-[150px] rounded-3xl">Change password</Button>
      </div>
    </ContentLayout>
  )
}
