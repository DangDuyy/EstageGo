import { ContentLayout } from '@/components/common/SidebarMenu/content-layout'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { DropzoneContent, DropzoneEmptyState, Dropzone } from '@/components/ui/dropzone'
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
      <div className='border-2 w-full rounded-2xl flex flex-col gap-5 p-5'>
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
        {/* Dialog cho zoom ảnh */}
      </div>
    </ContentLayout>
  )
}
