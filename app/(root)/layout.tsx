import React from 'react'
import HomeLayout from '@/modules/home/layout/home-layout'

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <HomeLayout>{children}</HomeLayout>
  )
}

export default RootLayout