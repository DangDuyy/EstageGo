import { ContentLayout } from '@/components/common/SidebarMenu/content-layout'
import React from 'react'

export default function Profile({ title }) {
  return (
    <ContentLayout title={title}>
      <div>Welcome to the profile</div>
    </ContentLayout>
  )
}
